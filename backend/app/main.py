import time
from collections import defaultdict, deque
from threading import Lock
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.api.routes import router
from app.core.config import settings
from app.core.db import engine
from app.schemas import HealthOutput

app = FastAPI(title="Personalized Medicine AI — synthetic Fast Arm", version="1.0.0", description="Research / Clinical Decision Support Prototype. Not validated for patient care.")
origins = [o.strip() for o in settings().allowed_origins.split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Content-Type"])
buckets: dict[str, deque] = defaultdict(deque)
lock = Lock()


@app.middleware("http")
async def security(request: Request, call_next):
    origin = request.headers.get("origin")
    if request.method in {"POST", "PUT", "DELETE", "PATCH"} and (origin and origin not in origins or request.headers.get("sec-fetch-site") == "cross-site"):
        return JSONResponse({"detail": "Origin is not allowed"}, status_code=403)
    try:
        content_length = int(request.headers.get("content-length", "0"))
    except ValueError:
        return JSONResponse({"detail": "Invalid content length"}, status_code=400)
    if content_length < 0 or content_length > 131072:
        return JSONResponse({"detail": "Request is too large"}, status_code=413)
    if request.method in {"POST", "PUT", "PATCH"}:
        total = 0
        chunks = []
        async for chunk in request.stream():
            total += len(chunk)
            if total > 131072:
                return JSONResponse({"detail": "Request is too large"}, status_code=413)
            chunks.append(chunk)
        request._body = b"".join(chunks)
    # In-process protection for the single-worker V1. Use gateway limits when scaling.
    key = (request.client.host if request.client else "unknown") + (":login" if request.url.path.endswith("/auth/login") else ":api")
    current = time.monotonic()
    with lock:
        if len(buckets) > 10000:
            for stale in [k for k, v in buckets.items() if not v or current - v[-1] > 60]:
                del buckets[stale]
        bucket = buckets[key]
        while bucket and current - bucket[0] > 60:
            bucket.popleft()
        limited = len(bucket) >= (15 if key.endswith(":login") else 180)
        if not limited:
            bucket.append(current)
    if limited:
        return JSONResponse({"detail": "Too many requests; try again in a minute"}, status_code=429, headers={"Retry-After": "60"})
    response = await call_next(request)
    response.headers.update({"X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'"})
    if settings().cookie_secure:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(Exception)
async def safe_error(request: Request, exc: Exception):
    return JSONResponse({"detail": "Request could not be completed. Retry or contact the demo administrator."}, status_code=500)


@app.get("/health", response_model=HealthOutput)
def health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok", "prototype": True}


from app.api.privaveda_routes import router as privaveda_router

app.include_router(router)
app.include_router(privaveda_router)

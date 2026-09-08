"""Authenticated deployment smoke check. Uses synthetic seeded cases only.

No credentials or session cookies are printed or written into the smoke state.
"""
import argparse
import hashlib
import http.cookiejar
import json
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, build_opener, HTTPCookieProcessor


def content_hash(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()


class DemoClient:
    def __init__(self, base_url, credentials):
        self.base = base_url.rstrip("/")
        self.credentials = credentials
        self.http = build_opener(HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def call(self, path, method="GET", body=None, expected=200):
        request = Request(self.base + "/api/v1" + path, method=method,
                          data=json.dumps(body).encode() if body is not None else None,
                          headers={"Content-Type": "application/json"})
        try:
            response = self.http.open(request, timeout=20)
        except HTTPError as error:
            response = error
        if response.code != expected:
            raise RuntimeError(f"{method} {path}: expected HTTP {expected}, got {response.code}")
        text = response.read().decode()
        return json.loads(text) if "application/json" in response.headers.get("Content-Type", "") else text

    def login(self, role):
        username = role + "@demo.local"
        text = self.credentials.read_text(encoding="utf-8-sig")
        line = next((line for line in text.splitlines() if line.startswith(username + ": ")), None)
        if line is None:
            raise RuntimeError(f"No {role} account in supplied private credentials file")
        self.call("/auth/login", "POST", {"username": username, "password": line.split(": ", 1)[1]})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:3000")
    parser.add_argument("--credentials-file", type=Path, default=Path("backend/demo-credentials.txt"))
    parser.add_argument("--state-file", type=Path, default=Path(".local/smoke-state.json"))
    parser.add_argument("--verify-only", action="store_true", help="Verify the earlier run after a service/container restart")
    parser.add_argument("--expected-database", choices=["sqlite", "postgresql"])
    args = parser.parse_args()
    client = DemoClient(args.base_url, args.credentials_file)
    client.login("clinician")
    if args.expected_database:
        status = client.call("/system/status")
        assert status["database_backend"] == args.expected_database, "Unexpected database backend"
    if args.verify_only:
        saved = json.loads(args.state_file.read_text())
        run = client.call("/analyses/" + saved["analysis_id"])
        assert content_hash(run["result"]) == saved["result_hash"], "Result changed across restart"
        assert run["input_hash"] == saved["input_hash"], "Input snapshot changed"
        assert any(r["id"] == saved["review_id"] for r in run["reviews"]), "Review missing after restart"
        client.call("/auth/logout", "POST")
        print("PASS: stored analysis, input hash and clinician review survived restart.")
        return
    cases = {c["label"]: c for c in client.call("/cases")}
    run = client.call(f'/cases/{cases["SYN-001"]["id"]}/analyze', "POST", expected=201)
    assert run["result"]["status"] == "READY_FOR_REVIEW"
    eligible = next(c for c in run["result"]["candidates"] if c["state"] == "PARETO_OPTIMAL")
    reviewed = client.call(f'/analyses/{run["id"]}/review', "POST", {
        "decision": "APPROVE_FURTHER_REVIEW", "candidate_id": eligible["therapy_id"],
        "comment": "Synthetic deployment smoke check. Further review only; not patient care."}, expected=201)
    blocked = client.call(f'/cases/{cases["SYN-002"]["id"]}/analyze', "POST", expected=201)
    atlas = next(c for c in blocked["result"]["candidates"] if c["name"] == "DEMO Atlas")
    assert atlas["state"] == "EXCLUDED"
    client.call(f'/analyses/{blocked["id"]}/review', "POST", {
        "decision": "APPROVE_FURTHER_REVIEW", "candidate_id": atlas["therapy_id"]}, expected=422)
    abstained = client.call(f'/cases/{cases["SYN-005"]["id"]}/analyze', "POST", expected=201)
    assert abstained["result"]["status"] == "ABSTAINED"
    assert abstained["result"]["message"] == "Insufficient validated evidence for recommendation."
    events = client.call(f'/audit/{run["id"]}')
    assert any(e["event_type"] == "clinician_decision" for e in events)
    report = client.call(f'/analyses/{run["id"]}/report')
    assert "not a prescription" in report
    args.state_file.parent.mkdir(parents=True, exist_ok=True)
    args.state_file.write_text(json.dumps({"analysis_id": run["id"], "result_hash": content_hash(run["result"]),
        "input_hash": run["input_hash"], "review_id": reviewed["reviews"][-1]["id"]}, indent=2) + "\n")
    client.call("/auth/logout", "POST")
    client.login("researcher")
    client.call(f'/analyses/{run["id"]}/review', "POST", {"decision": "REJECT"}, expected=403)
    client.call("/admin/therapies", "POST", {}, expected=403)
    client.call("/auth/logout", "POST")
    print("PASS: login, ranking, hard exclusion, abstention, review, audit, report and role restrictions.")


if __name__ == "__main__":
    main()

"""Private in-process API transport with the existing authentication and audit rules."""
import asyncio
import os
from pathlib import Path
import sys
import httpx

def roots():
    if getattr(sys, 'frozen', False):
        bundle = Path(sys._MEIPASS)
        assets = Path(sys.executable).parent / 'resources'
    else:
        bundle = Path(__file__).resolve().parents[1]
        assets = bundle / '.assets'
    data = Path(os.getenv('PMAI_DATA_DIR', str(Path(os.getenv('LOCALAPPDATA', Path.home())) / 'PersonalizedMedicineAI')))
    return bundle, Path(os.getenv('PMAI_ASSETS_DIR', str(assets))), data

def bootstrap():
    bundle, assets, data = roots()
    data.mkdir(parents=True, exist_ok=True)
    sys.path.insert(0, str(bundle / 'backend'))
    os.environ['DATABASE_URL'] = 'sqlite:///' + (data / 'desktop.sqlite').as_posix()
    os.environ['USE_HF_MODEL'] = 'false'
    os.environ['COOKIE_SECURE'] = 'false'
    os.environ['DEMO_CREDENTIALS_PATH'] = str(data / 'demo-credentials.txt')
    from alembic.config import Config
    from alembic import command
    config = Config()
    config.set_main_option('script_location', str(bundle / 'backend' / 'migrations'))
    command.upgrade(config, 'head')
    from app import seed as seeder
    from app.core.db import SessionLocal
    seeder.DATA = bundle / 'data'
    with SessionLocal() as db:
        seeder.seed(db)
    return assets, data

class Bridge:
    def __init__(self):
        from app.main import app
        self.app = app
        self.cookies = httpx.Cookies()

    def request(self, method, path, body=None):
        async def call():
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=self.app), base_url='http://desktop.local', cookies=self.cookies, timeout=60) as client:
                response = await client.request(method, '/api/v1' + path, json=body)
                self.cookies = client.cookies
                if response.is_error:
                    detail = response.json().get('detail', 'Request failed')
                    if isinstance(detail, list):
                        detail = '; '.join(str(item.get('msg', 'Invalid input')) for item in detail)
                    raise ValueError(str(detail))
                return response.text if 'text/html' in response.headers.get('content-type', '') else response.json()
        return asyncio.run(call())

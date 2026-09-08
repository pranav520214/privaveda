"""Download pinned model/runtime and official FDA bulk labels; verify before activation."""
import concurrent.futures
import json
import os
from pathlib import Path
import sys
import time
import urllib.request
import zipfile
import ijson

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from app.reference.catalog import ReferenceCatalog
from app.reference.local_model import sha256, gguf_parameter_count, validate_model_manifest

ASSETS = ROOT / '.assets'
ASSETS.mkdir(exist_ok=True)
MODEL_URL = 'https://huggingface.co/NewSonnet/triage-qwen2.5-1.5b-gguf/resolve/c18158f017b21aac89bd1de052d2c00fad327bce/qwen2.5-1.5b-instruct.Q4_K_M.gguf'
MODEL_HASH = '35dda66537779629d04fcee9e723f899a60d37c3e8e41504288a91b43dfcfd9d'
RUNTIME_URL = 'https://github.com/ggml-org/llama.cpp/releases/download/b10852/llama-b10852-bin-win-cpu-x64.zip'
RUNTIME_HASH = 'd57a613246ab1b54a8b9921319b276cddcc8bd83780d7dbeb39c6d2c00082e75'

def download(url, path, expected=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        digest = sha256(path)
        if expected is None or digest == expected:
            return digest
    temp = path.with_suffix(path.suffix + '.part')
    for attempt in range(4):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'PersonalizedMedicineResearchDesktop/1.0'})
            with urllib.request.urlopen(request, timeout=120) as response, temp.open('wb') as out:
                while block := response.read(1024 * 1024):
                    out.write(block)
            digest = sha256(temp)
            if expected and digest != expected:
                raise ValueError('SHA-256 mismatch for ' + path.name)
            temp.replace(path)
            print('Downloaded and hashed: ' + path.name, flush=True)
            return digest
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)

def model():
    path = ASSETS / 'model' / 'medical-1.5b-q4.gguf'
    digest = download(MODEL_URL, path, MODEL_HASH)
    manifest = {'name': 'NewSonnet triage Qwen2.5-1.5B', 'source_url': MODEL_URL,
                'sha256': digest, 'parameter_count': gguf_parameter_count(path),
                'status': 'EXPERIMENTAL_NOT_CLINICALLY_VALIDATED', 'license': 'Apache-2.0 publisher claim; training data rights not established'}
    validate_model_manifest(manifest)
    (path.parent / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    download(MODEL_URL.rsplit('/', 1)[0] + '/README.md', path.parent / 'MODEL_CARD.md')
    archive = ASSETS / 'downloads' / 'llama-b10852-bin-win-cpu-x64.zip'
    download(RUNTIME_URL, archive, RUNTIME_HASH)
    destination = (ASSETS / 'runtime').resolve()
    destination.mkdir(exist_ok=True)
    with zipfile.ZipFile(archive) as z:
        for member in z.infolist():
            target = (destination / member.filename).resolve()
            if not target.is_relative_to(destination):
                raise ValueError('Unsafe runtime archive path')
        z.extractall(destination)
    binaries = {str(p.relative_to(destination)): sha256(p) for p in destination.rglob('*') if p.is_file()}
    (destination / 'manifest.json').write_text(json.dumps({'url': RUNTIME_URL, 'archive_sha256': RUNTIME_HASH, 'files': binaries}, indent=2), encoding='utf-8')
    print('MODEL READY: ' + str(manifest['parameter_count']) + ' actual parameters', flush=True)

def references():
    manifest_path = ASSETS / 'downloads' / 'openfda-download.json'
    download('https://api.fda.gov/download.json', manifest_path)
    manifest = json.loads(manifest_path.read_text())['results']['drug']['label']
    partial = ASSETS / 'references.building.sqlite'
    catalog = ReferenceCatalog(partial)
    catalog.initialize()
    parts = manifest['partitions']
    def fetch(part):
        url = part['file']
        if not url.startswith('https://download.open.fda.gov/drug/label/'):
            raise ValueError('Untrusted FDA partition host')
        path = ASSETS / 'downloads' / url.rsplit('/', 1)[-1]
        return url, path, download(url, path)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(fetch, part) for part in parts]
        for future in futures:
            url, path, digest = future.result()
            if catalog.imported(url, digest):
                print('Already indexed: ' + path.name, flush=True)
                continue
            with zipfile.ZipFile(path) as archive:
                names = [n for n in archive.namelist() if n.endswith('.json')]
                if len(names) != 1:
                    raise ValueError('Unexpected FDA archive structure')
                with archive.open(names[0]) as source:
                    count = catalog.ingest(ijson.items(source, 'results.item'), url, digest, manifest['export_date'])
            print('Indexed ' + str(count) + ' records: ' + path.name, flush=True)
    with catalog.connect() as conn:
        raw_count = conn.execute('SELECT sum(record_count) FROM imports').fetchone()[0]
    if raw_count != manifest['total_records']:
        raise ValueError('FDA record count mismatch; incomplete index not activated')
    summary = {'source': 'https://api.fda.gov/download.json', 'export_date': manifest['export_date'],
               'raw_records': raw_count, 'indexed_records': catalog.count(), 'partitions': len(parts)}
    partial.replace(ASSETS / 'references.sqlite')
    (ASSETS / 'references-manifest.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
    print('REFERENCE LIBRARY READY: ' + json.dumps(summary), flush=True)

if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        tasks = [pool.submit(model), pool.submit(references)]
        for task in tasks:
            task.result()

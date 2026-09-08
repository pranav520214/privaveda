"""Download pinned model/runtime and official FDA bulk labels; verify before activation."""
import concurrent.futures
import json
import os
from pathlib import Path
import sys
import subprocess
import shutil
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
            subprocess.run(['curl.exe', '--fail', '--location', '--silent', '--show-error',
                            '--connect-timeout', '30', '--max-time', '1800', '--retry', '2',
                            '--output', str(temp), url], check=True, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
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
    if not path.exists():
        # Some CDN routes stall on whole-file transfers. Bounded ranges are resumable.
        size, chunk_size = 986048096, 8 * 1024 * 1024
        chunks = ASSETS / 'downloads' / 'model-chunks'
        chunks.mkdir(parents=True, exist_ok=True)
        def fetch_chunk(start):
            end = min(start + chunk_size, size) - 1
            chunk = chunks / str(start)
            if chunk.exists() and chunk.stat().st_size == end-start+1:
                return chunk
            subprocess.run(['curl.exe','--fail','--location','--silent','--show-error','--max-time','180','--retry','3',
                            '--range',f'{start}-{end}','--output',str(chunk),MODEL_URL+'?download=true'],check=True,
                           creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
            if chunk.stat().st_size != end-start+1:
                raise ValueError('Model range length mismatch')
            return chunk
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            files = list(pool.map(fetch_chunk,range(0,size,chunk_size)))
        path.parent.mkdir(parents=True, exist_ok=True)
        temp = path.with_suffix('.verified-part')
        with temp.open('wb') as out:
            for chunk in files:
                with chunk.open('rb') as source:
                    while block := source.read(1024*1024):
                        out.write(block)
        if sha256(temp) != MODEL_HASH:
            raise ValueError('Assembled model SHA-256 mismatch')
        temp.replace(path)
    digest = sha256(path)
    if digest != MODEL_HASH:
        raise ValueError('Model SHA-256 mismatch')
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
    shutil.copyfile(archive, destination / 'verified-runtime.zip')
    binaries = {str(p.relative_to(destination)): sha256(p) for p in destination.rglob('*') if p.is_file() and p.name not in ('manifest.json','verified-runtime.zip')}
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

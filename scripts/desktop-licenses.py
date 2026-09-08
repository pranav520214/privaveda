"""Collect installed license texts and public upstream model/runtime notices."""
import importlib.metadata
import json
from pathlib import Path
import shutil
import subprocess
import sys

destination = Path(sys.argv[1])/'licenses'
destination.mkdir(parents=True,exist_ok=True)
packages = []
for dist in importlib.metadata.distributions():
    name = dist.metadata['Name']
    packages.append({'name':name,'version':dist.version,'license':dist.metadata.get('License-Expression') or dist.metadata.get('License','See included texts')})
    for entry in dist.files or []:
        if 'license' in entry.name.lower() or 'copying' in entry.name.lower() or '/licenses/' in str(entry).replace('\\','/'):
            source = Path(dist.locate_file(entry))
            if source.is_file() and source.suffix.lower() not in ('.py','.pyc','.exe','.dll'):
                target = destination/name/entry.name
                target.parent.mkdir(parents=True,exist_ok=True)
                shutil.copyfile(source,target)
(destination/'installed-package-inventory.json').write_text(json.dumps(packages,indent=2),encoding='utf-8')
python_license = Path(sys.base_prefix)/'LICENSE.txt'
if python_license.exists():
    shutil.copyfile(python_license,destination/'PYTHON-LICENSE.txt')
for name,url in {
    'LLAMA-CPP-LICENSE.txt':'https://raw.githubusercontent.com/ggml-org/llama.cpp/b10852/LICENSE',
    'QWEN-BASE-APACHE-LICENSE.txt':'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct/raw/main/LICENSE',
}.items():
    subprocess.run(['curl.exe','--fail','--location','--silent','--show-error','--max-time','60','--output',str(destination/name),url],check=True)
print('Collected dependency and upstream license texts')

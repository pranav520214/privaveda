"""Run real local CPU inference against downloaded public label excerpts."""
import json
import sys
import time
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT/'backend'), str(ROOT/'desktop')]
from app.reference.catalog import ReferenceCatalog
from inference import LocalModel

catalog = ReferenceCatalog(ROOT/'.assets/references.sqlite')
label = next(label for row in catalog.search('metformin') if (label := catalog.get(row['id']))['sections'].get('indications_and_usage'))
sentences = [key.replace('_',' ') + ': ' + value[:280] for key,value in label['sections'].items()
             if key in ('indications_and_usage','contraindications','warnings','warnings_and_cautions','drug_interactions')][:8]
model = LocalModel(ROOT/'.assets')
start = time.monotonic()
try:
    selected = model.select('What warnings and contraindications does this label contain?',sentences)
    assert selected and all(s in sentences for s in selected)
    report = {'status':'PASS','seconds':round(time.monotonic()-start,2),'indexed_records':catalog.count(),
              'label_id':label['id'],'source_url':label['source_url'],'supplied_excerpts':len(sentences),
              'selected_excerpts':len(selected),'all_output_is_verbatim_source':True,
              'model':json.loads((ROOT/'.assets/model/manifest.json').read_text())}
    (ROOT/'.local').mkdir(exist_ok=True)
    (ROOT/'.local/desktop-model-smoke.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))
finally:
    model.close()

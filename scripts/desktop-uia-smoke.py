"""ECC Windows UIA test: packaged process, isolated profile, scoped screenshot."""
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import time
from uuid import uuid4
from pywinauto import Application
from pywinauto.timings import wait_until

ROOT = Path(__file__).resolve().parents[1]
exe = ROOT/'desktop/dist/PersonalizedMedicineAI/PersonalizedMedicineAI.exe'
profile = ROOT/'.local'/('native-uia-' + uuid4().hex[:8])
profile.mkdir(parents=True)
env = os.environ.copy()
for key in ('APPDATA','LOCALAPPDATA','TEMP','TMP','PMAI_DATA_DIR'):
    target = profile/key
    target.mkdir()
    env[key] = str(target)
env['QT_ACCESSIBILITY'] = '1'
env.pop('PMAI_ASSETS_DIR',None)
process = subprocess.Popen([str(exe)],env=env,cwd=exe.parent)
app = Application(backend='uia').connect(process=process.pid,timeout=30)
try:
    window = app.window(title='Personalized Medicine AI — Desktop')
    try:
        window.wait('visible',timeout=30)
    except Exception:
        print('Startup windows:',[(w.window_text(),w.texts()) for w in app.windows()])
        raise
    window.child_window(title='btnDemoLogin',control_type='Button').click_input()
    print('Packaged window opened; demo sign-in invoked',flush=True)
    cases = window.child_window(title='caseList')
    cases.wait('visible enabled',timeout=30)
    # The authenticated case load completes after the workspace first appears.
    db = Path(env['PMAI_DATA_DIR'])/'desktop.sqlite'
    def count(table):
        with sqlite3.connect(db) as conn:
            return conn.execute('SELECT count(*) FROM ' + table).fetchone()[0]
    before = count('analysis_runs')
    window.child_window(title='Run analysis',control_type='Button').wait('enabled',timeout=30).click_input()
    wait_until(30,.2,lambda:count('analysis_runs') > before)
    print('Case analysis passed',flush=True)
    window.child_window(title='Medicine library',control_type='ListItem').click_input()
    search = window.child_window(title='medicineSearch',control_type='Edit')
    search.wait('visible enabled',timeout=30).set_edit_text('metformin')
    window.child_window(title='searchLabels',control_type='Button').click_input()
    results = window.child_window(title='medicineResults')
    wait_until(30,.2,lambda:len(results.descendants(control_type='ListItem')) > 0)
    generate = window.child_window(title='generateBrief',control_type='Button')
    print('FDA search passed',flush=True)
    generate.wait('enabled',timeout=30).click_input()
    save = window.child_window(title='saveReferenceReport',control_type='Button')
    save.wait('enabled',timeout=180)
    window.child_window(title='referenceAssessment',control_type='Edit').set_edit_text('Synthetic UIA review: source excerpts checked. No patient-specific diagnosis.')
    save.click_input()
    reports = Path(env['PMAI_DATA_DIR'])/'reports'
    wait_until(30,.2,lambda:len(list(reports.glob('*.json'))) == 1)
    snapshot = json.loads(next(reports.glob('*.json')).read_text(encoding='utf-8'))['snapshot']
    assert snapshot['model']['parameter_count'] <= 2_000_000_000
    assert snapshot['selected_excerpts']
    print('Model and saved report passed',flush=True)
    window.child_window(title='Saved reports',control_type='ListItem').click_input()
    saved = window.child_window(title='savedReports')
    saved.descendants(control_type='ListItem')[0].click_input()
    window.capture_as_image().save(str(ROOT/'.local/native-desktop.png'))
    report = {'status':'PASS','profile':str(profile),'packaged_executable':str(exe),'case_analysis_created':True,
              'real_model_used':True,'saved_report_id':snapshot['id'],'parameter_count':snapshot['model']['parameter_count']}
    (ROOT/'.local/desktop-uia-smoke.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))
except Exception:
    print('Packaged process exit:',process.poll(),flush=True)
    if process.poll() is None:
        print('App text:',[(w.window_text(),[(c.element_info.control_type,c.element_info.name[:300]) for c in w.descendants() if c.element_info.control_type in ('Text','Button')][:25]) for w in app.windows()],flush=True)
    raise
finally:
    try:
        app.top_window().close()
        process.wait(timeout=10)
    except Exception:
        process.terminate()
        process.wait(timeout=5)

"""ECC native flow checks in isolated user storage; real model gets a separate smoke run."""
import json
import os
from pathlib import Path
import sys
import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'desktop'))
sys.path.insert(0,str(ROOT/'backend'))

@pytest.fixture(scope='session')
def workspace(tmp_path_factory):
    folder = tmp_path_factory.mktemp('native-profile')
    for name in ('APPDATA','LOCALAPPDATA','TEMP','TMP','PMAI_DATA_DIR'):
        target = folder/name
        target.mkdir()
        os.environ[name] = str(target)
    os.environ['PMAI_ASSETS_DIR'] = str(folder/'assets')
    from bridge import bootstrap
    assets,data = bootstrap()
    from app.reference.catalog import ReferenceCatalog
    catalog = ReferenceCatalog(assets/'references.sqlite')
    catalog.initialize()
    catalog.ingest([{'id':'test-label','set_id':'test-set','openfda':{'brand_name':['TEST aspirin'],'generic_name':['aspirin']},'warnings':['Fixture warning, not medical advice.'],'indications_and_usage':['Fixture indication.']}], 'https://download.open.fda.gov/test','test-hash','2026-09-07')
    (assets/'model').mkdir()
    (assets/'model/manifest.json').write_text(json.dumps({'name':'TEST MODEL','parameter_count':1543714304,'sha256':'a'*64}))
    return assets,data

@pytest.fixture
def window(qtbot,workspace):
    from main import Window
    w = Window(*workspace)
    qtbot.addWidget(w)
    w.show()
    yield w
    qtbot.waitUntil(lambda:w.job is None,timeout=30000)
    w.model.close()

def test_native_login_case_analysis_search_brief_save_and_pdf(qtbot,window,monkeypatch,tmp_path):
    w = window
    w.demo_login()
    qtbot.waitUntil(lambda:w.current_run is not None and w.job is None,timeout=30000)
    assert w.case_list.count() == 10
    assert 'SYN-001' in w.case_report.toPlainText()
    assert w.user['role'] == 'CLINICIAN'
    w.analyze()
    qtbot.waitUntil(lambda:w.job is None,timeout=30000)
    assert w.current_run['result']['candidates']
    w.nav.setCurrentRow(1)
    w.search.setText('aspirin')
    w.search_labels()
    qtbot.waitUntil(lambda:w.current_label is not None and w.job is None,timeout=30000)
    assert w.current_label['id'] == 'test-label'
    monkeypatch.setattr(w.model,'select',lambda question,sentences:sentences[:1])
    w.generate_brief()
    qtbot.waitUntil(lambda:w.brief is not None and w.job is None,timeout=30000)
    assert 'Fixture warning' in w.label_report.toPlainText()
    w.assessment.setPlainText('Clinician fixture assessment, not a real diagnosis.')
    w.save_brief()
    qtbot.waitUntil(lambda:w.saved.count() == 1 and w.job is None,timeout=30000)
    w.saved.setCurrentRow(0)
    assert 'Clinician fixture assessment' in w.saved_preview.toPlainText()
    from main import write_pdf
    path = tmp_path/'report.pdf'
    write_pdf(w.saved_preview.toHtml(),path)
    assert path.read_bytes().startswith(b'%PDF')
    assert path.stat().st_size > 4000
    w.logout()
    qtbot.waitUntil(lambda:w.root.currentIndex() == 0 and w.job is None,timeout=30000)
    assert w.current_label is None
    assert w.saved_preview.toPlainText() == ''

def test_case_editor_preserves_typed_observations(qtbot):
    from main import CaseEditor
    dialog = CaseEditor({'label':'SYN-TEST','condition':'DEMO-CONTEXT-A','age_band':'65+','sex':'female', 'labs':{'DEMO-LAB':72}, 'genomics':{'DEMO-G1':'unflagged'},'history':['x','y']})
    qtbot.addWidget(dialog)
    result = dialog.value()
    assert result['labs'] == {'DEMO-LAB':72.0}
    assert result['genomics'] == {'DEMO-G1':'unflagged'}
    assert result['history'] == ['x','y']
    assert result['synthetic'] is True


def test_native_create_edit_clinician_review_and_export(qtbot,window,monkeypatch,tmp_path):
    from PySide6.QtCore import QTimer
    from PySide6.QtWidgets import QApplication, QLineEdit, QPlainTextEdit, QDialog, QFileDialog
    w = window
    w.demo_login()
    qtbot.waitUntil(lambda:w.current_run is not None and w.job is None,timeout=30000)
    def fill_new():
        dialog = QApplication.activeModalWidget()
        dialog.findChild(QLineEdit,'case_label').setText('SYN-NATIVE-CREATED')
        dialog.accept()
    QTimer.singleShot(50,fill_new)
    w.edit_case(True)
    qtbot.waitUntil(lambda:w.case_list.count() == 11 and w.job is None,timeout=30000)
    w.case_list.setCurrentRow(10)
    qtbot.waitUntil(lambda:w.current_case['label'] == 'SYN-NATIVE-CREATED' and w.job is None,timeout=30000)
    def fill_edit():
        dialog = QApplication.activeModalWidget()
        dialog.findChild(QPlainTextEdit,'case_notes').setPlainText('Native edit persisted')
        dialog.accept()
    QTimer.singleShot(50,fill_edit)
    w.edit_case()
    qtbot.waitUntil(lambda:w.job is None,timeout=30000)
    w.case_list.setCurrentRow(10)
    qtbot.waitUntil(lambda:w.current_case['label'] == 'SYN-NATIVE-CREATED' and w.job is None,timeout=30000)
    assert w.current_case['data']['notes'] == 'Native edit persisted'
    w.analyze()
    qtbot.waitUntil(lambda:w.job is None,timeout=30000)
    def fill_review():
        dialog = QApplication.activeModalWidget()
        dialog.findChild(QPlainTextEdit,'clinicianAssessment').setPlainText('Synthetic differential remains inconclusive; obtain missing observations.')
        dialog.accept()
    QTimer.singleShot(50,fill_review)
    w.review()
    qtbot.waitUntil(lambda:w.job is None,timeout=30000)
    assert w.current_run['reviews'][-1]['decision'] == 'INCONCLUSIVE'
    assert 'Synthetic differential' in w.case_report.toPlainText()
    monkeypatch.setattr(QFileDialog,'getSaveFileName',lambda *args:(str(tmp_path/'case.pdf'),'PDF'))
    w.export_pdf(w.case_report.toHtml())
    assert (tmp_path/'case.pdf').read_bytes().startswith(b'%PDF')


def test_bridge_rejects_invalid_credentials(workspace):
    from bridge import Bridge
    bridge = Bridge()
    with pytest.raises(ValueError,match='Invalid username or password'):
        bridge.request('POST','/auth/login',{'username':'not-an-account','password':'invalid'})
    with pytest.raises(ValueError):
        bridge.request('GET','/cases')


@pytest.mark.skipif(not (ROOT/'.assets/model/manifest.json').exists(),reason='Real local assets not installed')
def test_real_model_and_runtime_integrity(tmp_path):
    from inference import LocalModel
    from app.reference.catalog import ReferenceCatalog
    catalog = ReferenceCatalog(ROOT/'.assets/references.sqlite')
    label = catalog.get(catalog.search('metformin')[0]['id'])
    excerpts = [v[:200] for k,v in label['sections'].items() if k in ('indications_and_usage','contraindications','boxed_warning')]
    model = LocalModel(ROOT/'.assets')
    try:
        with pytest.raises(ValueError,match='Select a label'):
            model.select('question',[])
        selected = model.select('Which excerpts explain warnings?',excerpts)
        assert selected and all(v in excerpts for v in selected)
        model.start()  # Running server can be reused without spawning another process.
    finally:
        model.close()
    assert model.process is None
    fake = tmp_path/'model'
    fake.mkdir()
    (fake/'manifest.json').write_text(json.dumps({'parameter_count':1543714304,'sha256':'a'*64}))
    with pytest.raises(ValueError,match='integrity'):
        LocalModel(tmp_path).start()


def test_headless_pdf_contains_selectable_readable_text(tmp_path):
    import subprocess
    env = os.environ.copy()
    env['QT_QPA_PLATFORM'] = 'offscreen'
    code = "from PySide6.QtWidgets import QApplication;from PySide6.QtPdf import QPdfDocument;from pathlib import Path;from main import write_pdf;a=QApplication([]);p=Path(__import__('sys').argv[1]);write_pdf('<h1>Readable clinical review</h1><p>Source evidence with clinician assessment.</p>',p);d=QPdfDocument();d.load(str(p));assert 'Readable clinical review' in d.getAllText(0).text()"
    result = subprocess.run([sys.executable,'-c',code,str(tmp_path/'readable.pdf')],cwd=ROOT/'desktop',env=env,capture_output=True,text=True,timeout=30)
    assert result.returncode == 0, result.stderr

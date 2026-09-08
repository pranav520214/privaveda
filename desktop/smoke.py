"""Packaged diagnostic flow, run only with explicit --smoke-test and isolated storage."""
import json
import time
from PySide6.QtCore import QTimer
from PySide6.QtPdf import QPdfDocument

def start(app, window):
    from main import write_pdf
    state = {'phase':0,'deadline':time.monotonic()+180}
    timer = QTimer(window)
    timer.setInterval(100)
    def tick():
        try:
            if time.monotonic() > state['deadline']:
                raise RuntimeError('Packaged flow timed out at phase ' + str(state['phase']))
            if window.job is not None:
                return
            phase = state['phase']
            if phase == 0:
                window.demo_login()
            elif phase == 1:
                if not window.current_run:
                    raise RuntimeError('Case did not load')
                state['previous_run'] = window.current_run['id']
                window.analyze()
            elif phase == 2:
                if window.current_run['id'] == state['previous_run']:
                    raise RuntimeError('Analysis was not created')
                write_pdf(window.case_report.toHtml(),window.data/'sample-case-report.pdf')
                window.nav.setCurrentRow(1)
                window.search.setText('metformin')
                window.search_labels()
            elif phase == 3:
                if not window.current_label:
                    raise RuntimeError('Reference did not load')
                window.generate_brief()
            elif phase == 4:
                if not window.brief:
                    raise RuntimeError('Real model did not produce a brief')
                window.assessment.setPlainText('Synthetic test: clinician review of source excerpts. Not a patient diagnosis.')
                window.save_brief()
            elif phase == 5:
                if not window.saved.count():
                    raise RuntimeError('Report did not persist')
                window.nav.setCurrentRow(2)
                window.saved.setCurrentRow(0)
                write_pdf(window.saved_preview.toHtml(),window.data/'sample-reference-report.pdf')
                for name, expected in [('sample-case-report.pdf','SYNTHETIC'),('sample-reference-report.pdf','Medicine reference review')]:
                    pdf = QPdfDocument(window)
                    pdf.load(str(window.data/name))
                    content = '\n'.join(pdf.getAllText(i).text() for i in range(pdf.pageCount()))
                    if expected not in content:
                        raise RuntimeError('PDF text verification failed: ' + name)
                    pdf.close()
                window.grab().save(str(window.data/'native-window.png'))
                result = {'status':'PASS','case_analysis':True,'real_local_model':True,'source_records':262737,
                          'saved_reference_report':True,'case_pdf':True,'reference_pdf':True,
                          'parameter_count':window.brief['model']['parameter_count']}
                (window.data/'packaged-smoke.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
                timer.stop()
                window.close()
                app.exit(0)
                return
            state['phase'] += 1
        except Exception as exc:
            (window.data/'packaged-smoke.json').write_text(json.dumps({'status':'FAIL','error':str(exc),'phase':state['phase']}),encoding='utf-8')
            timer.stop()
            if not window.job:
                window.close()
            app.exit(1)
    timer.timeout.connect(tick)
    timer.start()
    window._smoke_timer = timer

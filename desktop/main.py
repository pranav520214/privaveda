"""Windows-native Qt Widgets research workstation."""
import json
import os
import sys
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from uuid import uuid4

from PySide6.QtCore import Qt, QThread, Signal, QUrl, QMarginsF
from PySide6.QtGui import QDesktopServices, QTextDocument, QPageSize, QPageLayout, QFontDatabase, QFont, QTextOption
from PySide6.QtPrintSupport import QPrinter
from PySide6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QLineEdit, QTextBrowser, QPlainTextEdit, QListWidget, QListWidgetItem,
    QStackedWidget, QSplitter, QDialog, QDialogButtonBox, QFormLayout, QComboBox,
    QFileDialog, QMessageBox, QTableWidget, QTableWidgetItem, QHeaderView)
from bridge import bootstrap, Bridge, roots

def named(widget, name):
    widget.setObjectName(name)
    widget.setAccessibleName(name)
    return widget

def button(text, callback, name=None):
    w = named(QPushButton(text), name or text)
    w.clicked.connect(callback)
    return w

def viewer(name):
    w = named(QTextBrowser(), name)
    w.setOpenExternalLinks(False)
    w.setOpenLinks(False)
    return w

class Job(QThread):
    success = Signal(object)
    failure = Signal(str)
    def __init__(self, work, parent=None):
        super().__init__(parent)
        self.work = work
    def run(self):
        try:
            self.success.emit(self.work())
        except Exception as exc:
            self.failure.emit(str(exc)[:700])

class CaseEditor(QDialog):
    def __init__(self, data=None, parent=None):
        super().__init__(parent)
        self.setWindowTitle('Synthetic case details')
        self.resize(600, 760)
        data = data or {'label':'SYN-NEW', 'condition':'DEMO-CONTEXT-A', 'age_band':'40-64', 'sex':'unspecified'}
        self.original = data
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel('Synthetic cases only • Scores use the fictional demo therapy library.'))
        form = QFormLayout()
        self.fields = {}
        for key, title in [('label','Case label'), ('condition','Demo condition context'), ('age_band','Age band'), ('sex','Sex'), ('history','History (comma separated)'), ('medications','Medications (comma separated)'), ('allergies','Allergies (comma separated)')]:
            if key in ('age_band','sex'):
                field = QComboBox()
                field.addItems(['18-39','40-64','65+','unknown'] if key == 'age_band' else ['female','male','unspecified'])
                field.setCurrentText(data.get(key, ''))
            else:
                value = data.get(key, '')
                field = QLineEdit(', '.join(value) if isinstance(value, list) else str(value))
            self.fields[key] = named(field, 'case_' + key)
            form.addRow(title, field)
        layout.addLayout(form)
        self.tables = {}
        for key, title in [('labs','Labs — observation and number'), ('genomics','Genomics — marker and value'), ('organ_function','Organ function — observation and value')]:
            layout.addWidget(QLabel(title))
            table = named(QTableWidget(max(2, len(data.get(key, {}))+1), 2), 'case_' + key)
            table.setHorizontalHeaderLabels(['Observation', 'Value'])
            table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
            table.setMaximumHeight(110)
            for row, (name, value) in enumerate(data.get(key, {}).items()):
                table.setItem(row, 0, QTableWidgetItem(name))
                table.setItem(row, 1, QTableWidgetItem(str(value)))
            self.tables[key] = table
            layout.addWidget(table)
        self.notes = named(QPlainTextEdit(data.get('notes','')), 'case_notes')
        self.notes.setPlaceholderText('Clinician-entered notes; not interpreted by the demo scoring engine')
        self.notes.setMaximumHeight(85)
        layout.addWidget(self.notes)
        actions = QDialogButtonBox(QDialogButtonBox.StandardButton.Save | QDialogButtonBox.StandardButton.Cancel)
        actions.accepted.connect(self.accept)
        actions.rejected.connect(self.reject)
        layout.addWidget(actions)
    def value(self):
        result = {'synthetic':True, 'notes':self.notes.toPlainText()}
        for key, field in self.fields.items():
            value = field.currentText() if isinstance(field, QComboBox) else field.text().strip()
            result[key] = [v.strip() for v in value.split(',') if v.strip()] if key in ('history','medications','allergies') else value
        for key, table in self.tables.items():
            result[key] = {}
            for row in range(table.rowCount()):
                a, b = table.item(row,0), table.item(row,1)
                if a and a.text().strip():
                    val = b.text().strip() if b else ''
                    result[key][a.text().strip()] = float(val) if key == 'labs' else val
        return result

class Window(QMainWindow):
    def __init__(self, assets, data):
        super().__init__()
        from app.reference.catalog import ReferenceCatalog
        from inference import LocalModel
        self.assets, self.data = assets, data
        self.api = Bridge()
        self.catalog = ReferenceCatalog(assets / 'references.sqlite')
        self.model = LocalModel(assets)
        self.user = None
        self.current_case = self.current_run = self.current_label = None
        self.brief = None
        self.job = None
        self.setWindowTitle('Personalized Medicine AI — Desktop')
        self.resize(1280, 850)
        self.setMinimumSize(960, 680)
        self.root = QStackedWidget()
        self.setCentralWidget(self.root)
        self.login_page()
        self.workspace()
        self.statusBar().showMessage('Local research workstation • Synthetic cases only')

    def run_job(self, work, done, message='Working…'):
        if self.job and self.job.isRunning():
            return
        self.statusBar().showMessage(message)
        self.root.setEnabled(False)
        job = Job(work, self)
        self.job = job
        result = {}
        job.success.connect(lambda value: result.update(value=value))
        job.failure.connect(lambda error: result.update(error=error))
        def finished():
            self.root.setEnabled(True)
            self.statusBar().showMessage('Ready • All records and inference stay on this computer')
            if 'error' in result:
                QMessageBox.warning(self, 'Could not complete action', result['error'])
            elif 'value' in result:
                done(result['value'])
            job.deleteLater()
            if self.job is job:
                self.job = None
        job.finished.connect(finished)
        job.start()

    def login_page(self):
        page = QWidget()
        outer = QVBoxLayout(page)
        outer.addStretch()
        title = QLabel('Personalized Medicine AI')
        title.setStyleSheet('font-size:32px;font-weight:700;color:#123f43')
        outer.addWidget(title)
        outer.addWidget(QLabel('Native Windows workspace\nMedicine references • Local model • Clinician review'))
        self.username = named(QLineEdit('clinician@demo.local'), 'usernameInput')
        self.password = named(QLineEdit(), 'passwordInput')
        self.password.setEchoMode(QLineEdit.EchoMode.Password)
        self.password.returnPressed.connect(self.login)
        form = QFormLayout()
        form.addRow('Account', self.username)
        form.addRow('Password', self.password)
        outer.addLayout(form)
        outer.addWidget(button('Sign in', self.login, 'btnLogin'))
        outer.addWidget(button('Open local synthetic demo', self.demo_login, 'btnDemoLogin'))
        outer.addWidget(QLabel('Demo access uses the clinician account created for this Windows user.\nResearch prototype: not validated for patient care, diagnosis or prescribing.'))
        outer.addStretch()
        outer.setContentsMargins(160, 70, 160, 70)
        self.root.addWidget(page)

    def demo_login(self):
        try:
            rows = (self.data / 'demo-credentials.txt').read_text(encoding='utf-8').splitlines()
            password = next(row.split(': ',1)[1] for row in rows if row.startswith('clinician@demo.local: '))
        except (OSError, StopIteration):
            QMessageBox.information(self, 'Sign in required', 'Local demo access is unavailable. Sign in with your existing account password.')
            return
        self.authenticate('clinician@demo.local', password)

    def login(self):
        self.authenticate(self.username.text(), self.password.text())

    def authenticate(self, username, password):
        def work():
            user = self.api.request('POST','/auth/login', {'username':username,'password':password})
            return user, self.api.request('GET','/cases')
        def done(result):
            self.user, cases = result
            self.password.clear()
            self.account.setText(self.user['username'] + ' • ' + self.user['role'].capitalize())
            clinician = self.user['role'] == 'CLINICIAN'
            for control in self.clinician_controls:
                control.setEnabled(clinician)
            self.root.setCurrentIndex(1)
            self.fill_cases(cases)
            self.refresh_saved()
            self.refresh_status()
        self.run_job(work, done, 'Signing in locally…')

    def workspace(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        header = QHBoxLayout()
        logo = QLabel('Personalized Medicine AI')
        logo.setStyleSheet('font-size:23px;font-weight:700;color:#12484c')
        header.addWidget(logo)
        header.addStretch()
        self.account = QLabel()
        header.addWidget(self.account)
        header.addWidget(button('Sign out', self.logout))
        layout.addLayout(header)
        note = QLabel('RESEARCH PROTOTYPE   •   Synthetic case analysis   •   Reference labels require professional interpretation')
        note.setStyleSheet('background:#fff0cd;color:#644814;padding:10px;border-radius:6px')
        layout.addWidget(note)
        body = QHBoxLayout()
        self.nav = named(QListWidget(), 'workspaceNavigation')
        self.nav.addItems(['Case workspace', 'Medicine library', 'Saved reports', 'Local system'])
        self.nav.setMaximumWidth(185)
        self.nav.setSpacing(6)
        self.pages = QStackedWidget()
        self.nav.currentRowChanged.connect(self.pages.setCurrentIndex)
        body.addWidget(self.nav)
        body.addWidget(self.pages, 1)
        layout.addLayout(body)
        self.clinician_controls = []
        self.case_page()
        self.library_page()
        self.saved_page()
        self.system_page()
        self.nav.setCurrentRow(0)
        self.root.addWidget(page)

    def logout(self):
        def done(_):
            self.user = None
            self.current_case = self.current_run = self.current_label = self.brief = None
            self.case_list.clear()
            self.case_report.clear()
            self.label_report.clear()
            self.saved_preview.clear()
            self.results.clear()
            self.assessment.clear()
            self.root.setCurrentIndex(0)
        self.run_job(lambda:self.api.request('POST','/auth/logout'), done, 'Signing out…')

    def case_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        bar = QHBoxLayout()
        for title, callback in [('New case',lambda:self.edit_case(True)), ('Edit case',self.edit_case), ('Run analysis',self.analyze), ('Clinician review',self.review)]:
            control = button(title, callback)
            self.clinician_controls.append(control)
            bar.addWidget(control)
        bar.addWidget(button('Export case PDF', lambda:self.export_pdf(self.case_report.toHtml()), 'exportCasePdf'))
        layout.addLayout(bar)
        split = QSplitter()
        self.case_list = named(QListWidget(), 'caseList')
        self.case_list.currentItemChanged.connect(self.select_case)
        self.case_report = viewer('caseReport')
        split.addWidget(self.case_list)
        split.addWidget(self.case_report)
        split.setSizes([210, 800])
        layout.addWidget(split)
        self.pages.addWidget(page)

    def fill_cases(self, cases):
        self.case_list.blockSignals(True)
        self.case_list.clear()
        for case in cases:
            item = QListWidgetItem(case['label'] + '\n' + case['latest_status'].replace('_',' ').capitalize())
            item.setData(Qt.ItemDataRole.UserRole, case)
            self.case_list.addItem(item)
        self.case_list.blockSignals(False)
        if cases:
            self.case_list.setCurrentRow(0)

    def select_case(self, item, previous=None):
        if not item:
            return
        case = item.data(Qt.ItemDataRole.UserRole)
        def work():
            current = self.api.request('GET','/cases/' + case['id'])
            run = self.api.request('GET','/analyses/' + current['latest_analysis_id']) if current.get('latest_analysis_id') else None
            return current, run
        def done(value):
            from app.services.report import report_html, readable
            self.current_case, self.current_run = value
            self.case_report.setHtml(report_html(self.current_run) if self.current_run else '<h1>Case awaiting analysis</h1>' + readable(self.current_case['data']))
        self.run_job(work, done, 'Loading case and analysis…')

    def edit_case(self, new=False):
        if not new and not self.current_case:
            return
        dialog = CaseEditor(None if new else self.current_case['data'], self)
        if dialog.exec() != QDialog.DialogCode.Accepted:
            return
        try:
            value = dialog.value()
        except ValueError:
            QMessageBox.warning(self,'Check the lab values','Lab values must be finite numbers.')
            return
        path, method = '/cases', 'POST'
        if not new:
            path += '/' + self.current_case['id']
            method = 'PUT'
            value['revision'] = self.current_case['revision']
        def work():
            self.api.request(method,path,value)
            return self.api.request('GET','/cases')
        self.run_job(work,self.fill_cases,'Saving synthetic case…')

    def analyze(self):
        if not self.current_case:
            return
        def done(run):
            from app.services.report import report_html
            self.current_run = run
            self.case_report.setHtml(report_html(run))
        self.run_job(lambda:self.api.request('POST','/cases/' + self.current_case['id'] + '/analyze'),done,'Evaluating demo rules and evidence…')

    def review(self):
        if not self.current_run:
            return
        dialog = QDialog(self)
        dialog.setWindowTitle('Clinician assessment and review')
        dialog.resize(650,430)
        layout = QVBoxLayout(dialog)
        layout.addWidget(QLabel('Record your own assessment or differential. The model does not diagnose.'))
        choice = QComboBox()
        for title, value in [('Inconclusive','INCONCLUSIVE'),('Request information','REQUEST_INFORMATION'),('Reject','REJECT'),('Approve for further review','APPROVE_FURTHER_REVIEW')]:
            choice.addItem(title,value)
        layout.addWidget(choice)
        candidate = QComboBox()
        candidate.addItem('No candidate selected',None)
        for row in self.current_run['result']['candidates']:
            candidate.addItem(row.get('name',row.get('therapy_name',row['therapy_id'])) + ' • ' + row['state'],row['therapy_id'])
        layout.addWidget(candidate)
        notes = named(QPlainTextEdit(),'clinicianAssessment')
        notes.setPlaceholderText('Clinical interpretation / differential / missing information / rationale (synthetic case only)')
        layout.addWidget(notes)
        actions = QDialogButtonBox(QDialogButtonBox.StandardButton.Save | QDialogButtonBox.StandardButton.Cancel)
        actions.accepted.connect(dialog.accept)
        actions.rejected.connect(dialog.reject)
        layout.addWidget(actions)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            body = {'decision':choice.currentData(),'candidate_id':candidate.currentData(),'comment':notes.toPlainText()}
            def done(run):
                from app.services.report import report_html
                self.current_run = run
                self.case_report.setHtml(report_html(run))
            self.run_job(lambda:self.api.request('POST','/analyses/' + self.current_run['id'] + '/review',body),done,'Saving clinician review and audit event…')

    def library_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.addWidget(QLabel('Official drug-label reference library • Search product, ingredient or indication'))
        bar = QHBoxLayout()
        self.search = named(QLineEdit(),'medicineSearch')
        self.search.setPlaceholderText('Search the downloaded FDA labels, e.g. metformin')
        self.search.returnPressed.connect(self.search_labels)
        bar.addWidget(self.search)
        bar.addWidget(button('Search labels',self.search_labels,'searchLabels'))
        layout.addLayout(bar)
        split = QSplitter()
        self.results = named(QListWidget(),'medicineResults')
        self.results.currentItemChanged.connect(self.select_label)
        self.label_report = viewer('medicineReference')
        split.addWidget(self.results)
        split.addWidget(self.label_report)
        split.setSizes([270,700])
        layout.addWidget(split,1)
        self.question = named(QLineEdit(),'researchQuestion')
        self.question.setPlaceholderText('Research question about this label (no patient details)')
        layout.addWidget(self.question)
        actions = QHBoxLayout()
        actions.addWidget(button('Create local model brief',self.generate_brief,'generateBrief'))
        actions.addWidget(button('Show full label',self.show_label))
        actions.addWidget(button('Open original source',self.open_source))
        layout.addLayout(actions)
        self.assessment = named(QPlainTextEdit(),'referenceAssessment')
        self.assessment.setPlaceholderText('Optional clinician-authored interpretation. This is saved separately from source evidence.')
        self.assessment.setMaximumHeight(85)
        layout.addWidget(self.assessment)
        save = button('Save reference report',self.save_brief,'saveReferenceReport')
        self.clinician_controls.extend([self.assessment, save])
        layout.addWidget(save)
        self.pages.addWidget(page)

    def search_labels(self):
        query = self.search.text()
        def done(rows):
            self.results.clear()
            self.current_label = self.brief = None
            self.label_report.clear()
            for row in rows:
                item = QListWidgetItem(row['title'] + '\n' + row['generic_name'][:90] + '\n' + row.get('effective_time','') + ' • ' + row.get('manufacturer','')[:65])
                item.setData(Qt.ItemDataRole.UserRole,row['id'])
                self.results.addItem(item)
            if rows:
                self.results.setCurrentRow(0)
            else:
                self.label_report.setPlainText('No matching labels. Try the generic ingredient name. The full download must be complete before the library is available.')
        self.run_job(lambda:self.catalog.search(query),done,'Searching the local label index…')

    def select_label(self,item,previous=None):
        if not item:
            return
        id = item.data(Qt.ItemDataRole.UserRole)
        def done(label):
            self.current_label = label
            self.brief = None
            self.assessment.clear()
            self.show_label()
        self.run_job(lambda:self.catalog.get(id),done,'Loading source label…')

    def show_label(self):
        if self.current_label:
            from app.services.report import readable
            self.label_report.setHtml('<h1>' + escape(self.current_label['title']) + '</h1><p>REFERENCE TEXT — not patient-specific advice. Inclusion does not establish FDA approval. Label version and export dates appear below.</p>' + readable(self.current_label))

    def open_source(self):
        if self.current_label:
            url = self.current_label['source_url']
            if url.startswith('https://dailymed.nlm.nih.gov/dailymed/'):
                QDesktopServices.openUrl(QUrl(url))

    def generate_brief(self):
        if not self.current_label:
            return
        import re
        label = self.current_label
        question = self.question.text().strip() or 'Key indications and safety considerations in this label'
        excerpts = []
        for section in ('indications_and_usage','boxed_warning','contraindications','warnings','warnings_and_cautions','drug_interactions','adverse_reactions'):
            text = label['sections'].get(section,'')
            for sentence in re.split(r'(?<=[.!?])\s+',text)[:2]:
                if sentence:
                    excerpts.append(section.replace('_',' ').capitalize() + ': ' + sentence[:320] + (' [excerpt continues in full label]' if len(sentence)>320 else ''))
        excerpts = excerpts[:12]
        def work():
            selected = self.model.select(question,excerpts)
            return {'id':str(uuid4()),'created_at':datetime.now(timezone.utc).isoformat(),'question':question,
                    'label':label,'selected_excerpts':selected,'model':json.loads((self.assets/'model/manifest.json').read_text()),
                    'method':'Local medical model selected verbatim source excerpts. No generated diagnosis or treatment advice.',
                    'review_status':'UNREVIEWED_EXPERIMENTAL_REFERENCE_BRIEF'}
        def done(brief):
            self.brief = brief
            self.label_report.setHtml(self.brief_html(brief))
        self.run_job(work,done,'Running the verified 1.5B medical model locally… First load may take a minute.')

    @staticmethod
    def brief_html(brief):
        from app.services.report import readable
        label = brief['label']
        warnings = {k:v for k,v in label['sections'].items() if k in ('boxed_warning','contraindications','warnings','warnings_and_cautions','drug_interactions')}
        return '<html><body><h1>Medicine reference review</h1><p>Experimental research report • Not a diagnosis or prescription</p><h2>' + escape(label['title']) + '</h2>' + readable({k:v for k,v in brief.items() if k != 'label'}) + '<h2>Safety context from the source — independently included</h2>' + readable(warnings) + '<h2>Source provenance</h2>' + readable({k:v for k,v in label.items() if k != 'sections'}) + '<p>Selected excerpts can be incomplete. Read the full label and verify its current version before professional interpretation.</p></body></html>'

    def save_brief(self):
        if not self.brief:
            QMessageBox.information(self,'Create a brief first','Select a label and create a local model brief before saving a reference report.')
            return
        brief = dict(self.brief)
        brief['clinician_assessment'] = self.assessment.toPlainText()[:4000]
        def work():
            user = self.api.request('GET','/auth/me')
            if user['role'] != 'CLINICIAN':
                raise ValueError('A clinician account is required')
            brief['author'] = user['username']
            brief['review_status'] = 'CLINICIAN_NOTE_ATTACHED_NOT_CLINICAL_VALIDATION' if brief['clinician_assessment'] else 'UNREVIEWED_EXPERIMENTAL_REFERENCE_BRIEF'
            brief['id'] = str(uuid4())
            from app.audit.service import digest
            record = {'snapshot':brief,'sha256':digest(brief)}
            folder = self.data/'reports'
            folder.mkdir(exist_ok=True)
            with (folder/(brief['id']+'.json')).open('x',encoding='utf-8') as out:
                json.dump(record,out,ensure_ascii=False,indent=2)
            return brief
        def done(saved):
            self.brief = saved
            self.label_report.setHtml(self.brief_html(saved))
            self.refresh_saved()
            self.statusBar().showMessage('Reference report saved locally with source snapshot and integrity hash')
        self.run_job(work,done,'Saving reference report…')

    def saved_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.addWidget(QLabel('Saved reference reports • Source snapshots and clinician notes'))
        split = QSplitter()
        self.saved = named(QListWidget(),'savedReports')
        self.saved.currentItemChanged.connect(self.open_saved)
        self.saved_preview = viewer('savedReportPreview')
        split.addWidget(self.saved)
        split.addWidget(self.saved_preview)
        split.setSizes([250,750])
        layout.addWidget(split)
        layout.addWidget(button('Export readable PDF',lambda:self.export_pdf(self.saved_preview.toHtml()),'exportReferencePdf'))
        self.pages.addWidget(page)

    def refresh_saved(self):
        self.saved.clear()
        for file in sorted((self.data/'reports').glob('*.json'),key=lambda p:p.stat().st_mtime,reverse=True):
            try:
                brief = json.loads(file.read_text(encoding='utf-8'))['snapshot']
                item = QListWidgetItem(brief['label']['title'][:70] + '\n' + brief['created_at'][:19])
                item.setData(Qt.ItemDataRole.UserRole,str(file))
                self.saved.addItem(item)
            except (ValueError,KeyError,OSError):
                continue

    def open_saved(self,item,previous=None):
        if not item:
            return
        try:
            from app.audit.service import digest
            record = json.loads(Path(item.data(Qt.ItemDataRole.UserRole)).read_text(encoding='utf-8'))
            if digest(record['snapshot']) != record['sha256']:
                raise ValueError('Saved report integrity check failed')
            self.saved_preview.setHtml(self.brief_html(record['snapshot']))
        except (ValueError,KeyError,OSError) as exc:
            QMessageBox.warning(self,'Cannot read report',str(exc))

    def system_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        self.system = viewer('localSystemStatus')
        layout.addWidget(self.system)
        layout.addWidget(button('Refresh local status',self.refresh_status))
        self.pages.addWidget(page)

    def refresh_status(self):
        from app.services.report import readable
        reference_file = self.assets/'references-manifest.json'
        model_file = self.assets/'model/manifest.json'
        reference = json.loads(reference_file.read_text()) if reference_file.exists() else {'status':'Not installed — run the asset preparation script'}
        model = json.loads(model_file.read_text()) if model_file.exists() else {'status':'Not installed'}
        self.system.setHtml('<h1>Local system</h1><p>Native Qt Widgets application. No browser or web server required. Model requests use an authenticated loopback connection; case data stays in the application process.</p>' + readable({'Medicine library':reference,'Medical model':model,'Data folder':str(self.data),'Asset folder':str(self.assets),'Clinical status':'Research prototype. No clinical validation. Model cannot issue diagnoses or prescriptions.','Development':'ECC test-first and Windows desktop testing guidance','Privacy':'Local user storage. Not encrypted clinical storage. Use synthetic cases only.'}))

    def export_pdf(self, html):
        path,_ = QFileDialog.getSaveFileName(self,'Save readable report',str(self.data/'medicine-report.pdf'),'PDF documents (*.pdf)')
        if path:
            write_pdf(html,Path(path))
            self.statusBar().showMessage('PDF saved: ' + path)

    def closeEvent(self,event):
        if self.job and self.job.isRunning():
            event.ignore()
            self.statusBar().showMessage('Please wait for the current local operation before closing.')
            return
        self.model.close()
        event.accept()

def ensure_fonts():
    # Windows' offscreen Qt platform does not enumerate system fonts automatically.
    if not QFontDatabase.families() and os.name == 'nt':
        fonts = Path(os.environ.get('SystemRoot','C:/Windows'))/'Fonts'
        for name in ('arial.ttf','arialbd.ttf','segoeui.ttf','segoeuib.ttf'):
            QFontDatabase.addApplicationFont(str(fonts/name))
    if not QFontDatabase.families():
        raise RuntimeError('No readable font is available for display or PDF export')

def write_pdf(html,path):
    ensure_fonts()
    import re
    # QTextBrowser serializes screen fonts in pixels; printer pixels are much
    # smaller. Convert them to typographic points before high-resolution output.
    html = re.sub(r'font-size:\s*([\d.]+)px',lambda m:f'font-size:{float(m[1]) * .75:g}pt',html)
    html = re.sub(r'font:\s*([\d.]+)px',lambda m:f'font:{float(m[1]) * .75:g}pt',html)
    printer = QPrinter(QPrinter.PrinterMode.HighResolution)
    printer.setOutputFormat(QPrinter.OutputFormat.PdfFormat)
    printer.setOutputFileName(str(path))
    printer.setPageSize(QPageSize(QPageSize.PageSizeId.A4))
    printer.setPageMargins(QMarginsF(14,14,14,14),QPageLayout.Unit.Millimeter)
    document = QTextDocument()
    document.setDefaultFont(QFont('Arial',10))
    option = document.defaultTextOption()
    option.setWrapMode(QTextOption.WrapMode.WrapAtWordBoundaryOrAnywhere)
    document.setDefaultTextOption(option)
    document.setDefaultStyleSheet('body{font-family:Arial;font-size:10pt;color:#183c43}h1{color:#12595d}h2{font-size:13pt;color:#12595d}th{background:#edf4f3}td,th{border-bottom:1px solid #d4dfdf}table{border-collapse:collapse}li{margin-bottom:6px}')
    document.setHtml(html)
    document.print_(printer)

def main():
    os.environ.setdefault('QT_ACCESSIBILITY','1')
    app = QApplication(sys.argv)
    ensure_fonts()
    app.setApplicationName('Personalized Medicine AI')
    app.setOrganizationName('PersonalizedMedicineResearch')
    app.setStyle('Fusion')
    app.setStyleSheet('QWidget{font-family:Segoe UI;font-size:13px;color:#193c43}QMainWindow{background:#f4f7f6}QPushButton{background:#166465;color:white;border:0;border-radius:5px;padding:9px 14px}QPushButton:hover{background:#247f7d}QPushButton:disabled{background:#b1c3c1;color:#f5f7f7}QLineEdit,QPlainTextEdit,QTextBrowser,QListWidget,QTableWidget,QComboBox{background:white;border:1px solid #cbdad7;border-radius:4px;padding:6px}QListWidget::item{padding:9px}QListWidget::item:selected{background:#d6eeea;color:#154c4c}QLabel{padding:3px}')
    try:
        assets,data = bootstrap()
        window = Window(assets,data)
    except Exception as exc:
        QMessageBox.critical(None,'Desktop startup failed',str(exc)[:700])
        return 1
    window.show()
    if '--smoke-test' in sys.argv:
        if not os.getenv('PMAI_DATA_DIR'):
            QMessageBox.critical(window,'Test profile required','Set PMAI_DATA_DIR to an isolated test folder.')
            return 1
        from smoke import start
        start(app,window)
    return app.exec()

if __name__ == '__main__':
    raise SystemExit(main())

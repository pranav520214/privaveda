import html
import json
import re
import sqlite3
import zlib
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import quote

SECTIONS = ('indications_and_usage', 'contraindications', 'boxed_warning', 'warnings',
            'warnings_and_cautions', 'drug_interactions', 'adverse_reactions',
            'use_in_specific_populations', 'pregnancy', 'pediatric_use', 'geriatric_use',
            'clinical_pharmacology', 'dosage_and_administration', 'description',
            'information_for_patients', 'purpose', 'active_ingredient', 'do_not_use',
            'ask_doctor', 'stop_use', 'keep_out_of_reach_of_children')

def plain(value):
    if isinstance(value, list):
        value = '\n'.join(str(v) for v in value)
    return html.unescape(re.sub(r'<[^>]*>', '', str(value or ''))).strip()

def normalized_label(raw):
    meta = raw.get('openfda', {})
    return {'id': raw.get('id', ''), 'set_id': raw.get('set_id', ''),
            'title': plain(meta.get('brand_name') or meta.get('generic_name') or raw.get('active_ingredient') or ['Unnamed label'])[:500],
            'generic_name': plain(meta.get('generic_name', [])),
            'manufacturer': plain(meta.get('manufacturer_name', [])),
            'marketing_category': plain(meta.get('marketing_category', [])),
            'effective_time': raw.get('effective_time', ''), 'version': raw.get('version', ''),
            'source_url': 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=' + quote(str(raw.get('set_id', '')), safe=''),
            'sections': {key: plain(raw[key]) for key in SECTIONS if raw.get(key)},
            'validation_status': 'REFERENCE_ONLY_NOT_CLINICALLY_APPROVED'}

class ReferenceCatalog:
    def __init__(self, path):
        self.path = Path(path)

    @contextmanager
    def connect(self):
        conn = sqlite3.connect(self.path, timeout=60)
        conn.row_factory = sqlite3.Row
        try:
            with conn:
                yield conn
        finally:
            conn.close()

    def initialize(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as conn:
            conn.executescript('''
                CREATE TABLE IF NOT EXISTS labels(id TEXT PRIMARY KEY, title TEXT, generic_name TEXT, payload BLOB);
                CREATE VIRTUAL TABLE IF NOT EXISTS labels_fts USING fts5(id UNINDEXED, title, generic_name, indications, tokenize='unicode61');
                CREATE TABLE IF NOT EXISTS imports(url TEXT PRIMARY KEY, sha256 TEXT, export_date TEXT, record_count INTEGER);
            ''')

    def ingest(self, records, archive_url, archive_sha256, export_date):
        count = 0
        with self.connect() as conn:
            for raw in records:
                item = normalized_label(raw)
                if not item['id']:
                    continue
                item.update(archive_url=archive_url, archive_sha256=archive_sha256, export_date=export_date)
                payload = zlib.compress(json.dumps(item, ensure_ascii=False).encode(), 3)
                cursor = conn.execute('INSERT OR IGNORE INTO labels VALUES(?,?,?,?)', (item['id'], item['title'], item['generic_name'], payload))
                if cursor.rowcount:
                    conn.execute('INSERT INTO labels_fts VALUES(?,?,?,?)', (item['id'], item['title'], item['generic_name'], item['sections'].get('indications_and_usage', '')[:12000]))
                count += 1
            conn.execute('INSERT OR REPLACE INTO imports VALUES(?,?,?,?)', (archive_url, archive_sha256, export_date, count))
        return count

    def count(self):
        if not self.path.exists():
            return 0
        with self.connect() as conn:
            return conn.execute('SELECT count(*) FROM labels').fetchone()[0]

    def imported(self, url, digest):
        with self.connect() as conn:
            return conn.execute('SELECT 1 FROM imports WHERE url=? AND sha256=?', (url, digest)).fetchone() is not None

    def search(self, query, limit=40):
        words = re.findall(r'\w+', query[:500], re.UNICODE)[:12]
        if not words or not self.path.exists():
            return []
        expression = ' AND '.join('"' + w + '"' for w in words)
        with self.connect() as conn:
            rows = [dict(r) for r in conn.execute('SELECT id,title,generic_name FROM labels_fts WHERE labels_fts MATCH ? ORDER BY bm25(labels_fts,0,8,5,1) LIMIT ?', (expression, min(max(limit, 1), 100)))]
            for row in rows:
                label = json.loads(zlib.decompress(conn.execute('SELECT payload FROM labels WHERE id=?',(row['id'],)).fetchone()[0]))
                row.update(effective_time=label['effective_time'], manufacturer=label['manufacturer'],
                           clinical_sections=sum(k in label['sections'] for k in ('indications_and_usage','contraindications','boxed_warning','warnings','warnings_and_cautions','drug_interactions')))
            # Keep lexical ranking within completeness groups; prefer usable labels to packaging-only records.
            return sorted(rows,key=lambda r:-r['clinical_sections'])

    def get(self, id):
        with self.connect() as conn:
            row = conn.execute('SELECT payload FROM labels WHERE id=?', (id,)).fetchone()
            return json.loads(zlib.decompress(row[0])) if row else None

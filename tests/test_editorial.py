import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('editorial', ROOT/'scripts/editorial.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def entry():
    return dict(url='https://example.com/News', titleAr='عنوان عربي', summaryAr='ملخص مستند إلى المصدر',
                whyItMatters='اقتراح عملي يحتاج اختبارًا', reviewedAt='2026-01-01T00:00:00+00:00',
                basis='article', sources=[dict(title='المصدر',url='https://example.com/News')])


class EditorialTests(unittest.TestCase):
    def test_shipped_editorial_is_valid(self):
        mod.validate(json.loads((ROOT/'site/data/editorial.json').read_text()))

    def test_import_preserves_unrelated_entries(self):
        old={'version':1,'items':{'old':entry()}}
        incoming={'version':1,'items':{'new':entry()}}
        out=mod.merge_documents(old,incoming,{'items':[{'id':'new','url':entry()['url']}]})
        self.assertEqual(set(out['items']),{'old','new'})
        self.assertEqual(set(old['items']),{'old'})

    def test_reject_unknown_or_mismatched_source(self):
        for feed in [{'items':[]},{'items':[{'id':'n','url':'https://different.example/a'}]}]:
            with self.assertRaises(ValueError):
                mod.merge_documents({'version':1,'items':{}},{'version':1,'items':{'n':entry()}},feed)

    def test_reject_unsubstantiated_test_claim(self):
        e=entry();e['basis']='tested'
        with self.assertRaises(ValueError):mod.validate({'version':1,'items':{'n':e}})

    def test_reject_bad_sources_and_future_dates(self):
        for change in [{'sources':[]},{'url':'javascript:alert(1)'},{'reviewedAt':'2999-01-01T00:00:00Z'},{'reviewedAt':'2026-01-01'}]:
            with self.assertRaises(ValueError):mod.validate({'version':1,'items':{'n':{**entry(),**change}}})

    def test_reject_incomplete_proposals(self):
        e=entry();e['improvements']=[{'title':'اقتراح بلا خطة'}]
        with self.assertRaises(ValueError):mod.validate({'version':1,'items':{'n':e}})

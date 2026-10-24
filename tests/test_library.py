"""Persistent catalog identity and evidence contracts."""
import json
from pathlib import Path
import unittest
from urllib.parse import urlparse

class LibraryTests(unittest.TestCase):
    def test_catalog_has_unique_repository_identities(self):
        data=json.loads((Path(__file__).resolve().parents[1]/'site/data/library.json').read_text())
        entries=data['entries']
        self.assertGreaterEqual(len(entries),30)
        identities=[x['repository'].lower() for x in entries]
        self.assertEqual(len(identities),len(set(identities)))
        for x in entries:
            self.assertEqual(urlparse(x['url']).hostname,'github.com')
            self.assertEqual(urlparse(x['url']).path.strip('/').lower(),x['repository'].lower())
            self.assertTrue(x['metricCapturedAt'])
            self.assertIsInstance(x['archived'],bool)
            self.assertTrue(x['reviewBasis'])
            self.assertTrue(x['sources'])

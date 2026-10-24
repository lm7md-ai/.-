import json, unittest
from pathlib import Path
DATA = json.loads((Path(__file__).resolve().parents[1]/'site/data/research.json').read_text(encoding='utf-8'))
class ResearchCatalogTests(unittest.TestCase):
    def test_reviewed_projects_explicitly_scoped(self):
        self.assertEqual(set(DATA['reviewed']),{'firecrawl/firecrawl','nousresearch/hermes-agent','huggingface/transformers'})
    def test_three_categories_of_ten_each(self):
        for name,profile in DATA['reviewed'].items():
            self.assertTrue(profile['audited'])
            for category in ('improvements','spinoffs','religious'):
                ideas=profile[category]
                self.assertEqual(len(ideas),10,f'{name} {category}')
                self.assertEqual(len({i['title'] for i in ideas}),10)
                for idea in ideas:
                    self.assertTrue(all(idea.get(k) for k in ('title','problem','approach','stack','steps','metric','difficulty','risks','confidence','sources')))
                    self.assertGreaterEqual(len(idea['steps']),3)
                    for source in idea['sources']:self.assertTrue(source['url'].startswith('https://'))
    def test_religious_source_safeguards(self):
        for profile in DATA['reviewed'].values():
            for idea in profile['religious']:
                joined=' '.join([idea['risks'],idea['confidence']])
                self.assertIn('لا',joined)
                urls=' '.join(s['url'] for s in idea['sources'])
                self.assertIn('quran.com',urls)
                self.assertIn('sunnah.com',urls)
    def test_exploratory_fallback_has_ten_religious_ideas(self):
        for domain,ideas in DATA['genericReligious'].items():
            self.assertEqual(len(ideas),10,domain)
            self.assertEqual(len(ideas),len(set(ideas)))
if __name__=='__main__': unittest.main()

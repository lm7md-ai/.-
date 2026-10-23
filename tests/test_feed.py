import importlib.util
import json
import pathlib
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("feed_update", ROOT / "scripts" / "update_feed.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def news(url, desc="short", pts=0):
    return dict(id=mod.stable_id(url),kind="news",url=url,title="Python",description=desc,
                publishedAt="2026-10-19T12:00:00+00:00",source="Hacker News",category="برمجة",
                image="",points=pts,comments=3,ideaDomain="general")


class TestFeed(unittest.TestCase):
    def test_url_cleaning_removes_tracking(self):
        self.assertEqual(mod.canonical("https://example.com/news?utm_source=a&id=5#top"),
                         "https://example.com/news?id=5")

    def test_same_article_not_duplicated(self):
        first=news("https://example.com/news?utm_source=news")
        second=news("https://example.com/news",desc="a much longer article description",pts=42)
        combined,added=mod.merge([first,second],[])
        self.assertEqual(added,1)
        self.assertEqual(len(combined),1)
        self.assertEqual(combined[0]["points"],42)
        self.assertIn("longer",combined[0]["description"])

    def test_previous_article_not_added_again(self):
        a=news("https://example.com/news")
        first,added=mod.merge([a],[])
        self.assertEqual(added,1)
        second,added_again=mod.merge([a],first)
        self.assertEqual(added_again,0)
        self.assertEqual(len(second),1)

    def test_html_stripped(self):
        self.assertEqual(mod.clean_text('<p>Hello <b>world</b></p>'),"Hello world")

    def test_invalid_urls(self):
        self.assertEqual(mod.valid_url("javascript:alert(1)"),"")
        self.assertEqual(mod.valid_url("http://example.com"),"")
        self.assertEqual(mod.valid_url("https://example.com"),"https://example.com")

    def test_rss_parse_using_fake_response(self):
        rss=b'<rss><channel><item><title>New Python tool released</title><link>https://example.com/news</link><pubDate>Mon, 19 Oct 2026 12:00:00 GMT</pubDate><description>Great update</description></item></channel></rss>'
        with patch.object(mod,"FEEDS",[("Test","https://example.com/rss","برمجة","عالمي")]), patch.object(mod,"request_bytes",return_value=rss):
            result=mod.collect_rss()
        self.assertEqual(len(result),1)
        self.assertEqual(result[0]["title"],"New Python tool released")

    def test_seed_json_parseable(self):
        data=json.loads((ROOT / "site/data/feed.json").read_text(encoding="utf-8"))
        self.assertTrue(data["items"])
        self.assertTrue(all(x["url"].startswith("https://") for x in data["items"]))

if __name__ == "__main__": unittest.main()

class TestHeadlines(unittest.TestCase):
    def test_matching_headlines_different_links_coalesce(self):
        a=news('https://example.org/a')
        b=news('https://example.net/b',desc='Longer, independent syndicated report')
        a['title']='Python 2026 developer tools'
        b['title']='Python 2026 developer tools'
        merged,added=mod.merge([a,b],[])
        self.assertEqual(added,1)
        self.assertEqual(len(merged),1)

#!/usr/bin/env python3
"""Collect public tech news and OSS repositories for a static GitHub Pages site.
No API keys required; GITHUB_TOKEN increases API reliability if present.
Existing items are retained by stable ID instead of being reposted on each run.
"""
from __future__ import annotations

import calendar
import datetime as dt
import hashlib
import html
import json
import logging
import math
import os
import re
import sys
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from urllib.error import HTTPError, URLError
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, urlencode, urlparse, urlunparse, parse_qsl, urljoin
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "site" / "data" / "feed.json"
SEEN = ROOT / "site" / "data" / "seen.json"
UTC = dt.timezone.utc
NOW = dt.datetime.now(UTC)
USER_AGENT = "TechPulseArabic/1.0 (+https://github.com; public feeds; editorial project)"
TIMEOUT = 16
MAX_NEWS = max(1, min(2000, int(os.getenv("NABDH_MAX_NEWS", "700"))))
MAX_PROJECTS = max(1, min(250, int(os.getenv("NABDH_MAX_PROJECTS", "100"))))
SOURCE_STATUS = []
STATUS = ROOT / "site" / "data" / "status.json"
DEFAULT_HEADERS = {"User-Agent": USER_AGENT, "Accept": "application/json, application/rss+xml, application/atom+xml, */*"}

FEEDS = [
    ("OpenAI — المصدر الرسمي", "https://openai.com/news/rss.xml", "ذكاء اصطناعي", "عالمي"),
    ("Hugging Face", "https://huggingface.co/blog/feed.xml", "ذكاء اصطناعي", "عالمي"),
    ("GitHub Blog", "https://github.blog/feed/", "برمجة", "عالمي"),
    ("Python — المصدر الرسمي", "https://blog.python.org/feeds/posts/default?alt=rss", "برمجة", "عالمي"),
    ("Microsoft Research", "https://www.microsoft.com/en-us/research/feed/", "أبحاث", "عالمي"),
    ("البوابة العربية للأخبار التقنية", "https://aitnews.com/feed/", "تقنيات", "عالمي"),
    ("عالم التقنية", "https://www.tech-wd.com/wd/feed/", "تقنيات", "عالمي"),
    ("تقارير الذكاء الاصطناعي", "https://techcrunch.com/category/artificial-intelligence/feed/", "ذكاء اصطناعي", "عالمي"),
    ("أخبار التقنية", "https://www.theverge.com/rss/index.xml", "تقنيات", "عالمي"),
    ("تقنية BBC", "https://feeds.bbci.co.uk/news/technology/rss.xml", "تقنيات", "عالمي"),
    ("Engadget", "https://www.engadget.com/rss.xml", "تقنيات", "عالمي"),
    ("Wired", "https://www.wired.com/feed/rss", "تقنيات", "عالمي"),
    ("Ars Technica", "https://feeds.arstechnica.com/arstechnica/index", "برمجة", "عالمي"),
    ("أبحاث الذكاء الاصطناعي", "https://export.arxiv.org/rss/cs.AI", "أبحاث", "عالمي"),
    ("أبحاث تعلّم الآلة", "https://export.arxiv.org/rss/cs.LG", "أبحاث", "عالمي"),
    ("أخبار التقنية السعودية", "https://news.google.com/rss/search?" + urlencode({"q": "الذكاء الاصطناعي OR التقنية السعودية when:2d", "hl": "ar", "gl": "SA", "ceid": "SA:ar"}), "السعودية", "السعودية"),
    ("فرص وبرامج تقنية", "https://news.google.com/rss/search?" + urlencode({"q": "تدريب تقنية ذكاء اصطناعي طلاب السعودية OR سدايا when:3d", "hl": "ar", "gl": "SA", "ceid": "SA:ar"}), "فرص", "السعودية"),
    ("برمجة بايثون", "https://news.google.com/rss/search?" + urlencode({"q": "Python developer tools release when:2d", "hl": "en", "gl": "US", "ceid": "US:en"}), "برمجة", "عالمي"),
]
SINCE = (NOW - dt.timedelta(days=45)).strftime("%Y-%m-%d")
REPO_QUERIES = [
    f"topic:artificial-intelligence stars:>150 pushed:>{SINCE} archived:false",
    f"topic:ai-agents stars:>100 pushed:>{SINCE} archived:false",
    f"topic:developer-tools stars:>100 pushed:>{SINCE} archived:false",
    f"topic:rag stars:>100 pushed:>{SINCE} archived:false",
    f"topic:text-to-speech stars:>100 pushed:>{SINCE} archived:false",
    f"topic:education stars:>100 pushed:>{SINCE} archived:false",
    f"language:Python topic:machine-learning stars:>150 pushed:>{SINCE} archived:false",
]
BLOCKED = {"youtube.com", "www.youtube.com", "tiktok.com"}
TRACKING = {"utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "ref", "ref_src"}
KEYWORDS = {
    "ذكاء اصطناعي": ["model", "openai", "anthropic", "gemini", "ai", "llm", "transformer", "chatgpt", "artificial intelligence", "ذكاء", "نماذج", "نموذج"],
    "برمجة": ["python", "pytorch", "developer", "programming", "coding", "github", "code", "release", "rust", "framework", "بايثون", "مطور", "برمجة"],
    "أبحاث": ["research", "paper", "arxiv", "study", "benchmark", "dataset", "علمي", "أبحاث", "بحث"],
    "فرص": ["job", "internship", "scholarship", "training", "hackathon", "university", "students", "وظائف", "تدريب", "منحة", "طلاب", "هاكاثون"],
    "تقنيات": ["device", "hardware", "processor", "chip", "phone", "robot", "app", "technology", "معالج", "هاتف", "تقنية", "تطبيق"],
}
PROJECT_DOMAINS = {
    "agents": ["agent", "orchestration", "langgraph", "multiagent", "autonomous", "workflow"],
    "vision": ["vision", "image", "diffusion", "stable-diffusion", "comfy", "video", "yolo"],
    "speech": ["speech", "audio", "voice", "whisper", "tts", "asr"],
    "data": ["dataset", "dataframe", "analytics", "etl", "database", "sql", "pandas"],
    "devtools": ["developer", "package", "lint", "formatter", "compiler", "terminal", "cli", "uv", "ruff", "git"],
    "search": ["rag", "retrieval", "embedding", "vector", "semantic", "search"],
    "inference": ["llm", "inference", "transformer", "llama", "local", "ollama", "vllm", "model"],
    "education": ["education", "learn", "course", "tutorial", "curriculum"],
}


class Stripper(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []
    def handle_data(self, data): self.parts.append(data)


def clean_text(value, limit=650):
    if not value: return ""
    stripper = Stripper()
    try: stripper.feed(str(value)); text = " ".join(stripper.parts)
    except Exception: text = str(value)
    text = unicodedata.normalize("NFKC", html.unescape(text))
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit].rstrip()


def valid_url(u):
    if not u or not isinstance(u, str): return ""
    p = urlparse(u.strip())
    if p.scheme != "https" or not p.netloc or p.hostname in BLOCKED: return ""
    if p.username or p.password: return ""
    return u.strip()


def canonical(u):
    try:
        p = urlparse(u)
        query = urlencode([(k, v) for k, v in parse_qsl(p.query) if k.lower() not in TRACKING])
        return urlunparse((p.scheme.lower(), p.netloc.lower(), p.path.rstrip("/"), "", query, ""))
    except Exception: return u


def stable_id(u): return hashlib.sha256(canonical(u).encode("utf-8")).hexdigest()[:18]


def title_fingerprint(title):
    value = clean_text(title, 220).casefold()
    value = re.sub(r"\s+[-–|]\s+[^-–|]{2,35}$", "", value)
    value = re.sub(r"[^\w\u0600-\u06ff]+", "", value)
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:18] if len(value) >= 18 else ""


def request_bytes(url, headers=None):
    h = dict(DEFAULT_HEADERS)
    if headers: h.update(headers)
    for attempt in range(3):
        try:
            req = Request(url, headers=h)
            with urlopen(req, timeout=TIMEOUT) as resp:
                if resp.status != 200: raise RuntimeError("HTTP " + str(resp.status))
                body = resp.read(3_000_000 + 1)
                if len(body) > 3_000_000: raise ValueError("feed too large")
                return body
        except HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == 2: raise
            retry = exc.headers.get("Retry-After", "")
            time.sleep(min(8, int(retry)) if retry.isdigit() else 2 ** attempt)
        except (URLError, TimeoutError):
            if attempt == 2: raise
            time.sleep(2 ** attempt)


def request_json(url, headers=None): return json.loads(request_bytes(url, headers).decode("utf-8"))


def date_iso(text):
    if not text: return ""
    try:
        stamp = parsedate_to_datetime(str(text))
    except Exception:
        try: stamp = dt.datetime.fromisoformat(str(text).replace("Z", "+00:00"))
        except Exception: return ""
    if stamp.tzinfo is None: stamp = stamp.replace(tzinfo=UTC)
    return stamp.astimezone(UTC).isoformat(timespec="seconds")


def age_hours(date):
    try: return max(0, (NOW - dt.datetime.fromisoformat(date.replace("Z", "+00:00"))).total_seconds() / 3600)
    except Exception: return 10000


def category_for(text, initial="تقنيات"):
    s = (text or "").lower()
    scores = {key:sum(1 for term in terms if re.search(r"(?<![a-z])" + re.escape(term) + r"(?![a-z])", s)) for key, terms in KEYWORDS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] >= 2 else initial


def repo_domain(repo):
    hay = " ".join([repo.get("full_name", ""), repo.get("description") or "", *repo.get("topics", [])]).lower()
    matches = {key: sum(1 for w in terms if w in hay) for key, terms in PROJECT_DOMAINS.items()}
    best = max(matches, key=matches.get)
    return best if matches[best] else "general"


def score_item(item):
    h = age_hours(item.get("publishedAt", ""))
    recency = max(0, 28 * math.exp(-h / 64))
    if item["kind"] == "project":
        stars = max(0, item.get("stars") or 0)
        forks = max(0, item.get("forks") or 0)
        return round(min(99, 4.4 * math.log1p(stars) + 1.3 * math.log1p(forks) + recency), 2)
    pts = max(0, item.get("points") or 0)
    comments = max(0, item.get("comments") or 0)
    source_signal = 8 if item.get("source") not in ("Google News", "Hacker News") else 4
    return round(min(99, 8.2 * math.log1p(pts) + 2.1 * math.log1p(comments) + source_signal + recency), 2)


def local(tag): return tag.rsplit("}", 1)[-1].lower()


def node_text(parent, *names):
    for child in parent:
        if local(child.tag) in names and child.text: return child.text.strip()
    return ""



class PictureMetadata(HTMLParser):
    """Read article image metadata without JavaScript or external dependencies."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.candidates = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag.lower() == "meta":
            key = (a.get("property") or a.get("name") or "").lower().strip()
            if key in ("og:image", "og:image:url", "twitter:image", "twitter:image:src"):
                self.candidates.append(a.get("content", ""))
        elif tag.lower() == "link" and (a.get("rel") or "").lower() == "image_src":
            self.candidates.append(a.get("href", ""))
        elif tag.lower() == "img":
            self.candidates.append(a.get("data-src") or a.get("src") or "")


def picture_candidates(markup, base=""):
    parser = PictureMetadata()
    try:
        parser.feed(markup or "")
    except (ValueError, TypeError):
        return []
    selected = []
    for src in parser.candidates:
        src = html.unescape(str(src).strip())
        if not src or src.startswith("data:") or src.startswith("blob:"):
            continue
        absolute = valid_url(urljoin(base, src))
        if not absolute:
            continue
        path = urlparse(absolute).path.lower()
        if any(t in path for t in ("tracking", "pixel", "beacon", "1x1", "favicon", "badge")):
            continue
        if absolute not in selected:
            selected.append(absolute)
    return selected


ARTICLE_IMAGE_HOSTS = (
    "theverge.com", "techcrunch.com", "engadget.com", "bbc.co.uk", "wired.com",
    "arstechnica.com", "github.blog", "huggingface.co", "nvidia.com",
    "openai.com", "anthropic.com", "python.org", "microsoft.com",
)


def article_image(url):
    """Extract an official publisher image from known domains only."""
    domain = (urlparse(url).hostname or "").lower()
    if not domain or not any(domain == host or domain.endswith("." + host) for host in ARTICLE_IMAGE_HOSTS):
        return ""
    if urlparse(url).path.lower().endswith((".pdf", ".json", ".xml")):
        return ""
    try:
        # Only read the first 320 KiB; most og:image tags appear in <head>.
        req = Request(url, headers={**DEFAULT_HEADERS, "Accept":"text/html,application/xhtml+xml;q=0.9,*/*;q=0.8"})
        with urlopen(req, timeout=7) as response:
            content_type = response.headers.get("Content-Type", "").lower()
            if "html" not in content_type:
                return ""
            base = response.geturl()
            body = response.read(320_000).decode("utf-8", errors="replace")
        # Favor og:image/twitter:image from <head>; do not treat arbitrary article illustrations as official.
        parser = PictureMetadata()
        parser.feed(body.split("</head>", 1)[0])
        for candidate in parser.candidates:
            absolute = valid_url(urljoin(base, html.unescape(str(candidate).strip())))
            if absolute and not any(x in urlparse(absolute).path.lower() for x in ("favicon", "badge", "pixel", "1x1")):
                return absolute
    except Exception as exc:
        logging.debug("Article image unavailable for %s: %s", domain, str(exc)[:90])
    return ""


def enrich_missing_news_images(fresh, old_items, limit=24):
    """Best-effort enrichment. Stored results survive the next three-hour update."""
    cached = {canonical(x.get("url", "")): x.get("image", "") for x in old_items if x.get("image")}
    missing = sorted((x for x in fresh if x.get("kind") == "news" and not x.get("image")),
                     key=lambda x: x.get("publishedAt", ""), reverse=True)
    fetched = 0
    for entry in missing:
        cached_img = cached.get(canonical(entry["url"]))
        if cached_img:
            entry["image"] = cached_img
            continue
        domain = (urlparse(entry.get("url", "")).hostname or "").lower()
        if domain in ("news.google.com", "arxiv.org", "export.arxiv.org"):
            continue
        if fetched >= limit:
            break
        fetched += 1
        found = article_image(entry["url"])
        if found:
            entry["image"] = found
            entry["imageSource"] = "صورة المصدر الأصلي"
    logging.info("Publisher image metadata checked on %d articles", fetched)


def rss_image(node):
    for child in node.iter():
        kind = local(child.tag)
        attrs = child.attrib
        if kind in ("thumbnail", "content"):
            u = attrs.get("url")
            if valid_url(u) and (kind == "thumbnail" or attrs.get("medium") == "image"): return u
        if kind == "enclosure" and attrs.get("type", "").startswith("image/"):
            u = attrs.get("url")
            if valid_url(u): return u
    # Some RSS publishers embed article images inside CDATA descriptions.
    for child in node:
        if local(child.tag) in ("description", "summary", "encoded", "content") and child.text:
            candidates = picture_candidates(child.text)
            if candidates:
                return candidates[0]
    return ""


def collect_one_rss(feed):
    source, url, default_cat, region = feed
    out = []
    started = time.monotonic()
    try:
        raw = request_bytes(url)
        tree = ET.fromstring(raw)
        items = [node for node in tree.iter() if local(node.tag) in ("item", "entry")]
        for item in items[:34]:
            title = clean_text(node_text(item, "title"), 180)
            link = node_text(item, "link")
            if not link:
                for c in item:
                    if local(c.tag) == "link" and c.attrib.get("href") and c.attrib.get("rel", "alternate") == "alternate":
                        link = c.attrib["href"]; break
            link = valid_url(link)
            if not title or not link: continue
            summary = clean_text(node_text(item, "description", "summary", "content", "encoded"), 800)
            published = date_iso(node_text(item, "pubdate", "published", "updated", "date"))
            if not published or age_hours(published) > 24 * 21: continue
            if dt.datetime.fromisoformat(published) > NOW + dt.timedelta(hours=24): continue
            category = default_cat if default_cat in ("السعودية", "فرص", "أبحاث") else category_for(title + " " + summary, default_cat)
            domain = urlparse(link).hostname or ""
            detected_source = source
            if "news.google.com" in domain:
                gsource = next((c.text for c in item if local(c.tag) == "source" and c.text), "")
                detected_source = clean_text(gsource, 55) or "Google News"
            out.append({
                "id": stable_id(link), "kind": "news", "title": title,
                "description": summary or "تفاصيل الخبر في المصدر الأصلي؛ لم يتوفر ملخص موسّع في التغذية.",
                "impact": "تحليل مبدئي: راجع المصدر لفهم الآثار التقنية والإعلان الكامل، فقد تختلف النتائج بحسب الاستخدام.",
                "url": link, "source": detected_source, "category": category, "region": region,
                "publishedAt": published, "image": rss_image(item), "points": 0, "comments": 0,
                "metric": "التقدير: حداثة ومصدر", "ideaDomain": "general",
            })
        SOURCE_STATUS.append({"name": source, "url": url, "state": "ok" if out else "empty", "items": len(out), "checkedAt": NOW.isoformat(timespec="seconds"), "seconds": round(time.monotonic()-started, 2)})
    except Exception as exc:
        logging.warning("RSS %s failed: %s", source, exc)
        SOURCE_STATUS.append({"name": source, "url": url, "state": "error", "items": 0, "checkedAt": NOW.isoformat(timespec="seconds"), "error": "HTTP " + str(exc.code) if isinstance(exc, HTTPError) else type(exc).__name__})
    return out


def collect_rss():
    with ThreadPoolExecutor(max_workers=5) as pool:
        return [item for result in pool.map(collect_one_rss, FEEDS) for item in result]


def collect_hn():
    url = "https://hn.algolia.com/api/v1/search?" + urlencode({"tags": "front_page", "hitsPerPage": "90"})
    try: hits = request_json(url).get("hits", [])
    except Exception as exc:
        logging.warning("Hacker News failed: %s", exc)
        SOURCE_STATUS.append({"name":"Hacker News", "state":"error", "items":0, "error":type(exc).__name__})
        return []
    out = []
    for hit in hits:
        title = clean_text(hit.get("title") or "", 180)
        s = (title + " " + str(hit.get("url", ""))).lower()
        if not title or not any(w in s for w in ["ai", "llm", "python", "robot", "open source", "github", "research", "gpu", "chip", "software", "programming", "developer", "model", "code"]):
            continue
        link = valid_url(hit.get("url") or "")
        if not link: continue
        points, comments = hit.get("points") or 0, hit.get("num_comments") or 0
        out.append({"id": stable_id(link), "kind": "news", "title": title,
                    "description": "موضوع تقني يحظى بنقاش على Hacker News. افتح المصدر الأساسي لمعرفة التفاصيل، ثم راجع النقاش لآراء المطورين.",
                    "impact": "مؤشر التفاعل هنا يعتمد على التصويتات والتعليقات الفعلية في Hacker News، وليس عدد المشاهدات.",
                    "url": link, "source": "Hacker News", "category": category_for(title, "تقنيات"), "region": "عالمي",
                    "publishedAt": date_iso(hit.get("created_at")), "image": "", "points": points,
                    "comments": comments, "hnUrl": "https://news.ycombinator.com/item?id=" + str(hit.get("objectID", "")),
                    "metric": f"{points} نقطة · {comments} تعليق", "ideaDomain": "general"})
    SOURCE_STATUS.append({"name":"Hacker News", "state":"ok" if out else "empty", "items":len(out)})
    return out


def repo_images(repo, headers):
    """Best-effort README screenshot extraction. Never treat avatar images as screenshots."""
    full = repo.get("full_name", "")
    branch = repo.get("default_branch") or "main"
    if not re.fullmatch(r"[\w.\-]+/[\w.\-]+", full): return []
    try:
        raw = request_bytes("https://api.github.com/repos/" + full + "/readme", {**headers, "Accept":"application/vnd.github.raw+json"})
        body = raw.decode("utf-8", errors="replace")[:70000]
        candidates = re.findall(r"!\[[^]]{0,200}\]\(([^\s)]+)", body)
        candidates += re.findall(r"<img[^>]+src=[\"']([^\"']+)", body, re.I)
        output = []
        for link in candidates:
            link = html.unescape(link).strip('\"\'')
            if any(x in link.lower() for x in ("shields.io", "badge", "travis", "workflow", "coverage", "github.com/actions/")): continue
            if link.startswith("./"): link = link[2:]
            if link.startswith("/" ) and not link.startswith("//"): link = link[1:]
            if not re.match(r"https?://",link):
                link = f"https://raw.githubusercontent.com/{full}/{branch}/{link}"
            link = valid_url(link)
            if link and link not in output and any(x in link.lower().split('?')[0] for x in (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg")):
                output.append(link)
            if len(output) >= 3: break
        return output
    except Exception as exc:
        logging.info("README preview skipped for %s: %s", full, str(exc)[:70])
        return []


def collect_repos():
    headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if os.getenv("GITHUB_TOKEN"): headers["Authorization"] = "Bearer " + os.environ["GITHUB_TOKEN"]
    repos = {}
    for q in REPO_QUERIES:
        try:
            url = "https://api.github.com/search/repositories?" + urlencode({"q": q, "sort": "stars", "order": "desc", "per_page": 25})
            result = request_json(url, headers)
            for r in result.get("items", []): repos[r["full_name"].lower()] = r
            SOURCE_STATUS.append({"name":"GitHub: " + q.split(" stars:")[0], "state":"ok" if result.get("items") else "empty", "items":len(result.get("items", []))})
        except Exception as exc:
            logging.warning("GitHub search failed: %s", exc)
            SOURCE_STATUS.append({"name":"GitHub: " + q.split(" stars:")[0], "state":"error", "items":0, "error":type(exc).__name__})
        time.sleep(.22)
    out = []
    for r in repos.values():
        if r.get("fork") or r.get("archived") or not r.get("html_url"): continue
        desc = clean_text(r.get("description") or "", 380)
        name = clean_text(r.get("name") or "", 100)
        full = clean_text(r.get("full_name") or "", 180)
        if not name or not full: continue
        topics = [str(t)[:36] for t in (r.get("topics") or [])[:10]]
        domain = repo_domain(r)
        out.append({
            "id": stable_id(r["html_url"]), "kind": "project", "title": name,
            "description": desc or "مستودع برمجي مفتوح المصدر. اقرأ README الرسمي للمزيد من التفاصيل.",
            "impact": "قد يفيد في التجارب العملية أو التعلّم أو دمجه في مشاريعك؛ راجع الترخيص والتوثيق قبل الاعتماد عليه.",
            "url": r["html_url"], "source": "GitHub", "category": "مفتوح المصدر", "region": "عالمي",
            "publishedAt": date_iso(r.get("pushed_at") or r.get("updated_at")),
            "image": "", "avatar": valid_url((r.get("owner") or {}).get("avatar_url", "")),
            "stars": r.get("stargazers_count") or 0, "forks": r.get("forks_count") or 0,
            "language": r.get("language") or "غير محدد", "license": ((r.get("license") or {}).get("spdx_id") or "غير محدد"),
            "topics": topics, "repo": full, "ideaDomain": domain,
            "metric": f"{r.get('stargazers_count') or 0:,} نجمة GitHub",
        })
    out.sort(key=lambda x: (x["stars"], x["publishedAt"]), reverse=True)
    for entry in out[:22]:
        repo = repos.get(entry["repo"].lower())
        if repo:
            entry["gallery"] = repo_images(repo, headers)
            entry["image"] = entry["gallery"][0] if entry["gallery"] else ""
    return diverse_selection(out, MAX_PROJECTS, "ideaDomain")


def diverse_selection(items, limit, field):
    """Round-robin across categories, preserving order within each category."""
    groups = {}
    for item in items: groups.setdefault(item.get(field, "general"), []).append(item)
    selected = []
    while groups and len(selected) < limit:
        for key in list(groups):
            selected.append(groups[key].pop(0))
            if not groups[key]: del groups[key]
            if len(selected) == limit: break
    return selected


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(".tmp")
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(path)


def merge(new_items, prior):
    existing = {x.get("id"): x for x in prior if isinstance(x, dict) and x.get("id")}
    key_to_id = {canonical(x.get("url", "")): x["id"] for x in existing.values() if x.get("url")}
    title_to_id = {title_fingerprint(x.get("title", "")):x["id"] for x in existing.values() if x.get("kind")=="news" and title_fingerprint(x.get("title", ""))}
    added = 0
    for fresh in new_items:
        u = canonical(fresh.get("url", ""))
        finger = title_fingerprint(fresh.get("title", "")) if fresh.get("kind")=="news" else ""
        prior_id = key_to_id.get(u) or (title_to_id.get(finger) if finger else None)
        old = existing.get(prior_id or fresh["id"])
        if old:
            if fresh["kind"] == "project":
                # Keep updated metrics, but retain initial discovery ID.
                first_seen = old.get("firstSeenAt", NOW.isoformat(timespec="seconds"))
                retained_images = old.get("gallery") or []
                retained_id = old["id"]
                old.update(fresh); old["firstSeenAt"] = first_seen; old["id"] = retained_id
                if retained_images and not fresh.get("gallery"):
                    old["gallery"] = retained_images
                    old["image"] = retained_images[0]
            else:
                # Higher-quality RSS summary wins over generic HN text.
                if len(fresh.get("description", "")) > len(old.get("description", "")):
                    old["description"] = fresh["description"]
                old["points"] = max(fresh.get("points", 0), old.get("points", 0))
                old["comments"] = max(fresh.get("comments", 0), old.get("comments", 0))
                old["hnUrl"] = fresh.get("hnUrl") or old.get("hnUrl", "")
                if fresh.get("image") and not old.get("image"): old["image"] = fresh["image"]
                # Prefer a verified publisher link over a Google News intermediate link.
                if "news.google.com" in urlparse(old.get("url", "")).netloc and "news.google.com" not in urlparse(fresh.get("url", "")).netloc:
                    old["url"] = fresh["url"]; old["source"] = fresh["source"]
        else:
            fresh["firstSeenAt"] = NOW.isoformat(timespec="seconds")
            existing[fresh["id"]] = fresh; key_to_id[u] = fresh["id"]
            if finger: title_to_id[finger] = fresh["id"]
            added += 1
    values = [v for v in existing.values() if v.get("kind") in ("project", "news") and valid_url(v.get("url", ""))]
    for v in values: v["score"] = score_item(v)
    news = sorted([x for x in values if x["kind"] == "news"], key=lambda x:x.get("publishedAt", ""), reverse=True)
    news = diverse_selection(news, MAX_NEWS, "category")
    projects = sorted([x for x in values if x["kind"] == "project"], key=lambda x:x.get("score", 0), reverse=True)
    projects = diverse_selection(projects, MAX_PROJECTS, "ideaDomain")
    return sorted(news + projects, key=lambda x:(x["score"], x.get("publishedAt", "")), reverse=True), added


def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    old_data = {}
    if OUTPUT.exists():
        try: old_data = json.loads(OUTPUT.read_text(encoding="utf-8"))
        except Exception: logging.warning("Existing JSON cannot be parsed; starting fresh")
    SOURCE_STATUS.clear()
    fresh = collect_rss() + collect_hn() + collect_repos()
    enrich_missing_news_images(fresh, old_data.get("items", []))
    try: prior_seen=json.loads(SEEN.read_text(encoding="utf-8"))
    except (OSError, ValueError): prior_seen={}
    seen_ids=set(prior_seen.get("ids", []))
    seen_titles=set(prior_seen.get("titles", []))
    active_ids={x.get("id") for x in old_data.get("items", [])}
    active_titles={title_fingerprint(x.get("title", "")) for x in old_data.get("items", []) if x.get("kind")=="news"}
    # Never re-introduce a previously archived article, even if it resurfaces in RSS.
    candidate_news=[x for x in fresh if x.get("kind")=="news"]
    news_filtered=[x for x in candidate_news if x["id"] not in seen_ids or x["id"] in active_ids]
    news_filtered=[x for x in news_filtered if not title_fingerprint(x.get("title", "")) or title_fingerprint(x["title"]) not in seen_titles or title_fingerprint(x["title"]) in active_titles]
    fresh=news_filtered+[x for x in fresh if x.get("kind")=="project"]
    available = any(x["state"] in ("ok", "empty") for x in SOURCE_STATUS)
    write_json(STATUS, {"lastAttemptAt": NOW.isoformat(timespec="seconds"),
                       "lastSuccessfulAt": NOW.isoformat(timespec="seconds") if fresh else old_data.get("generatedAt"),
                       "state": "partial" if fresh and any(x["state"] == "error" for x in SOURCE_STATUS) else "ok" if fresh else "empty" if available else "error",
                       "sources": sorted(SOURCE_STATUS, key=lambda x:x["name"]),
                       "collected": len(fresh)})
    if not fresh:
        logging.warning("All sources unavailable; preserving previous snapshot, no bogus new timestamp")
        if old_data.get("items"): return 0
        return 1
    merged, added = merge(fresh, old_data.get("items", []))
    payload = {"generatedAt": NOW.isoformat(timespec="seconds"), "timezone": "Asia/Riyadh",
               "newItems": added, "rankNote": "مؤشر تقريبي من تفاعل Hacker News ونجوم GitHub وحداثة التحديث؛ لا يمثل المشاهدات الفعلية.",
               "items": merged}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    write_json(OUTPUT, payload)
    seen_ids.update(x["id"] for x in candidate_news)
    seen_ids.update(x["id"] for x in merged if x["kind"]=="news")
    seen_titles.update(title_fingerprint(x.get("title", "")) for x in candidate_news)
    seen_titles.update(title_fingerprint(x.get("title", "")) for x in merged if x["kind"]=="news")
    SEEN.write_text(json.dumps({"ids": sorted(seen_ids), "titles": sorted(t for t in seen_titles if t)}, ensure_ascii=False) + "\n", encoding="utf-8")
    logging.info("Updated feed: %s items (%s newly discovered)", len(merged), added)
    return 0

if __name__ == "__main__": sys.exit(main())

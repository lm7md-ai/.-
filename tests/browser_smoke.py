"""Optional end-to-end checks. Install Playwright + Chromium, then run this file."""
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_): pass


def run():
    server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(ROOT/'site')))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    origin=f'http://127.0.0.1:{server.server_port}'
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
        try:
            page=browser.new_page(viewport={'width':1440,'height':1000})
            page.route('**/*',lambda route:route.continue_() if route.request.url.startswith(origin) else route.abort())
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.goto(origin,wait_until='networkidle')
            page.wait_for_selector('.article-card')
            assert page.locator('#heroFeature [data-open]').count()==1
            assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
            assert page.locator('#sourceHealth').count()==1
            for width in [1440,390]:
                page.set_viewport_size({'width':width,'height':1000})
                page.locator('#designSelect').select_option('classic')
                assert page.locator('html').get_attribute('data-design')=='classic'
                page.reload(wait_until='networkidle')
                assert page.locator('#designSelect').input_value()=='classic'
                assert page.locator('#sidebar .primary-nav').count()==1
                assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
                if width==390:page.locator('#mobileMenu').click()
                page.locator('[data-nav="library"]').click()
                assert page.locator('.article-card').count()>0
                page.locator('#feedGrid .title-open').first.click()
                page.locator('#closeDetail').click()
                page.locator('#designSelect').select_option('modern')
                assert page.locator('.masthead .primary-nav').count()==1
                page.locator('[data-nav="all"]').click()
                assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
            page.set_viewport_size({'width':1440,'height':1000})
            page.locator('[data-nav="مفتوح المصدر"]').click()
            page.locator('#feedGrid .card-open').first.click()
            page.locator('[data-proposal-type="improvements"]').first.click()
            page.locator('#saveProposal').click()
            saved_title=page.locator('.proposal-header h2').inner_text()
            shared=page.url
            page.reload(wait_until='networkidle')
            assert page.locator('.proposal-header h2').inner_text()==saved_title
            page.locator('#closeDetail').click()
            page.locator('[data-nav="saved"]').click()
            assert page.locator('.article-card').count()==1
            page.locator('#feedGrid .card-open').first.click()
            assert page.locator('.proposal-header h2').inner_text()==saved_title
            page.locator('#closeDetail').click()
            page.locator('[data-nav="all"]').click()
            page.locator('#searchInput').fill('no-match-12345678')
            assert page.locator('.article-card').count()==0
            page.locator('#resetFilters').click()
            assert page.locator('.article-card').count()>0
            page.locator('[data-layout="list"]').click()
            assert page.locator('#feedGrid').evaluate("e=>e.classList.contains('reading-list')")
            page.reload(wait_until='networkidle')
            assert page.locator('[data-layout="list"]').get_attribute('aria-pressed')=='true'
            source=page.locator('#sourceFilter option').nth(1).get_attribute('value')
            page.locator('#sourceFilter').select_option(source)
            assert page.locator('.article-card').count()>0
            page.locator('#resetFilters').click()
            assert page.locator('#sourceFilter').input_value()=='all'
            page.locator('#feedGrid .title-open').first.focus()
            page.keyboard.press('Enter')
            assert page.locator('.app-shell').evaluate('e=>e.inert')
            page.keyboard.press('Escape')
            assert not page.locator('.app-shell').evaluate('e=>e.inert')
            page.locator('#dateFilter').select_option('7')
            page.locator('#regionFilter').select_option('السعودية')
            # Seed snapshots may contain no recent Saudi news; resetting must recover.
            page.locator('#resetFilters').click()
            page.set_viewport_size({'width':390,'height':844})
            assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
            page.locator('#mobileMenu').click()
            assert page.locator('#mobileMenu').get_attribute('aria-expanded')=='true'
            page.locator('#sidebar [data-nav="برمجة"]').click()
            assert page.locator('#mobileMenu').get_attribute('aria-expanded')=='false'
            page.locator('[data-nav="ideas"]').click()
            page.locator('#reviewedFilter').check()
            page.locator('#resetFilters').click()
            page.locator('[data-nav="library"]').click()
            assert page.locator('#feedGrid .article-card').count()>0
            page.locator('#feedGrid .title-open').first.click()
            assert 'تاريخ فحص البيانات' in page.locator('.detail-submeta').inner_text()
            assert page.locator('.study-entry').count()==0
            library_link=page.url
            page.reload(wait_until='networkidle')
            assert page.locator('#detailTitle').is_visible()
            page.locator('#closeDetail').click()
            page.locator('[data-nav="ideas"]').click()
            # A failed refresh must not erase the last loaded feed.
            before=page.locator('.article-card').count()
            page.route('**/data/feed.json?*',lambda route:route.abort())
            page.locator('#refreshButton').click()
            page.wait_for_function("!document.getElementById('refreshButton').disabled")
            assert page.locator('.article-card').count()==before
            assert 'تعذر' in page.locator('#freshnessMessage').inner_text()
            assert not errors,errors
            # Enrichment must render escaped text, detailed evidence and true proposal counts.
            feed=json.loads((ROOT/'site/data/feed.json').read_text())
            project=next(i for i in feed['items'] if i['kind']=='project')
            editorial={'version':1,'items':{project['id']:{'url':project['url'],'titleAr':'اختبار أداة عربية',
                'summaryAr':'<img src=x onerror=alert(1)>','whyItMatters':'شرح تجريبي',
                'basis':'readme','reviewedAt':'2026-01-01T00:00:00Z','sources':[{'title':'المصدر','url':project['url']}],
                'improvements':[],'spinoffs':[],'religious':[]}}}
            page.unroute('**/data/feed.json?*')
            page.route('**/data/editorial.json?*',lambda route:route.fulfill(json=editorial))
            page.goto(origin+'/?editorial-test=1#item='+project['id'],wait_until='networkidle')
            page.wait_for_selector('.editorial-context')
            assert 'اختبار أداة عربية' in page.locator('#detailTitle').inner_text()
            assert page.locator('.detail-heading>p img').count()==0
            assert page.locator('.study-entry').count()==0
            assert not errors,errors
            print('Browser checks passed: desktop, mobile, filters, saved proposals, deep links, outage retention, editorial rendering, escaped content.')
        finally:
            browser.close()
            server.shutdown()

if __name__=='__main__':run()

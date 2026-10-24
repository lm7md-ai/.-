"""Generate a single-file offline preview (does not live-update)."""
import json
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
html=(ROOT/'site/index.html').read_text(encoding='utf8')
css=(ROOT/'site/styles.css').read_text(encoding='utf8')
ideas=(ROOT/'site/ideas.js').read_text(encoding='utf8')
app=(ROOT/'site/app.js').read_text(encoding='utf8')
feed=(ROOT/'site/data/feed.json').read_text(encoding='utf8')
html=html.replace('<link rel="stylesheet" href="./editorial.css" id="editorialTheme" />','<style id="editorialTheme">'+ (ROOT/'site/editorial.css').read_text(encoding='utf8')+'</style>')
html=html.replace('<link rel="stylesheet" href="./classic.css" id="classicTheme" media="not all" />','<style id="classicTheme" media="not all">'+ (ROOT/'site/classic.css').read_text(encoding='utf8')+'</style>')
html=html.replace('<link rel="stylesheet" href="./styles.css" />','<style>\n'+css+'\n</style>')
html=html.replace('  <script defer src="./ideas.js"></script>','')
html=html.replace('  <script defer src="./app.js"></script>','')
html=html.replace('href="./assets/favicon.svg"','href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\'%3E%3Crect width=\'64\' height=\'64\' rx=\'16\' fill=\'%230c1521\'/%3E%3C/svg%3E"')
extras = ''
for filename, tag in [('research','bootstrapResearch'),('editorial','bootstrapEditorial'),('status','bootstrapStatus'),('library','bootstrapLibrary')]:
    path=ROOT/'site/data'/f'{filename}.json'
    if path.exists():
        data=path.read_text(encoding='utf8').replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
        extras += f'<script id="{tag}" type="application/json">{data}</script>\n'
inline = feed.replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
html=html.replace('</body>',f'{extras}<script id="bootstrapData" type="application/json">{inline}</script>\n<script>{ideas}</script>\n<script>{app}</script>\n</body>')
output=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'nabdh-offline-preview.html'
output.write_text(html,encoding='utf8')
print(output,len(html),'bytes')

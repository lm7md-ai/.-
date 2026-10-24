#!/usr/bin/env python3
"""Export an enrichment queue; validate and merge model-produced editorial JSON."""
from __future__ import annotations
import argparse
import datetime as dt
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
FEED = ROOT / 'site/data/feed.json'
EDITORIAL = ROOT / 'site/data/editorial.json'
TEXT_FIELDS = ('titleAr', 'summaryAr', 'whyItMatters', 'audience', 'overview', 'requirements', 'quickStart', 'limitations')
PROPOSAL_FIELDS = ('title', 'problem', 'approach', 'stack', 'metric', 'difficulty', 'risks')


def secure_url(value):
    try:
        url = urlparse(value)
        return url.scheme == 'https' and bool(url.hostname) and not url.username and not url.password
    except (ValueError, TypeError):
        return False


def text(value, name, maximum=6000):
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise ValueError(f'{name}: expected nonempty text, at most {maximum} characters')


def sources(value):
    if not isinstance(value, list) or not 1 <= len(value) <= 20:
        raise ValueError('sources: expected 1–20 references')
    for entry in value:
        if not isinstance(entry, dict) or not secure_url(entry.get('url')):
            raise ValueError('sources: each reference requires an HTTPS URL')
        text(entry.get('title'), 'source.title', 300)


def validate(document):
    if not isinstance(document, dict) or document.get('version') != 1 or not isinstance(document.get('items'), dict):
        raise ValueError('expected {"version":1,"items":{id:entry}}')
    if len(document['items']) > 5000:
        raise ValueError('too many entries')
    for item_id, entry in document['items'].items():
        text(item_id, 'id', 100)
        if not isinstance(entry, dict) or not secure_url(entry.get('url')):
            raise ValueError(f'{item_id}: missing HTTPS original url')
        text(entry.get('titleAr'), 'titleAr', 300)
        text(entry.get('summaryAr'), 'summaryAr')
        text(entry.get('whyItMatters'), 'whyItMatters')
        sources(entry.get('sources'))
        reviewed = dt.datetime.fromisoformat(str(entry.get('reviewedAt', '')).replace('Z', '+00:00'))
        if reviewed.tzinfo is None or reviewed > dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=10):
            raise ValueError('reviewedAt must include a timezone and cannot be in the future')
        if entry.get('basis') not in ('metadata', 'article', 'readme', 'code', 'tested'):
            raise ValueError('basis must describe what was actually inspected')
        if entry['basis'] == 'tested': text(entry.get('testEvidence'), 'testEvidence')
        for key in TEXT_FIELDS:
            if key in entry: text(entry[key], key, 300 if key == 'titleAr' else 6000)
        for field in ('nextSteps',):
            if field in entry:
                if not isinstance(entry[field], list) or not 1 <= len(entry[field]) <= 10:
                    raise ValueError(f'{field}: expected 1–10 steps')
                for step in entry[field]: text(step, field, 1200)
        for field in ('improvements', 'spinoffs', 'religious'):
            if field not in entry: continue
            proposals = entry[field]
            if not isinstance(proposals, list) or len(proposals) > 10:
                raise ValueError(f'{field}: expected up to 10 proposals')
            titles = set()
            for proposal in proposals:
                if not isinstance(proposal, dict): raise ValueError('proposal must be an object')
                for key in PROPOSAL_FIELDS: text(proposal.get(key), key)
                if proposal['title'] in titles: raise ValueError('duplicate proposal title')
                titles.add(proposal['title'])
                steps = proposal.get('steps')
                if not isinstance(steps, list) or not 3 <= len(steps) <= 12:
                    raise ValueError('proposal.steps: expected 3–12 steps')
                for step in steps: text(step, 'step', 1200)
                sources(proposal.get('sources'))
    return document


def merge_documents(existing, incoming, feed):
    validate(existing)
    validate(incoming)
    active = {x['id']: x for x in feed['items']}
    merged = {'version': 1, 'items': dict(existing['items'])}
    for item_id, entry in incoming['items'].items():
        if item_id not in active or active[item_id]['url'] != entry['url']:
            raise ValueError(f'{item_id}: unknown item or original URL mismatch; export a fresh queue')
        merged['items'][item_id] = entry
    return validate(merged)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['queue', 'validate', 'import'])
    parser.add_argument('file', nargs='?', type=Path)
    parser.add_argument('--limit', type=int, default=20)
    parser.add_argument('--kind', choices=['all','news','project'], default='all')
    args = parser.parse_args()
    if args.command == 'queue':
        feed = json.loads(FEED.read_text())
        editorial = validate(json.loads(EDITORIAL.read_text()))
        # Unenriched items first; a bounded queue keeps scheduled work manageable.
        items = sorted([x for x in feed['items'] if args.kind == 'all' or x['kind'] == args.kind], key=lambda x:(x['id'] in editorial['items'], -(x.get('score') or 0)))
        result = {'generatedAt': feed.get('generatedAt'), 'items': items[:max(1, min(100, args.limit))]}
        output = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
        if args.file: args.file.write_text(output, encoding='utf-8')
        else: print(output, end='')
    else:
        path = args.file or EDITORIAL
        incoming = validate(json.loads(path.read_text(encoding='utf-8')))
        if args.command == 'import':
            if not args.file: parser.error('import requires an input file')
            current = json.loads(EDITORIAL.read_text(encoding='utf-8'))
            merged = merge_documents(current, incoming, json.loads(FEED.read_text()))
            temp = EDITORIAL.with_suffix('.tmp')
            temp.write_text(json.dumps(merged, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
            temp.replace(EDITORIAL)
        print(f"Validated {len(incoming['items'])} editorial entries")


if __name__ == '__main__':
    try: main()
    except (ValueError, KeyError, OSError, TypeError) as error:
        raise SystemExit(f'Editorial validation failed: {error}')

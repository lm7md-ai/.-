# Nabdh — knowledge journal transformation

## Product contracts preserved
Static Arabic RTL news, GitHub discovery and practical proposals. Keep feed/editorial JSON contracts, all previous saved IDs and localStorage keys, scheduled Actions, publisher links, source status and failure recovery. No new dependencies or paid APIs. No feed data or secret changes.

## Different architecture, not a palette swap
Before: persistent dark sidebar, promotional hero and mixed cards in a single overview.
After: a paper-toned journal with an Arabic masthead, five destinations, a secondary topic index, a reading-first news stream, a separate project discovery shelf, persistent historical catalog and centered article reader. Project cards and idea cards have their own visual treatment. The home stream now contains news only; projects remain accessible through their dedicated destination and preview shelf.

Primary journeys: Read → open article → source/explanation → save; Discover → project → proposal; Library → historical project → upstream source; Ideas → actionable proposal; Saved → return to existing news/project/proposal. The sidebar becomes a topic drawer only on mobile. Native controls retain keyboard operation.

## Art direction and research
Warm paper #f4f2ec, ink #19272e, ultramarine #2949d7 and rust #a54331. Square editorial surfaces and rules, generous Arabic line height, numbered story hierarchy and restrained motion. Text is the primary visual material; no fake editorial images.

References actually fetched: Smashing Magazine home and Nielsen Norman Group articles. HTML titles and article/navigation landmarks were inspected; no claim of a full visual audit. Original adaptation emphasizes a publication's topic index and readable article hierarchy. Prior document inspection of Linear, Resend and Godly informed consistency, but the earlier dark design is superseded here. No reference assets or component source copied.

## Historical catalog
site/data/library.json publishes the existing 31-project research queue as a persistent metadata catalog independent of the 45-day discovery window. Stable library:<owner/repo> IDs support links and saved entries. Archived status, cumulative stars and metadata measurement dates are displayed honestly. Unknown API licenses request verification. No generated proposals are attached to these metadata-only cards.

This is a useful metadata library, not 31 completed project reviews. The existing scheduled editorial import tool still targets active feed IDs; enriching out-of-feed library entries requires a subsequent extension of that contract. The snapshot does not automatically refresh when editorial/library research files change.

## Evidence and quality review
Existing desktop/mobile before screenshots in /workspace/scratch/nabdh-refined-*.png; earlier dark editorial pass in nabdh-premium-*.png was subsequently replaced by current captures. Final screenshots use nabdh-radical-desktop.png and nabdh-radical-mobile.png. These workspace images are review evidence, not deployed site content.

Checks include Python unit tests, JavaScript syntax, Chromium user flows, metadata catalog detail/deep links, reset/source filters, local layout persistence, saved proposals, failed-refresh preservation and HTML escaping. Width checks at 320,390,768,1440 pixels. Screens reviewed for typography, topic navigation, feed hierarchy and mobile flow. Full screen-reader, browser matrix and field-performance audits have not been completed.

## Independent critical pass
- Substantial difference: sidebar-led mixed dashboard replaced by destination-based editorial publication.
- Identity coherent across main feed, project and idea cards, article dialog, proposal sheets, filters and error states.
- Mobile topic drawer is hidden from focus when closed; primary destinations remain directly available.
- Known limitations: catalog reviews are incomplete; long content still needs pagination/archival strategy at larger scale; external images/fonts remain dependent on their hosts. No fabricated benchmarks or design quality score.

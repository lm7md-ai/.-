# Nabdh editorial reading system

## Product and preserved foundations
Arabic RTL technical news, open-source discovery, and practical proposals. Retain the static HTML/CSS/JavaScript stack, existing green identity, dark palette, data contracts, scheduling, and local saved IDs. No new runtime dependencies.

## Research actually performed
Fetched HTML and linked stylesheet references from Linear (https://linear.app/), Resend (https://resend.com/), and Godly (https://godly.design/). This was document inspection, not a comprehensive visual or interaction audit of those products. Adopt original implementations of restrained surfaces, clear hierarchy, and progressive disclosure. No third-party component source was copied.

## Foundations
- Background #090f18; panel #111b28; borders #2c3b4b; text #f3f7fc; secondary #a2b3c5; action #bbf77e. Color must not be the only state indicator.
- IBM Plex Sans Arabic with system fallback; Inter for compact numeric metadata. Titles use automatic text direction; paragraphs preserve mixed text direction.
- Base spacing unit 4px. Typical section gaps 24–32px, card padding 18px, reading rows 22–26px.
- Radius 12px for content surfaces, 8px for groups and controls. No decorative glow or 3D objects in the reading flow.
- Main text 13–15px, feed titles 17–19px, detail title 24–28px. Detail body line height 2.15 for Arabic technical content.

## Components and behavior
- Hero communicates the product in two lines. The daily brief is the main overview; remove the duplicate image spotlight from visual flow.
- Two content densities: cards for discovery, list for sustained reading. Persist only layout preference, not content filters.
- Source filter combines with date, region, language, reviewed status and search. Reset clears all filters, retaining the chosen section and density.
- Empty results offer recovery. Source failures keep last loaded content and expose status. Enrichment labels distinguish source descriptions and custom editorial work.
- Card titles and image areas are keyboard actionable. Bookmarks, detail close, and core mobile controls use at least 42–44px targets.
- Dialog isolates background with native inert and traps keyboard focus. Slash shortcut does not steal focus from form controls or an open dialog. Escape and close restore focus.
- Skip link goes to focusable content section; active navigation exposes aria-current; layout switches use aria-pressed.

## Responsive and motion
At 670px, navigation enters from the RTL inline start (right). Filters use two columns, controls remain usable, and empty image blocks are compact. Sidebar scrolls on short screens. Reading layout stays one column. Existing intermediate breakpoints remain.
Use only brief hover/border feedback and menu transitions. Respect prefers-reduced-motion. No animation dependency.

## Remaining work
Historical project queue is not a published library; it requires durable data and routing integration. No new claims of content publication are made in this UI change. Full screen-reader and WCAG conformance audits remain separate from the automated browser checks.

## Professional editorial refinement
The home hero now includes a real news selection with source, date and article action. The five-item brief uses a lead story and supporting rows on desktop, becoming a single reading column below 800px. Typography, borders, secondary text, metadata, card spacing and dialog surfaces share the same muted green/ink identity in site/editorial.css. This optional visual layer loads after component styles and is embedded by the offline preview builder. No fabricated featured content or image assets are introduced. Scoped category pages hide the home hero and time digest to prioritize results.

Verified at 320, 390, 768 and 1440 pixels; desktop and mobile screenshots reviewed. Existing local saved entries and editorial data are preserved.

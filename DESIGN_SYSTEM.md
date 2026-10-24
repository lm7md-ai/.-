# Nabdh / Knowledge journal

This document supersedes the previous dark editorial direction. See docs/TRANSFORMATION.md for behavior, research evidence and limitations.

- Purpose: read technology with context, discover projects and turn ideas into work.
- Foundations: warm paper #f4f2ec; ink #19272e; secondary #52646c; rule #d6d4ca; ultramarine action #2949d7; rust editorial accent #a54331.
- Typography: IBM Plex Sans Arabic with system fallback; Inter for metrics. Headlines 27–66px according to hierarchy, articles 15px/2.1, feed summaries 13–14px/2. Source metadata remains subordinate and readable. Mixed text uses automatic direction.
- Layout: maximum content width 1380px, masthead 1460px. News is a ruled article stream; projects use a two/three-column directory; ideas use compact work cards. Details use a centered 900px reader, full viewport on phones.
- Components: square/near-square rules and surfaces, native selects, explicit active states and visible focus. No ornamental glass, background glow, false images, gratuitous motion or new UI dependencies.
- Destinations: reading, projects, library, ideas, saved. Topic navigation is secondary and a mobile drawer. Primary destinations remain visible on mobile.
- Breakpoints: 1100px compact masthead and two-column directory; 800px stacked hero/brief; 670px touch-first single column and full-screen reader. Verify 320px minimum.
- Touch: important controls 42–44px. Skip link, aria-current and aria-pressed identify state. Detail background uses inert, dialog focus is trapped, Escape restores focus.
- Motion: short border/menu feedback only, respects prefers-reduced-motion.
- Implementation: styles.css supplies existing functional component foundations; editorial.css is the authoritative redesigned presentation layer. CSS embeds in the standalone preview. No framework migration.

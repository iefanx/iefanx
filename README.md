# iefan.net

Iefan's portfolio and repository-backed journal, built with Astro and deployed
from the `main` branch through Vercel.

## Publishing an article

Add a Markdown file under `src/content/blog` with the following frontmatter:

```yaml
---
title: Article title
description: Concise search and feed description.
pubDate: YYYY-MM-DD
heroImage: ../../assets/article-image.png
topics: ['Topic One', 'Topic Two']
featured: false
kind: research
status: Draft proposal
---
```

Use `kind: note` and `status: Technical note` for journal entries. Research
proposals appear at `/research/`; technical notes appear at `/blog/`. Both
keep article URLs under `/blog/<slug>/`. Images are optional.

The publication indexes, article route, RSS feed, table of contents, and sitemap are
generated during `npm run build`.

## Nostr identity

`public/.well-known/nostr.json` is the production NIP-05 mapping for
`iefan.net`. Preserve it when changing the site. `vercel.json` supplies the
required JSON content type and cross-origin header for this endpoint.

## Local development

```sh
npm ci
npm run dev
npm run build
```

## Research integrity

Research drafts are proposals, not peer-reviewed publications. Include an abstract,
assumptions, evaluation plan, limitations, and primary references. Add empirical
claims only when supporting measurements and reproducible artifacts are available.
The September 2026 redesign replaces unsupported benchmark claims in the robotics
and federated-learning entries with explicit evaluation proposals.

Article pages include browser print styling for Print / Save as PDF.

## Browser narration

The personal introduction and article pages use the Web Speech API for optional
read-aloud playback. Playback starts only after a tap. Readers can pause, resume,
stop, change speed, and choose an English voice available on their device. Long
prose is split into short passages. Code blocks and tables are omitted. Article
controls stay accessible at the bottom of phone screens during playback.
This is browser-generated narration, not an audio recording of Iefan.

## Projects and publication types

`src/data/projects.ts` supplies the Work page and homepage project summaries.
Case studies use `kind: note`, `status: Case study`, and a matching `project` id.
Research entries use `kind: research`, with `researchQuestion`, `method`, and
`evaluation` frontmatter fields shown in the research ledger and article brief.
Related reading stays within the research or journal collection. Use ISO date
strings (`YYYY-MM-DD`) to keep publication dates stable across time zones.

## Publication details

Reading estimates share `src/utils/publication.ts`. Article contents indicate the
current section, with a lightweight reading progress line. The default social card
is `public/social-card.png`; metadata uses the production canonical domain.
The 404 page and empty collection state provide routes back into the notebook.
Local fonts, reduced-motion styles, keyboard focus, print styling, and phone
narration controls are part of the shared publication design.

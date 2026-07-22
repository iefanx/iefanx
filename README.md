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
---
```

The journal index, article route, RSS feed, reading ledger, and sitemap are
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

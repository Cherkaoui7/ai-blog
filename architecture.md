# AI Blog Architecture

## Summary

This project is now a local-first MDX blog system.

- Next.js 16 / React 19 frontend
- Local Ollama generation through `scripts/generate-post.ts`
- MDX posts stored in `posts/`
- Public blog pages rendered from local files
- Admin and pipeline pages kept as UI, but disconnected from content generation
- Optional GitHub push after local generation

There is no paid AI dependency in the generation path.

## Core flow

1. `scripts/generate-post.ts` selects topics, calls Ollama, applies fallback content if needed, injects SEO/internal links/monetization structure, and writes MDX into `posts/`.
2. The script records generation logs in `.tmp-generated/`.
3. `lib/posts.ts` reads local MDX files and prepares them for the public site.
4. The blog pages under `app/blog/` render those posts.
5. The admin page reads the same local content through `app/api/admin/posts/route.ts`.
6. The pipeline page shows the offline workflow and recent logs instead of orchestrating remote agents.

## Main directories

```text
ai-blog/
|-- app/
|   |-- admin/
|   |   `-- page.tsx
|   |-- api/
|   |   `-- admin/
|   |       `-- posts/route.ts
|   |-- blog/
|   |   |-- [slug]/page.tsx
|   |   `-- page.tsx
|   |-- pipeline/
|   |   `-- page.tsx
|   |-- layout.tsx
|   `-- page.tsx
|-- components/
|   `-- EmailCapture.tsx
|-- data/
|   |-- affiliate-links.json
|   |-- products.json
|   `-- topic-clusters.json
|-- lib/
|   |-- affiliate.ts
|   |-- content-engine.ts
|   |-- posts.ts
|   |-- reviews.ts
|   `-- topic-clusters.ts
|-- posts/
|-- scripts/
|   `-- generate-post.ts
`-- .tmp-generated/
```

## Important modules

### `scripts/generate-post.ts`

The main engine.

- Calls Ollama at `http://localhost:11434`
- Uses `llama3`
- Supports fallback content
- Adds metadata, tags, reading time, internal links, review sections, and logging
- Avoids duplicate topics and duplicate slugs

### `lib/posts.ts`

The content reader for the site.

- Loads local MDX files
- Normalizes spacing
- Computes descriptions and reading time
- Builds related posts
- Applies affiliate monetization
- Powers both the public blog and the admin content list

### `lib/content-engine.ts`

Reads the local generation logs and exposes the current status for the pipeline dashboard.

### `app/admin/page.tsx`

Local content browser for generated posts.

### `app/pipeline/page.tsx`

Offline workflow dashboard.

It no longer triggers research, SEO, content, image, or publishing agents.

## Runtime model

### Local machine

- Runs Ollama
- Runs the generator
- Writes MDX files
- Writes generation logs

### Hosted site

- Serves the Next.js app
- Reads committed MDX content
- Does not run Ollama

## Optional external systems

These are optional and are not required for content generation:

- GitHub push
- Vercel deploy hook
- Mailchimp
- Google AdSense
- Affiliate programs

## Removed architecture pieces

The generation path no longer depends on:

- OpenRouter
- external AI APIs
- multi-agent orchestration
- Supabase-backed generation storage
- research/image/content agent API routes

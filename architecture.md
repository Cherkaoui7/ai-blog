# AI Blog - Project Architecture and Structure

This document outlines the architecture and file structure of the `ai-blog` project.

## High-Level Architecture

The project is a Next.js web application utilizing the **App Router** paradigm. It integrates **Supabase** for database and authentication, and **Google Gemini AI** for managing AI agents that assist in researching, writing, and optimizing blog content. 

### Core Technologies
- **Framework:** Next.js 16 / React 19
- **Database / Auth:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **AI Integration:** Google Generative AI (`@google/generative-ai`)
- **Styling / UI:** Tailwind CSS, Shadcn UI (`radix-ui`), Lucide React
- **Content Rendering:** MDX (`@next/mdx`, `next-mdx-remote`)
- **Data Scraping / Research:** `axios`, `cheerio`

---

## Directory Structure Overview

```text
ai-blog/
├── agents/
│   ├── skills/
│   │   └── supabase-postgres-best-practices/
│   ├── content.ts
│   ├── image.ts
│   ├── publisher.ts
│   ├── research.ts
│   └── seo.ts
├── app/
│   ├── admin/
│   │   └── page.tsx
│   ├── api/
│   │   ├── admin/
│   │   │   └── posts/
│   │   │       └── route.ts
│   │   └── agents/
│   │       ├── content/route.ts
│   │       ├── image/route.ts
│   │       ├── preview/route.ts
│   │       ├── publisher/route.ts
│   │       ├── research/route.ts
│   │       └── seo/route.ts
│   ├── blog/
│   │   ├── [slug]/
│   │   │   └── page.tsx
│   │   └── posts/
│   │       ├── hello-world.mdx
│   │       └── how-to-save-money-on-low-income.mdx
│   ├── components/
│   │   └── PostCard.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── client.ts
│   ├── db.ts
│   ├── gemini.ts
│   ├── middleware.ts
│   ├── posts.ts
│   ├── server.ts
│   ├── supabase.ts
│   └── utils.ts
├── public/
│   ├── images/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── .env.local
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── package.json
└── README.md (and other config files)
```

### 1. `agents/` - AI Agent Backends
This directory contains the central logic that powers the AI capabilities of the blog.
- **`content.ts`** - Agent responsible for drafting blog content.
- **`image.ts`** - Agent responsible for generating or managing image assets.
- **`publisher.ts`** - Agent handling the formatting and publishing flow.
- **`research.ts`** - Agent that scrapes web data and performs research for posts.
- **`seo.ts`** - Agent dedicated to optimizing content for search engines.
- **`skills/`** - Contains specific instructional skills/prompts for the AI (e.g., `supabase-postgres-best-practices`).

### 2. `app/` - Frontend and Application Routing
Next.js App Router directory containing both page components and API endpoints.

#### `app/admin/`
Admin interface of the application for managing agents and blog content.
- `page.tsx` - Main admin dashboard.

#### `app/api/` (Backend Routes)
Serverless API endpoints to communicate with AI agents and the database.
- **`admin/posts/route.ts`** - API endpoint for retrieving and managing posts.
- **`agents/`** - API endpoints triggering the various AI agents:
  - `/content/route.ts`
  - `/image/route.ts`
  - `/preview/route.ts`
  - `/publisher/route.ts`
  - `/research/route.ts`
  - `/seo/route.ts`

#### `app/blog/` (Public Blog Frontend)
The public-facing blog application.
- **`[slug]/`** - Dynamic route for individual blog posts (`page.tsx`).
- **`posts/`** - MDX content files for the blog (`hello-world.mdx`, etc.).

#### Components and Layout
- **`components/`** - Shared React UI components (e.g., `PostCard.tsx`).
- `layout.tsx` - The root layout structure.
- `page.tsx` - The main landing page.
- `globals.css` - Global Tailwind and standard CSS styles.

### 3. `lib/` - Shared Utilities & Services
Integration files that are utilized across `agents` and `app` components.
- **`gemini.ts`** - Configuration and instantiation of the Google Gemini AI client.
- **`supabase.ts`**, **`db.ts`** - Supabase client setup and database abstractions.
- **`client.ts`**, **`server.ts`** - Environment-specific utility wrappers (usually for Auth/Supabase).
- **`posts.ts`** - Logic for fetching, parsing, and processing MDX post content.
- **`middleware.ts`**, **`utils.ts`** - General utility functions and potential routing middleware.

### 4. Configuration Files
Standard configuration files for the modern frontend stack:
- `next.config.js` - Next.js configuration.
- `tailwind.config.mjs` / `postcss.config.mjs` - Tailwind CSS settings.
- `components.json` - Shadcn UI configuration.
- `tsconfig.json` - TypeScript compiler parameters.
- `.env.local` - Environment variables (API keys for Gemini, Supabase, etc.).

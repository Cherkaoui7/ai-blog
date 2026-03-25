# AI Blog

Local-first blog generator built with Next.js, MDX, and Ollama.

## What changed

- No paid AI APIs
- No agent orchestration pipeline
- No Supabase dependency for content generation
- `scripts/generate-post.ts` is the main content engine
- Posts are written to `posts/`
- Generation logs are written to `.tmp-generated/`

## Quick start

1. Install dependencies:

```powershell
npm install
```

2. Install Ollama and pull the model:

```powershell
ollama pull llama3
ollama serve
```

3. Create `.env.local` with the minimum local settings:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_SECRET=change-this
```

4. Generate content:

```powershell
npm run generate
```

5. Start the app:

```powershell
npm run dev
```

6. Open:

```text
http://localhost:3000
```

## Main commands

```powershell
npm run generate
npm run generate -- --count 3
npm run generate -- --dry-run
npm run dev
npm run build
```

## Optional env vars

Use these only if you need the related feature:

```env
GITHUB_TOKEN=your_github_token
GITHUB_REPO=your-username/your-repo
VERCEL_DEPLOY_HOOK=optional_vercel_hook

NEXT_PUBLIC_ADSENSE_CLIENT=optional
NEXT_PUBLIC_ADSENSE_LIST_SLOT=optional
NEXT_PUBLIC_ADSENSE_ARTICLE_TOP_SLOT=optional
NEXT_PUBLIC_ADSENSE_ARTICLE_BOTTOM_SLOT=optional

MAILCHIMP_FORM_ACTION=optional
MAILCHIMP_EMAIL_FIELD=EMAIL
MAILCHIMP_SOURCE_FIELD=SOURCE
```

## Notes

- If Ollama is unavailable, the generator writes improved fallback content instead of crashing.
- Vercel can host the site, but it cannot run your local Ollama model.
- The intended flow is: generate locally, review locally, then push posts to GitHub.
- The public blog and admin UI read local MDX files, not a remote database.

# Setup Step By Step

This is the exact order to get the app working with the new local-only content system.

## 1. Install the required tools

Install these first:

1. Node.js 20 or newer
2. Git
3. Ollama

Then install project dependencies:

```powershell
npm install
```

## 2. Create `.env.local`

Use this minimum setup:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_SECRET=change-this-to-a-strong-password
```

Optional values:

```env
GITHUB_TOKEN=YOUR_GITHUB_PAT
GITHUB_REPO=YOUR_GITHUB_USERNAME/YOUR_REPO_NAME
VERCEL_DEPLOY_HOOK=YOUR_VERCEL_DEPLOY_HOOK

NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_LIST_SLOT=1234567890
NEXT_PUBLIC_ADSENSE_ARTICLE_TOP_SLOT=1234567890
NEXT_PUBLIC_ADSENSE_ARTICLE_BOTTOM_SLOT=1234567890

MAILCHIMP_FORM_ACTION=https://YOUR_MAILCHIMP_FORM_URL
MAILCHIMP_EMAIL_FIELD=EMAIL
MAILCHIMP_SOURCE_FIELD=SOURCE
```

Important:

- You do not need Supabase.
- You do not need OpenRouter.
- You do not need any paid AI API key.

## 3. Start Ollama

Pull the model once:

```powershell
ollama pull llama3
```

Start the local server:

```powershell
ollama serve
```

Optional check:

```powershell
Invoke-WebRequest http://localhost:11434/api/tags
```

If Ollama is down, the generator still works with fallback content.

## 4. Test the generator

Dry run:

```powershell
npm run generate -- --dry-run
```

Batch dry run:

```powershell
npm run generate -- --count 3 --dry-run
```

Real write:

```powershell
npm run generate
```

Generated posts are written to:

```text
posts/
```

Logs are written to:

```text
.tmp-generated/content-engine-log.json
.tmp-generated/topic-usage.json
```

## 5. Start the app

Run:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

## 6. Check the local UI

Verify these pages:

1. `/blog`
2. `/blog/<post-slug>`
3. `/admin`
4. `/pipeline`
5. `/login`

Notes:

- `/admin` now reads local MDX posts.
- `/pipeline` is now an offline workflow dashboard, not a generation orchestrator.
- Login still uses `ADMIN_SECRET`.

## 7. Optional GitHub publishing

Only do this if you want to push generated content to a remote repo.

1. Create a GitHub personal access token with repository contents write access.
2. Set `GITHUB_TOKEN`.
3. Set `GITHUB_REPO` in the form `username/repo-name`.
4. Optionally set `VERCEL_DEPLOY_HOOK`.

Typical publish flow:

```powershell
git add posts
git commit -m "publish generated posts"
git push
```

## 8. Optional monetization and email

Affiliate links:

1. Replace placeholder affiliate IDs in `data/affiliate-links.json`
2. Replace placeholder affiliate IDs in `data/products.json`

Email capture:

1. Set `MAILCHIMP_FORM_ACTION` if you want real Mailchimp submissions
2. If you skip it, the app keeps using local placeholder capture

Ads:

1. Set the AdSense env vars only if you want live ads
2. If you skip them, the placeholders stay hidden

## 9. Production reality

The site can be deployed to Vercel, but the generator still runs where Ollama runs.

That means the real flow is:

1. Run Ollama on your own machine
2. Generate posts locally
3. Review the content locally
4. Push the generated MDX files to GitHub
5. Let Vercel deploy the updated site

## 10. Final checklist

Before calling the system fully working, confirm:

1. `npm run build` passes
2. `ollama serve` is running
3. `npm run generate -- --dry-run` works
4. `npm run generate` creates a file in `posts/`
5. `/blog` shows the new post
6. `/admin` lists local posts
7. `/pipeline` shows recent generation logs
8. Affiliate placeholders are replaced if you want revenue
9. Mailchimp envs are set if you want live email capture
10. AdSense envs are set if you want live ads

That is the exact setup path for the current architecture.

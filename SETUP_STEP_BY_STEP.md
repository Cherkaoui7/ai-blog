# Setup Step By Step

This file tells you exactly what to do to get this project working end to end.

## 1. Install the base tools

Do these first:

1. Install Node.js 20 or newer.
2. Install Git.
3. Install Ollama.
4. Make sure `npm` works in your terminal.

Then in the project folder run:

```powershell
npm install
```

## 2. Create or update `.env.local`

The app already expects a `.env.local` file in the project root.

Use this template and fill in real values:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_SECRET=change-this-to-a-strong-password

NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_BROWSER_ANON_KEY
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_BROWSER_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY

GITHUB_TOKEN=YOUR_GITHUB_PAT_WITH_CONTENTS_WRITE
GITHUB_REPO=YOUR_GITHUB_USERNAME/YOUR_REPO_NAME
VERCEL_DEPLOY_HOOK=YOUR_VERCEL_DEPLOY_HOOK_URL

UNSPLASH_ACCESS_KEY=YOUR_UNSPLASH_KEY

NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_LIST_SLOT=1234567890
NEXT_PUBLIC_ADSENSE_ARTICLE_TOP_SLOT=1234567890
NEXT_PUBLIC_ADSENSE_ARTICLE_BOTTOM_SLOT=1234567890

MAILCHIMP_FORM_ACTION=https://YOUR_MAILCHIMP_FORM_URL
MAILCHIMP_EMAIL_FIELD=EMAIL
MAILCHIMP_SOURCE_FIELD=SOURCE
```

Important notes:

- Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the same Supabase browser anon key. The code currently reads both names in different files.
- `OPENROUTER_API_KEY` is required for the admin pipeline agents.
- `GITHUB_TOKEN`, `GITHUB_REPO`, and `VERCEL_DEPLOY_HOOK` are required for the publisher flow.
- If you do not set the Mailchimp variables, email capture still works in placeholder mode.
- If you do not set the AdSense variables, the ad placeholders stay hidden.

## 3. Set up Supabase

Create a Supabase project if you do not already have one.

Then create these two tables in the SQL editor.

### `posts` table

```sql
create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  keyword text,
  meta_description text,
  h2_tags text[],
  secondary_keywords text[],
  target_word_count integer,
  competition text,
  mdx_content text,
  word_count integer,
  image_path text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz,
  views integer default 0,
  revenue numeric default 0
);
```

### `research_topics` table

```sql
create table if not exists public.research_topics (
  id uuid primary key default gen_random_uuid(),
  niche text not null,
  topic text not null,
  reason text,
  search_volume text,
  content_angle text,
  status text default 'pending',
  created_at timestamptz default now()
);
```

After that:

1. Copy your Supabase project URL.
2. Copy your anon key.
3. Copy your service role key.
4. Put them in `.env.local`.

## 4. Set up Ollama for the free content engine

The local generator in `scripts/generate-post.ts` calls Ollama at `http://localhost:11434`.

Run these commands:

```powershell
ollama pull llama3
ollama serve
```

Then verify Ollama is reachable:

```powershell
Invoke-WebRequest http://localhost:11434/api/tags
```

If this does not work, `npm run generate` will still run, but it will use fallback content instead of live `llama3` output.

## 5. Set up GitHub publishing

This is required only if you want the admin pipeline to publish content automatically through GitHub.

Do this:

1. Create a GitHub personal access token with repository contents write access.
2. Put that token in `GITHUB_TOKEN`.
3. Set `GITHUB_REPO` to `username/repo-name`.
4. Make sure the repo default branch is `main`, because the publisher writes to `main`.

The publisher writes generated posts into:

- `app/blog/posts/*.mdx`
- `public/images/*`

## 6. Set up Vercel deploy hook

This is required only if you want publishing to trigger a redeploy automatically.

Do this:

1. Create a deploy hook in Vercel.
2. Copy the hook URL.
3. Put it in `VERCEL_DEPLOY_HOOK`.

## 7. Set up monetization

### Affiliate links

Replace all placeholder values in these files:

- [data/affiliate-links.json](/C:/Users/USER/Documents/ai-blog/data/affiliate-links.json)
- [data/products.json](/C:/Users/USER/Documents/ai-blog/data/products.json)

Specifically replace:

- `YOURAFFILIATETAG-20`
- `YOUR_AFFILIATE_ID`

### AdSense

If you want ads live, set these env vars:

- `NEXT_PUBLIC_ADSENSE_CLIENT`
- `NEXT_PUBLIC_ADSENSE_LIST_SLOT`
- `NEXT_PUBLIC_ADSENSE_ARTICLE_TOP_SLOT`
- `NEXT_PUBLIC_ADSENSE_ARTICLE_BOTTOM_SLOT`

## 8. Set up email capture

If you want real email collection through Mailchimp:

1. Get your Mailchimp embedded form action URL.
2. Put it in `MAILCHIMP_FORM_ACTION`.
3. Keep `MAILCHIMP_EMAIL_FIELD=EMAIL` unless your form uses another field name.
4. Set `MAILCHIMP_SOURCE_FIELD` only if you want to pass the article slug as an extra field.

If you skip this, the site still works. Emails will be stored in placeholder mode by the server action.

## 9. Start the app locally

Run:

```powershell
npm run dev
```

Then open:

```text
http://localhost:3000
```

## 10. Log into the admin area

To access admin and pipeline pages:

1. Open `/login`
2. Enter the value of `ADMIN_SECRET`

The login route uses that exact env value.

## 11. Test each major system

Run these checks in order.

### Public blog

1. Open `/blog`
2. Open any article
3. Confirm you see:
   - article content
   - related reading
   - affiliate disclosure
   - email capture block
   - ad slots only if AdSense envs are set

### Local content engine

Dry run:

```powershell
npm run generate -- --count 3 --dry-run
```

Real write:

```powershell
npm run generate:batch
```

This writes to `/posts` by default.

### Admin pipeline

Open `/pipeline` and test the flow:

1. Research
2. SEO
3. Content
4. Image
5. Publish

For this path to fully work, you need:

- Supabase configured
- OpenRouter configured
- GitHub configured
- optional Vercel hook configured

## 12. Deploy the site

If you deploy to Vercel:

1. Add all required env vars in Vercel project settings.
2. Deploy the app.
3. Set `NEXT_PUBLIC_SITE_URL` to the real production URL.

Important:

- Vercel can host the site.
- Vercel cannot run your local Ollama model.
- The free local generator only works on a machine where Ollama is installed and running.

That means:

1. Use the local Ollama generator from your own machine, then push content.
2. Or use the admin pipeline path with OpenRouter for hosted generation.

## 13. Know what is optional vs required

### Required for the website itself

- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_SECRET`
- `npm install`
- `npm run dev`

### Required for local free generation

- Ollama installed
- `ollama pull llama3`
- `ollama serve`

### Required for admin pipeline

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`

### Required for auto publishing

- `GITHUB_TOKEN`
- `GITHUB_REPO`

### Required for auto redeploy after publish

- `VERCEL_DEPLOY_HOOK`

### Required for live money systems

- Real affiliate IDs in the JSON files
- AdSense env vars
- Mailchimp env vars

## 14. Final go-live checklist

Before you call the app fully live, make sure all of these are true:

1. `npm run build` passes.
2. Ollama responds at `http://localhost:11434`.
3. Supabase tables exist.
4. Admin login works.
5. `npm run generate -- --count 3 --dry-run` works.
6. Real affiliate IDs replaced the placeholders.
7. Mailchimp env vars are set if you want real email capture.
8. AdSense env vars are set if you want ads live.
9. GitHub publishing works from the pipeline.
10. `NEXT_PUBLIC_SITE_URL` is set to the real domain in production.

## 15. Recommended order if you want the fastest path

If you want the shortest path to a fully working system, do it in this order:

1. `npm install`
2. Fill `.env.local`
3. Create Supabase tables
4. Start Ollama and pull `llama3`
5. Run `npm run dev`
6. Run `npm run build`
7. Run `npm run generate -- --count 3 --dry-run`
8. Replace affiliate placeholders
9. Add Mailchimp env vars
10. Add AdSense env vars
11. Configure GitHub + Vercel hook
12. Test `/pipeline`

That is the exact order that makes the least amount of rework.

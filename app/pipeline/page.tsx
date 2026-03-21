'use client';

import { useState, useEffect } from 'react';

type Stage = 'idle' | 'research' | 'seo' | 'content' | 'image' | 'publish' | 'done' | 'error';
type Log = { stage: string; status: 'ok' | 'error' | 'running'; message: string };

declare global {
  interface Window {
    puter: any;
  }
}

async function askPuter(prompt: string, model = 'gpt-5.4-nano'): Promise<string> {
  const response = await window.puter.ai.chat(prompt, { model });
  return typeof response === 'string' ? response : response?.message?.content?.[0]?.text || String(response);
}

async function generateImagePuter(prompt: string): Promise<HTMLImageElement | null> {
  try {
    const img = await window.puter.ai.txt2img(prompt, { model: 'gpt-image-1.5' });
    return img;
  } catch {
    return null;
  }
}

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

function fixEncoding(str: string): string {
  return str.replace(/â€™/g, "'").replace(/â€œ/g, '"').replace(/â€/g, '"').replace(/â/g, "'").replace(/\s{2,}/g, ' ').trim();
}

export default function PipelinePage() {
  const [topic, setTopic] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [logs, setLogs] = useState<Log[]>([]);
  const [result, setResult] = useState<{ url?: string; title?: string } | null>(null);
  const [puterReady, setPuterReady] = useState(false);

  useEffect(() => {
    // Load Puter.js from CDN
    if (window.puter) { setPuterReady(true); return; }
    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.onload = () => setPuterReady(true);
    document.head.appendChild(script);
  }, []);

  function addLog(s: string, status: 'ok' | 'error' | 'running', message: string) {
    setLogs(prev => {
      const existing = prev.findIndex(l => l.stage === s);
      const entry = { stage: s, status, message };
      if (existing >= 0) { const u = [...prev]; u[existing] = entry; return u; }
      return [...prev, entry];
    });
  }

  async function serverPost(url: string, body: any) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function runPipeline() {
    if (!topic.trim() || !puterReady) return;
    setLogs([]); setResult(null);

    try {
      // ── Step 1: Research (server - needs scraping) ────────
      setStage('research');
      addLog('Research', 'running', 'Finding article ideas...');
      const researchPrompt = `You are an SEO content strategist. Generate 5 specific blog article ideas for: "${topic}"

Each must target a real Google search query. Return ONLY valid JSON:
[{"topic":"title","reason":"why people search this","estimatedSearchVolume":"high|medium|low","contentAngle":"specific angle to rank"}]`;

      const researchRaw = await askPuter(researchPrompt, 'gpt-5.4-nano');
      const topics = JSON.parse(researchRaw.replace(/\`\`\`json|\`\`\`/g, '').trim());
      addLog('Research', 'ok', `Found ${topics.length} topics`);

      // ── Step 2: SEO (Puter.js — free GPT-5.4) ────────────
      setStage('seo');
      addLog('SEO', 'running', 'Generating keyword brief...');
      const bestTopic = topics[0];
      const seoPrompt = `You are an SEO expert. Generate a keyword brief for this blog topic.

Topic: "${bestTopic.topic}"
Content angle: "${bestTopic.contentAngle}"

Return ONLY valid JSON, no markdown:
{
  "primaryKeyword": "exact phrase people google (3-6 words)",
  "secondaryKeywords": ["kw1", "kw2", "kw3", "kw4", "kw5"],
  "titleTag": "max 60 chars, include keyword",
  "metaDescription": "max 155 chars, include keyword, add value",
  "h2Tags": ["heading 1", "heading 2", "heading 3", "heading 4", "heading 5", "heading 6"],
  "targetWordCount": 1800,
  "competition": "low"
}`;

      const seoRaw = await askPuter(seoPrompt, 'gpt-5.4-nano');
      const seoClean = seoRaw.replace(/```json|```/g, '').trim();
      const seo = JSON.parse(seoClean);
      const slug = toSlug(seo.primaryKeyword || bestTopic.topic);
      addLog('SEO', 'ok', `Keyword: "${seo.primaryKeyword}"`);

      // ── Step 3: Content (Puter.js — free GPT-5.4) ────────
      setStage('content');
      addLog('Content', 'running', 'Writing article with GPT-5.4...');
      const contentPrompt = `You are a professional blog writer. Write a complete blog article.

Title: ${seo.titleTag}
Primary keyword: "${seo.primaryKeyword}" (use 4-6 times naturally)
Secondary keywords: ${seo.secondaryKeywords.join(', ')}
Target word count: ${seo.targetWordCount} words
H2 headings to use:
${seo.h2Tags.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n')}

Rules:
- Friendly, conversational tone
- First person occasionally ("In my experience...", "I've found...")
- Use contractions (don't, you're, I'll)
- Each H2 section: 200-300 words
- Add specific examples and numbers
- Add [[PRODUCT_LINK:keyword]] where product fits (max 3)
- NEVER use: "In today's world", "It's important to note", "In conclusion", "Leverage", "Delve", "Game-changer"
- Use ## for H2, ### for H3, **bold** for key terms, > for tips

Output only the article body markdown. No frontmatter.`;

      const articleBody = fixEncoding(await askPuter(contentPrompt, 'gpt-5.4'));
      const wordCount = articleBody.replace(/[#*`_\[\]()>-]/g, '').split(/\s+/).filter(Boolean).length;
      const readTime = `${Math.ceil(wordCount / 200)} min read`;
      const date = new Date().toISOString().split('T')[0];
      const imagePath = `/images/${slug}.svg`;

      const mdx = `---
title: "${seo.titleTag.replace(/"/g, "'")}"
description: "${seo.metaDescription.replace(/"/g, "'")}"
date: "${date}"
slug: "${slug}"
keyword: "${seo.primaryKeyword}"
image: "${imagePath}"
author: "Editorial Team"
readTime: "${readTime}"
lastUpdated: "${date}"
tags: [${seo.secondaryKeywords.slice(0, 4).map((k: string) => `"${k.replace(/"/g, "'")}"`).join(', ')}]
---

${articleBody}`;

      addLog('Content', 'ok', `Written — ${wordCount.toLocaleString()} words`);

      // ── Step 4: Image (Puter.js — free GPT Image) ─────────
      setStage('image');
      addLog('Image', 'running', 'Generating image with GPT Image...');

      // Try Puter image generation first
      let imageSource = 'placeholder';
      try {
        const imgEl = await generateImagePuter(
          `Professional blog featured image for: "${seo.titleTag}". Clean editorial style, no text, photorealistic, wide format.`
        );
        if (imgEl?.src) {
          // Convert to base64 and send to server to save
          const canvas = document.createElement('canvas');
          canvas.width = 1200; canvas.height = 630;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(imgEl, 0, 0, 1200, 630);
            const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
            await serverPost('/api/agents/save-image', { slug, base64 });
            imageSource = 'gpt-image';
          }
        }
      } catch {
        // Fall back to server image agent
        const r4 = await serverPost('/api/agents/image', { title: seo.titleTag, slug });
        imageSource = r4.results?.[0]?.source || 'placeholder';
      }
      addLog('Image', 'ok', `Image ready (${imageSource})`);

      // ── Step 5: Save to Supabase + Publish ───────────────
      setStage('publish');
      addLog('Publish', 'running', 'Saving and publishing...');

      // Save content to Supabase via server
      await serverPost('/api/agents/save-content', {
        slug,
        title: seo.titleTag,
        keyword: seo.primaryKeyword,
        metaDescription: seo.metaDescription,
        mdxContent: mdx,
        wordCount,
        imagePath,
      });

      // Publish to GitHub
      const r5 = await serverPost('/api/agents/publisher', { slug });
      if (!r5.ok) throw new Error(r5.errors?.[0]?.error || 'Publish failed');
      addLog('Publish', 'ok', 'Live on Vercel!');

      setStage('done');
      setResult({ url: r5.published?.[0]?.url, title: seo.titleTag });

    } catch (err: any) {
      addLog(stage, 'error', err.message);
      setStage('error');
    }
  }

  const stageOrder = ['Research', 'SEO', 'Content', 'Image', 'Publish'];
  const isRunning = !['idle', 'done', 'error'].includes(stage);
  const statusIcon: Record<string, string> = { ok: '✓', error: '✗', running: '◌' };
  const statusColor: Record<string, string> = { ok: '#16a34a', error: '#dc2626', running: '#d97706' };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: "'Georgia', serif", padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase', marginBottom: 8 }}>
            AI Blog Pipeline
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            Publish an article
          </h1>
          <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
            {puterReady ? 'GPT-5.4 ready — type a topic and publish' : 'Loading AI engine...'}
          </p>
          {puterReady && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
              background: '#0d1f0d', border: '1px solid #1a3a1a', borderRadius: 20,
              padding: '4px 12px', fontSize: 12, color: '#4ade80'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              Free GPT-5.4 + GPT Image active
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: '2rem' }}>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isRunning && puterReady && runPipeline()}
            placeholder="e.g. how to invest $500 a month"
            disabled={isRunning || !puterReady}
            style={{
              flex: 1, padding: '12px 16px', background: '#1a1a1a',
              border: '1px solid #2a2a2a', borderRadius: 10, color: '#fff',
              fontSize: 15, outline: 'none', fontFamily: 'inherit'
            }}
          />
          <button
            onClick={runPipeline}
            disabled={isRunning || !topic.trim() || !puterReady}
            style={{
              padding: '12px 22px',
              background: isRunning || !puterReady ? '#1a1a1a' : '#fff',
              color: isRunning || !puterReady ? '#555' : '#000',
              border: '1px solid #2a2a2a', borderRadius: 10, fontSize: 14,
              fontWeight: 600, cursor: isRunning || !puterReady ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit'
            }}
          >
            {isRunning ? 'Running...' : 'Publish →'}
          </button>
        </div>

        {logs.length > 0 && (
          <div style={{
            background: '#141414', border: '1px solid #222',
            borderRadius: 12, overflow: 'hidden', marginBottom: '1.5rem'
          }}>
            {stageOrder.map((s, i) => {
              const log = logs.find(l => l.stage === s);
              return (
                <div key={s} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  borderBottom: i < stageOrder.length - 1 ? '1px solid #1e1e1e' : 'none',
                  opacity: !log ? 0.35 : 1, transition: 'opacity 0.3s'
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                    background: log ? statusColor[log.status] + '22' : '#1e1e1e',
                    color: log ? statusColor[log.status] : '#444', flexShrink: 0,
                    animation: log?.status === 'running' ? 'spin 1.5s linear infinite' : 'none'
                  }}>
                    {log ? statusIcon[log.status] : i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e5e5' }}>
                      {s} agent
                      {(s === 'SEO' || s === 'Content' || s === 'Image') && (
                        <span style={{
                          fontSize: 10, marginLeft: 8, color: '#4ade80',
                          background: '#0d1f0d', padding: '1px 6px', borderRadius: 10
                        }}>
                          GPT-5.4
                        </span>
                      )}
                    </div>
                    {log && <div style={{ fontSize: 12, color: statusColor[log.status], marginTop: 2 }}>{log.message}</div>}
                  </div>
                  {log?.status === 'running' && <div style={{ fontSize: 11, color: '#555' }}>processing...</div>}
                </div>
              );
            })}
          </div>
        )}

        {stage === 'done' && result && (
          <div style={{
            background: '#0d1f0d', border: '1px solid #1a3a1a',
            borderRadius: 12, padding: '20px', textAlign: 'center'
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#4ade80', marginBottom: 4 }}>Article published!</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>{result.title}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <a href={result.url} target="_blank" rel="noopener noreferrer"
                style={{
                  padding: '8px 18px', background: '#fff', color: '#000',
                  borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none'
                }}>
                View live →
              </a>
              <button onClick={() => { setStage('idle'); setLogs([]); setTopic(''); setResult(null); }}
                style={{
                  padding: '8px 18px', background: 'transparent', color: '#888',
                  border: '1px solid #333', borderRadius: 8, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit'
                }}>
                Publish another
              </button>
            </div>
          </div>
        )}

        {stage === 'error' && (
          <div style={{
            background: '#1f0d0d', border: '1px solid #3a1a1a', borderRadius: 12,
            padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: 13, color: '#f87171' }}>Pipeline failed — check the log above</span>
            <button onClick={() => { setStage('idle'); setLogs([]); }}
              style={{
                padding: '6px 14px', background: 'transparent', color: '#888',
                border: '1px solid #333', borderRadius: 6, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit'
              }}>
              Try again
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: '2rem' }}>
          <a href="/admin" style={{ fontSize: 12, color: '#444', textDecoration: 'none' }}>Content manager</a>
          <a href="/" style={{ fontSize: 12, color: '#444', textDecoration: 'none' }}>View blog</a>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #444; }
        input:focus { border-color: #444 !important; }
      `}</style>
    </div>
  );
}
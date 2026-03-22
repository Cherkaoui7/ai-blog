'use client';

import { useState } from 'react';

type Stage = 'idle' | 'research' | 'seo' | 'content' | 'image' | 'publish' | 'done' | 'error';
type Log = { stage: string; status: 'ok' | 'error' | 'running'; message: string };

export default function PipelinePage() {
  const [topic, setTopic]   = useState('');
  const [stage, setStage]   = useState<Stage>('idle');
  const [logs, setLogs]     = useState<Log[]>([]);
  const [result, setResult] = useState<{ url?: string; title?: string } | null>(null);

  function addLog(s: string, status: 'ok' | 'error' | 'running', message: string) {
    setLogs(prev => {
      const idx = prev.findIndex(l => l.stage === s);
      const entry = { stage: s, status, message };
      if (idx >= 0) { const u = [...prev]; u[idx] = entry; return u; }
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
    if (!topic.trim()) return;
    setLogs([]); setResult(null);

    try {
      // ── Step 1: Research ──────────────────────────────────
      setStage('research');
      addLog('Research', 'running', 'Finding article ideas...');
      const r1 = await serverPost('/api/agents/research', { niche: topic });
      if (!r1.ok) throw new Error(r1.error);
      addLog('Research', 'ok', `Found ${r1.topics.length} topics`);

      // ── Step 2: SEO ───────────────────────────────────────
      setStage('seo');
      addLog('SEO', 'running', 'Generating keyword brief...');
      const r2 = await serverPost('/api/agents/seo', { topics: r1.topics });
      if (!r2.ok || !r2.briefs?.length) throw new Error(r2.error || 'No SEO brief generated');
      const brief = r2.briefs[0];
      addLog('SEO', 'ok', `Keyword: "${brief.primaryKeyword}"`);

      // ── Step 3: Content ───────────────────────────────────
      setStage('content');
      addLog('Content', 'running', 'Writing article...');
      const r3 = await serverPost('/api/agents/content', { brief });
      if (!r3.ok || !r3.articles?.length) throw new Error(r3.errors?.[0]?.error || 'Content failed');
      const article = r3.articles[0];
      addLog('Content', 'ok', `Written — ${article.wordCount?.toLocaleString()} words`);

      // ── Step 4: Image ─────────────────────────────────────
      setStage('image');
      addLog('Image', 'running', 'Generating featured image...');
      const r4 = await serverPost('/api/agents/image', { title: article.title, slug: article.slug });
      if (!r4.ok) throw new Error(r4.error);
      addLog('Image', 'ok', `Image ready (${r4.results?.[0]?.source})`);

      // ── Step 5: Publish ───────────────────────────────────
      setStage('publish');
      addLog('Publish', 'running', 'Publishing to GitHub...');
      const r5 = await serverPost('/api/agents/publisher', { slug: article.slug });
      if (!r5.ok) throw new Error(r5.errors?.[0]?.error || 'Publish failed');
      addLog('Publish', 'ok', 'Live on Vercel!');

      setStage('done');
      setResult({ url: r5.published?.[0]?.url, title: article.title });

    } catch (err: any) {
      addLog(stage, 'error', err.message);
      setStage('error');
    }
  }

  const stageOrder  = ['Research', 'SEO', 'Content', 'Image', 'Publish'];
  const isRunning   = !['idle', 'done', 'error'].includes(stage);
  const statusIcon: Record<string, string>  = { ok: '✓', error: '✗', running: '◌' };
  const statusColor: Record<string, string> = { ok: '#16a34a', error: '#dc2626', running: '#d97706' };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: "'Georgia', serif", padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase', marginBottom: 8 }}>
            AI Blog Pipeline
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            Publish an article
          </h1>
          <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
            Type a topic and all 5 agents run automatically
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
            background: '#0d1f0d', border: '1px solid #1a3a1a', borderRadius: 20,
            padding: '4px 12px', fontSize: 12, color: '#4ade80' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            DeepSeek V3 + DALL-E active
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: '2rem' }}>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isRunning && runPipeline()}
            placeholder="e.g. how to invest $500 a month"
            disabled={isRunning}
            style={{ flex: 1, padding: '12px 16px', background: '#1a1a1a',
              border: '1px solid #2a2a2a', borderRadius: 10, color: '#fff',
              fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
          />
          <button
            onClick={runPipeline}
            disabled={isRunning || !topic.trim()}
            style={{ padding: '12px 22px',
              background: isRunning ? '#1a1a1a' : '#fff',
              color: isRunning ? '#555' : '#000',
              border: '1px solid #2a2a2a', borderRadius: 10, fontSize: 14,
              fontWeight: 600, cursor: isRunning ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
          >
            {isRunning ? 'Running...' : 'Publish →'}
          </button>
        </div>

        {logs.length > 0 && (
          <div style={{ background: '#141414', border: '1px solid #222',
            borderRadius: 12, overflow: 'hidden', marginBottom: '1.5rem' }}>
            {stageOrder.map((s, i) => {
              const log = logs.find(l => l.stage === s);
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  borderBottom: i < stageOrder.length - 1 ? '1px solid #1e1e1e' : 'none',
                  opacity: !log ? 0.35 : 1, transition: 'opacity 0.3s' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                    background: log ? statusColor[log.status] + '22' : '#1e1e1e',
                    color: log ? statusColor[log.status] : '#444', flexShrink: 0,
                    animation: log?.status === 'running' ? 'spin 1.5s linear infinite' : 'none' }}>
                    {log ? statusIcon[log.status] : i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e5e5' }}>
                      {s} agent
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
          <div style={{ background: '#0d1f0d', border: '1px solid #1a3a1a',
            borderRadius: 12, padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#4ade80', marginBottom: 4 }}>Article published!</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>{result.title}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <a href={result.url} target="_blank" rel="noopener noreferrer"
                style={{ padding: '8px 18px', background: '#fff', color: '#000',
                  borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                View live →
              </a>
              <button onClick={() => { setStage('idle'); setLogs([]); setTopic(''); setResult(null); }}
                style={{ padding: '8px 18px', background: 'transparent', color: '#888',
                  border: '1px solid #333', borderRadius: 8, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit' }}>
                Publish another
              </button>
            </div>
          </div>
        )}

        {stage === 'error' && (
          <div style={{ background: '#1f0d0d', border: '1px solid #3a1a1a', borderRadius: 12,
            padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#f87171' }}>Pipeline failed — check the log above</span>
            <button onClick={() => { setStage('idle'); setLogs([]); }}
              style={{ padding: '6px 14px', background: 'transparent', color: '#888',
                border: '1px solid #333', borderRadius: 6, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit' }}>
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
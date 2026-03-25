import Link from 'next/link';
import { getContentEngineStatus } from '@/lib/content-engine';

const STEPS = [
  { label: 'Start Ollama', command: 'ollama serve' },
  { label: 'Pull the model once', command: 'ollama pull llama3' },
  { label: 'Generate one post', command: 'npm run generate' },
  { label: 'Generate a batch', command: 'npm run generate -- --count 3' },
  { label: 'Push to GitHub when ready', command: 'git add posts && git commit -m "publish posts" && git push' },
];

function formatDate(value: string | null): string {
  if (!value) {
    return 'No runs logged yet';
  }

  return new Date(value).toLocaleString();
}

export default function PipelinePage() {
  const status = getContentEngineStatus();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f0f',
        color: '#fff',
        fontFamily: "'Georgia', serif",
        padding: '2rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: 980, margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#6b7280', textTransform: 'uppercase', marginBottom: 8 }}>
            Offline Content Engine
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Local Ollama workflow
          </h1>
          <p style={{ color: '#a3a3a3', fontSize: 15, marginTop: 10, maxWidth: 720, lineHeight: 1.6 }}>
            This project no longer runs a paid multi-agent pipeline. Content generation happens locally through{' '}
            <code>scripts/generate-post.ts</code>, then you optionally push the generated MDX files to GitHub.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: '2rem' }}>
          <div style={{ background: '#161616', border: '1px solid #262626', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 12, color: '#737373', textTransform: 'uppercase', marginBottom: 8 }}>Posts folder</div>
            <div style={{ fontSize: 15, fontWeight: 600, wordBreak: 'break-word' }}>{status.outputDir}</div>
          </div>
          <div style={{ background: '#161616', border: '1px solid #262626', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 12, color: '#737373', textTransform: 'uppercase', marginBottom: 8 }}>Local posts</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{status.postsAvailable}</div>
          </div>
          <div style={{ background: '#161616', border: '1px solid #262626', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 12, color: '#737373', textTransform: 'uppercase', marginBottom: 8 }}>Last generation</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{formatDate(status.lastGeneratedAt)}</div>
          </div>
          <div style={{ background: '#161616', border: '1px solid #262626', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 12, color: '#737373', textTransform: 'uppercase', marginBottom: 8 }}>GitHub publish</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{status.githubConfigured ? 'Configured' : 'Optional / not configured'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: 20 }}>
          <section style={{ background: '#141414', border: '1px solid #222', borderRadius: 16, padding: 22 }}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Run the generator</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {STEPS.map((step, index) => (
                <div
                  key={step.command}
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    padding: '12px 0',
                    borderBottom: index < STEPS.length - 1 ? '1px solid #1f1f1f' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#222',
                      color: '#d4d4d4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{step.label}</div>
                    <code
                      style={{
                        display: 'block',
                        background: '#0d0d0d',
                        border: '1px solid #252525',
                        borderRadius: 10,
                        padding: '10px 12px',
                        color: '#e5e5e5',
                        fontSize: 13,
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}
                    >
                      {step.command}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ display: 'grid', gap: 20 }}>
            <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 16, padding: 22 }}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>Recent runs</h2>
              {status.recentRuns.length === 0 ? (
                <p style={{ color: '#a3a3a3', marginBottom: 0 }}>
                  No generation logs yet. After the first run, this page will show the latest output written by the local script.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {status.recentRuns.map(run => (
                    <div key={`${run.slug}-${run.generatedAt}`} style={{ paddingBottom: 12, borderBottom: '1px solid #1f1f1f' }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{run.title}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        {run.slug} · {run.clusterKey || 'unclustered'} · {run.usedFallback ? 'fallback' : 'ollama'}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{formatDate(run.generatedAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 16, padding: 22 }}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>Topic usage</h2>
              {status.topicUsage.length === 0 ? (
                <p style={{ color: '#a3a3a3', marginBottom: 0 }}>
                  Topic usage tracking starts after the first non-dry-run generation.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {status.topicUsage.map(entry => (
                    <div key={entry.topic} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                      <span style={{ color: '#e5e5e5' }}>{entry.topic}</span>
                      <span style={{ color: '#888' }}>{entry.count} run{entry.count === 1 ? '' : 's'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: '2rem' }}>
          <Link href="/admin" style={{ fontSize: 12, color: '#71717a', textDecoration: 'none' }}>
            Content manager
          </Link>
          <Link href="/" style={{ fontSize: 12, color: '#71717a', textDecoration: 'none' }}>
            View blog
          </Link>
        </div>
      </div>
    </div>
  );
}

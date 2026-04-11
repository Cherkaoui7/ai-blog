'use client';

export function InsightBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="prose-insight"
      style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
        padding: '1rem 1.25rem',
        margin: '1.5rem 0',
        background: 'rgba(139, 124, 248, 0.06)',
        borderLeft: '4px solid var(--accent)',
        borderRadius: '0 10px 10px 0',
        fontSize: '0.9375rem',
        lineHeight: 1.7,
        color: 'var(--text)',
      }}
    >
      <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}>👉</span>
      <div>{children}</div>
    </div>
  );
}

export function WarningBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="prose-warning"
      style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
        padding: '1rem 1.25rem',
        margin: '1.5rem 0',
        background: 'rgba(245, 158, 11, 0.06)',
        borderLeft: '4px solid #f59e0b',
        borderRadius: '0 10px 10px 0',
        fontSize: '0.9375rem',
        lineHeight: 1.7,
        color: 'var(--text)',
      }}
    >
      <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
      <div>{children}</div>
    </div>
  );
}

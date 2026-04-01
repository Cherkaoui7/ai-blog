'use client';

import DOMPurify from 'isomorphic-dompurify';
import { useEffect, useState } from 'react';

type Post = {
  id: string;
  title: string;
  slug: string;
  keyword: string;
  word_count: number;
  status: string;
  created_at: string;
  mdx_content: string;
  meta_description: string;
};

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selected, setSelected] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'preview' | 'raw'>('preview');

  useEffect(() => {
    fetch('/api/admin/posts', {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then(async response => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load posts.');
        }

        return data;
      })
      .then(data => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => {
        setPosts([]);
        setLoading(false);
      });
  }, []);

  function mdxToHTML(mdx: string): string {
    const rendered = mdx
      .replace(/^---[\s\S]*?---\n/m, '')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`)
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|u|b|l|a|p])/gm, '')
      .replace(
        /\[\[PRODUCT_LINK:([^\]]+)\]\]/g,
        '<span style="background:#fef3c7;padding:2px 6px;border-radius:4px;font-size:12px;color:#92400e">LINK: $1</span>'
      );

    return DOMPurify.sanitize(rendered, {
      ALLOWED_TAGS: ['a', 'blockquote', 'em', 'h1', 'h2', 'h3', 'li', 'p', 'span', 'strong', 'ul'],
      ALLOWED_ATTR: ['href', 'rel', 'style', 'target'],
    });
  }

  const statusColor: Record<string, string> = {
    local: '#2563eb',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Georgia', serif", background: '#f9f6f1' }}>
      <div
        style={{
          width: selected ? '320px' : '100%',
          borderRight: '1px solid #e5e0d8',
          overflowY: 'auto',
          background: '#fff',
          flexShrink: 0,
          transition: 'width 0.2s',
        }}
      >
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #e5e0d8' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>
            Pulse Editorial
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>Content Manager</h1>
          <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
            {loading ? 'Loading...' : `${posts.length} local article${posts.length !== 1 ? 's' : ''} available`}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading posts...</div>
        ) : posts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>Write</div>
            <div>No posts yet. Run `npm run generate` to create your first article.</div>
          </div>
        ) : (
          <div>
            {posts.map(post => (
              <div
                key={post.id}
                onClick={() => setSelected(post)}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f0ebe3',
                  cursor: 'pointer',
                  background: selected?.id === post.id ? '#fdf8f0' : 'transparent',
                  borderLeft: selected?.id === post.id ? '3px solid #d97706' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={event => {
                  if (selected?.id !== post.id) {
                    event.currentTarget.style.background = '#fafaf8';
                  }
                }}
                onMouseLeave={event => {
                  if (selected?.id !== post.id) {
                    event.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 6 }}>
                  {post.title}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: statusColor[post.status] + '18',
                      color: statusColor[post.status],
                      fontWeight: 600,
                      letterSpacing: '0.03em',
                    }}
                  >
                    {post.status}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{post.word_count?.toLocaleString()} words</span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                    {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#d97706', marginTop: 4, fontFamily: 'monospace' }}>/ {post.slug}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              padding: '20px 32px',
              borderBottom: '1px solid #e5e0d8',
              background: '#fff',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <button
              onClick={() => setSelected(null)}
              style={{
                border: '1px solid #e5e0d8',
                background: 'transparent',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: 13,
                color: '#6b7280',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              Back
            </button>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 4px', fontSize: 18, color: '#1a1a1a', lineHeight: 1.3 }}>{selected.title}</h2>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>
                <span style={{ color: '#d97706', fontFamily: 'monospace' }}>/ {selected.slug}</span>
                <span style={{ margin: '0 8px' }}>·</span>
                <span>{selected.word_count?.toLocaleString()} words</span>
                {selected.keyword ? (
                  <>
                    <span style={{ margin: '0 8px' }}>·</span>
                    <span style={{ color: '#059669', fontWeight: 500 }}>{selected.keyword}</span>
                  </>
                ) : null}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => setView('preview')}
                style={{
                  border: '1px solid #e5e0d8',
                  borderRadius: 6,
                  padding: '5px 14px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: view === 'preview' ? 600 : 400,
                  background: view === 'preview' ? '#1a1a1a' : 'transparent',
                  color: view === 'preview' ? '#fff' : '#6b7280',
                }}
              >
                Preview
              </button>
              <button
                onClick={() => setView('raw')}
                style={{
                  border: '1px solid #e5e0d8',
                  borderRadius: 6,
                  padding: '5px 14px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: view === 'raw' ? 600 : 400,
                  background: view === 'raw' ? '#1a1a1a' : 'transparent',
                  color: view === 'raw' ? '#fff' : '#6b7280',
                }}
              >
                Raw MDX
              </button>
            </div>
          </div>

          {selected.meta_description && (
            <div
              style={{
                margin: '16px 32px 0',
                padding: '12px 16px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 8,
                fontSize: 13,
                color: '#92400e',
                lineHeight: 1.5,
              }}
            >
              <strong>Meta:</strong> {selected.meta_description}
            </div>
          )}

          <div style={{ padding: '24px 32px 48px', flex: 1 }}>
            {view === 'preview' ? (
              <div
                style={{
                  maxWidth: 720,
                  lineHeight: 1.8,
                  fontSize: 16,
                  color: '#1a1a1a',
                  fontFamily: "'Georgia', serif",
                }}
                dangerouslySetInnerHTML={{ __html: mdxToHTML(selected.mdx_content || '') }}
              />
            ) : (
              <pre
                style={{
                  background: '#1a1a1a',
                  color: '#e5e7eb',
                  padding: 24,
                  borderRadius: 10,
                  fontSize: 13,
                  lineHeight: 1.6,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {selected.mdx_content}
              </pre>
            )}
          </div>
        </div>
      )}

      <style>{`
        h1, h2, h3 { font-family: 'Georgia', serif; margin: 1.5em 0 0.5em; color: #1a1a1a; }
        h2 { font-size: 1.4em; border-bottom: 1px solid #e5e0d8; padding-bottom: 0.3em; }
        h3 { font-size: 1.15em; }
        blockquote { border-left: 3px solid #d97706; padding: 8px 16px; margin: 16px 0; background: #fffbeb; color: #92400e; border-radius: 0 6px 6px 0; }
        ul, ol { padding-left: 1.5em; margin: 12px 0; }
        li { margin: 6px 0; }
        p { margin: 1em 0; }
        strong { color: #111; }
        a { color: #b45309; text-decoration: underline; }
      `}</style>
    </div>
  );
}

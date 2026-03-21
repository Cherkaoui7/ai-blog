'use client';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export function FeaturedCard({ post }: { post: any }) {
  return (
    <Link href={`/blog/${post.slug}`} style={{ display: 'block', marginBottom: '3rem' }}>
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '2rem', transition: 'box-shadow .2s', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
        <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)',
            background: 'var(--accent-light)', padding: '2px 10px', borderRadius: 999 }}>Featured</span>
          {post.tags?.slice(0, 2).map((t: string) => (
            <span key={t} style={{ fontSize: 12, color: 'var(--muted)',
              border: '1px solid var(--border)', padding: '2px 10px', borderRadius: 999 }}>{t}</span>
          ))}
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em',
          marginBottom: '0.5rem', lineHeight: 1.3 }}>{post.title}</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.6 }}>{post.description}</p>
        <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: '1rem' }}>
          <span>{formatDate(post.date)}</span>
          <span>{post.readTime || '5 min read'}</span>
        </div>
      </div>
    </Link>
  );
}

export function PostCard({ post }: { post: any }) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '1.25rem', height: '100%',
          transition: 'border-color .2s, box-shadow .2s', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: '0.6rem', flexWrap: 'wrap' }}>
          {post.tags?.slice(0, 1).map((t: string) => (
            <span key={t} style={{ fontSize: 11, color: 'var(--accent)',
              background: 'var(--accent-light)', padding: '1px 8px', borderRadius: 999, fontWeight: 500 }}>{t}</span>
          ))}
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.35,
          marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>{post.title}</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55,
          marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.description}</p>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(post.date)}</div>
      </div>
    </Link>
  );
}
'use client';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

type PostCardPost = {
  author?: string;
  date: string;
  description: string;
  image?: string;
  niche?: string;
  readTime?: string;
  slug: string;
  tags?: string[];
  title: string;
};

/* ── Niche → gradient map for thumbnail placeholders ── */
const nicheGradients: Record<string, string> = {
  tech: 'linear-gradient(135deg, #1e1835 0%, #1a2332 100%)',
  finance: 'linear-gradient(135deg, #1a2318 0%, #1e1835 100%)',
  health: 'linear-gradient(135deg, #18232a 0%, #1e1835 100%)',
  education: 'linear-gradient(135deg, #231e18 0%, #1e1835 100%)',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('');
}

function getCategoryLabel(post: PostCardPost): string {
  if (post.niche) {
    return post.niche.charAt(0).toUpperCase() + post.niche.slice(1);
  }
  return post.tags?.[0] || 'Article';
}

/* ── Featured Card ── */
export function FeaturedCard({ post }: { post: PostCardPost }) {
  const categoryLabel = getCategoryLabel(post);
  const gradient = nicheGradients[post.niche || ''] || nicheGradients.tech;
  const hasImage = post.image && post.image.length > 0;

  return (
    <Link href={`/blog/${post.slug}`} style={{ display: 'block', marginBottom: '3rem', textDecoration: 'none' }}>
      <article
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
          cursor: 'pointer',
          display: 'grid',
          gridTemplateColumns: '1fr',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-hover, #3f3f46)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            position: 'relative',
            aspectRatio: '21 / 9',
            overflow: 'hidden',
            background: hasImage ? 'var(--surface-raised, #1f1f23)' : gradient,
          }}
        >
          {hasImage && (
            <img
              src={post.image}
              alt={post.title}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          {/* Gradient overlay for text readability on images */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(15,15,17,0.6) 0%, transparent 50%)',
              pointerEvents: 'none',
            }}
          />
          {/* Badges */}
          <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                background: 'rgba(30, 24, 53, 0.85)',
                backdropFilter: 'blur(6px)',
                padding: '4px 10px',
                borderRadius: 6,
              }}
            >
              Featured
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                background: 'rgba(30, 24, 53, 0.85)',
                backdropFilter: 'blur(6px)',
                padding: '4px 10px',
                borderRadius: 6,
              }}
            >
              {categoryLabel}
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem 2rem 2rem' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
              color: 'var(--text)',
              marginBottom: '0.5rem',
            }}
          >
            {post.title}
          </h2>
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'var(--text-secondary, #a1a1aa)',
              lineHeight: 1.6,
              marginBottom: '1.25rem',
              maxWidth: '65ch',
            }}
          >
            {post.description}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {post.author && post.author !== 'Pulse Editorial' && (
                <>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: 'var(--accent-subtle, #1e1835)',
                      color: 'var(--accent)',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(post.author)}
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-meta, #9191a0)' }}>
                    {post.author}
                  </span>
                </>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-meta, #9191a0)' }}>
              <span>{formatDate(post.date)}</span>
              <span>{post.readTime || '5 min read'}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ── Standard Post Card ── */
export function PostCard({ post }: { post: PostCardPost }) {
  const categoryLabel = getCategoryLabel(post);
  const gradient = nicheGradients[post.niche || ''] || nicheGradients.tech;
  const hasImage = post.image && post.image.length > 0;

  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
      <article
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-hover, #3f3f46)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            position: 'relative',
            aspectRatio: '16 / 9',
            overflow: 'hidden',
            background: hasImage ? 'var(--surface-raised, #1f1f23)' : gradient,
          }}
        >
          {hasImage && (
            <img
              src={post.image}
              alt={post.title}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            />
          )}
          {/* Niche icon overlay when no image */}
          {!hasImage && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                opacity: 0.15,
                color: 'var(--accent)',
              }}
            >
              {post.niche === 'tech' && '⟨/⟩'}
              {post.niche === 'finance' && '◈'}
              {post.niche === 'health' && '♥'}
              {post.niche === 'education' && '◎'}
              {!post.niche && '◇'}
            </div>
          )}
          {/* Category badge */}
          <span
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              background: 'rgba(30, 24, 53, 0.85)',
              backdropFilter: 'blur(6px)',
              padding: '4px 10px',
              borderRadius: 6,
            }}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              lineHeight: 1.35,
              letterSpacing: '-0.01em',
              color: 'var(--text)',
              marginBottom: '0.5rem',
            }}
          >
            {post.title}
          </h3>
          <p
            style={{
              fontSize: '0.875rem',
              fontWeight: 400,
              lineHeight: 1.55,
              color: 'var(--text-secondary, #a1a1aa)',
              marginBottom: '1rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flex: 1,
            }}
          >
            {post.description}
          </p>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {post.author && post.author !== 'Pulse Editorial' && (
                <>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--accent-subtle, #1e1835)',
                      color: 'var(--accent)',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(post.author)}
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-meta, #9191a0)' }}>
                    {post.author}
                  </span>
                </>
              )}
            </div>
            <time style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-meta, #9191a0)' }}>
              {formatDate(post.date)}
            </time>
          </div>
        </div>
      </article>
    </Link>
  );
}

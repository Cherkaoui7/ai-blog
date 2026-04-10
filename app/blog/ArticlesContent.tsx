'use client';

import { useState, useMemo } from 'react';
import { PostCard } from '../components/PostCard';

type FilterablePost = {
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

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'tech', label: 'Technology' },
  { key: 'finance', label: 'Finance' },
  { key: 'health', label: 'Health' },
  { key: 'education', label: 'Education' },
];

export function ArticlesContent({ posts }: { posts: FilterablePost[] }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'all') return posts;
    return posts.filter((post) => post.niche === activeCategory);
  }, [posts, activeCategory]);

  return (
    <>
      {/* Sticky Filter Bar */}
      <div
        style={{
          position: 'sticky',
          top: 60, // below the 60px header
          zIndex: 40,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          borderRadius: 12,
          marginBottom: '2rem',
          padding: '0.75rem 1rem',
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          const count =
            cat.key === 'all'
              ? posts.length
              : posts.filter((p) => p.niche === cat.key).length;

          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                padding: '6px 16px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary, #a1a1aa)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--surface-raised, #1f1f23)';
                  e.currentTarget.style.color = 'var(--text)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary, #a1a1aa)';
                }
              }}
            >
              {cat.label}
              <span
                style={{
                  marginLeft: 6,
                  fontSize: '0.6875rem',
                  opacity: 0.7,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p
        style={{
          fontSize: '0.8125rem',
          color: 'var(--text-meta, #9191a0)',
          marginBottom: '1.25rem',
        }}
      >
        {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
        {activeCategory !== 'all' && (
          <> in <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
            {CATEGORIES.find((c) => c.key === activeCategory)?.label}
          </span></>
        )}
      </p>

      {/* 2-column grid for browse feel */}
      {filteredPosts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 0',
            color: 'var(--text-meta, #9191a0)',
          }}
        >
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
            No articles in this category yet.
          </p>
          <button
            onClick={() => setActiveCategory('all')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: 0,
            }}
          >
            View all articles →
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </>
  );
}

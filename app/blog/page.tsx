import { getAllPosts } from '@/lib/posts';
import type { Metadata } from 'next';
import { AdSlot } from '../components/AdSlot';
import { ArticlesContent } from './ArticlesContent';

export async function generateMetadata(): Promise<Metadata> {
  const posts = await getAllPosts();
  const leadPost = posts[0];
  const description =
    leadPost?.description ||
    'Browse all articles from Pulse Editorial with practical insights across tech, finance, health, and education.';

  return {
    title: 'Articles',
    description,
    keywords: posts.flatMap(post => post.tags).slice(0, 8),
    alternates: { canonical: '/blog' },
    openGraph: {
      title: 'Articles',
      description,
      type: 'website',
      url: '/blog',
    },
  };
}

export default async function BlogPage() {
  const posts = await getAllPosts();
  const listingAdSlot = process.env.NEXT_PUBLIC_ADSENSE_LIST_SLOT;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--text)',
            lineHeight: 1.2,
          }}>
            All Articles
          </h1>
          <span style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--accent)',
            background: 'var(--accent-subtle, #1e1835)',
            padding: '2px 10px',
            borderRadius: 999,
          }}>
            {posts.length}
          </span>
        </div>
        <p style={{
          color: 'var(--text-secondary, #a1a1aa)',
          fontSize: '1rem',
          lineHeight: 1.6,
        }}>
          Expert-written insights across tech, finance, health and education.
        </p>
      </div>

      {listingAdSlot && (
        <div style={{ marginBottom: '2rem' }}>
          <AdSlot slot={listingAdSlot} format="auto" />
        </div>
      )}

      {posts.length === 0 ? (
        <p style={{
          color: 'var(--text-meta, #9191a0)',
          textAlign: 'center',
          padding: '3rem 0',
        }}>
          No articles published yet. Check back soon!
        </p>
      ) : (
        <ArticlesContent posts={posts} />
      )}
    </div>
  );
}

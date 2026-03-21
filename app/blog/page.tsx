import { getAllPosts } from '@/lib/posts';
import { PostCard } from '../components/PostCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Browse all articles from Pulse Editorial — expert insights across tech, finance, health and education.',
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
        All Articles
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
        Expert-written insights across tech, finance, health and education.
      </p>

      {posts.length === 0 ? (
        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '3rem 0' }}>
          No articles published yet. Check back soon!
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {posts.map(post => <PostCard key={post.slug} post={post} />)}
        </div>
      )}
    </div>
  );
}

import { getAllPosts } from '@/lib/posts';
import { FeaturedCard, PostCard } from './components/PostCard';

export default async function HomePage() {
  const posts = await getAllPosts();
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>

      {/* Hero */}
      <div style={{ marginBottom: '3rem', maxWidth: 640 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--accent-light)', color: 'var(--accent)',
          padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 500, marginBottom: '1rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          Daily AI-generated articles
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
          Fresh insights,<br />every single day.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1.7 }}>
          Powered by 5 AI agents that research, write, and publish articles automatically.
        </p>
      </div>

      {/* Featured post */}
      {featured && <FeaturedCard post={featured} />}

      {/* Post grid */}
      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: '1.25rem',
        color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Latest Articles
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {rest.map(post => <PostCard key={post.slug} post={post} />)}
      </div>
    </div>
  );
}
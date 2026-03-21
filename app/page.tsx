import { getAllPosts } from '@/lib/posts';
import { FeaturedCard, PostCard } from './components/PostCard';
import { authors } from '@/lib/authors';

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
          Daily expert analysis
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
          Fresh insights,<br />every single day.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1.7 }}>
          Written by specialists across tech, finance, health and education.
        </p>
      </div>

      {/* Trust Bar */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '3rem',
        padding: '1rem 1.5rem', background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, fontSize: 14, color: 'var(--muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>👥</span> 10,000+ readers
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>📝</span> 500+ articles
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>✅</span> Expert-verified content
        </span>
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

      {/* Meet Our Experts */}
      <section style={{ marginTop: '4rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Meet Our Experts
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: '1.5rem' }}>
          Our team brings decades of real-world experience across every topic we cover.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {authors.map(author => (
            <div key={author.name} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '1.25rem', textAlign: 'center',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 0.75rem',
                background: 'var(--accent-light)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--accent)',
              }}>
                {author.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 2 }}>{author.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, marginBottom: '0.5rem' }}>{author.title}</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{author.bio}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
import { getAllPosts } from '@/lib/posts';
import { FeaturedCard, PostCard } from './components/PostCard';
import { authors } from '@/lib/authors';

export default async function HomePage() {
  const posts = await getAllPosts();
  const featured = posts[0];
  const rest = posts.slice(1, 7); // Show 6 latest on home, not all

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>

      {/* Hero */}
      <div style={{ marginBottom: '3.5rem', maxWidth: 660 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--accent-subtle, #1e1835)', color: 'var(--accent)',
          padding: '5px 14px', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 600,
          letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          Daily expert analysis
        </div>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          marginBottom: '1rem',
          color: 'var(--text)',
        }}>
          Fresh insights,<br />every single day.
        </h1>
        <p style={{
          color: 'var(--text-secondary, #a1a1aa)',
          fontSize: '1.125rem',
          lineHeight: 1.7,
        }}>
          Written by specialists across tech, finance, health and education.
        </p>
      </div>

      {/* Trust Bar */}
      <div style={{
        display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '3rem',
        padding: '1rem 1.5rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        fontSize: '0.875rem',
        color: 'var(--text-secondary, #a1a1aa)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>👥</span> 10,000+ readers
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📝</span> 500+ articles
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>✅</span> Expert-verified content
        </span>
      </div>

      {/* Featured post */}
      {featured && <FeaturedCard post={featured} />}

      {/* Post grid */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <p style={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: 'var(--text-meta, #9191a0)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          Latest Articles
        </p>
        <a href="/blog" style={{
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'var(--accent)',
          transition: 'opacity 0.15s',
        }}>
          View all →
        </a>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.25rem',
      }}>
        {rest.map(post => <PostCard key={post.slug} post={post} />)}
      </div>

      {/* Meet Our Experts */}
      <section style={{ marginTop: '5rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginBottom: '0.5rem',
          color: 'var(--text)',
        }}>
          Meet Our Experts
        </h2>
        <p style={{
          color: 'var(--text-secondary, #a1a1aa)',
          fontSize: '0.9375rem',
          marginBottom: '1.5rem',
          lineHeight: 1.6,
        }}>
          Our team brings decades of real-world experience across every topic we cover.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.5rem',
        }}>
          {authors.map(author => (
            <div key={author.name} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '2.5rem 1.75rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'border-color 0.2s ease, transform 0.2s ease',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.25rem',
                background: 'var(--accent-subtle, #1e1835)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 700, color: 'var(--accent)',
                letterSpacing: '0.02em',
              }}>
                {author.name.replace('Dr. ', 'D').split(' ').map(n => n[0]).join('').substring(0, 3)}
              </div>
              <h3 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: 8, color: 'var(--text)' }}>
                {author.name}
              </h3>
              <p style={{
                fontSize: '0.8125rem',
                color: 'var(--accent)',
                fontWeight: 600,
                marginBottom: '1.25rem',
                letterSpacing: '0.01em',
                lineHeight: 1.5,
              }}>
                {author.title}
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary, #a1a1aa)',
                lineHeight: 1.7,
              }}>
                {author.bio}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
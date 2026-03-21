import { getPostBySlug, getAllPosts } from '@/lib/posts';
import { formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { authors } from '@/lib/authors';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: { title: post.title, description: post.description, type: 'article' },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // Find the matching author profile, or fall back to a default
  const author = authors.find(a => a.name === post.author) || null;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem',
      display: 'grid', gridTemplateColumns: '1fr min(680px, 100%) 1fr', gap: '0 2rem' }}>
      <article style={{ gridColumn: 2 }}>
        <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:6,
          fontSize:13, color:'var(--muted)', marginBottom:'2rem', transition:'color .15s' }}>
          ← Back to articles
        </Link>
        <div style={{ display:'flex', gap:8, marginBottom:'1rem', flexWrap:'wrap' }}>
          {post.tags?.map((t:string) => (
            <span key={t} style={{ fontSize:12, color:'var(--accent)',
              background:'var(--accent-light)', padding:'3px 10px', borderRadius:999, fontWeight:500 }}>{t}</span>
          ))}
          <span style={{ fontSize:11, fontWeight:500, color:'#16a34a',
            background:'#f0fdf4', padding:'3px 10px', borderRadius:999 }}>Fact-checked by our editorial team ✓</span>
        </div>
        <h1 style={{ fontSize:'2.25rem', fontWeight:800, lineHeight:1.2,
          letterSpacing:'-0.03em', marginBottom:'0.5rem' }}>{post.title}</h1>

        {/* Author byline */}
        {author && (
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1.5rem' }}>
            <div style={{
              width:36, height:36, borderRadius:'50%', background:'var(--accent-light)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, fontWeight:700, color:'var(--accent)', flexShrink:0,
            }}>
              {author.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <span style={{ fontWeight:600, fontSize:14 }}>Written by {author.name}</span>
              <span style={{ display:'block', fontSize:12, color:'var(--muted)' }}>{author.title}</span>
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:'1.5rem', fontSize:13, color:'var(--muted)',
          marginBottom:'2rem', paddingBottom:'2rem', borderBottom:'1px solid var(--border)' }}>
          <span>{formatDate(post.date)}</span>
          <span>{post.readTime || '5 min read'}</span>
          {post.keyword && <span>#{post.keyword}</span>}
        </div>
        {post.image && (
          <img src={post.image} alt={post.title}
            style={{ width:'100%', borderRadius:16, marginBottom:'2rem', aspectRatio:'16/9', objectFit:'cover' }}/>
        )}
        <div className="prose">
          <MDXRemote source={post.content} />
        </div>

        {/* CTA */}
        <div style={{ marginTop:'3rem', padding:'1.5rem', background:'var(--accent-light)',
          borderRadius:12, border:'1px solid var(--accent)', textAlign:'center' }}>
          <p style={{ fontWeight:600, marginBottom:'0.5rem' }}>Enjoyed this article?</p>
          <p style={{ fontSize:14, color:'var(--muted)' }}>New articles published daily by our editorial team.</p>
        </div>

        {/* About the Author */}
        {author && (
          <div style={{ marginTop:'2.5rem', padding:'1.5rem', background:'var(--surface)',
            border:'1px solid var(--border)', borderRadius:12 }}>
            <h3 style={{ fontSize:'1rem', fontWeight:700, marginBottom:'0.75rem' }}>About the Author</h3>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <div style={{
                width:48, height:48, borderRadius:'50%', background:'var(--accent-light)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:18, fontWeight:700, color:'var(--accent)', flexShrink:0,
              }}>
                {author.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p style={{ fontWeight:600 }}>{author.name}</p>
                <p style={{ fontSize:13, color:'var(--accent)', marginBottom:'0.5rem' }}>{author.title}</p>
                <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.6 }}>{author.bio}</p>
                <div style={{ display:'flex', gap:'1rem', marginTop:'0.75rem', fontSize:13, color:'var(--muted)' }}>
                  <span>{author.twitter}</span>
                  <span>LinkedIn: {author.linkedin}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
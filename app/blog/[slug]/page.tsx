import { getPostBySlug, getAllPosts } from '@/lib/posts';
import { formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';

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
        </div>
        <h1 style={{ fontSize:'2.25rem', fontWeight:800, lineHeight:1.2,
          letterSpacing:'-0.03em', marginBottom:'1rem' }}>{post.title}</h1>
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
        <div style={{ marginTop:'3rem', padding:'1.5rem', background:'var(--accent-light)',
          borderRadius:12, border:'1px solid var(--accent)', textAlign:'center' }}>
          <p style={{ fontWeight:600, marginBottom:'0.5rem' }}>Enjoyed this article?</p>
          <p style={{ fontSize:14, color:'var(--muted)' }}>New articles published daily by our AI agents.</p>
        </div>
      </article>
    </div>
  );
}
import { getAllPosts, getPostBySlug } from '@/lib/posts';
import { formatDate } from '@/lib/utils';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { authors } from '@/lib/authors';
import { AdSlot } from '@/app/components/AdSlot';
import { EmailCapture } from '@/components/EmailCapture';
import { ReadingProgress, TLDRCard, ShareBar } from '@/app/components/ArticleInteractive';
import { FAQAccordion, FAQItem } from '@/app/components/FAQAccordion';
import { InsightBlock, WarningBlock } from '@/app/components/HighlightBlocks';

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map(post => ({ slug: post.slug }));
}

export async function generateMetadata(
  { params }: PageProps<'/blog/[slug]'>
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: `/blog/${slug}`,
      publishedTime: post.date,
      modifiedTime: post.lastUpdated,
      tags: post.tags,
      images: post.image ? [post.image] : undefined,
    },
    twitter: {
      card: post.image ? 'summary_large_image' : 'summary',
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
  };
}

/* ── Niche → gradient map for related card thumbnails ── */
const nicheGradients: Record<string, string> = {
  tech: 'linear-gradient(135deg, #1e1835 0%, #1a2332 100%)',
  finance: 'linear-gradient(135deg, #1a2318 0%, #1e1835 100%)',
  health: 'linear-gradient(135deg, #18232a 0%, #1e1835 100%)',
  education: 'linear-gradient(135deg, #231e18 0%, #1e1835 100%)',
};

export default async function PostPage({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const author = authors.find(entry => entry.name === post.author)
    || authors.find(entry => entry.niche === post.niche)
    || null;
  const nicheLabel = post.niche
    ? post.niche.charAt(0).toUpperCase() + post.niche.slice(1)
    : post.tags[0] || 'Article';
  const articleTopAdSlot = process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_TOP_SLOT;
  const articleBottomAdSlot =
    process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_BOTTOM_SLOT || articleTopAdSlot;

  return (
    <>
      {/* Reading Progress Bar */}
      <ReadingProgress />

      {/* Share Bar */}
      <ShareBar title={post.title} slug={post.slug} />

      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '2rem 1.5rem',
        display: 'grid',
        gridTemplateColumns: '1fr min(680px, 100%) 1fr',
        gap: '0 2rem',
      }}>
        <article style={{ gridColumn: 2 }}>

          {/* ── Back link ── */}
          <Link
            href="/blog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.8125rem',
              color: 'var(--text-meta)',
              marginBottom: '2rem',
              transition: 'color .15s',
            }}
          >
            ← Back to articles
          </Link>

          {/* ── Tags ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                background: 'var(--accent-subtle)',
                padding: '4px 10px',
                borderRadius: 6,
              }}
            >
              {nicheLabel}
            </span>
            {post.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-meta)',
                  border: '1px solid var(--border)',
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* ── Title (single H1 — no duplicate) ── */}
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
            color: 'var(--text)',
          }}>
            {post.title}
          </h1>

          {/* ── Byline: Author + meta ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--border)',
            flexWrap: 'wrap',
          }}>
            {author && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--accent-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    flexShrink: 0,
                  }}
                >
                  {author.name.split(' ').map(name => name[0]).join('')}
                </div>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>
                    {author.name}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 500 }}>
                    {author.title}
                  </span>
                </div>
              </div>
            )}
            <div style={{
              display: 'flex',
              gap: '1rem',
              fontSize: '0.8125rem',
              color: 'var(--text-meta)',
              marginLeft: author ? 'auto' : 0,
            }}>
              <span>{formatDate(post.date)}</span>
              <span>·</span>
              <span>{post.readTime}</span>
              <span>·</span>
              <span>{post.wordCount.toLocaleString()} words</span>
            </div>
          </div>

          {/* ── Hero image ── */}
          {post.image && (
            <img
              src={post.image}
              alt={post.title}
              style={{
                width: '100%',
                borderRadius: 16,
                marginBottom: '2rem',
                aspectRatio: '16/9',
                objectFit: 'cover',
              }}
            />
          )}

          {/* ── Hero quote (visual hook above the fold) ── */}
          {post.heroQuote && (
            <div className="hero-quote">
              <p className="hero-quote__text">{post.heroQuote}</p>
            </div>
          )}

          {/* ── TL;DR card (key takeaways moved to top) ── */}
          <TLDRCard takeaways={post.keyTakeaways} />

          {/* ── What you'll learn box ── */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '1.25rem 1.5rem',
            marginBottom: '2.5rem',
          }}>
            <p style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-meta)',
              marginBottom: '0.75rem',
            }}>
              What you&apos;ll learn
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {(post.keyTakeaways.length > 0
                ? post.keyTakeaways.slice(0, 3)
                : [post.description]
              ).map((item, i) => (
                <li key={i} style={{
                  position: 'relative',
                  paddingLeft: '1.25rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    color: 'var(--accent)',
                    fontWeight: 600,
                  }}>
                    →
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {articleTopAdSlot && (
            <div style={{ marginBottom: '2rem' }}>
              <AdSlot slot={articleTopAdSlot} format="fluid" />
            </div>
          )}

          {/* ── Article body ── */}
          <div className="prose">
            <MDXRemote
              source={post.content}
              components={{ FAQAccordion, FAQItem, InsightBlock, WarningBlock }}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [rehypeHighlight]
                },
              }}
            />
          </div>

          {articleBottomAdSlot && (
            <div style={{ marginTop: '2rem' }}>
              <AdSlot slot={articleBottomAdSlot} format="fluid" />
            </div>
          )}

          {/* ── Affiliate disclosure (moved out of body) ── */}
          <p className="affiliate-disclosure">
            Some links in this article may be affiliate links. This does not affect our editorial independence.
          </p>

          {/* ── Email capture ── */}
          <div style={{ marginTop: '2.5rem' }}>
            <EmailCapture source={post.slug} />
          </div>

          {/* ── About the Author ── */}
          {author && (
            <div
              style={{
                marginTop: '2.5rem',
                padding: '1.5rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
              }}
            >
              <h3 style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-meta)',
                marginBottom: '1rem',
              }}>
                About the Author
              </h3>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'var(--accent-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    flexShrink: 0,
                  }}
                >
                  {author.name.split(' ').map(name => name[0]).join('')}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '1rem' }}>{author.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.5rem' }}>{author.title}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{author.bio}</p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-meta)' }}>
                    <span>{author.twitter}</span>
                    <span>LinkedIn: {author.linkedin}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Keep Reading (redesigned related articles) ── */}
          {post.relatedPosts.length > 0 && (
            <section style={{ marginTop: '3rem' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: '1.25rem',
                color: 'var(--text)',
              }}>
                Keep reading
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
              }}>
                {post.relatedPosts.map(related => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="related-card"
                  >
                    <div
                      className="related-card__thumb"
                      style={{
                        background: nicheGradients[post.niche] || nicheGradients.tech,
                      }}
                    >
                      <span className="related-card__badge">Article</span>
                    </div>
                    <div className="related-card__body">
                      <p className="related-card__title">{related.title}</p>
                      <p className="related-card__excerpt">{related.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </article>
      </div>
    </>
  );
}

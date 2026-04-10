import { authors } from '@/lib/authors';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Meet the team behind Pulse Editorial — specialists in tech, finance, health and education.',
};

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>

      {/* Mission — full width banner */}
      <div style={{ marginBottom: '3rem', maxWidth: 720 }}>
        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.025em',
          marginBottom: '1.25rem',
          color: 'var(--text)',
        }}>
          About Pulse Editorial
        </h1>
        <p style={{
          fontSize: '1.0625rem',
          color: 'var(--text-secondary, #a1a1aa)',
          lineHeight: 1.7,
          marginBottom: '1rem',
        }}>
          We started Pulse Editorial with a simple goal: give readers clear, trustworthy
          answers to the questions that matter — without the jargon, fluff, or clickbait
          that clutters most of the internet.
        </p>
        <p style={{
          fontSize: '1.0625rem',
          color: 'var(--text-secondary, #a1a1aa)',
          lineHeight: 1.7,
        }}>
          Our team of specialists covers four pillars — technology, personal finance,
          health &amp; fitness, and education — because we believe practical knowledge in
          these areas can genuinely improve your life. Every article is researched,
          written, and fact-checked by someone who actually works in the field.
        </p>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '3rem' }} />

      {/* Two-column layout for Team + Process (≥1024px) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
          gap: '3rem',
          alignItems: 'start',
        }}
      >
        {/* Left column: Team */}
        <section>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: '1.5rem',
            color: 'var(--text)',
          }}>
            Meet Our Team
          </h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {authors.map(author => (
              <div key={author.name} style={{
                display: 'flex', gap: 16, padding: '1.25rem',
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
                transition: 'border-color 0.2s ease',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent-subtle, #1e1835)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: 'var(--accent)',
                }}>
                  {author.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{
                    fontWeight: 600,
                    fontSize: '1rem',
                    marginBottom: 2,
                    color: 'var(--text)',
                  }}>
                    {author.name}
                  </h3>
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    letterSpacing: '0.01em',
                  }}>
                    {author.title}
                  </p>
                  <p style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary, #a1a1aa)',
                    lineHeight: 1.6,
                    marginBottom: '0.5rem',
                  }}>
                    {author.bio}
                  </p>
                  <div style={{
                    display: 'flex', gap: '1rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-meta, #9191a0)',
                  }}>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right column: Editorial Process */}
        <section>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: '1rem',
            color: 'var(--text)',
          }}>
            Our Editorial Process
          </h2>
          <p style={{
            color: 'var(--text-secondary, #a1a1aa)',
            lineHeight: 1.7,
            marginBottom: '1.5rem',
            fontSize: '0.9375rem',
          }}>
            We hold our content to a high standard. Here is how every article goes from
            idea to publication:
          </p>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {[
              { step: '1', title: 'Research', desc: 'We monitor trends, reader questions, and industry developments to find topics that genuinely matter.' },
              { step: '2', title: 'Writing', desc: 'A specialist with hands-on experience in the field drafts the article, drawing on real-world knowledge and data.' },
              { step: '3', title: 'Fact-Checking', desc: 'Every claim, statistic, and recommendation is verified against primary sources before publication.' },
              { step: '4', title: 'Publication & Updates', desc: 'Articles are published and periodically reviewed to ensure they stay accurate as things change.' },
            ].map(item => (
              <div key={item.step} style={{
                display: 'flex', gap: 14, padding: '1.25rem',
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
                transition: 'border-color 0.2s ease',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.875rem',
                }}>
                  {item.step}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontWeight: 600, marginBottom: 2, color: 'var(--text)', fontSize: '1rem' }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary, #a1a1aa)',
                    lineHeight: 1.6,
                  }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats summary */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            background: 'var(--accent-subtle, #1e1835)',
            border: '1px solid var(--border)',
            borderRadius: 14,
          }}>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--accent)',
              fontWeight: 600,
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              By the numbers
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
            }}>
              {[
                { value: '4', label: 'Expert writers' },
                { value: '500+', label: 'Articles published' },
                { value: '4', label: 'Topic pillars' },
                { value: '10K+', label: 'Monthly readers' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: 2,
                  }}>
                    {stat.value}
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-meta, #9191a0)',
                  }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

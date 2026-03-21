import { authors } from '@/lib/authors';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Meet the team behind Pulse Editorial — specialists in tech, finance, health and education.',
};

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem' }}>

      {/* Mission */}
      <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2,
        letterSpacing: '-0.03em', marginBottom: '1rem' }}>
        About Pulse Editorial
      </h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '1rem' }}>
        We started Pulse Editorial with a simple goal: give readers clear, trustworthy
        answers to the questions that matter — without the jargon, fluff, or clickbait
        that clutters most of the internet.
      </p>
      <p style={{ fontSize: '1.1rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
        Our team of specialists covers four pillars — technology, personal finance,
        health &amp; fitness, and education — because we believe practical knowledge in
        these areas can genuinely improve your life. Every article is researched,
        written, and fact-checked by someone who actually works in the field.
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '2.5rem' }} />

      {/* Team */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
        Meet Our Team
      </h2>
      <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '3rem' }}>
        {authors.map(author => (
          <div key={author.name} style={{
            display: 'flex', gap: 16, padding: '1.5rem',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent-light)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--accent)',
            }}>
              {author.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 2 }}>{author.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, marginBottom: '0.5rem' }}>{author.title}</p>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: '0.5rem' }}>{author.bio}</p>
              <div style={{ display: 'flex', gap: '1rem', fontSize: 13, color: 'var(--muted)' }}>
                <span>{author.twitter}</span>
                <span>LinkedIn: {author.linkedin}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '2.5rem' }} />

      {/* Editorial Process */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
        Our Editorial Process
      </h2>
      <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
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
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent)', color: '#fff', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14,
            }}>
              {item.step}
            </div>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: 2 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

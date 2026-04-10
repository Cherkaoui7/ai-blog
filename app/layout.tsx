import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import Script from 'next/script';
import './globals.css';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: { default: 'Pulse Editorial', template: '%s | Pulse Editorial' },
  description: 'Expert insights across tech, finance, health and education',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: { type: 'website', locale: 'en_US' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  return (
    <html lang="en" suppressHydrationWarning className={cn('font-sans', geist.variable)}>
      <body>
        <header
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              padding: '0 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 60,
            }}
          >
            <Link href="/" style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--text)' }}>
              <span style={{ color: 'var(--accent)' }}>Pulse</span> Editorial
            </Link>
            <nav style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary, #a1a1aa)' }}>
              <Link href="/" style={{ transition: 'color .15s' }}>
                Home
              </Link>
              <Link href="/blog" style={{ transition: 'color .15s' }}>
                Articles
              </Link>
              <Link href="/about" style={{ transition: 'color .15s' }}>
                About
              </Link>
            </nav>
          </div>
        </header>

        <main style={{ minHeight: 'calc(100vh - 120px)' }}>{children}</main>

        <footer style={{ borderTop: '1px solid var(--border)', marginTop: '4rem' }}>
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              padding: '2rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              fontSize: '0.8125rem',
              color: 'var(--text-meta, #9191a0)',
            }}
          >
            <span>&copy; {new Date().getFullYear()} Pulse Editorial. Written by our team of specialists.</span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/sitemap.xml">Sitemap</Link>
              <Link href="/privacy">Privacy</Link>
            </div>
          </div>
        </footer>

        {adsenseClient && (
          <Script
            id="google-adsense"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}

        <Analytics />
      </body>
    </html>
  );
}

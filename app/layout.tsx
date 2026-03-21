import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: { default: 'AI Blog', template: '%s | AI Blog' },
  description: 'Daily articles powered by AI agents',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: { type: 'website', locale: 'en_US' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body>
        <header style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
              <span style={{ color: 'var(--accent)' }}>AI</span>Blog
            </Link>
            <nav style={{ display: 'flex', gap: '1.5rem', fontSize: 14, color: 'var(--muted)' }}>
              <Link href="/" style={{ transition: 'color .15s' }}>Home</Link>
              <Link href="/blog" style={{ transition: 'color .15s' }}>Articles</Link>
              <Link href="/about" style={{ transition: 'color .15s' }}>About</Link>
            </nav>
          </div>
        </header>

        <main style={{ minHeight: 'calc(100vh - 120px)' }}>
          {children}
        </main>

        <footer style={{ borderTop: '1px solid var(--border)', marginTop: '4rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '1rem', fontSize: 13, color: 'var(--muted)' }}>
            <span>© {new Date().getFullYear()} AiBlog. Powered by AI agents.</span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/sitemap.xml">Sitemap</Link>
              <Link href="/privacy">Privacy</Link>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Reading Progress Bar ─── */
export function ReadingProgress() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      if (scrollHeight <= 0) return;
      setWidth(Math.min(100, (scrollTop / scrollHeight) * 100));
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return <div className="reading-progress" style={{ width: `${width}%` }} />;
}

/* ─── TL;DR Collapsible Card ─── */
export function TLDRCard({ takeaways }: { takeaways: string[] }) {
  const [collapsed, setCollapsed] = useState(false);

  if (takeaways.length === 0) return null;

  return (
    <div className="tldr-card">
      <div
        className="tldr-card__header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="tldr-card__label">⚡ Quick summary</span>
        <button className="tldr-card__toggle" type="button">
          {collapsed ? 'Show ▾' : 'Hide ▴'}
        </button>
      </div>
      {!collapsed && (
        <div className="tldr-card__body">
          <ul>
            {takeaways.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Share Bar ─── */
export function ShareBar({ title, slug }: { title: string; slug: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/blog/${slug}`
    : `/blog/${slug}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [url]);

  const shareX = useCallback(() => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }, [title, url]);

  const shareLinkedIn = useCallback(() => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }, [url]);

  return (
    <div className={`share-bar ${visible ? 'share-bar--visible' : ''}`}>
      <button
        className={`share-bar__btn ${copied ? 'share-bar__btn--copied' : ''}`}
        onClick={copyLink}
        title="Copy link"
        type="button"
      >
        {copied ? '✓' : '🔗'}
      </button>
      <button
        className="share-bar__btn"
        onClick={shareX}
        title="Share on X"
        type="button"
      >
        𝕏
      </button>
      <button
        className="share-bar__btn"
        onClick={shareLinkedIn}
        title="Share on LinkedIn"
        type="button"
      >
        in
      </button>
    </div>
  );
}

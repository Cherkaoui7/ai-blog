'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSlotProps = {
  slot?: string;
  format?: 'auto' | 'horizontal' | 'rectangle' | 'fluid';
};

export function AdSlot({ slot, format = 'auto' }: AdSlotProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client || !slot) return;

    try {
      const queue = (window.adsbygoogle = window.adsbygoogle || []);
      queue.push({});
    } catch {
      // Ignore duplicate or blocked AdSense initializations.
    }
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}

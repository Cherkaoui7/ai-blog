'use client';

import { useState } from 'react';
import { getSafeRedirectPath } from '@/lib/request';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    const res = await fetch('/api/auth/login', {
      cache: 'no-store',
      credentials: 'same-origin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json().catch(() => null);

    if (res.ok) {
      const nextPath = new URLSearchParams(window.location.search).get('next');
      window.location.href = getSafeRedirectPath(nextPath, '/pipeline');
    } else {
      setError(data?.error || 'Wrong password');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <div style={{ width: 360, textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 22, marginBottom: 8 }}>Admin access</h1>
        <p style={{ color: '#555', fontSize: 14, marginBottom: 24 }}>Enter your password to continue</p>
        <input
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={e => { setPassword(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="Password"
          style={{ width: '100%', padding: '12px 16px', background: '#1a1a1a',
            border: `1px solid ${error ? '#dc2626' : '#2a2a2a'}`, borderRadius: 10,
            color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box',
            marginBottom: 10, fontFamily: 'inherit' }}
        />
        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{error}</p>}
        <button onClick={handleLogin} style={{ width: '100%', padding: '12px',
          background: '#fff', color: '#000', border: 'none', borderRadius: 10,
          fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Enter →
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

export function FAQAccordion({ children }: { children: React.ReactNode }) {
  return (
    <div className="faq-accordion" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '2rem 0' }}>
      {children}
    </div>
  );
}

export function FAQItem({ question, children }: { question: string, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={`faq-item ${isOpen ? 'is-open' : ''}`}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          background: 'none',
          border: 'none',
          color: 'var(--text)',
          fontSize: '1.05rem',
          fontWeight: 600,
          textAlign: 'left',
          cursor: 'pointer',
        }}
        type="button"
      >
        <span>{question}</span>
        <span 
          style={{ 
            color: 'var(--accent)', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            fontSize: '1.5rem',
            lineHeight: 1
          }}
        >
          ▾
        </span>
      </button>
      
      <div 
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.3s ease-in-out',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div style={{ 
            padding: '0 1.5rem 1.25rem', 
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            fontSize: '0.95rem'
          }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

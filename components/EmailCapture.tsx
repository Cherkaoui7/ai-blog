'use client';

import { useActionState } from 'react';
import { submitEmailCapture, type EmailCaptureState } from '@/app/actions/email-capture';

type EmailCaptureProps = {
  source: string;
};

const initialState: EmailCaptureState = {
  status: 'idle',
  message: '',
};

export function EmailCapture({ source }: EmailCaptureProps) {
  const submitAction = submitEmailCapture.bind(null, source);
  const [state, formAction, pending] = useActionState(submitAction, initialState);

  return (
    <section className="email-capture" aria-labelledby={`email-capture-title-${source}`}>
      <div className="email-capture__content">
        <p className="email-capture__eyebrow">Email updates</p>
        <h2 id={`email-capture-title-${source}`} className="email-capture__title">
          Get more tips
        </h2>
        <p className="email-capture__copy">
          Get practical money, productivity, and AI notes in a short format you can actually use.
        </p>
      </div>

      <form action={formAction} className="email-capture__form">
        <label htmlFor={`email-capture-input-${source}`} className="sr-only">
          Email address
        </label>
        <div className="email-capture__fields">
          <input
            id={`email-capture-input-${source}`}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            required
            className="email-capture__input"
          />
          <button type="submit" className="email-capture__button" disabled={pending}>
            {pending ? 'Sending...' : 'Get more tips'}
          </button>
        </div>

        <p className="email-capture__fine-print">No spam. Useful updates only.</p>

        {state.message && (
          <p
            className={`email-capture__message email-capture__message--${state.status}`}
            aria-live="polite"
          >
            {state.message}
          </p>
        )}
      </form>
    </section>
  );
}

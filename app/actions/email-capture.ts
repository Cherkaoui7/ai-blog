'use server';

import fs from 'node:fs/promises';
import path from 'node:path';

export type EmailCaptureState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

const SIGNUPS_PATH = path.join(process.cwd(), '.tmp-generated', 'email-signups.json');

function normalizeEmail(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function savePlaceholderSignup(email: string, source: string) {
  await fs.mkdir(path.dirname(SIGNUPS_PATH), { recursive: true });

  let existing: Array<{ email: string; source: string; createdAt: string }> = [];

  try {
    const raw = await fs.readFile(SIGNUPS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      existing = parsed.filter(
        (entry): entry is { email: string; source: string; createdAt: string } =>
          Boolean(entry) &&
          typeof entry.email === 'string' &&
          typeof entry.source === 'string' &&
          typeof entry.createdAt === 'string'
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('ENOENT')) {
      throw error;
    }
  }

  const alreadyExists = existing.some(entry => entry.email === email);
  if (alreadyExists) {
    return { created: false };
  }

  existing.push({
    email,
    source,
    createdAt: new Date().toISOString(),
  });

  await fs.writeFile(SIGNUPS_PATH, JSON.stringify(existing, null, 2), 'utf-8');
  return { created: true };
}

async function sendToMailchimp(email: string, source: string) {
  const action = process.env.MAILCHIMP_FORM_ACTION;
  if (!action) return false;

  const params = new URLSearchParams();
  params.set(process.env.MAILCHIMP_EMAIL_FIELD || 'EMAIL', email);

  const sourceField = process.env.MAILCHIMP_SOURCE_FIELD;
  if (sourceField) {
    params.set(sourceField, source);
  }

  const response = await fetch(action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Mailchimp returned ${response.status}`);
  }

  return true;
}

export async function submitEmailCapture(
  source: string,
  _prevState: EmailCaptureState,
  formData: FormData
): Promise<EmailCaptureState> {
  const email = normalizeEmail(formData.get('email'));

  if (!isValidEmail(email)) {
    return {
      status: 'error',
      message: 'Enter a valid email address.',
    };
  }

  try {
    const submittedToMailchimp = await sendToMailchimp(email, source);

    if (submittedToMailchimp) {
      return {
        status: 'success',
        message: 'Thanks. Check your inbox for the next update.',
      };
    }

    const result = await savePlaceholderSignup(email, source);

    return {
      status: 'success',
      message: result.created
        ? 'Thanks. Your email was saved in placeholder mode.'
        : 'This email is already saved in placeholder mode.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      status: 'error',
      message: message.includes('Mailchimp')
        ? 'Signup is temporarily unavailable. Try again in a moment.'
        : 'Something went wrong. Try again.',
    };
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const DEFAULT_CONTACT = 'mailto:security-contact@example.com';
const DEFAULT_EXPIRES = '2027-04-01T00:00:00.000Z';

export function GET() {
  const lines = [
    `Contact: ${process.env.SECURITY_CONTACT || DEFAULT_CONTACT}`,
    `Expires: ${process.env.SECURITY_TXT_EXPIRES || DEFAULT_EXPIRES}`,
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
  ];
  const policyUrl = process.env.SECURITY_POLICY_URL;

  if (policyUrl) {
    lines.push(`Policy: ${policyUrl}`);
  }

  return new Response(lines.join('\n') + '\n', {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

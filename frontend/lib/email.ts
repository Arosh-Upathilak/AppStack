// Email adapter. Uses Resend if RESEND_API_KEY is set, otherwise logs to console.
// Keeping a tiny surface so the rest of the app doesn't depend on Resend directly.

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const FROM = process.env.EMAIL_FROM || 'AppStack <noreply@example.com>';
const KEY = process.env.RESEND_API_KEY;

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
  if (!KEY) {
    console.log('\n[email:simulated]', { to, subject, text: text ?? stripHtml(html).slice(0, 200) });
    return;
  }
  // Lazy-call the Resend HTTP API to avoid a hard SDK dep.
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html, text }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('[email:resend-failed]', res.status, body);
    throw new Error(`Resend failed: ${res.status}`);
  }
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Convenience templates ------------------------------------------------------

export function otpEmail(code: string) {
  return {
    subject: `Your AppStack verification code: ${code}`,
    html: `<p>Your verification code is <strong style="font-size:22px;letter-spacing:4px">${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
    text: `Your AppStack verification code is ${code}. Expires in 10 minutes.`,
  };
}

export function passwordResetEmail(link: string) {
  return {
    subject: 'Reset your AppStack password',
    html: `<p>Use the link below to reset your password. It expires in 1 hour.</p><p><a href="${link}">${link}</a></p>`,
    text: `Reset your password: ${link}`,
  };
}

// reCAPTCHA v3 verifier — NRQ-9. Returns true when no secret is set, so dev/CI
// doesn't have to round-trip Google. Production sets RECAPTCHA_SECRET_KEY.

const SECRET = process.env.RECAPTCHA_SECRET_KEY;

export async function verifyRecaptcha(token: string | null | undefined, minScore = 0.5): Promise<boolean> {
  if (!SECRET) return true;
  if (!token) return false;
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: SECRET, response: token }),
  });
  if (!res.ok) return false;
  const json = (await res.json()) as { success: boolean; score?: number };
  return !!json.success && (json.score ?? 1) >= minScore;
}

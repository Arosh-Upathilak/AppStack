import { retryOnTransient } from '../retry';

/**
 * Demo safety net. Wraps a real API call so that if the backend endpoint is
 * unavailable (network error / 404 — e.g. Arosh hasn't shipped it yet), we fall
 * back to mock data and keep the demo flowing. Mirrors the graceful-degradation
 * pattern already used in the NextAuth Google `signIn` callback.
 *
 * Returns `{ data, mocked }` so callers can surface a subtle "demo data" hint.
 */
export async function withMockFallback<T>(
  real: () => Promise<T>,
  mock: () => T | Promise<T>,
  label: string,
): Promise<{ data: T; mocked: boolean }> {
  try {
    const data = await retryOnTransient(real);
    return { data, mocked: false };
  } catch (err) {
    console.warn(
      `[demo-fallback] ${label} — backend unavailable, using mock data`,
      err instanceof Error ? err.message : err,
    );
    return { data: await mock(), mocked: true };
  }
}

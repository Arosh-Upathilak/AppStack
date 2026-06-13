import axios from "axios";

/**
 * Retry an async call on *transient* failures — network errors or 5xx
 * responses. This smooths over Neon's serverless cold-starts: when the DB has
 * auto-suspended, the first query can fail with "Can't reach database server"
 * (surfaced as a 500) but succeeds a moment later once the compute wakes.
 *
 * Client errors (4xx — e.g. "wrong password", "account exists") are NOT
 * retried; they're surfaced immediately.
 */
export async function retryOnTransient<T>(
  fn: () => Promise<T>,
  attempts = 2,
  delayMs = 1200,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const transient = status === undefined || status >= 500;
      if (!transient || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

/**
 * fetchWithRetry
 *
 * Wraps the native fetch() with automatic retry logic for transient failures
 * (e.g., Edge Function cold starts, network blips). Retries on TypeError
 * ("Failed to fetch") and 5xx responses.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { retries?: number; delayMs?: number }
): Promise<Response> {
  const { retries = 2, delayMs = 800 } = options || {};

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(input, init);

      // Retry on 5xx server errors (but not on last attempt)
      if (response.status >= 500 && attempt < retries) {
        console.warn(
          `[fetchWithRetry] ${response.status} on attempt ${attempt + 1}/${retries + 1}, retrying in ${delayMs}ms...`
        );
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }

      return response;
    } catch (error) {
      // "TypeError: Failed to fetch" — network-level failure
      if (attempt < retries) {
        console.warn(
          `[fetchWithRetry] Network error on attempt ${attempt + 1}/${retries + 1}: ${error}. Retrying in ${delayMs}ms...`
        );
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
      } else {
        throw error;
      }
    }
  }

  // Should never reach here, but just in case
  throw new Error("[fetchWithRetry] All retries exhausted");
}

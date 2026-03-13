const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const TIMEOUT_MS = 20_000
const MAX_RETRIES = 2

/**
 * Fetch Overpass API with AbortController timeout and exponential backoff retry.
 * @param query - Overpass QL query string
 * @param attempt - current attempt number (0-indexed), used internally for recursion
 */
export async function fetchOverpass(query: string, attempt = 0): Promise<unknown> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return await response.json()
  } catch (err) {
    clearTimeout(timeoutId)
    if (attempt < MAX_RETRIES) {
      const backoff = 1000 * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, backoff))
      return fetchOverpass(query, attempt + 1)
    }
    throw err
  }
}

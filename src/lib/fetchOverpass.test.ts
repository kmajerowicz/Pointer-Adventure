import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchOverpass } from './fetchOverpass'

describe('fetchOverpass', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns parsed JSON on successful response', async () => {
    const mockData = { elements: [{ type: 'way', id: 1 }] }
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response)

    const promise = fetchOverpass('test query')
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toEqual(mockData)
    expect(global.fetch).toHaveBeenCalledOnce()
  })

  it('retries up to 2 times on network failure with exponential backoff', async () => {
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ elements: [] }),
      } as Response)

    const promise = fetchOverpass('test query')

    // First attempt fails immediately, then 1s delay
    await vi.advanceTimersByTimeAsync(1000)
    // Second attempt fails, then 2s delay
    await vi.advanceTimersByTimeAsync(2000)
    // Third attempt succeeds
    await vi.runAllTimersAsync()

    const result = await promise
    expect(result).toEqual({ elements: [] })
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('throws after exhausting retries', async () => {
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))

    const promise = fetchOverpass('test query')
    // Catch eagerly to prevent unhandled rejection
    const caught = promise.catch((e) => ({ error: e }))

    // Advance through all retry backoff timers
    await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(2000)
    await vi.runAllTimersAsync()

    const result = await caught
    expect((result as { error: Error }).error.message).toBe('Network error')
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('aborts request after 20s timeout', async () => {
    // Each fetch call returns a promise that rejects when the AbortController fires
    const makeFetchMock = (_url: string, opts: RequestInit) => {
      const p = new Promise<Response>((_resolve, reject) => {
        const signal = opts?.signal as AbortSignal
        const onAbort = () => reject(new DOMException('The operation was aborted.', 'AbortError'))
        if (signal?.aborted) { onAbort(); return }
        signal?.addEventListener('abort', onAbort)
      })
      // Prevent unhandled rejection noise — the fetchOverpass catch handles it
      p.catch(() => undefined)
      return p
    }

    global.fetch = vi.fn().mockImplementation(makeFetchMock)

    const promise = fetchOverpass('test query')
    // Eagerly catch to avoid unhandled rejection
    promise.catch(() => undefined)

    // Advance 20s — AbortController fires, attempt 0 fails
    await vi.advanceTimersByTimeAsync(20_000)
    // 1s backoff
    await vi.advanceTimersByTimeAsync(1_000)
    // Advance 20s — attempt 1 fails
    await vi.advanceTimersByTimeAsync(20_000)
    // 2s backoff
    await vi.advanceTimersByTimeAsync(2_000)
    // Advance 20s — attempt 2 fails, no more retries
    await vi.advanceTimersByTimeAsync(20_000)
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow()
  }, 10_000)
})

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`HTTP ${status} for ${url}`)
    this.name = 'HttpError'
  }
}

export interface RequestOptions {
  headers?: Record<string, string>
}

export interface HttpClient {
  /** Fetch with retries; returns the final response even when it is a 4xx/5xx. */
  fetch(url: string, options?: RequestOptions): Promise<Response>
  json<T = unknown>(url: string, options?: RequestOptions): Promise<T>
  buffer(url: string, options?: RequestOptions): Promise<Buffer>
}

export interface HttpOptions {
  userAgent: string
  fetchImpl?: typeof fetch
  retries?: number
  baseDelayMs?: number
  /** Minimum gap between request starts, for politeness towards shared endpoints. */
  minIntervalMs?: number
  timeoutMs?: number
  /** Upper bound for any single retry wait, even if the server asks for longer. */
  maxDelayMs?: number
  sleep?: (ms: number) => Promise<void>
  now?: () => number
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])
const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export function createHttp(options: HttpOptions): HttpClient {
  const {
    userAgent,
    fetchImpl = fetch,
    retries = 4,
    baseDelayMs = 1000,
    minIntervalMs = 0,
    timeoutMs = 90_000,
    maxDelayMs = 30_000,
    sleep = defaultSleep,
    now = Date.now,
  } = options

  let nextSlot = 0
  let queue: Promise<void> = Promise.resolve()

  const waitForSlot = (): Promise<void> => {
    const turn = queue.then(async () => {
      const wait = nextSlot - now()
      if (wait > 0) await sleep(wait)
      nextSlot = now() + minIntervalMs
    })
    queue = turn
    return turn
  }

  const backoffMs = (attempt: number, response?: Response): number => {
    const retryAfter = Number(response?.headers.get('Retry-After'))
    const delay = retryAfter > 0 ? retryAfter * 1000 : baseDelayMs * 2 ** attempt
    return Math.min(delay, maxDelayMs)
  }

  async function request(url: string, opts: RequestOptions = {}): Promise<Response> {
    const headers = { 'User-Agent': userAgent, ...opts.headers }
    for (let attempt = 0; ; attempt += 1) {
      await waitForSlot()
      let response: Response
      try {
        response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(timeoutMs) })
      } catch (error) {
        if (attempt >= retries) throw error
        await sleep(backoffMs(attempt))
        continue
      }
      if (!RETRYABLE_STATUS.has(response.status) || attempt >= retries) return response
      await response.body?.cancel()
      await sleep(backoffMs(attempt, response))
    }
  }

  async function ok(url: string, opts?: RequestOptions): Promise<Response> {
    const response = await request(url, opts)
    if (!response.ok) {
      await response.body?.cancel()
      throw new HttpError(response.status, url)
    }
    return response
  }

  return {
    fetch: request,
    json: async <T>(url: string, opts?: RequestOptions) => (await (await ok(url, opts)).json()) as T,
    buffer: async (url: string, opts?: RequestOptions) =>
      Buffer.from(await (await ok(url, opts)).arrayBuffer()),
  }
}

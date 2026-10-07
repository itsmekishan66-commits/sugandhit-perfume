import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_CHUNK_SIZE = 60
const DEFAULT_WINDOW_SIZE = 120

export interface ChunkedResult<T> {
  items: T[]
  total: number
}

export interface UseChunkedPagingOptions<T> {
  /**
   * Fetches one server chunk (limit = chunkSize). Called with the 1-based server
   * page number; the response must carry `total` for the full filtered result set.
   */
  fetcher: (page: number, limit: number) => Promise<ChunkedResult<T>>
  /**
   * Search/filter values that drive the request. Whenever the serialized value
   * changes the hook resets to page 1 and re-fetches the first chunks.
   */
  query: unknown[]
  enabled?: boolean
  debounceMs?: number
  pageSize?: number
  chunkSize?: number
  windowSize?: number
  onError?: (error: unknown) => void
}

export interface UseChunkedPaging<T> {
  /** Rows for the currently visible page (pageSize items). */
  pageItems: T[]
  /**
   * All rows currently held in memory, contiguous from `windowStart` (always 0 when
   * an unbounded `windowSize` is used, so the list only ever grows as pages load).
   */
  rows: T[]
  /** Total rows matching the current query (server reported). */
  total: number
  totalPages: number
  page: number
  setPage: (page: number) => void
  /** Initial (first-ever) load in flight. */
  loading: boolean
  /** Query-change fetch in flight (search/filter changed; previous rows still shown). */
  searching: boolean
  /** Chunk fetch in flight while paging. */
  loadingMore: boolean
  /** Re-fetches the current window in place (e.g. after an add/delete elsewhere). */
  refresh: () => Promise<void>
}

/**
 * Hybrid server/client pagination:
 * - the first call fetches 60 rows (one server chunk),
 * - the UI pages through them 20 at a time,
 * - reaching the last 20 rows of the loaded window triggers the next 60-row fetch,
 * - only the latest 120 rows (2 chunks) stay in memory; older rows are re-fetched
 *   from the server when the user navigates back.
 * Search/filter changes are sent to the server, so matches always come from the
 * database regardless of what is currently loaded in the UI.
 *
 * Lint-safe variant of the admin hook: every setState reachable from the load
 * effect runs after an `await` (never synchronously inside the effect body), which
 * keeps `react-hooks/set-state-in-effect` satisfied.
 */
export function useChunkedPaging<T>({
  fetcher,
  query,
  enabled = true,
  debounceMs = 300,
  pageSize = DEFAULT_PAGE_SIZE,
  chunkSize = DEFAULT_CHUNK_SIZE,
  windowSize = DEFAULT_WINDOW_SIZE,
  onError,
}: UseChunkedPagingOptions<T>): UseChunkedPaging<T> {
  const [page, setPageState] = useState(1)
  const [rows, setRows] = useState<T[]>([])
  const [windowStart, setWindowStart] = useState(0)
  const [total, setTotal] = useState(0)
  const [initialLoading, setInitialLoading] = useState(enabled)
  const [searching, setSearching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetcherRef = useRef(fetcher)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    fetcherRef.current = fetcher
    onErrorRef.current = onError
  }, [fetcher, onError])

  const seqRef = useRef(0)
  const windowRef = useRef<{ rows: T[]; start: number }>({ rows: [], start: 0 })
  const totalRef = useRef(0)
  const firstRunRef = useRef(true)
  const prevQueryKeyRef = useRef<string | null>(null)
  const pageRef = useRef(page)
  pageRef.current = page

  const queryKey = JSON.stringify(query)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const totalPagesRef = useRef(totalPages)
  totalPagesRef.current = totalPages
  const safePage = Math.min(page, totalPages)

  const reportError = useCallback((error: unknown) => {
    onErrorRef.current?.(error)
  }, [])

  const commitWindow = useCallback((next: { rows: T[]; start: number }) => {
    windowRef.current = next
    setRows(next.rows)
    setWindowStart(next.start)
  }, [])

  const fetchChunk = useCallback(
    async (offset: number, seq: number): Promise<ChunkedResult<T> | null> => {
      const requestPage = Math.floor(offset / chunkSize) + 1
      try {
        const result = await fetcherRef.current(requestPage, chunkSize)
        if (seq !== seqRef.current) return null
        return result
      } catch (error) {
        if (seq !== seqRef.current) return null
        throw error
      }
    },
    [chunkSize]
  )

  // Merge one server chunk into the sliding window.
  const applyChunk = useCallback(
    (chunk: ChunkedResult<T>, offset: number) => {
      totalRef.current = chunk.total
      setTotal(chunk.total)
      const w = windowRef.current
      if (offset === w.start + w.rows.length) {
        // Appending at the right edge of the window.
        const merged = [...w.rows, ...chunk.items]
        const over = merged.length - windowSize
        commitWindow({ rows: over > 0 ? merged.slice(over) : merged, start: over > 0 ? w.start + over : w.start })
      } else if (offset + chunk.items.length === w.start) {
        // Prepending at the left edge of the window.
        const merged = [...chunk.items, ...w.rows]
        commitWindow({ rows: merged.slice(0, windowSize), start: offset })
      } else {
        // Non-adjacent (big jump / reset): rebuild the window from this chunk.
        commitWindow({ rows: chunk.items.slice(0, windowSize), start: offset })
      }
    },
    [windowSize, commitWindow]
  )

  // Ensure the visible range [from, to) is covered, fetching chunks as needed.
  const ensureRange = useCallback(
    async (from: number, to: number, seq: number) => {
      for (;;) {
        const w = windowRef.current
        if (w.start + w.rows.length >= to || seq !== seqRef.current) break
        const offset = w.start + w.rows.length
        const chunk = await fetchChunk(offset, seq)
        if (!chunk) return
        applyChunk(chunk, offset)
      }
      for (;;) {
        const w = windowRef.current
        if (w.start <= from || seq !== seqRef.current) break
        const offset = Math.max(0, w.start - chunkSize)
        const chunk = await fetchChunk(offset, seq)
        if (!chunk) return
        applyChunk(chunk, offset)
      }
    },
    [fetchChunk, applyChunk, chunkSize]
  )

  // Prefetch one chunk ahead when the visible page reaches the end of the loaded window.
  const prefetchIfAtEdge = useCallback(
    async (curPage: number, seq: number) => {
      const w = windowRef.current
      if (w.start + w.rows.length >= totalRef.current) return
      if (curPage * pageSize >= w.start + w.rows.length) {
        const offset = w.start + w.rows.length
        const chunk = await fetchChunk(offset, seq)
        if (!chunk) return
        applyChunk(chunk, offset)
      }
    },
    [fetchChunk, applyChunk, pageSize]
  )

  // Fetch the first chunks after an initial load or a query change.
  const reloadForQuery = useCallback(
    async (seq: number) => {
      await Promise.resolve()
      setSearching(true)
      try {
        const chunk = await fetchChunk(0, seq)
        if (!chunk) return
        totalRef.current = chunk.total
        setTotal(chunk.total)
        const next = { rows: chunk.items, start: 0 }
        if (chunk.items.length === chunkSize && chunk.total > chunkSize) {
          const second = await fetchChunk(chunkSize, seq)
          if (second) next.rows = [...next.rows, ...second.items]
        }
        commitWindow(next)
        setPageState(1)
      } catch (error) {
        reportError(error)
      } finally {
        setSearching(false)
        setInitialLoading(false)
      }
    },
    [fetchChunk, commitWindow, chunkSize, reportError]
  )

  useEffect(() => {
    if (!enabled) return
    const seq = ++seqRef.current
    const firstRun = firstRunRef.current
    firstRunRef.current = false
    const queryChanged = !firstRun && prevQueryKeyRef.current !== queryKey
    prevQueryKeyRef.current = queryKey

    if (firstRun || queryChanged) {
      if (queryChanged) {
        const timer = setTimeout(() => void reloadForQuery(seq), debounceMs)
        return () => clearTimeout(timer)
      }
      void reloadForQuery(seq)
      return
    }

    // Same query: make sure the current page range is loaded.
    void (async () => {
      await Promise.resolve()
      setLoadingMore(true)
      const wantedPage = Math.min(pageRef.current, totalPagesRef.current)
      try {
        await ensureRange((wantedPage - 1) * pageSize, wantedPage * pageSize, seq)
        await prefetchIfAtEdge(wantedPage, seq)
      } catch (error) {
        reportError(error)
      } finally {
        if (seq === seqRef.current) setLoadingMore(false)
      }
    })()
  }, [queryKey, page, enabled, debounceMs, reloadForQuery, ensureRange, prefetchIfAtEdge, pageSize, reportError])

  const setPage = useCallback(
    (next: number) => {
      setPageState((current) => {
        const clamped = Math.min(Math.max(1, next), Math.max(1, Math.ceil(totalRef.current / pageSize)))
        return clamped === current ? current : clamped
      })
    },
    [pageSize]
  )

  const refresh = useCallback(async () => {
    const seq = ++seqRef.current
    const start = windowRef.current.start
    const end = start + windowRef.current.rows.length
    commitWindow({ rows: [], start })
    setLoadingMore(true)
    try {
      await ensureRange(start, end, seq)
    } catch (error) {
      reportError(error)
    } finally {
      if (seq === seqRef.current) setLoadingMore(false)
    }
  }, [ensureRange, commitWindow, reportError])

  const pageItems = useMemo(() => {
    const from = Math.max(0, (safePage - 1) * pageSize - windowStart)
    const to = Math.min(rows.length, from + pageSize)
    return rows.slice(Math.max(0, from), to)
  }, [rows, safePage, pageSize, windowStart])

  return {
    pageItems,
    rows,
    total,
    totalPages,
    page: safePage,
    setPage,
    loading: initialLoading,
    searching,
    loadingMore,
    refresh,
  }
}
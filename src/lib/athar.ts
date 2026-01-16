import type { AtharData, AtharSection } from '../types'

const REMOTE_URLS = [
  'https://xgharibx.github.io/ATHAR/data/adhkar.json',
  'https://raw.githubusercontent.com/xgharibx/ATHAR/main/public/data/adhkar.json',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeData(raw: unknown): AtharData {
  if (!isRecord(raw) || !Array.isArray(raw.sections)) {
    throw new Error('Unexpected ATHAR JSON schema')
  }

  const sections: AtharSection[] = raw.sections
    .filter((s): s is Record<string, unknown> => isRecord(s))
    .map((s) => {
      const id = typeof s.id === 'string' ? s.id : ''
      const title = typeof s.title === 'string' ? s.title : id
      const content = Array.isArray(s.content) ? s.content : []

      return {
        id,
        title,
        content: content
          .filter((c): c is Record<string, unknown> => isRecord(c))
          .map((c) => ({
            text: typeof c.text === 'string' ? c.text : '',
            benefit: typeof c.benefit === 'string' ? c.benefit : undefined,
            count:
              typeof c.count === 'number' || typeof c.count === 'string'
                ? c.count
                : undefined,
            count_description:
              typeof c.count_description === 'string'
                ? c.count_description
                : undefined,
          }))
          .filter((c) => c.text.trim().length > 0),
      }
    })
    .filter((s) => s.id && s.content.length > 0)

  if (sections.length === 0) {
    throw new Error('ATHAR JSON loaded but no sections found')
  }

  return { sections }
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal, cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${url} (${res.status})`)
  }
  return res.json()
}

export async function fetchAtharData(signal?: AbortSignal): Promise<AtharData> {
  const localUrl = `${import.meta.env.BASE_URL}data/adhkar.json`
  const urls = [localUrl, ...REMOTE_URLS]

  let lastError: unknown
  for (const url of urls) {
    try {
      const raw = await fetchJson(url, signal)
      return normalizeData(raw)
    } catch (err) {
      lastError = err
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to fetch ATHAR data')
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchAtharData } from './lib/athar'
import { createDesign, createRng, randomSeed } from './lib/random'
import { downloadNodeAsImage } from './lib/exportImage'
import { StoryCanvas } from './components/StoryCanvas'
import type { AtharData, AtharSection, StoryOptions } from './types'

function safeSlug(input: string): string {
  const s = input
    .trim()
    .replace(/[\s\u200f\u200e]+/g, '-')
    .replace(/[^\p{L}\p{N}\-_.]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return s.length ? s : 'azkar'
}

export default function App() {
  const [data, setData] = useState<AtharData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [sectionId, setSectionId] = useState<string>('')
  const [seed, setSeed] = useState<number>(() => randomSeed())
  const [offset, setOffset] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  const [options, setOptions] = useState<StoryOptions>({
    showBenefit: true,
    showCount: true,
    showWatermark: true,
  })

  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    setIsLoading(true)
    setError(null)

    fetchAtharData(ctrl.signal)
      .then((d) => {
        setData(d)
        setSectionId((prev) => prev || d.sections[0]?.id || '')
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load ATHAR data')
      })
      .finally(() => setIsLoading(false))

    return () => ctrl.abort()
  }, [])

  const section: AtharSection | null = useMemo(() => {
    if (!data) return null
    return data.sections.find((s) => s.id === sectionId) ?? data.sections[0] ?? null
  }, [data, sectionId])

  const design = useMemo(() => createDesign(seed), [seed])

  const itemIndex = useMemo(() => {
    if (!section) return 0
    const rng = createRng(seed ^ 0x9e3779b9)
    const base = rng.int(0, Math.max(0, section.content.length - 1))
    return (base + offset) % section.content.length
  }, [section, seed, offset])

  const dhikr = section?.content[itemIndex]

  const filenameBase = useMemo(() => {
    const t = section?.title ?? 'Azkar'
    return `${safeSlug(t)}-${seed.toString(16)}`
  }, [section?.title, seed])

  async function download(format: 'png' | 'jpeg') {
    if (!exportRef.current) return
    if (!section || !dhikr) return

    setIsDownloading(true)
    try {
      await downloadNodeAsImage(exportRef.current, {
        filename: `${filenameBase}.${format === 'png' ? 'png' : 'jpg'}`,
        format,
        backgroundColor: '#070a12',
        pixelRatio: 2,
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070a12]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-extrabold tracking-tight text-white">
              Azkar Generator
            </div>
            <div className="text-sm text-white/60">
              ستوري واحد • نص كامل • تصاميم عشوائية • تصدير PNG/JPG
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
              onClick={() => {
                setSeed(randomSeed())
                setOffset(0)
              }}
              disabled={isLoading}
            >
              توليد تصميم جديد
            </button>
            <button
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
              onClick={() => setOffset((v) => v + 1)}
              disabled={isLoading || !section}
            >
              ذكر آخر
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-soft">
            <div className="text-sm font-bold text-white/80">الإعدادات</div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-white/60">التصنيف</label>
              <select
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-ink-400"
                value={sectionId}
                onChange={(e) => {
                  setSectionId(e.target.value)
                  setOffset(0)
                }}
                disabled={isLoading || !data}
              >
                {(data?.sections ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-white/50">
                {section ? `${section.content.length} ذكر` : ''}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <span className="text-sm text-white/80">إظهار الفائدة</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-ink-400"
                  checked={options.showBenefit}
                  onChange={(e) =>
                    setOptions((o) => ({ ...o, showBenefit: e.target.checked }))
                  }
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <span className="text-sm text-white/80">إظهار عدد التكرار/الوصف</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-ink-400"
                  checked={options.showCount}
                  onChange={(e) =>
                    setOptions((o) => ({ ...o, showCount: e.target.checked }))
                  }
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <span className="text-sm text-white/80">إظهار توقيع صغير</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-ink-400"
                  checked={options.showWatermark}
                  onChange={(e) =>
                    setOptions((o) => ({ ...o, showWatermark: e.target.checked }))
                  }
                />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="rounded-xl bg-ink-500 px-4 py-2 text-sm font-bold text-white hover:bg-ink-400 disabled:opacity-60"
                onClick={() => download('png')}
                disabled={isLoading || !dhikr || isDownloading}
              >
                {isDownloading ? '...' : 'PNG'}
              </button>
              <button
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-60"
                onClick={() => download('jpeg')}
                disabled={isLoading || !dhikr || isDownloading}
              >
                {isDownloading ? '...' : 'JPG'}
              </button>
            </div>

            {isLoading ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                جارٍ تحميل بيانات الأذكار...
              </div>
            ) : error ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
                <div className="font-bold">تعذر التحميل</div>
                <div className="mt-1 text-xs opacity-80">{error}</div>
                <button
                  className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
                  onClick={() => window.location.reload()}
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : null}
          </aside>

          <main className="flex flex-col items-center">
            <div className="w-full max-w-[420px]">
              <div className="aspect-[9/16] w-full overflow-hidden rounded-[28px] border border-white/10 bg-black/20 shadow-soft">
                {section && dhikr ? (
                  <div className="h-full w-full scale-[0.3333] origin-top-left">
                    <StoryCanvas
                      width={1080}
                      height={1920}
                      title={section.title}
                      dhikr={dhikr}
                      design={design}
                      options={options}
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/60">
                    اختر تصنيفاً...
                  </div>
                )}
              </div>
              <div className="mt-3 text-center text-xs text-white/45">
                المعاينة مُصغّرة. التصدير يكون بدقة 1080×1920.
              </div>
            </div>

            {/* Hidden high-res node for export */}
            <div className="pointer-events-none fixed left-[-99999px] top-0">
              {section && dhikr ? (
                <div ref={exportRef}>
                  <StoryCanvas
                    width={1080}
                    height={1920}
                    title={section.title}
                    dhikr={dhikr}
                    design={design}
                    options={options}
                  />
                </div>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

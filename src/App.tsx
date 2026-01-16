import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchAtharData } from './lib/athar'
import { createDesign, createRng, randomSeed } from './lib/random'
import { downloadNodeAsImage } from './lib/exportImage'
import { StoryCanvas } from './components/StoryCanvas'
import { useElementSize } from './lib/useElementSize'
import type { AtharData, AtharDhikr, AtharSection, StoryOptions, StoryDesign } from './types'

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
  const STORY_ITEMS_CAP = 200

  const [data, setData] = useState<AtharData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [tab, setTab] = useState<'athar' | 'custom'>('athar')

  const [sectionId, setSectionId] = useState<string>('')
  const [seed, setSeed] = useState<number>(() => randomSeed())
  const [offset, setOffset] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  const [storyItems, setStoryItems] = useState<AtharDhikr[]>([])
  const [storyTitle, setStoryTitle] = useState<string>('')
  const [atharSearch, setAtharSearch] = useState('')

  const [options, setOptions] = useState<StoryOptions>({
    showBenefit: true,
    showCount: true,
    showWatermark: true,
    watermarkText: 'أثر',
    columns: 2,
    maxItems: 20,
    fontSize: 34,
    lineHeight: 1.35,
    backgroundImageUrl: '',
  })

  const [designMode, setDesignMode] = useState<'random' | 'light' | 'dark'>('random')
  const [templateMode, setTemplateMode] = useState<'auto' | StoryDesign['template']>('auto')

  const [customText, setCustomText] = useState('')
  const [customBenefit, setCustomBenefit] = useState('')
  const [customCount, setCustomCount] = useState('')
  const [customCountDesc, setCustomCountDesc] = useState('')

  const exportRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const previewSize = useElementSize(previewRef)

  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const backgroundPresets = useMemo(
    () =>
      [
        { name: 'بدون', url: '' },
        // Put any stable hosted backgrounds you like here.
        // If the URL 404s, it won't affect export unless selected.
      ] as const,
    [],
  )

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem('azkar.generator.state')
      if (!raw) return
      const parsed = JSON.parse(raw) as any
      if (parsed?.options) {
        setOptions((o) => ({ ...o, ...parsed.options }))
      }
      if (Array.isArray(parsed?.storyItems)) {
        setStoryItems(parsed.storyItems)
      }
      if (typeof parsed?.storyTitle === 'string') {
        setStoryTitle(parsed.storyTitle)
      }
      if (typeof parsed?.tab === 'string') {
        setTab(parsed.tab)
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const payload = {
      options,
      storyItems,
      storyTitle,
      tab,
    }
    try {
      localStorage.setItem('azkar.generator.state', JSON.stringify(payload))
    } catch {
      // ignore
    }
  }, [options, storyItems, storyTitle, tab])

  const section: AtharSection | null = useMemo(() => {
    if (!data) return null
    return data.sections.find((s) => s.id === sectionId) ?? data.sections[0] ?? null
  }, [data, sectionId])

  const design = useMemo(() => {
    let d = createDesign(seed)
    if (designMode !== 'random' && d.background.mode !== designMode) {
      d = createDesign(seed ^ 0xa53a9b41)
    }
    if (templateMode !== 'auto') {
      d = { ...d, template: templateMode }
    }
    return d
  }, [seed, designMode, templateMode])

  const itemIndex = useMemo(() => {
    if (!section) return 0
    const rng = createRng(seed ^ 0x9e3779b9)
    const base = rng.int(0, Math.max(0, section.content.length - 1))
    return (base + offset) % section.content.length
  }, [section, seed, offset])

  const dhikr = section?.content[itemIndex]

  useEffect(() => {
    if (storyItems.length === 0 && dhikr) {
      setStoryItems([dhikr])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dhikr?.text])

  useEffect(() => {
    if (!storyTitle.trim() && section?.title) {
      setStoryTitle(section.title)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section?.title])

  const filenameBase = useMemo(() => {
    const t = storyTitle.trim() || section?.title || 'Azkar'
    return `${safeSlug(t)}-${seed.toString(16)}`
  }, [section?.title, storyTitle, seed])

  const atharMatches = useMemo(() => {
    const q = atharSearch.trim()
    if (!q || !section) return []
    const needle = q.toLowerCase()
    const matches: { item: AtharDhikr; idx: number }[] = []
    for (let i = 0; i < section.content.length; i++) {
      const t = section.content[i]?.text
      if (!t) continue
      if (t.toLowerCase().includes(needle)) {
        matches.push({ item: section.content[i]!, idx: i })
      }
      if (matches.length >= 20) break
    }
    return matches
  }, [atharSearch, section])

  async function download(format: 'png' | 'jpeg') {
    if (!exportRef.current) return
    if (storyItems.length === 0) return

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
            <div className="text-2xl font-extrabold tracking-tight text-white">Azkar Generator</div>
            <div className="text-sm text-white/60">ستوري واحد • نص كامل • تصاميم عشوائية • تصدير PNG/JPG</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
              onClick={() => setSeed(randomSeed())}
              disabled={isLoading}
            >
              توليد تصميم جديد
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-white/80">التحكم</div>
              <div className="inline-flex overflow-hidden rounded-xl border border-white/10 bg-black/20">
                <button
                  className={`px-3 py-2 text-xs font-bold ${
                    tab === 'athar' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                  }`}
                  onClick={() => setTab('athar')}
                >
                  ATHAR
                </button>
                <button
                  className={`px-3 py-2 text-xs font-bold ${
                    tab === 'custom' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                  }`}
                  onClick={() => setTab('custom')}
                >
                  مخصص
                </button>
              </div>
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

            {tab === 'athar' ? (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white/60">عنوان الصورة</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-ink-400"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="مثال: أذكار المساء"
                  />
                </div>

                <div>
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

                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-60"
                    onClick={() => setOffset((v) => v + 1)}
                    disabled={isLoading || !section}
                  >
                    ذكر آخر
                  </button>
                  <button
                    className="rounded-xl bg-ink-500 px-3 py-2 text-sm font-bold text-white hover:bg-ink-400 disabled:opacity-60"
                    onClick={() => {
                      if (!section) return
                      const n = Math.max(1, options.maxItems)
                      const rng = createRng(seed ^ 0x1234abcd)
                      const start = rng.int(0, Math.max(0, section.content.length - 1))
                      const next: AtharDhikr[] = []
                      for (let i = 0; i < n; i++) {
                        next.push(section.content[(start + i) % section.content.length]!)
                      }
                      setStoryItems(next)
                    }}
                    disabled={isLoading || !section}
                  >
                    إضافة مجموعة
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/60">ابحث عن ذكر وأضفه</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-ink-400"
                    value={atharSearch}
                    onChange={(e) => setAtharSearch(e.target.value)}
                    placeholder="ابحث بكلمة من الذكر..."
                  />
                  {atharMatches.length ? (
                    <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/20 p-2">
                      {atharMatches.map((m) => (
                        <button
                          key={m.idx}
                          className="w-full rounded-lg px-2 py-2 text-right text-xs text-white/80 hover:bg-white/10"
                          onClick={() => {
                            setStoryItems((prev) => [m.item, ...prev].slice(0, STORY_ITEMS_CAP))
                            setAtharSearch('')
                          }}
                          title="إضافة"
                        >
                          <span className="line-clamp-2">{m.item.text}</span>
                        </button>
                      ))}
                    </div>
                  ) : atharSearch.trim() ? (
                    <div className="mt-2 text-xs text-white/45">لا توجد نتائج.</div>
                  ) : null}
                </div>

                <button
                  className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-60"
                  onClick={() => {
                    if (!dhikr) return
                    setStoryItems((prev) => [dhikr, ...prev].slice(0, STORY_ITEMS_CAP))
                  }}
                  disabled={!dhikr}
                >
                  إضافة الذكر الحالي للصورة
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-white/60">عنوان الصورة</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-ink-400"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="مثال: ذكر مخصص"
                  />
                </div>

                <label className="text-xs font-semibold text-white/60">نص الذكر</label>
                <textarea
                  className="h-28 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none focus:border-ink-400"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="اكتب الذكر هنا..."
                />

                <label className="text-xs font-semibold text-white/60">فائدة (اختياري)</label>
                <textarea
                  className="h-20 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none focus:border-ink-400"
                  value={customBenefit}
                  onChange={(e) => setCustomBenefit(e.target.value)}
                  placeholder="مثال: من قالها كُفي..."
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-white/60">عدد التكرار</label>
                    <input
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-ink-400"
                      value={customCount}
                      onChange={(e) => setCustomCount(e.target.value)}
                      placeholder="مثال: 3"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60">وصف العدد</label>
                    <input
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-ink-400"
                      value={customCountDesc}
                      onChange={(e) => setCustomCountDesc(e.target.value)}
                      placeholder="مثال: ثلاث مرات"
                    />
                  </div>
                </div>

                <button
                  className="w-full rounded-xl bg-ink-500 px-3 py-2 text-sm font-extrabold text-white hover:bg-ink-400 disabled:opacity-60"
                  onClick={() => {
                    const text = customText.trim()
                    if (!text) return
                    const item: AtharDhikr = {
                      text,
                      benefit: customBenefit.trim() || undefined,
                      count: customCount.trim() || undefined,
                      count_description: customCountDesc.trim() || undefined,
                    }
                    setStoryItems((prev) => [item, ...prev].slice(0, STORY_ITEMS_CAP))
                    setCustomText('')
                    setCustomBenefit('')
                    setCustomCount('')
                    setCustomCountDesc('')
                  }}
                  disabled={!customText.trim()}
                >
                  إضافة للصورة
                </button>
              </div>
            )}

            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="text-xs font-bold text-white/70">محتوى الصورة</div>
              {storyItems.length === 0 ? (
                <div className="mt-2 text-xs text-white/50">لم يتم إضافة أذكار بعد.</div>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className="text-[11px] text-white/45">
                    يعرض {Math.min(options.maxItems, storyItems.length)} من {storyItems.length}
                  </div>
                  <div className="max-h-80 space-y-2 overflow-auto pr-1">
                    {storyItems.slice(0, Math.min(60, storyItems.length)).map((it, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/10 bg-black/20 p-3"
                      draggable
                      onDragStart={() => setDragIndex(idx)}
                      onDragOver={(e) => {
                        e.preventDefault()
                      }}
                      onDrop={() => {
                        if (dragIndex === null || dragIndex === idx) return
                        setStoryItems((prev) => {
                          const next = [...prev]
                          const [moved] = next.splice(dragIndex, 1)
                          next.splice(idx, 0, moved!)
                          return next
                        })
                        setDragIndex(null)
                      }}
                    >
                      <div className="line-clamp-2 text-xs font-semibold text-white/80">
                        {it.text}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-white/45">#{idx + 1}</div>
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold text-white hover:bg-white/15 disabled:opacity-60"
                            onClick={() => {
                              if (idx === 0) return
                              setStoryItems((prev) => {
                                const next = [...prev]
                                ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
                                return next
                              })
                            }}
                            disabled={idx === 0}
                          >
                            ↑
                          </button>
                          <button
                            className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold text-white hover:bg-white/15 disabled:opacity-60"
                            onClick={() => {
                              if (idx === storyItems.length - 1) return
                              setStoryItems((prev) => {
                                const next = [...prev]
                                ;[next[idx + 1], next[idx]] = [next[idx], next[idx + 1]]
                                return next
                              })
                            }}
                            disabled={idx === storyItems.length - 1}
                          >
                            ↓
                          </button>
                          <button
                            className="rounded-lg bg-red-500/15 px-2 py-1 text-[11px] font-bold text-red-100 hover:bg-red-500/25"
                            onClick={() =>
                              setStoryItems((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                  <button
                    className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15"
                    onClick={() => setStoryItems([])}
                  >
                    مسح الكل
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="text-xs font-bold text-white/70">تخصيص التصميم</div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-white/60">نمط الألوان</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-ink-400"
                    value={designMode}
                    onChange={(e) => setDesignMode(e.target.value as any)}
                  >
                    <option value="random">عشوائي</option>
                    <option value="light">فاتح</option>
                    <option value="dark">داكن</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-white/60">القالب</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-ink-400"
                    value={templateMode}
                    onChange={(e) => setTemplateMode(e.target.value as any)}
                  >
                    <option value="auto">تلقائي</option>
                    <option value="list">قائمة</option>
                    <option value="paper">ورق (ATHAR)</option>
                    <option value="frame">إطار</option>
                    <option value="center">وسط</option>
                    <option value="split">منقسم</option>
                    <option value="stack">مكدس</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-white/60">عدد العناصر</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-ink-400"
                    value={options.maxItems}
                    onChange={(e) =>
                      setOptions((o) => ({ ...o, maxItems: Number(e.target.value) || 1 }))
                    }
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-white/60">الأعمدة</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-ink-400"
                    value={options.columns}
                    onChange={(e) =>
                      setOptions((o) => ({
                        ...o,
                        columns: Number(e.target.value) as 1 | 2 | 3,
                      }))
                    }
                  >
                    <option value={1}>عمود واحد</option>
                    <option value={2}>عمودين</option>
                    <option value={3}>ثلاثة أعمدة</option>
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="text-[11px] font-semibold text-white/60">
                  رابط صورة خلفية (اختياري)
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-ink-400"
                  value={options.backgroundImageUrl ?? ''}
                  onChange={(e) =>
                    setOptions((o) => ({ ...o, backgroundImageUrl: e.target.value }))
                  }
                  placeholder="https://..."
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <select
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-ink-400"
                    value={
                      backgroundPresets.find((p) => p.url === (options.backgroundImageUrl ?? ''))
                        ?.url ?? 'custom'
                    }
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === 'custom') return
                      setOptions((o) => ({ ...o, backgroundImageUrl: v }))
                    }}
                  >
                    <option value="custom">اختر خلفية</option>
                    {backgroundPresets.map((p) => (
                      <option key={p.name} value={p.url}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15"
                    onClick={() => setOptions((o) => ({ ...o, backgroundImageUrl: '' }))}
                  >
                    إزالة
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-white/45">
                          setStoryItems(next.slice(0, STORY_ITEMS_CAP))
                </div>
              </div>

              <div className="mt-3">
                <label className="text-[11px] font-semibold text-white/60">حجم الخط (للقوائم)</label>
                <input
                  type="range"
                  min={24}
                  max={60}
                  value={options.fontSize}
                  onChange={(e) =>
                    setOptions((o) => ({ ...o, fontSize: Number(e.target.value) }))
                  }
                  className="mt-2 w-full"
                />
                <div className="mt-1 text-[11px] text-white/45">{options.fontSize}px</div>
              </div>

              <div className="mt-3">
                <label className="text-[11px] font-semibold text-white/60">تباعد الأسطر</label>
                <input
                  type="range"
                  min={115}
                  max={200}
                  value={Math.round(options.lineHeight * 100)}
                  onChange={(e) =>
                    setOptions((o) => ({ ...o, lineHeight: Number(e.target.value) / 100 }))
                  }
                  className="mt-2 w-full"
                />
                <div className="mt-1 text-[11px] text-white/45">{options.lineHeight.toFixed(2)}</div>
              </div>

              <div className="mt-3 space-y-2">
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
                  <span className="text-sm text-white/80">إظهار العدد/الوصف</span>
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
                  <span className="text-sm text-white/80">إظهار التوقيع</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-ink-400"
                    checked={options.showWatermark}
                    onChange={(e) =>
                      setOptions((o) => ({ ...o, showWatermark: e.target.checked }))
                    }
                  />
                </label>
                <div>
                  <label className="text-[11px] font-semibold text-white/60">نص التوقيع</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-ink-400"
                    value={options.watermarkText}
                    onChange={(e) =>
                      setOptions((o) => ({ ...o, watermarkText: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  className="rounded-xl bg-ink-500 px-4 py-2 text-sm font-bold text-white hover:bg-ink-400 disabled:opacity-60"
                  onClick={() => download('png')}
                  disabled={isLoading || storyItems.length === 0 || isDownloading}
                >
                  {isDownloading ? '...' : 'PNG'}
                </button>
                <button
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-60"
                  onClick={() => download('jpeg')}
                  disabled={isLoading || storyItems.length === 0 || isDownloading}
                >
                  {isDownloading ? '...' : 'JPG'}
                </button>
              </div>
            </div>
          </aside>

          <main className="flex flex-col items-center">
            <div className="w-full max-w-[520px]">
              <div
                ref={previewRef}
                className="aspect-[9/16] w-full overflow-hidden rounded-[28px] border border-white/10 bg-black/20 shadow-soft"
              >
                {storyItems.length > 0 ? (
                  <StoryCanvas
                    width={Math.max(1, Math.round(previewSize.width || 1))}
                    height={
                      Math.max(1, Math.round(((previewSize.width || 1) * 16) / 9))
                    }
                    title={storyTitle.trim() || section?.title || 'أذكار'}
                    items={storyItems}
                    design={design}
                    options={options}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/60">
                    أضف أذكاراً للصورة...
                  </div>
                )}
              </div>
              <div className="mt-3 text-center text-xs text-white/45">
                المعاينة بنفس النسبة. التصدير يكون بدقة 1080×1920.
              </div>
            </div>

            {/* Hidden high-res node for export */}
            <div className="pointer-events-none fixed left-[-99999px] top-0">
              {storyItems.length > 0 ? (
                <div ref={exportRef}>
                  <StoryCanvas
                    width={1080}
                    height={1920}
                    title={storyTitle.trim() || section?.title || 'أذكار'}
                    items={storyItems}
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

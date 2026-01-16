import type { CSSProperties } from 'react'
import type { AtharDhikr, StoryDesign, StoryOptions } from '../types'
import { clamp } from '../lib/random'

function chooseMainFontPx(textLength: number, width: number): number {
  const scale = width / 1080
  const max = 96 * scale
  const min = 40 * scale

  const t = clamp(0, (textLength - 240) / 1100, 1)
  return Math.round(max - t * (max - min))
}

function countLabel(count: AtharDhikr['count']): string | null {
  if (count === undefined || count === null) return null
  if (typeof count === 'number') return `${count}`
  const s = String(count).trim()
  return s.length ? s : null
}

export function StoryCanvas({
  width,
  height,
  title,
  items,
  design,
  options,
}: {
  width: number
  height: number
  title: string
  items: AtharDhikr[]
  design: StoryDesign
  options: StoryOptions
}) {
  const first = items[0]
  const safeItems = items.filter((i) => i.text.trim().length > 0)
  const effectiveItems = safeItems.slice(0, Math.max(1, options.maxItems || 1))

  const isList = effectiveItems.length > 1 || design.template === 'list'
  const mainSize = chooseMainFontPx(first?.text?.length ?? 0, width)
  const listBase = clamp(22, options.fontSize || 34, 70) * (width / 1080)
  const listLineHeight = clamp(1.15, options.lineHeight || 1.35, 2)

  const fontFamily = design.font.family === 'serif' ? 'font-serif' : 'font-sans'

  const textColor = design.background.mode === 'light' ? '#111827' : 'rgba(255,255,255,0.95)'
  const subTextColor = design.background.mode === 'light' ? 'rgba(17,24,39,0.70)' : 'rgba(255,255,255,0.70)'
  const dividerColor = design.background.mode === 'light' ? 'rgba(17,24,39,0.10)' : 'rgba(255,255,255,0.10)'

  const bgStyle: CSSProperties = {
    width,
    height,
    backgroundImage: `linear-gradient(135deg, ${design.background.from}, ${design.background.to})`,
  }

  const patternStyle: CSSProperties = design.decorations.showPattern
    ? {
        backgroundImage:
          (design.background.mode === 'light'
            ? `repeating-linear-gradient(45deg, rgba(17,24,39,0.03) 0 1px, transparent 1px 14px),`
            : `repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 14px),`) +
          `radial-gradient(circle at 15% 20%, ${design.background.accent}2a 0 24%, transparent 55%),` +
          `radial-gradient(circle at 85% 85%, ${design.background.accent}24 0 22%, transparent 52%)`,
      }
    : {}

  const glowStyle: CSSProperties = design.decorations.showGlow
    ? {
        boxShadow: `inset 0 0 90px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)`,
      }
    : { boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }

  return (
    <div
      dir="rtl"
      className="relative overflow-hidden rounded-[36px]"
      style={{ ...bgStyle, ...glowStyle }}
    >
      <div className="absolute inset-0 opacity-80" style={patternStyle} />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, ${design.background.accent}30, transparent 55%)`,
        }}
      />

      <div className="relative flex h-full w-full flex-col p-[72px]">
        <header className="flex items-center justify-center">
          <div
            className="inline-flex items-center gap-3 rounded-full px-6 py-3 text-[32px] font-extrabold"
            style={{
              color: textColor,
              background:
                design.background.mode === 'light'
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
              border:
                design.background.mode === 'light'
                  ? '1px solid rgba(17,24,39,0.10)'
                  : '1px solid rgba(255,255,255,0.10)',
            }}
          >
            <span>{title}</span>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          {!isList ? (
            <div
              className="w-full rounded-[28px] p-10"
              style={{
                background:
                  design.background.mode === 'light'
                    ? `linear-gradient(135deg, ${design.background.paper ?? 'rgba(255,255,255,0.95)'}, rgba(255,255,255,0.55))`
                    : 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
                border:
                  design.background.mode === 'light'
                    ? `1px solid rgba(17,24,39,0.10)`
                    : `1px solid rgba(255,255,255,0.14)`,
              }}
            >
              <div
                className={`${fontFamily} whitespace-pre-wrap text-center leading-[1.35]`}
                style={{ fontSize: mainSize, color: textColor }}
              >
                {first?.text ?? ''}
              </div>
              {(options.showBenefit && first?.benefit) ||
              (options.showCount && first?.count_description) ? (
                <div
                  className="mt-10 rounded-[22px] p-8 text-[28px] leading-relaxed"
                  style={{
                    color: subTextColor,
                    background:
                      design.background.mode === 'light'
                        ? 'linear-gradient(135deg, rgba(0,0,0,0.04), rgba(0,0,0,0.02))'
                        : 'linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.15))',
                    border:
                      design.background.mode === 'light'
                        ? '1px solid rgba(17,24,39,0.08)'
                        : '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  {options.showBenefit && first?.benefit ? (
                    <div className="whitespace-pre-wrap">{first.benefit}</div>
                  ) : null}
                  {options.showCount && first?.count_description ? (
                    <div className="mt-4 whitespace-pre-wrap" style={{ opacity: 0.85 }}>
                      {first.count_description}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div
              className="w-full rounded-[28px] p-10"
              style={{
                background:
                  design.background.mode === 'light'
                    ? `linear-gradient(135deg, ${design.background.paper ?? 'rgba(255,255,255,0.95)'}, rgba(255,255,255,0.60))`
                    : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                border:
                  design.background.mode === 'light'
                    ? `1px solid rgba(17,24,39,0.10)`
                    : `1px solid rgba(255,255,255,0.14)`,
              }}
            >
              <div
                className="grid gap-10"
                style={{
                  gridTemplateColumns:
                    options.columns === 2 ? '1fr 1fr' : '1fr',
                }}
              >
                {(() => {
                  const cols = options.columns
                  const perCol = Math.ceil(effectiveItems.length / cols)
                  const columns: AtharDhikr[][] = []
                  for (let c = 0; c < cols; c++) {
                    columns.push(effectiveItems.slice(c * perCol, (c + 1) * perCol))
                  }
                  return columns
                })().map((col, colIdx) => (
                  <div key={colIdx} className="space-y-7">
                    {col.map((it, idx) => {
                      const badge = options.showCount ? countLabel(it.count) : null
                      return (
                        <div key={`${colIdx}-${idx}`}>
                          <div className="flex items-start gap-4">
                            <div
                              className="mt-2 h-5 w-5 rounded-full"
                              style={{
                                backgroundColor: `${design.background.accent}`,
                                opacity: design.background.mode === 'light' ? 0.25 : 0.35,
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div
                                className={`${fontFamily} whitespace-pre-wrap`}
                                style={{
                                  fontSize: listBase,
                                  lineHeight: listLineHeight,
                                  color: textColor,
                                }}
                              >
                                {it.text}
                              </div>
                              {options.showBenefit && it.benefit ? (
                                <div
                                  className="mt-2 whitespace-pre-wrap"
                                  style={{
                                    fontSize: Math.max(20, listBase * 0.75),
                                    lineHeight: 1.35,
                                    color: subTextColor,
                                  }}
                                >
                                  {it.benefit}
                                </div>
                              ) : null}
                              {options.showCount && it.count_description ? (
                                <div
                                  className="mt-2 whitespace-pre-wrap"
                                  style={{
                                    fontSize: Math.max(18, listBase * 0.7),
                                    lineHeight: 1.35,
                                    color: subTextColor,
                                    opacity: 0.9,
                                  }}
                                >
                                  {it.count_description}
                                </div>
                              ) : null}
                            </div>

                            {badge ? (
                              <div
                                className="shrink-0 rounded-full px-4 py-2 text-[22px] font-extrabold"
                                style={{
                                  backgroundColor: design.background.accent,
                                  color: design.background.mode === 'light' ? '#111827' : '#0b1220',
                                  opacity: design.background.mode === 'light' ? 0.9 : 1,
                                }}
                              >
                                × {badge}
                              </div>
                            ) : null}
                          </div>

                          {idx !== col.length - 1 ? (
                            <div
                              className="mt-6"
                              style={{
                                height: 1,
                                backgroundColor: dividerColor,
                              }}
                            />
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="flex items-end justify-between">
          <div
            className="text-[22px] font-bold"
            style={{ color: design.background.mode === 'light' ? 'rgba(17,24,39,0.45)' : 'rgba(255,255,255,0.55)' }}
          >
            {options.showWatermark ? options.watermarkText : ''}
          </div>
          <div
            className="text-[22px]"
            style={{ color: design.background.mode === 'light' ? 'rgba(17,24,39,0.40)' : 'rgba(255,255,255,0.50)' }}
          >
            {options.showWatermark ? 'ATHAR' : ''}
          </div>
        </footer>
      </div>
    </div>
  )
}

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
  dhikr,
  design,
  options,
}: {
  width: number
  height: number
  title: string
  dhikr: AtharDhikr
  design: StoryDesign
  options: StoryOptions
}) {
  const mainSize = chooseMainFontPx(dhikr.text.length, width)
  const fontFamily = design.font.family === 'serif' ? 'font-serif' : 'font-sans'
  const badge = countLabel(dhikr.count)
  const showFooterDetails = design.template !== 'stack'

  const bgStyle: CSSProperties = {
    width,
    height,
    backgroundImage: `linear-gradient(135deg, ${design.background.from}, ${design.background.to})`,
  }

  const patternStyle: CSSProperties = design.decorations.showPattern
    ? {
        backgroundImage:
          `repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 14px),` +
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
        {design.template === 'split' ? (
          <header className="flex items-center justify-between">
            <div className="text-[40px] font-bold tracking-tight text-white/95">
              {title}
            </div>
            {badge ? (
              <div
                className="rounded-full px-5 py-2 text-[28px] font-bold text-black"
                style={{ backgroundColor: design.background.accent }}
              >
                × {badge}
              </div>
            ) : null}
          </header>
        ) : (
          <header className="flex items-center justify-center">
            <div
              className="inline-flex items-center gap-3 rounded-full px-6 py-3 text-[32px] font-bold text-white/95"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <span>{title}</span>
              {badge ? (
                <span
                  className="rounded-full px-3 py-1 text-[24px] font-bold text-black"
                  style={{ backgroundColor: design.background.accent }}
                >
                  × {badge}
                </span>
              ) : null}
            </div>
          </header>
        )}

        <main className="flex flex-1 items-center justify-center py-10">
          {design.template === 'frame' ? (
            <div
              className="w-full rounded-[28px] p-10"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
                border: `1px solid rgba(255,255,255,0.14)`,
              }}
            >
              <div
                className={`${fontFamily} whitespace-pre-wrap text-center leading-[1.35] text-white/95`}
                style={{ fontSize: mainSize }}
              >
                {dhikr.text}
              </div>
            </div>
          ) : design.template === 'stack' ? (
            <div className="w-full">
              <div
                className={`${fontFamily} whitespace-pre-wrap text-center leading-[1.35] text-white/95`}
                style={{ fontSize: mainSize }}
              >
                {dhikr.text}
              </div>
              {(options.showBenefit && dhikr.benefit) ||
              (options.showCount && dhikr.count_description) ? (
                <div
                  className="mt-10 rounded-[22px] p-8 text-[28px] leading-relaxed text-white/85"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.15))',
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  {options.showBenefit && dhikr.benefit ? (
                    <div className="whitespace-pre-wrap">{dhikr.benefit}</div>
                  ) : null}
                  {options.showCount && dhikr.count_description ? (
                    <div className="mt-4 whitespace-pre-wrap text-white/75">
                      {dhikr.count_description}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="w-full">
              <div
                className={`${fontFamily} whitespace-pre-wrap text-center leading-[1.35] text-white/95`}
                style={{ fontSize: mainSize }}
              >
                {dhikr.text}
              </div>
            </div>
          )}
        </main>

        <footer className="flex items-end justify-between gap-8">
          <div className="text-[22px] text-white/55">
            {options.showWatermark ? 'Azkar Generator • ATHAR' : ''}
          </div>

          <div className="text-left text-[22px] leading-relaxed text-white/70">
            {showFooterDetails && options.showBenefit && dhikr.benefit ? (
              <div className="max-w-[560px] whitespace-pre-wrap">{dhikr.benefit}</div>
            ) : null}
            {showFooterDetails && options.showCount && dhikr.count_description ? (
              <div className="mt-2 max-w-[560px] whitespace-pre-wrap text-white/60">
                {dhikr.count_description}
              </div>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  )
}

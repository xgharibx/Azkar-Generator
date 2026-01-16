export type AtharDhikr = {
  text: string
  benefit?: string
  count?: number | string
  count_description?: string
}

export type AtharSection = {
  id: string
  title: string
  content: AtharDhikr[]
}

export type AtharData = {
  sections: AtharSection[]
}

export type StoryDesign = {
  template: 'frame' | 'center' | 'split' | 'stack' | 'list'
  background: {
    from: string
    to: string
    accent: string
    mode: 'dark' | 'light'
    paper?: string
  }
  font: {
    family: 'sans' | 'serif'
  }
  decorations: {
    showPattern: boolean
    showGlow: boolean
  }
}

export type StoryOptions = {
  showBenefit: boolean
  showCount: boolean
  showWatermark: boolean
  watermarkText: string

  // Story layout controls
  columns: 1 | 2
  maxItems: number

  // Typography controls (base for list layouts)
  fontSize: number // px at 1080px width
  lineHeight: number
}

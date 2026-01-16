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
  template: 'frame' | 'center' | 'split' | 'stack'
  background: {
    from: string
    to: string
    accent: string
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
}

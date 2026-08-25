export interface Set {
  intro: string;
  projects: { id: string; why?: string }[];
}

export const sets: Record<string, Set> = {
  default: {
    intro: "a product designer with a creative director’s background. I design and test consumer and marketplace experiences where craft and proof carry equal weight.",
    projects: [
      { id: 'etsy-homepage' },
      { id: 'flow14-mental-health' },
      { id: 'etsy-collections' },
      { id: 'flow14-qwally' },
    ],
  },
  'babylist': {
    intro: "I’m Kyle Johnston, a product designer with a creative director’s background. I design and test consumer and marketplace experiences where craft and proof carry equal weight.",
    projects: [
      { id: 'etsy-homepage', why:'Why: demonstrates impact at scale + an AI-enabled workflow' },
      { id: 'etsy-landings', why:'Why: demonstrates systems thinking + product strategy' },
      { id: 'etsy-ios-faves', why:'Why: cross-platform design + product strategy' },
      { id: 'etsy-collections', why:'Why: this feature is similar to registries' },
    ],
  },
  'eli-lilly': {
    intro: "a product designer with a creative director’s background. I design and test consumer and marketplace experiences where craft and proof carry equal weight.",
    projects: [
      { id: 'flow14-medtronic-ux-ia' },
      { id: 'etsy-global-nav' },
      { id: 'etsy-homepage' },
      { id: 'flow14-qwally' },
    ],
  },
  'demo': {
    intro: "and this is a custom intro statement",
    projects: [
      { id: 'flow14-medtronic-ux-ia', why: 'Same migration problem you described, at ~40 surfaces.' },
      { id: 'demo-marketplace-homepage-redesign', why: 'Where the system met a high-traffic surface.' },
      { id: 'demo-wearable-onboarding', why: 'Constraint-heavy work, if that maps to your hardware side.' },
    ],
  },
};

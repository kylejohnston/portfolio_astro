export interface Set {
  heading?: string;
  intro: string;
  projects: { id: string; why?: string }[];
}

export const sets: Record<string, Set> = {
  default: {
    heading: "I’m Kyle Johnston,",
    intro: "a product designer with a creative director’s background. I design and test consumer and marketplace experiences where craft and results carry equal weight.",
    projects: [
      { id: 'etsy-homepage' },
      { id: 'flow14-mental-health' },
      { id: 'etsy-collections' },
      { id: 'flow14-qwally' },
    ],
  },
  'babylist': {
    heading: "Hello Babylist!",
    intro: "I’m Kyle Johnston, a product designer with a creative director’s background. I design and test consumer and marketplace experiences where craft and results carry equal weight.",
    projects: [
      { id: 'etsy-homepage', why:'Why: demonstrates impact at scale + an AI-enabled workflow' },
      { id: 'etsy-landings', why:'Why: demonstrates systems thinking + product strategy' },
      { id: 'etsy-ios-faves', why:'Why: cross-platform design + product strategy' },
      { id: 'etsy-collections', why:'Why: this feature is similar to registries' },
    ],
  },
  'eli-lilly': {
    heading: "I’m Kyle Johnston,",
    intro: "a product designer with a creative director’s background. I design and test consumer and marketplace experiences where craft and results carry equal weight.",
    projects: [
      { id: 'flow14-medtronic-ux-ia' },
      { id: 'etsy-global-nav' },
      { id: 'etsy-homepage' },
      { id: 'flow14-qwally' },
    ],
  },
};

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
      { id: 'etsy-homepage', why:'demonstrates impact at scale + an AI-enabled workflow' },
      { id: 'etsy-landings', why:'demonstrates systems thinking + product strategy' },
      { id: 'etsy-ios-faves', why:'cross-platform design + product strategy' },
      { id: 'etsy-collections', why:'this feature is similar to registries' },
    ],
  },
  'seatgeek': {
    heading: "Hi SeatGeek — I design the moment intent becomes a purchase.",
    intro: "I'm Kyle Johnston. At Etsy I owned that exact stretch—homepage, discovery, and collections—turning browsing into buying, $80M+ in combined revenue along the way.",
    projects: [
      { id: 'etsy-homepage', why: 'personalized the funnel entry point, validated with research and live A/B testing' },
      { id: 'etsy-landings', why: 'a literal shopping funnel—discovery-to-listing conversion, built as a flexible system' },
      { id: 'etsy-collections', why: 'highest experiment velocity at Etsy, $46M in data-driven revenue' },
      { id: 'flow14-qwally', why: '0-1 product design in ambiguity, direct stakeholder partnership' },
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

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
      { id: 'etsy-cursor-for-pds' },
      { id: 'etsy-collections' },
      { id: 'etsy-global-nav' },
      { id: 'flow14-mental-health' },
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
    intro: "I'm Kyle Johnston. At Etsy I owned that exact stretch—homepage, discovery, and collections—turning browsing into buying, driving $80M+ in combined revenue along the way.",
    projects: [
      { id: 'etsy-homepage', why: 'personalized the funnel entry point, validated with research and live A/B testing' },
      { id: 'etsy-landings', why: 'a literal shopping funnel—discovery-to-listing conversion, built as a flexible system' },
      { id: 'etsy-collections', why: 'highest experiment velocity at Etsy—UX, ranking, and placement tuned through rapid testing' },
      { id: 'flow14-qwally', why: 'no existing product to react to—direct partnership with city stakeholders through launch' },
    ],
  },
  'vanta': {
    heading: "Hi Vanta — I’m Kyle Johnston. I bring clarity to complex, interconnected systems and lead the design teams behind them.",
    intro: "Five years as a Staff Product Designer at Etsy sharpened my systems thinking and AI-native workflows. Before that, 12+ years managing in-house and agency teams shaped how I lead.",
    projects: [
      { id: 'etsy-global-nav', why: 'a north star vision for a whole product area, with exec buy-in to back it' },
      { id: 'etsy-homepage', why: 'a carousel design that scaled to support 65,000 personalized, ranked items' },
      { id: 'etsy-cursor-for-pds', why: "a proof of concept—AI-native onboarding that got designers to a working prototype without a trainer" },
      { id: 'flow14-qwally', why: 'zero-to-one for a process-heavy SaaS platform—no existing product to react to, direct partnership through launch' },
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

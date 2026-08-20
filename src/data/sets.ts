export interface Set {
  intro: string;
  projects: { id: string; why?: string }[];
}

export const sets: Record<string, Set> = {
  default: {
    intro: "a product designer with deep experience in UI/UX design, visual design, and branding. My sweet spot is solving for complex design challenges—keeping end-users at the center of every step in the journey.",
    projects: [
      { id: 'etsy-homepage' },
      { id: 'flow14-mental-health' },
      { id: 'etsy-collections' },
      { id: 'flow14-qwally' },
    ],
  },
  acme: {
    intro: 'Three projects on design systems at scale, closest to what we talked through Tuesday.',
    projects: [
      { id: 'demo-design-system-migration', why: 'Same migration problem you described, at ~40 surfaces.' },
      { id: 'demo-marketplace-homepage-redesign', why: 'Where the system met a high-traffic surface.' },
      { id: 'demo-wearable-onboarding', why: 'Constraint-heavy work, if that maps to your hardware side.' },
    ],
  },
};

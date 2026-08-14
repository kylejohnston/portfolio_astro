export interface Set {
  intro: string;
  projects: { id: string; why?: string }[];
}

export const sets: Record<string, Set> = {
  default: {
    intro: "I'm a staff product designer working on complex, systems-heavy problems.",
    projects: [
      { id: 'demo-marketplace-homepage-redesign' },
      { id: 'demo-wearable-onboarding' },
      { id: 'demo-design-system-migration' },
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

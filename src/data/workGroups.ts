export interface WorkGroup {
  label: string;
  ids: string[];
}

// Controls both grouping and order on /work. A project id not listed here
// is silently omitted from /work — it's still reachable directly at
// /work/<id> (and via /for/* curated pages in sets.ts) for one-off case
// studies that don't belong in a named group.
export const workGroups: WorkGroup[] = [
  {
    label: 'Etsy',
    ids: ['etsy-homepage', 'etsy-global-nav', 'etsy-collections', 'etsy-ios-faves'],
  },
  {
    label: 'flow14',
    ids: ['flow14-qwally', 'flow14-mental-health', 'flow14-vmc-group'],
  },
  {
    label: 'Garmin',
    ids: ['garmin-connect', 'garmin-mobile-web'],
  },
];

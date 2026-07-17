// App release notes rendered on the home page and in the What's New modal.
// Add new releases to the FRONT of the array; the modal re-shows whenever
// the latest version string changes.

export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const changelog: ReleaseNote[] = [
  {
    version: '1.0.0',
    date: 'July 2026',
    title: 'Update 1.0.0',
    changes: [
      'Homebrew content support — create & edit classes, subclasses, items, feats, spells, races, subraces, and backgrounds',
      'Info viewers & dialogs for all SRD content types, with sortable tables',
      'D&D rules reference & rules dictionary',
      'Search, pagination & filtering',
      'Dark mode, theming & menu restyle',
      'PWA / offline support — install flow, SRD preload, offline verification, update prompt, card-image caching',
      'DM/GM tools & AI homebrew generation groundwork',
      '5.1 & 5.2 SRD data',
    ],
  },
];

export const latestRelease = changelog[0];

export const upcomingFeatures: string[] = [
  'Accessibility & Mobile UI Improvements',
  'Deeper Homebrew Management (create/edit/share)',
  'Character Builder & Viewer',
  'Generate a Filled Character sheet PDF',
  'Generate Homebrew with AI',
  'Admin/GM Tools',
];

// New entries are prepended by `npm run bump "<subject>"` before a release commit.
// Each entry: { version, date (YYYY-MM-DD), summary (commit subject), notes? }
export interface ChangelogEntry {
  version: string
  date: string
  summary: string
  notes?: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.1.4',
    date: '2026-05-16',
    summary: 'chore: sync version bump from prepare-commit-msg',
  },
  {
    version: '0.1.3',
    date: '2026-05-16',
    summary: 'chore: add Luis Miguel to footer copyright',
  },
  {
    version: '0.1.2',
    date: '2026-05-16',
    summary: 'fix: move bump+changelog from pre-commit to prepare-commit-msg so it reads the real commit subject',
  },
  {
    version: '0.1.1',
    date: '2026-05-16',
    summary: 'feat: notebook redesign, button DNA, compact calendar, dev mode, secret scanner',
  },
  {
    version: '0.1.0',
    date: '2026-05-16',
    summary: 'Notebook redesign + design system',
    notes: [
      'Desktop dashboard rewritten as a centered notebook page',
      'New Button component (gradient + double shadow + hover scale)',
      'Modal: fade animation + backdrop blur on web',
      'Drag system replaced with up/down buttons + LinearTransition',
      'Count-up animation on the ledger stats',
      'Calendar redesigned (Cal.com-style cells, emojis inside, hover lift)',
      'Sidebar segmented with section labels',
      'Auto-seed of placeholder data on first launch',
    ],
  },
]

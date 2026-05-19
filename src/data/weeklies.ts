export interface WeeklySection {
  name: string
  url?: string
  acclaim?: number
  totalAcclaim?: number
  description?: string
  reward?: string
  notes?: string[]
}

export const WEEKLY_SECTIONS: WeeklySection[] = [
  {
    name: "Wizard's Vault",
    acclaim: 50,
    totalAcclaim: 750,
    description: '6 weekly objectives. Completion chest: 450 Acclaim, 10 Laurels, Tome of Knowledge.',
    notes: [
      'For jumping puzzles, commanders usually squad at completion (use TP to friend).',
      'Easy objectives list: https://wiki.guildwars2.com/wiki/Wizard%27s_Vault/Easy_objectives',
    ],
  },
  {
    name: 'Raid Encounters (Strikes / Quickplay)',
    reward: '6 Legendary Insight for completing 10 encounters a week',
  },
]

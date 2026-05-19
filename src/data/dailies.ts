export interface DailySection {
  name: string
  url?: string
  acclaim?: number
  totalAcclaim?: number
  description?: string
  tiers?: { name: string; url: string }[]
  notes?: string[]
}

export const DAILY_SECTIONS: DailySection[] = [
  {
    name: "Wizard's Vault",
    acclaim: 10,
    totalAcclaim: 60,
    description: '4 daily objectives. Completion chest: 1 Gold, 20 Acclaim, 250 reward track points per PvP/WvW objective.',
  },
  {
    name: '3 Daily Fractals + Recommended',
    description: 'Completing a higher-tier daily fractal rewards all tiers at and below it.',
    tiers: [
      { name: 'Tier 1 (Initiate)', url: "https://wiki.guildwars2.com/wiki/Fractal_Initiate%27s_Chest" },
      { name: 'Tier 2 (Adept)',    url: "https://wiki.guildwars2.com/wiki/Fractal_Adept%27s_Chest" },
      { name: 'Tier 3 (Expert)',   url: "https://wiki.guildwars2.com/wiki/Fractal_Expert%27s_Chest" },
      { name: 'Tier 4 (Master)',   url: "https://wiki.guildwars2.com/wiki/Fractal_Master%27s_Chest" },
    ],
  },
]

export interface VendorProduct {
  name: string
  limitStr?: string
  cost: string
}

export interface CompiledVendor {
  name: string
  url?: string
  products: VendorProduct[]
  notes?: string[]
}

export const VENDORS: CompiledVendor[] = [
  {
    name: 'BUY-4373',
    url: 'https://wiki.guildwars2.com/wiki/BUY-4373',
    products: [
      {
        name: 'Mystic Clovers',
        limitStr: '10 weekly',
        cost: '150 Fractal Relics + 2 Globs + 2 Mystic Coins + 2 Spirit Shards',
      },
      {
        name: 'Deeply Discounted Fractal Encryption Key',
        limitStr: '30 daily',
        cost: '1 Fractal Relic + 20 Silver each',
      },
      {
        name: 'Discounted Fractal Encryption Key',
        limitStr: '30 daily',
        cost: '1 Fractal Relic + 25 Silver + 4 Copper each',
      },
    ],
  },
  {
    name: 'Dugan (WvW)',
    url: 'https://wiki.guildwars2.com/wiki/Dugan',
    products: [
      {
        name: 'Mystic Clover',
        limitStr: '5 weekly',
        cost: '20 Skirmish Tickets + 10 Badge of Honor + 2 Globs + 2 Mystic Coins',
      },
      {
        name: 'Provisioner Token',
        limitStr: '25 weekly',
        cost: '5 Skirmish Tickets + 10 Badges + 5 Testimony of Jade Heroics + 5 Memories of Battle',
      },
    ],
  },
  {
    name: 'League Vendor (PvP)',
    url: 'https://wiki.guildwars2.com/wiki/League_Vendor',
    products: [
      {
        name: 'Mystic Clover',
        limitStr: '5 weekly',
        cost: '1 Emblem of Tournament Victory + 2 Globs + 2 Mystic Coins + 2 Spirit Shards',
      },
      {
        name: 'Mystic Clover',
        limitStr: '5 weekly',
        cost: '5 PvP Tickets + 2 Globs + 2 Mystic Coins + 2 Spirit Shards',
      },
      {
        name: 'Provisioner Token',
        limitStr: '15 weekly',
        cost: '5 PvP Tickets + 100 Shards of Glory',
      },
    ],
  },
  {
    name: 'Lyhr',
    url: 'https://wiki.guildwars2.com/wiki/Lyhr',
    products: [
      {
        name: 'Mystic Clover',
        limitStr: 'unlimited',
        cost: '3 Mystic Coins + 3 Obsidian Shards + 5 Globs + 3 Spirit Shards',
      },
    ],
  },
  {
    name: 'Miyani / Mystic Forge Attendant',
    url: 'https://wiki.guildwars2.com/wiki/Miyani',
    products: [
      {
        name: 'Mystic Clover',
        limitStr: '10 weekly',
        cost: '3 Mystic Coins + 3 Obsidian Shards + 3 Spirit Shards + 5 Globs',
      },
    ],
  },
  {
    name: "Wizard's Vault",
    products: [
      { name: 'Mystic Clover',        limitStr: '20 per season',  cost: '60 Astral Acclaim each' },
      { name: 'Mystic Coins',         limitStr: '60 per season',  cost: '9 Astral Acclaim each' },
      { name: 'Obsidian Shard',       limitStr: '20 per season',  cost: '30 Astral Acclaim each' },
      { name: 'Vision Crystal',       limitStr: '4 per season',   cost: '150 Astral Acclaim each' },
      { name: 'Bag of Coins (1 Gold)', limitStr: '100 per season', cost: '8 Astral Acclaim each' },
      { name: 'Bag of Laurels',       limitStr: '150 per season', cost: '10 Astral Acclaim each' },
      { name: 'Tome of Knowledge',    limitStr: '35 per season',  cost: '8 Astral Acclaim each' },
    ],
  },
  {
    name: 'Manfred Njallson (Raids)',
    url: 'https://wiki.guildwars2.com/wiki/Manfred_Njallson',
    products: [
      {
        name: 'Mystic Clover',
        limitStr: '15 weekly',
        cost: '2 Globs + 2 Mystic Coins + 2 Spirit Shards + 30 Magnetite Shards',
      },
      {
        name: 'Mystic Coin',
        limitStr: '10 weekly',
        cost: '1 Spirit Shard + 10 Magnetite Shards',
      },
    ],
  },
  {
    name: 'Gharr Leadclaw (Exchanges)',
    products: [
      {
        name: 'Astral Fluctuating Mass',
        limitStr: '42 weekly',
        cost: 'Good sink for Bloodstone / Empyreal / Dragonite',
      },
    ],
  },
  {
    name: 'Faction Provisioners',
    products: [],
    notes: [
      '7 tokens each vendor, weekly. Look at Heart of Thorns vendor table for cheap TP weapons.',
      'Quartermaster Natomi — waypoint [&BN4HAAA=]',
      'Scavenger Rakatin — waypoint [&BNYHAAA=]',
      'Supply Assistant — waypoint [&BMwHAAA=]',
    ],
  },
]

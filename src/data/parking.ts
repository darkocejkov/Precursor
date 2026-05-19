export interface ParkingSpot {
  name: string
  url?: string
  image?: string
  rewards: string[]
}

export interface ParkingGroup {
  name: string
  notes?: string[]
  spots: ParkingSpot[]
}

export const PARKING_GROUPS: ParkingGroup[] = [
  {
    name: 'Bjora Marches (Icebrood Saga)',
    notes: [
      'Look out for eternal ice nodes.',
      'Requires masteries for essence chests.',
      'Recommended: Prototype Position Rewinder.',
    ],
    spots: [
      {
        name: 'Ox Shrine',
        url: 'https://fast.farming-community.eu/alt-parking-details/large-chest-of-essence/bjora-marches-large-chest-of-resilience',
        image: 'https://fast.farming-community.eu/assets/images/alt_parking/alt_parking_bjora_marches_large_chest_of_resilience.jpg',
        rewards: ['Large Chest', 'Small Chest', 'Medium Chest', 'Glorious Norn Chest'],
      },
      {
        name: 'Eaglewatch Rise',
        url: 'https://fast.farming-community.eu/alt-parking-details/large-chest-of-essence/bjora-marches-large-chest-of-vigilance',
        image: 'https://fast.farming-community.eu/assets/images/alt_parking/alt_parking_bjora_marches_large_chest_of_vigilance.jpg',
        rewards: ['1 Large Chest', '2 Small Chests'],
      },
      {
        name: 'Forest of a Thousand Voices',
        url: 'https://fast.farming-community.eu/alt-parking-details/large-chest-of-essence/bjora-marches-large-chest-of-valor',
        image: 'https://fast.farming-community.eu/assets/images/alt_parking/alt_parking_bjora_marches_large_chest_of_valor.jpg',
        rewards: ['Large Chest', 'Medium Chest', 'Norn Chest'],
      },
    ],
  },
  {
    name: 'Magic Mirrors (Visions of Eternity)',
    spots: [
      {
        name: 'Starlit Weald',
        url: 'https://fast.farming-community.eu/alt-parking-details/magic-mirror/starlit-weald-magic-mirror',
        image: 'https://fast.farming-community.eu/assets/images/alt_parking/alt_parking_starlit_weald_magic_mirror_all.png',
        rewards: ['Magic Mirror loot'],
      },
      {
        name: 'Shipwreck Strand',
        url: 'https://fast.farming-community.eu/alt-parking-details/magic-mirror/shipwreck-strand-magic-mirror',
        image: 'https://fast.farming-community.eu/assets/images/alt_parking/alt_parking_shipwreck_strand_magic_mirror_all.png',
        rewards: ['Magic Mirror loot'],
      },
    ],
  },
]

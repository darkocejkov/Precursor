export type MatType = 'foraging' | 'logging' | 'shellfish'

export interface GatheringMaterial {
  name: string
  count: number
  type: MatType
}

export interface GatheringNode {
  zone: string
  location: string
  waypoint: string
  image?: string
  materials: GatheringMaterial[]
}

export const VM_RANGE: Record<MatType, [number, number]> = {
  foraging:  [3, 9],
  logging:   [1, 3],
  shellfish: [1, 3],
}

export function estimateVM(node: GatheringNode): { min: number; avg: number; max: number } {
  let min = 0
  let avg = 0
  let max = 0
  for (const mat of node.materials) {
    const [lo, hi] = VM_RANGE[mat.type]
    min += mat.count * lo
    avg += mat.count * (lo + hi) / 2
    max += mat.count * hi
  }
  return { min, avg: Math.round(avg), max }
}

export const GATHERING_NODES: GatheringNode[] = [
  {
    zone: 'Seitung Province',
    location: 'Village',
    waypoint: '[&BJ4MAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Seitung%20Province1.png',
    materials: [
      { name: 'Cabbage',       count: 3,  type: 'foraging' },
      { name: 'Carrot',        count: 3,  type: 'foraging' },
      { name: 'Flax',          count: 5,  type: 'foraging' },
      { name: 'Thyme',         count: 1,  type: 'foraging' },
      { name: 'Parsley',       count: 1,  type: 'foraging' },
      { name: 'Lotus',         count: 9,  type: 'foraging' },
      { name: 'Potatoes',      count: 4,  type: 'foraging' },
      { name: 'Soybeans',      count: 3,  type: 'foraging' },
      { name: 'Sugar Pumpkins', count: 4, type: 'foraging' },
      { name: 'Zucchini',      count: 4,  type: 'foraging' },
    ],
  },
  {
    zone: 'Dry Top',
    location: 'Vine Bridge',
    waypoint: '[&BIYHAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Dry%20Top%20-%20Perma%20Carrot%20Lettuce%20Cabbage%20&%20Cactus.jpg',
    materials: [
      { name: 'Carrot',  count: 4, type: 'foraging' },
      { name: 'Lettuce', count: 4, type: 'foraging' },
      { name: 'Cabbage', count: 2, type: 'foraging' },
      { name: 'Cactus',  count: 4, type: 'foraging' },
    ],
  },
  {
    zone: 'Verdant Brink',
    location: 'Jaka Itzel',
    waypoint: '[&BOAHAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Verdant%20Brink%20-%20Perma%20Flax.jpg',
    materials: [
      { name: 'Flax', count: 12, type: 'foraging' },
    ],
  },
  {
    zone: 'Verdant Brink',
    location: 'Shipwreck Peak',
    waypoint: '[&BN4HAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/15%20-%20Mussels%20-%20Verdant%20Brink%20-%20Shipwreck%20Peak%20Waypoint.png',
    materials: [
      { name: 'Mussels', count: 11, type: 'shellfish' },
    ],
  },
  {
    zone: 'Ember Bay',
    location: 'Castaway Circus',
    waypoint: '[&BHgJAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Elder%20Wood%20-%20Ember%20Bay%20-%20Castaway%20Circus%20Waypoint.png',
    materials: [
      { name: 'Elder Wood', count: 15, type: 'logging' },
    ],
  },
  {
    zone: 'Bloodstone Fen',
    location: "Soulkeeper's Airship",
    waypoint: '[&BEsJAAA=]',
    image: "https://gw2efficiency.com/assets/gathering/permanent/Elder%20Wood%20-%20Soulkeeper's%20Airship%20Waypoint.png",
    materials: [
      { name: 'Elder Wood', count: 14, type: 'logging' },
    ],
  },
  {
    zone: 'Straits of Devastation',
    location: 'Waywarde',
    waypoint: '[&BPgCAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Straits%20of%20Devastation%20-%20Perma%20Elder%20Wood.jpg',
    materials: [
      { name: 'Elder Wood', count: 12, type: 'logging' },
    ],
  },
  {
    zone: 'Straits of Devastation',
    location: 'Plinth Timberland',
    waypoint: '[&BFgGAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Straits%20of%20Devastation%20-%20Perma%20Artichokes.jpg',
    materials: [
      { name: 'Artichoke', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: "Malchor's Leap",
    location: "Pagga's",
    waypoint: '[&BKYCAAA=]',
    image: "https://gw2efficiency.com/assets/gathering/permanent/Machor's%20Leap%20-%20Perma%20Elder%20Wood.jpg",
    materials: [
      { name: 'Elder Wood', count: 15, type: 'logging' },
    ],
  },
  {
    zone: 'Sparkfly Fen',
    location: "Ocean's Gulley",
    waypoint: '[&BMkBAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Sparkfly%20Fen%20-%20Perma%20Cauliflower.jpg',
    materials: [
      { name: 'Cauliflower', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Mount Maelstrom',
    location: 'Oxbow Isle',
    waypoint: '[&BNECAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Mount%20Maelstrom%20-%20Perma%20Artichokes.jpg',
    materials: [
      { name: 'Artichoke', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Metrica Province',
    location: 'Akk Wilds',
    waypoint: '[&BEIAAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Metrica%20Province%20-%20Perma%20Potatoes.jpg',
    materials: [
      { name: 'Potatoes', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Caledon Forest',
    location: 'Kraitbane Haven',
    waypoint: '[&BEABAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Caledon%20Forest%20-%20Perma%20Lettuce.jpg',
    materials: [
      { name: 'Lettuce', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Queensdale',
    location: 'Beetletun',
    waypoint: '[&BPoAAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Queensdale%20-%20Perma%20Lettuce.jpg',
    materials: [
      { name: 'Lettuce', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Kessex Hills',
    location: 'Cereboth',
    waypoint: '[&BBIAAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Kessex%20Hills%20-%20Perma%20Strawberry%20Patch.jpg',
    materials: [
      { name: 'Strawberries', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Harathi Hinterlands',
    location: 'Demetra',
    waypoint: '[&BKsAAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Harathi%20Hinterlands%20-%20Perma%20Cabbage.jpg',
    materials: [
      { name: 'Cabbage', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Gendarran Fields',
    location: 'Provern Shore',
    waypoint: '[&BOQAAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Gendarren%20Fields%20-%20Perma%20Spinach.jpg',
    materials: [
      { name: 'Spinach', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Bloodtide Coast',
    location: 'Remanda',
    waypoint: '[&BKcBAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Bloodtide%20Coast%20-%20Perma%20Sugar%20Pumpkins.jpg',
    materials: [
      { name: 'Sugar Pumpkins', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Timberline Falls',
    location: 'Thistlereed',
    waypoint: '[&BFECAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Timberline%20Falls%20-%20Perma%20Cauliflower.jpg',
    materials: [
      { name: 'Cauliflower', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Snowden Drifts',
    location: "Reaver's",
    waypoint: '[&BMAAAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Snowden%20Drifts%20-%20Perma%20Strawberry%20Patch.jpg',
    materials: [
      { name: 'Strawberries', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: "Lornar's Pass",
    location: "Demon's Maw",
    waypoint: '[&BOYAAAA=]',
    image: "https://gw2efficiency.com/assets/gathering/permanent/Lornar's%20Pass%20-%20Perma%20Grapes.jpg",
    materials: [
      { name: 'Grapes', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Frostgorge Sound',
    location: 'Arundon',
    waypoint: '[&BHgCAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Frostgorge%20Sound%20-%20Perma%20Butternut%20Squash.jpg',
    materials: [
      { name: 'Butternut Squash', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Dredgehaunt Cliffs',
    location: 'Wide Expanse',
    waypoint: '[&BF8CAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Dredgehaunt%20Cliffs%20-%20Perma%20Cabbage.jpg',
    materials: [
      { name: 'Cabbage', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Plains of Ashford',
    location: 'Loreclaw',
    waypoint: '[&BMcDAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Plains%20of%20Ashford%20-%20Perma%20Potatoes.jpg',
    materials: [
      { name: 'Potatoes', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Iron Marches',
    location: 'Bulwark',
    waypoint: '[&BOwBAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Iron%20Marches%20-%20Perma%20Sugar%20Pumpkins.jpg',
    materials: [
      { name: 'Sugar Pumpkins', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Grothmar Valley',
    location: 'Blood Keep',
    waypoint: '[&BBsMAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Grothmar%20Valley1.png',
    materials: [
      { name: 'Cabbage',       count: 3, type: 'foraging' },
      { name: 'Lettuce',       count: 3, type: 'foraging' },
      { name: 'Potatoes',      count: 3, type: 'foraging' },
      { name: 'Strawberries',  count: 3, type: 'foraging' },
      { name: 'Sugar Pumpkins', count: 3, type: 'foraging' },
      { name: 'Zucchini',      count: 3, type: 'foraging' },
    ],
  },
  {
    zone: 'Fireheart Rise',
    location: 'Apostate',
    waypoint: '[&BB0CAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Fireheart%20Rise%20-%20Perma%20Butternut%20Squash.jpg',
    materials: [
      { name: 'Butternut Squash', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Fields of Ruin',
    location: 'Ogre Road',
    waypoint: '[&BE8BAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Fields%20of%20Ruin%20-%20Perma%20Grapes.jpg',
    materials: [
      { name: 'Grapes', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Diessa Plateau',
    location: 'Nolan',
    waypoint: '[&BN4AAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Diessa%20Plateau%20-%20Perma%20Strawberry%20Patch.jpg',
    materials: [
      { name: 'Strawberries', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'Blazeridge Steppes',
    location: 'Lunk Kraal',
    waypoint: '[&BAACAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Blazeridge%20Steppes%20-%20Perma%20Cabbage.jpg',
    materials: [
      { name: 'Cabbage', count: 8, type: 'foraging' },
    ],
  },
  {
    zone: 'The Desolation',
    location: 'Bonestrand',
    waypoint: '[&BNwKAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/11%20-%20Carrots%20-%20The%20Desolation%20-%20Bonestrand%20Waypoint.png',
    materials: [
      { name: 'Carrot', count: 7, type: 'foraging' },
    ],
  },
  {
    zone: 'Sandswept Isles',
    location: 'Atholma',
    waypoint: '[&BEMLAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/12%20-%20Mixed%20-%20Sandswept%20Isles%20-%20Atholma%20Waypoint.png',
    materials: [
      { name: 'Artichoke', count: 4, type: 'foraging' },
      { name: 'Cabbage',   count: 4, type: 'foraging' },
      { name: 'Lentils',   count: 4, type: 'foraging' },
    ],
  },
  {
    zone: 'Jahai Bluffs',
    location: 'Reclaimed Chantry',
    waypoint: '[&BJkLAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Flax%20-%20Reclaimed%20Chantry%20Waypoint.png',
    materials: [
      { name: 'Flax', count: 12, type: 'foraging' },
    ],
  },
  {
    zone: 'Domain of Kourna',
    location: 'Allied Encampment',
    waypoint: '[&BFcLAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/Flax%20-%20Allied%20Encampment%20Waypoint.png',
    materials: [
      { name: 'Flax', count: 12, type: 'foraging' },
    ],
  },
  {
    zone: 'Desert Highlands',
    location: 'Brightwater',
    waypoint: '[&BJEKAAA=]',
    image: 'https://gw2efficiency.com/assets/gathering/permanent/7%20-%20Strawberry%20-%20Desert%20Highlands%20-%20Brightwater%20Waypoint.png',
    materials: [
      { name: 'Strawberries', count: 6, type: 'foraging' },
    ],
  },
  {
    zone: 'Shipwreck Strand',
    location: 'Pub Canach',
    waypoint: '[&BJEPAAA=]',
    materials: [
      { name: 'Pumpkins',        count: 3, type: 'foraging' },
      { name: 'Cabbage',         count: 6, type: 'foraging' },
      { name: 'Butternut Squash', count: 3, type: 'foraging' },
    ],
  },
]

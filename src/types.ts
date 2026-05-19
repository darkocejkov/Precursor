export interface MaterialNode {
  name: string;
  quantity?: number;
  itemId?: number;
  source?: string;
  note?: string;
  children?: MaterialNode[];
}

export interface LegendaryItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory';
  subtype: string;
  isFullSet?: boolean;
  /** GW2 item IDs for checking against /v2/account/legendaryarmory */
  legendaryItemIds?: number[];
  components: MaterialNode[];
}

export type Category = 'armor' | 'weapon' | 'accessory';

export interface PlayerInventory {
  /** itemId -> total count across bank + material storage */
  counts: Map<number, number>;
}

export interface GW2BankSlot {
  id: number;
  count: number;
}

export interface GW2MaterialSlot {
  id: number;
  category: number;
  count: number;
}

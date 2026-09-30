import { upgradeCost } from './economy';
import { UPGRADE_IDS } from './ids';
import type { UpgradeDef } from './types';

export interface ShopEntry extends UpgradeDef {
  speed?: number;
  color?: number;
}

export { UPGRADE_IDS };

export const SHOP_ENTRIES: ShopEntry[] = [
  {
    id: UPGRADE_IDS.machineSpeed,
    name: 'Gépsebesség',
    desc: 'Az automata gyorsabban nyeli be a palackokat',
    icon: '⚙️',
    category: 'gep',
    baseCost: 150,
    growth: 1.3,
    maxLevel: 15,
  },
  {
    id: UPGRADE_IDS.capacity,
    name: 'Sor-kapacitás',
    desc: 'Nagyobb sor fér el a gépben, kevesebb dugulás',
    icon: '📦',
    category: 'gep',
    baseCost: 300,
    growth: 1.45,
    maxLevel: 10,
  },
  {
    id: UPGRADE_IDS.price,
    name: 'Árszorzó',
    desc: 'Minden visszaváltás többet ér',
    icon: '💰',
    category: 'bonusz',
    baseCost: 1200,
    growth: 2.1,
    maxLevel: 25,
  },
  {
    id: UPGRADE_IDS.spawn,
    name: 'Gyűjtőterület',
    desc: 'Több palack jelenik meg egyszerre',
    icon: '🍾',
    category: 'bonusz',
    baseCost: 400,
    growth: 1.55,
    maxLevel: 8,
  },
  {
    id: UPGRADE_IDS.collectorBela,
    name: 'Béla',
    desc: 'Gyűjti a palackokat és bedobja őket',
    icon: '👷',
    category: 'csapat',
    baseCost: 600,
    growth: 2.6,
    maxLevel: 10,
    speed: 1.7,
    color: 0x4a90d9,
  },
  {
    id: UPGRADE_IDS.collectorGyula,
    name: 'Gyula',
    desc: 'Gyorsabb futó, ő sem szól, ha van munka',
    icon: '🧢',
    category: 'csapat',
    baseCost: 12_000,
    growth: 2.7,
    maxLevel: 10,
    speed: 2.3,
    color: 0xe2711d,
  },
  {
    id: UPGRADE_IDS.collectorMari,
    name: 'Mari',
    desc: 'Villámgyors, prémium palackokra specializálódott',
    icon: '🧑‍🔧',
    category: 'csapat',
    baseCost: 250_000,
    growth: 2.8,
    maxLevel: 10,
    speed: 3.1,
    color: 0x9b59b6,
  },
];

const BY_ID = new Map(SHOP_ENTRIES.map((entry) => [entry.id, entry]));

export const SHOP_CATEGORY_ORDER: UpgradeDef['category'][] = ['gep', 'csapat', 'bonusz'];

export const SHOP_CATEGORY_LABELS: Record<UpgradeDef['category'], string> = {
  gep: 'Gép',
  csapat: 'Csapat',
  bonusz: 'Bónusz',
};

export function entryById(id: string): ShopEntry | undefined {
  return BY_ID.get(id);
}

export function entryCost(entry: ShopEntry, level: number): number {
  return upgradeCost(entry, level);
}

export function isCollector(entry: ShopEntry): boolean {
  return entry.category === 'csapat';
}

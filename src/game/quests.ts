import { upgradeLevel } from './economy';
import { UPGRADE_IDS } from './ids';
import type { GameState } from './types';
import { SHOP_ENTRIES, isCollector } from './upgrades';

export type QuestMetric =
  | 'totalBottles'
  | 'totalMoney'
  | 'playTime'
  | 'totalPremiumBottles'
  | 'upgrade'
  | 'collectors';

export interface QuestReward {
  money: number;
  upgrade?: string;
}

export interface QuestDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  metric: QuestMetric;
  goal: number;
  targetId?: string;
  reward: QuestReward;
}

export const QUESTS: QuestDef[] = [
  {
    id: 'q-elso-palack',
    name: 'Az első palack',
    desc: 'Válts vissza 1 palackot',
    icon: '🥤',
    metric: 'totalBottles',
    goal: 1,
    reward: { money: 150 },
  },
  {
    id: 'q-tiz-palack',
    name: 'Kis indulás',
    desc: 'Összesen 10 palack a gépben',
    icon: '📦',
    metric: 'totalBottles',
    goal: 10,
    reward: { money: 600 },
  },
  {
    id: 'q-szaz-palack',
    name: 'Száz darab',
    desc: 'Összesen 100 palackot válts vissza',
    icon: '💯',
    metric: 'totalBottles',
    goal: 100,
    reward: { money: 5_000 },
  },
  {
    id: 'q-elso-fejlesztes',
    name: 'Gépész',
    desc: 'Fejleszd a gépsebességet 3. szintre',
    icon: '⚙️',
    metric: 'upgrade',
    goal: 3,
    targetId: UPGRADE_IDS.machineSpeed,
    reward: { money: 2_500 },
  },
  {
    id: 'q-bela',
    name: 'Első alkalmazott',
    desc: 'Bérelj fel egy gyűjtőt',
    icon: '👷',
    metric: 'collectors',
    goal: 1,
    reward: { money: 4_000, upgrade: UPGRADE_IDS.capacity },
  },
  {
    id: 'q-kapacitas',
    name: 'Nagyobb sor',
    desc: 'Fejleszd a sor-kapacitást 3. szintre',
    icon: '🚚',
    metric: 'upgrade',
    goal: 3,
    targetId: UPGRADE_IDS.capacity,
    reward: { money: 12_000 },
  },
  {
    id: 'q-ezer-palack',
    name: 'Ezresszázalék',
    desc: 'Összesen 1 000 palackot válts vissza',
    icon: '🏅',
    metric: 'totalBottles',
    goal: 1_000,
    reward: { money: 40_000 },
  },
  {
    id: 'q-utcas-penz',
    name: 'Üzlet a gáton',
    desc: 'Gyűjts össze 100 000 Ft bevételt (összesen)',
    icon: '💰',
    metric: 'totalMoney',
    goal: 100_000,
    reward: { money: 15_000, upgrade: UPGRADE_IDS.price },
  },
  {
    id: 'q-csapat',
    name: 'Csapatmunka',
    desc: 'Legyen összesen 5 gyűjtőd',
    icon: '👥',
    metric: 'collectors',
    goal: 5,
    reward: { money: 90_000, upgrade: UPGRADE_IDS.machineSpeed },
  },
  {
    id: 'q-premium',
    name: 'Üveggyűjtő',
    desc: 'Válts vissza 50 prémium üveget',
    icon: '🍷',
    metric: 'totalPremiumBottles',
    goal: 50,
    reward: { money: 60_000 },
  },
  {
    id: 'q-arszorzo',
    name: 'Prémium árazás',
    desc: 'Fejleszd az árszorzót 5. szintre',
    icon: '📈',
    metric: 'upgrade',
    goal: 5,
    targetId: UPGRADE_IDS.price,
    reward: { money: 150_000, upgrade: UPGRADE_IDS.spawn },
  },
  {
    id: 'q-maraton',
    name: 'Repont maraton',
    desc: 'Összesen 10 000 palackot válts vissza',
    icon: '🏆',
    metric: 'totalBottles',
    goal: 10_000,
    reward: { money: 750_000 },
  },
];

export function collectorLevelSum(state: GameState): number {
  return SHOP_ENTRIES.filter((entry) => isCollector(entry)).reduce(
    (sum, entry) => sum + upgradeLevel(state, entry.id),
    0,
  );
}

export function questProgress(state: GameState, def: QuestDef): number {
  switch (def.metric) {
    case 'totalBottles':
      return state.totalBottles;
    case 'totalMoney':
      return state.totalMoney;
    case 'playTime':
      return Math.floor(state.playTime);
    case 'totalPremiumBottles':
      return state.totalPremiumBottles;
    case 'upgrade':
      return upgradeLevel(state, def.targetId ?? '');
    case 'collectors':
      return collectorLevelSum(state);
  }
}

export function questPercent(state: GameState, def: QuestDef): number {
  return Math.min(100, (questProgress(state, def) / def.goal) * 100);
}

export function isClaimed(state: GameState, def: QuestDef): boolean {
  return state.quests[def.id]?.claimed === true;
}

export function isComplete(state: GameState, def: QuestDef): boolean {
  return questProgress(state, def) >= def.goal;
}

export function isClaimable(state: GameState, def: QuestDef): boolean {
  return !isClaimed(state, def) && isComplete(state, def);
}

export function activeQuest(state: GameState): QuestDef | null {
  return QUESTS.find((def) => !isClaimed(state, def)) ?? null;
}

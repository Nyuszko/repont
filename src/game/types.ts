export type BottleTypeId = 'pet' | 'doboz' | 'zsugoritott' | 'premium';

export interface BottleType {
  id: BottleTypeId;
  name: string;
  value: number;
  weight: number;
  color: string;
}

export type UpgradeCategory = 'gep' | 'csapat' | 'bonusz';

export interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: UpgradeCategory;
  baseCost: number;
  growth: number;
  maxLevel: number;
}

export interface QuestProgress {
  progress: number;
  claimed: boolean;
}

export interface GameState {
  money: number;
  totalMoney: number;
  totalBottles: number;
  totalPremiumBottles: number;
  inventory: Record<BottleTypeId, number>;
  upgrades: Record<string, number>;
  quests: Record<string, QuestProgress>;
  soundEnabled: boolean;
  prestigeCount: number;
  prestigeMultiplier: number;
  locationId: string;
  unlockedLocations: string[];
  playTime: number;
  createdAt: number;
  lastSeen: number;
}

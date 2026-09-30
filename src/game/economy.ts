import { UPGRADE_IDS } from './ids';
import type { BottleType, GameState, UpgradeDef } from './types';

export const PRICE_STEP = 0.25;

export function priceMultiplierAt(level: number): number {
  return 1 + PRICE_STEP * level;
}

export function priceMultiplier(state: GameState): number {
  return priceMultiplierAt(upgradeLevel(state, UPGRADE_IDS.price));
}

export function bottleValue(state: GameState, type: BottleType): number {
  return Math.max(1, Math.round(type.value * priceMultiplier(state) * state.prestigeMultiplier));
}

export function upgradeCost(
  def: Pick<UpgradeDef, 'baseCost' | 'growth'>,
  currentLevel: number,
): number {
  return Math.ceil(def.baseCost * Math.pow(def.growth, currentLevel));
}

export function upgradeLevel(state: GameState, id: string): number {
  return state.upgrades[id] ?? 0;
}

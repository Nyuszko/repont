import type { BottleType, GameState, UpgradeDef } from './types';

export function bottleValue(state: GameState, type: BottleType): number {
  return Math.max(1, Math.round(type.value * state.prestigeMultiplier));
}

export function upgradeCost(def: UpgradeDef, currentLevel: number): number {
  return Math.ceil(def.baseCost * Math.pow(def.growth, currentLevel));
}

export function upgradeLevel(state: GameState, id: string): number {
  return state.upgrades[id] ?? 0;
}

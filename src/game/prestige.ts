import type { GameState } from './types';

export const PRESTIGE_BASE_COST = 5_000_000;
export const PRESTIGE_GROWTH = 4;

export interface PrestigeGain {
  count: number;
  multiplier: number;
  bonusMoney: number;
}

export function prestigeCost(state: GameState): number {
  return Math.ceil(PRESTIGE_BASE_COST * Math.pow(PRESTIGE_GROWTH, state.prestigeCount));
}

export function prestigeMultiplierFor(count: number): number {
  return 1 + 0.25 * count;
}

export function canPrestige(state: GameState): boolean {
  return state.totalMoney >= prestigeCost(state);
}

export function nextMultiplier(state: GameState): number {
  return prestigeMultiplierFor(state.prestigeCount + 1);
}

export function prestigeGain(state: GameState): PrestigeGain {
  const count = state.prestigeCount + 1;
  return {
    count,
    multiplier: prestigeMultiplierFor(count),
    bonusMoney: Math.floor(prestigeBonus(state, count)),
  };
}

export function prestigeBonus(state: GameState, count: number): number {
  return state.totalMoney * 0.05 * count;
}

import type { BottleTypeId, GameState } from './types';

export function emptyInventory(): Record<BottleTypeId, number> {
  return { pet: 0, doboz: 0, zsugoritott: 0, premium: 0 };
}

export function createInitialState(now = Date.now()): GameState {
  return {
    money: 0,
    totalMoney: 0,
    totalBottles: 0,
    inventory: emptyInventory(),
    upgrades: {},
    quests: {},
    soundEnabled: true,
    prestigeCount: 0,
    prestigeMultiplier: 1,
    locationId: 'lakotelep',
    unlockedLocations: ['lakotelep'],
    playTime: 0,
    createdAt: now,
    lastSeen: now,
  };
}

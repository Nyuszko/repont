import { priceMultiplierAt, upgradeLevel } from './economy';
import { UPGRADE_IDS } from './ids';
import type { GameState } from './types';
import { isCollector, type ShopEntry } from './upgrades';

export const MACHINE_BASE_INTERVAL = 0.45;
export const SPAWN_BASE_INTERVAL = 0.9;
export const BASE_TARGET_BOTTLES = 12;
export const BASE_CAPACITY = 12;
export const CAPACITY_STEP = 8;
export const TARGET_STEP = 3;

export function machineIntervalAt(level: number): number {
  return Math.max(0.12, MACHINE_BASE_INTERVAL / (1 + 0.18 * level));
}

export function machineInterval(state: GameState): number {
  return machineIntervalAt(upgradeLevel(state, UPGRADE_IDS.machineSpeed));
}

export function spawnIntervalAt(level: number): number {
  return Math.max(0.15, SPAWN_BASE_INTERVAL / (1 + 0.15 * level));
}

export function spawnInterval(state: GameState): number {
  return spawnIntervalAt(upgradeLevel(state, UPGRADE_IDS.spawn));
}

export function targetBottlesAt(level: number): number {
  return BASE_TARGET_BOTTLES + TARGET_STEP * level;
}

export function targetBottles(state: GameState): number {
  return targetBottlesAt(upgradeLevel(state, UPGRADE_IDS.spawn));
}

export function capacityAt(level: number): number {
  return BASE_CAPACITY + CAPACITY_STEP * level;
}

export function capacity(state: GameState): number {
  return capacityAt(upgradeLevel(state, UPGRADE_IDS.capacity));
}

export function collectorSpeedAt(level: number, baseSpeed: number): number {
  return baseSpeed * (1 + 0.12 * level);
}

export interface ActiveCollectorSpec {
  id: string;
  name: string;
  level: number;
  speed: number;
  color: number;
}

export function collectorSpecs(state: GameState, entries: ShopEntry[]): ActiveCollectorSpec[] {
  const specs: ActiveCollectorSpec[] = [];
  for (const entry of entries) {
    if (!isCollector(entry)) continue;
    const level = upgradeLevel(state, entry.id);
    if (level <= 0) continue;
    specs.push({
      id: entry.id,
      name: entry.name,
      level,
      speed: collectorSpeedAt(level, entry.speed ?? 1.5),
      color: entry.color ?? 0x4a90d9,
    });
  }
  return specs;
}

export function effectText(entry: ShopEntry, level: number): string {
  switch (entry.id) {
    case UPGRADE_IDS.machineSpeed:
      return `${machineIntervalAt(level).toFixed(2)} mp/palack`;
    case UPGRADE_IDS.capacity:
      return `${capacityAt(level)} palack a sorban`;
    case UPGRADE_IDS.price:
      return `+${Math.round((priceMultiplierAt(level) - 1) * 100)}% palackérték`;
    case UPGRADE_IDS.spawn:
      return `${targetBottlesAt(level)} palack a színtéren`;
    default:
      return `${level} fő · ${collectorSpeedAt(level, entry.speed ?? 1.5).toFixed(1)} m/s`;
  }
}

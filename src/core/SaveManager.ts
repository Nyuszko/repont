import { createInitialState } from '../game/state';
import type { BottleTypeId, GameState, QuestProgress } from '../game/types';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const SAVE_KEY = 'repont-save';
export const SCHEMA_VERSION = 2;

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

const MIGRATIONS: Record<number, Migration> = {
  1: (raw) => ({ ...raw, totalPremiumBottles: num(raw.totalPremiumBottles, 0) }),
};

interface SaveFile {
  version: number;
  savedAt: number;
  state: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function numRecord(value: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isRecord(value)) return out;
  for (const [key, val] of Object.entries(value)) {
    if (typeof val === 'number' && Number.isFinite(val)) out[key] = val;
  }
  return out;
}

function pickInventory(raw: unknown, fallback: Record<BottleTypeId, number>): Record<BottleTypeId, number> {
  const out = { ...fallback };
  if (!isRecord(raw)) return out;
  for (const key of Object.keys(fallback) as BottleTypeId[]) {
    out[key] = num(raw[key], fallback[key]);
  }
  return out;
}

export function normalizeState(raw: unknown, now = Date.now()): GameState {
  const base = createInitialState(now);
  if (!isRecord(raw)) return base;
  const locations = Array.isArray(raw.unlockedLocations)
    ? raw.unlockedLocations.filter((v): v is string => typeof v === 'string')
    : base.unlockedLocations;
  return {
    money: num(raw.money, base.money),
    totalMoney: num(raw.totalMoney, base.totalMoney),
    totalBottles: num(raw.totalBottles, base.totalBottles),
    totalPremiumBottles: num(raw.totalPremiumBottles, base.totalPremiumBottles),
    inventory: pickInventory(raw.inventory, base.inventory),
    upgrades: numRecord(raw.upgrades),
    quests: isRecord(raw.quests) ? (raw.quests as Record<string, QuestProgress>) : base.quests,
    soundEnabled: typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : base.soundEnabled,
    prestigeCount: num(raw.prestigeCount, base.prestigeCount),
    prestigeMultiplier: num(raw.prestigeMultiplier, base.prestigeMultiplier),
    locationId: typeof raw.locationId === 'string' ? raw.locationId : base.locationId,
    unlockedLocations: locations.length > 0 ? locations : [...base.unlockedLocations],
    playTime: num(raw.playTime, base.playTime),
    createdAt: num(raw.createdAt, base.createdAt),
    lastSeen: num(raw.lastSeen, now),
  };
}

export class SaveManager {
  constructor(private storage: StorageLike) {}

  load(now = Date.now()): GameState {
    const json = this.storage.getItem(SAVE_KEY);
    if (json === null) return createInitialState(now);
    return this.parse(json, now) ?? createInitialState(now);
  }

  parse(json: string, now = Date.now()): GameState | null {
    try {
      const parsed: unknown = JSON.parse(json);
      if (!isRecord(parsed)) return null;
      let version = num(parsed.version, 0);
      let raw = isRecord(parsed.state) ? parsed.state : {};
      while (version < SCHEMA_VERSION) {
        const migrate = MIGRATIONS[version];
        if (!migrate) return null;
        raw = migrate(raw);
        version++;
      }
      if (version !== SCHEMA_VERSION) return null;
      return normalizeState(raw, now);
    } catch {
      return null;
    }
  }

  save(state: GameState, now = Date.now()): void {
    const file: SaveFile = {
      version: SCHEMA_VERSION,
      savedAt: now,
      state: { ...state, lastSeen: now } as unknown as Record<string, unknown>,
    };
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(file));
    } catch {
      return;
    }
  }

  exportData(state: GameState, now = Date.now()): string {
    const file: SaveFile = {
      version: SCHEMA_VERSION,
      savedAt: now,
      state: { ...state, lastSeen: now } as unknown as Record<string, unknown>,
    };
    return JSON.stringify(file);
  }

  importData(json: string, now = Date.now()): GameState | null {
    return this.parse(json, now);
  }
}

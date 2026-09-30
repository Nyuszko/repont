import type { GameState } from './types';

export interface LocationDef {
  id: string;
  name: string;
  desc: string;
  cost: number;
  spawnBonus: number;
  palette: {
    sky: number;
    grass: number;
    asphalt: number;
    building: number;
  };
  banner: string;
}

export const LOCATIONS: LocationDef[] = [
  {
    id: 'lakotelep',
    name: 'Lakótelepi sarok',
    desc: 'Kis utca, ismerős arcok. Innen indultál.',
    cost: 0,
    spawnBonus: 1,
    palette: { sky: 0x8ecae6, grass: 0x5da45f, asphalt: 0x3d4045, building: 0x9fb8c9 },
    banner: '🏘️ Lakótelepi sarok',
  },
  {
    id: 'piac',
    name: 'Szabadtéri piac',
    desc: 'Sok palack, még több pénz. Árusok egymásnak értékelik a ládáját.',
    cost: 250_000,
    spawnBonus: 1.6,
    palette: { sky: 0xa8dadc, grass: 0x6a9e5b, asphalt: 0x494c52, building: 0xc9a227 },
    banner: '🧺 Szabadtéri piac',
  },
  {
    id: 'fesztival',
    name: 'Fesztivál tér',
    desc: 'A szomoriságos nyári esték: műanyag flakonok mindenütt.',
    cost: 4_000_000,
    spawnBonus: 2.6,
    palette: { sky: 0xf4a5c0, grass: 0x7fa86a, asphalt: 0x3f3a44, building: 0xe0559b },
    banner: '🎪 Fesztivál tér',
  },
  {
    id: 'stadion',
    name: 'Stadion előtere',
    desc: 'Négyvenezer ember, mindegyik ürítget valamit.',
    cost: 75_000_000,
    spawnBonus: 4.2,
    palette: { sky: 0x9ad0f0, grass: 0x5f9a5a, asphalt: 0x35383d, building: 0x2f4858 },
    banner: '🏟️ Stadion előtere',
  },
  {
    id: 'repulotér',
    name: 'Repülőtér csarnok',
    desc: 'A csúcsidő. Palackhalmok, profitorok, hatósági lélegzetvétel.',
    cost: 2_000_000_000,
    spawnBonus: 7,
    palette: { sky: 0xb8d8ef, grass: 0x8fa5b0, asphalt: 0x4a4f57, building: 0x6c7a89 },
    banner: '✈️ Repülőtér csarnok',
  },
];

export function totalLocationCost(): number {
  return LOCATIONS.slice(1).reduce((sum, location) => sum + location.cost, 0);
}

const BY_ID = new Map(LOCATIONS.map((location) => [location.id, location]));

export const START_LOCATION = LOCATIONS[0]?.id ?? 'lakotelep';

export function locationById(id: string): LocationDef | undefined {
  return BY_ID.get(id);
}

export function nextLocation(state: GameState): LocationDef | null {
  const index = LOCATIONS.findIndex((location) => location.id === state.locationId);
  return LOCATIONS[index + 1] ?? null;
}

export function isUnlocked(state: GameState, id: string): boolean {
  return state.unlockedLocations.includes(id);
}

export function currentLocation(state: GameState): LocationDef {
  return locationById(state.locationId) ?? (LOCATIONS[0] as LocationDef);
}

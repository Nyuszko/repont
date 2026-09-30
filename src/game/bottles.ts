import type { BottleType, BottleTypeId } from './types';

export const BOTTLE_TYPES: Record<BottleTypeId, BottleType> = {
  pet: { id: 'pet', name: 'PET palack', value: 50, weight: 58, color: '#7ec8ff' },
  doboz: { id: 'doboz', name: 'Italos doboz', value: 50, weight: 22, color: '#ff8a80' },
  zsugoritott: {
    id: 'zsugoritott',
    name: 'Zsugorított PET',
    value: 25,
    weight: 12,
    color: '#baffc9',
  },
  premium: { id: 'premium', name: 'Prémium üveg', value: 250, weight: 8, color: '#ffd23f' },
};

export const BOTTLE_TYPE_IDS: BottleTypeId[] = ['pet', 'doboz', 'zsugoritott', 'premium'];

const TOTAL_WEIGHT = BOTTLE_TYPE_IDS.reduce((sum, id) => sum + BOTTLE_TYPES[id].weight, 0);

export function randomBottleType(rng: () => number = Math.random): BottleType {
  let roll = rng() * TOTAL_WEIGHT;
  for (const id of BOTTLE_TYPE_IDS) {
    roll -= BOTTLE_TYPES[id].weight;
    if (roll <= 0) return BOTTLE_TYPES[id];
  }
  return BOTTLE_TYPES.pet;
}

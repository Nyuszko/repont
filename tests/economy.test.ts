import { describe, expect, it } from 'vitest';
import { BOTTLE_TYPES } from '../src/game/bottles';
import { bottleValue, upgradeCost, upgradeLevel } from '../src/game/economy';
import { createInitialState } from '../src/game/state';
import type { UpgradeDef } from '../src/game/types';

const UPGRADE: UpgradeDef = {
  id: 'gep-sebesség',
  name: 'Gépsebesség',
  desc: 'Gyorsabb bedobás',
  icon: '⚙️',
  category: 'gep',
  baseCost: 100,
  growth: 1.15,
  maxLevel: 20,
};

describe('bottleValue', () => {
  it('prestaige szorzó nélkül az alapértéket adja', () => {
    const state = createInitialState(0);
    expect(bottleValue(state, BOTTLE_TYPES.pet)).toBe(50);
    expect(bottleValue(state, BOTTLE_TYPES.premium)).toBe(250);
  });

  it('alkalmazza a prestige szorzót és kerekít', () => {
    const state = createInitialState(0);
    state.prestigeMultiplier = 1.1;
    expect(bottleValue(state, BOTTLE_TYPES.pet)).toBe(55);
  });

  it('legalább 1 Ft-ot ad', () => {
    const state = createInitialState(0);
    state.prestigeMultiplier = 0.001;
    expect(bottleValue(state, BOTTLE_TYPES.pet)).toBe(1);
  });
});

describe('upgradeCost', () => {
  it('szintenként exponenciálisan nő', () => {
    expect(upgradeCost(UPGRADE, 0)).toBe(100);
    expect(upgradeCost(UPGRADE, 1)).toBe(115);
    expect(upgradeCost(UPGRADE, 2)).toBe(133);
  });
});

describe('upgradeLevel', () => {
  it('hiányzó fejlesztésnél 0', () => {
    expect(upgradeLevel(createInitialState(0), 'nincs-ilyen')).toBe(0);
  });

  it('mentett szintet ad vissza', () => {
    const state = createInitialState(0);
    state.upgrades['gep-sebesség'] = 4;
    expect(upgradeLevel(state, 'gep-sebesség')).toBe(4);
  });
});

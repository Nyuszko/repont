import { describe, expect, it } from 'vitest';
import { UPGRADE_IDS } from '../src/game/ids';
import {
  currentLocation,
  isUnlocked,
  locationById,
  LOCATIONS,
  nextLocation,
  START_LOCATION,
  totalLocationCost,
} from '../src/game/locations';
import {
  canPrestige,
  nextMultiplier,
  prestigeBonus,
  prestigeCost,
  prestigeGain,
  prestigeMultiplierFor,
} from '../src/game/prestige';
import { targetBottles } from '../src/game/progression';
import { createInitialState } from '../src/game/state';

describe('helyszínek', () => {
  it('a lakótelep a kezdő helyszín', () => {
    expect(START_LOCATION).toBe('lakotelep');
    expect(currentLocation(createInitialState(0)).id).toBe('lakotelep');
  });

  it('minden helyszín egyedi azonosítóval rendelkezik', () => {
    const ids = LOCATIONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a költségek növekvők', () => {
    const costs = LOCATIONS.map((l) => l.cost);
    for (let i = 1; i < costs.length; i++) {
      expect(costs[i]).toBeGreaterThan(costs[i - 1] ?? 0);
    }
  });

  it('a következő helyszín létezik, az utolsó után nincs', () => {
    const state = createInitialState(0);
    expect(nextLocation(state)?.id).toBe('piac');
    state.locationId = 'repulotér';
    expect(nextLocation(state)).toBeNull();
  });

  it('csak a feloldott helyszíhez lehet utazni', () => {
    const state = createInitialState(0);
    expect(isUnlocked(state, 'piac')).toBe(false);
    expect(isUnlocked(state, 'lakotelep')).toBe(true);
    state.unlockedLocations.push('piac');
    expect(isUnlocked(state, 'piac')).toBe(true);
  });

  it('ismeretlen azonosítóra nincs helyszín', () => {
    expect(locationById('nincs')).toBeUndefined();
  });

  it('a teljes helyszínköltség összeadható', () => {
    const sum = LOCATIONS.slice(1).reduce((acc, l) => acc + l.cost, 0);
    expect(totalLocationCost()).toBe(sum);
  });

  it('a helyszín növeli a palacksűrűséget', () => {
    const state = createInitialState(0);
    const base = targetBottles(state);
    state.upgrades[UPGRADE_IDS.spawn] = 1;
    state.locationId = 'piac';
    expect(targetBottles(state)).toBeGreaterThan(base);
  });
});

describe('franchise', () => {
  it('a szorzó minden alkalommal 25 százalékkal nő', () => {
    expect(prestigeMultiplierFor(0)).toBe(1);
    expect(prestigeMultiplierFor(1)).toBe(1.25);
    expect(prestigeMultiplierFor(4)).toBe(2);
  });

  it('a költség exponenciálisan nő', () => {
    const state = createInitialState(0);
    const first = prestigeCost(state);
    state.prestigeCount = 1;
    expect(prestigeCost(state)).toBeGreaterThan(first * 3);
  });

  it('kis játékkal nem lehet franchise-zni', () => {
    expect(canPrestige(createInitialState(0))).toBe(false);
  });

  it('nagy játékkal franchise-elhető', () => {
    const state = createInitialState(0);
    state.totalMoney = 10_000_000;
    expect(canPrestige(state)).toBe(true);
    expect(nextMultiplier(state)).toBe(1.25);
  });

  it('a bónusz a bevetel százaléka', () => {
    const state = createInitialState(0);
    state.totalMoney = 1_000_000;
    expect(prestigeBonus(state, 1)).toBe(50_000);
    expect(prestigeGain(state).bonusMoney).toBe(50_000);
  });
});

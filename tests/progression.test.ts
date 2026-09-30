import { describe, expect, it } from 'vitest';
import { priceMultiplier, upgradeLevel } from '../src/game/economy';
import { UPGRADE_IDS } from '../src/game/ids';
import {
  capacity,
  capacityAt,
  collectorSpeedAt,
  collectorSpecs,
  effectText,
  machineInterval,
  machineIntervalAt,
  spawnInterval,
  targetBottles,
  targetBottlesAt,
} from '../src/game/progression';
import { createInitialState } from '../src/game/state';
import { SHOP_ENTRIES, entryById, entryCost, isCollector } from '../src/game/upgrades';

describe('gépsebesség', () => {
  it('nő a szinttel, de van egy minimum', () => {
    expect(machineIntervalAt(0)).toBeCloseTo(0.45);
    expect(machineIntervalAt(1)).toBeLessThan(machineIntervalAt(0));
    expect(machineIntervalAt(99)).toBe(0.12);
  });

  it('a mentett szintből olvas', () => {
    const state = createInitialState(0);
    expect(machineInterval(state)).toBeCloseTo(0.45);
    state.upgrades[UPGRADE_IDS.machineSpeed] = 3;
    expect(machineInterval(state)).toBe(machineIntervalAt(3));
  });
});

describe('kapacitás és spawn', () => {
  it('kapacitás lineárisan nő', () => {
    expect(capacityAt(0)).toBe(12);
    expect(capacityAt(2)).toBe(28);
  });

  it('spawn cél és intervallum nő a szinttel', () => {
    expect(targetBottlesAt(0)).toBe(12);
    expect(targetBottlesAt(3)).toBe(21);
    const state = createInitialState(0);
    state.upgrades[UPGRADE_IDS.spawn] = 4;
    expect(targetBottles(state)).toBe(targetBottlesAt(4));
    expect(spawnInterval(state)).toBeLessThan(0.9);
  });

  it('alap értékekkel is működik', () => {
    const state = createInitialState(0);
    expect(capacity(state)).toBe(12);
    expect(targetBottles(state)).toBe(12);
  });
});

describe('árszorzó', () => {
  it('szintenként 25 százalékkal emel', () => {
    const state = createInitialState(0);
    expect(priceMultiplier(state)).toBe(1);
    state.upgrades[UPGRADE_IDS.price] = 2;
    expect(priceMultiplier(state)).toBeCloseTo(1.5);
  });
});

describe('gyűjtők', () => {
  it('csak a megvásárolt gyűjtőket listázza', () => {
    const state = createInitialState(0);
    expect(collectorSpecs(state, SHOP_ENTRIES)).toHaveLength(0);
    state.upgrades[UPGRADE_IDS.collectorBela] = 2;
    const specs = collectorSpecs(state, SHOP_ENTRIES);
    expect(specs).toHaveLength(1);
    expect(specs[0]?.level).toBe(2);
  });

  it('a gyorsabb gyűjtő gyorsabb', () => {
    expect(collectorSpeedAt(0, 2)).toBe(2);
    expect(collectorSpeedAt(5, 2)).toBeGreaterThan(2);
  });
});

describe('bolt', () => {
  it('minden bejegyzés egyedi azonosítóval rendelkezik', () => {
    const ids = SHOP_ENTRIES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a költség szintenként nő', () => {
    const entry = entryById(UPGRADE_IDS.machineSpeed);
    expect(entry).toBeDefined();
    if (!entry) return;
    expect(entryCost(entry, 0)).toBe(150);
    expect(entryCost(entry, 1)).toBe(195);
    expect(entryCost(entry, 5)).toBeGreaterThan(entryCost(entry, 4));
  });

  it('a gép és bónusz kategóriák nem gyűjtők', () => {
    const machine = entryById(UPGRADE_IDS.machineSpeed);
    const collector = entryById(UPGRADE_IDS.collectorBela);
    expect(machine && isCollector(machine)).toBe(false);
    expect(collector && isCollector(collector)).toBe(true);
  });

  it('hatása szövegesen megjeleníthető', () => {
    const entry = entryById(UPGRADE_IDS.price);
    expect(entry).toBeDefined();
    if (!entry) return;
    expect(effectText(entry, 0)).toContain('0%');
    expect(effectText(entry, 4)).toContain('100%');
  });

  it('ismeretlen azonosítóra nincs bejegyzés', () => {
    expect(entryById('nincs-ilyen')).toBeUndefined();
  });
});

describe('szint olvasás', () => {
  it('hiányzó fejlesztés 0', () => {
    expect(upgradeLevel(createInitialState(0), 'barmi')).toBe(0);
  });
});

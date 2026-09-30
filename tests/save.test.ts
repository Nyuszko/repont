import { describe, expect, it } from 'vitest';
import { SaveManager, SAVE_KEY, type StorageLike } from '../src/core/SaveManager';
import { createInitialState } from '../src/game/state';

class FakeStorage implements StorageLike {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe('SaveManager', () => {
  it('üres tárolónál új játékot ad', () => {
    const saves = new SaveManager(new FakeStorage());
    const state = saves.load(1000);
    expect(state.money).toBe(0);
    expect(state.totalBottles).toBe(0);
    expect(state.inventory.pet).toBe(0);
  });

  it('mentés és betöltés körbejárás megőrzi az állapotot', () => {
    const storage = new FakeStorage();
    const saves = new SaveManager(storage);
    const state = createInitialState(1000);
    state.money = 12_500;
    state.totalMoney = 20_000;
    state.totalBottles = 137;
    state.inventory.doboz = 3;
    state.upgrades['gep-sebesség'] = 2;
    saves.save(state, 5000);

    const loaded = saves.load(9000);
    expect(loaded.money).toBe(12_500);
    expect(loaded.totalBottles).toBe(137);
    expect(loaded.inventory.doboz).toBe(3);
    expect(loaded.upgrades['gep-sebesség']).toBe(2);
    expect(loaded.lastSeen).toBe(5000);
    expect(storage.getItem(SAVE_KEY)).not.toBeNull();
  });

  it('sérült mentésnél új játékot indít', () => {
    const storage = new FakeStorage();
    storage.setItem(SAVE_KEY, '{ez nem json');
    const saves = new SaveManager(storage);
    expect(saves.load(1000).money).toBe(0);
  });

  it('ismeretlen jövőbeli verziót eldob', () => {
    const storage = new FakeStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 99, state: { money: 5 } }));
    const saves = new SaveManager(storage);
    expect(saves.load(1000).money).toBe(0);
  });

  it('részleges állapotot hibás mezőkkel normalizál', () => {
    const storage = new FakeStorage();
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        state: { money: 'nincs', inventory: { pet: 7, doboz: 'x' }, prestigeMultiplier: 2 },
      }),
    );
    const saves = new SaveManager(storage);
    const state = saves.load(1000);
    expect(state.money).toBe(0);
    expect(state.inventory.pet).toBe(7);
    expect(state.inventory.doboz).toBe(0);
    expect(state.inventory.zsugoritott).toBe(0);
    expect(state.prestigeMultiplier).toBe(2);
  });

  it('export és import körbejárás működik', () => {
    const saves = new SaveManager(new FakeStorage());
    const state = createInitialState(1000);
    state.money = 777;
    const json = saves.exportData(state, 2000);
    const imported = saves.importData(json, 3000);
    expect(imported?.money).toBe(777);
    expect(saves.importData('nonsense', 3000)).toBeNull();
  });

  it('mentéskor a lastSeen a mentés időpontja marad', () => {
    const storage = new FakeStorage();
    const saves = new SaveManager(storage);
    saves.save(createInitialState(1000), 7777);
    expect(saves.load(8888).lastSeen).toBe(7777);
  });
});

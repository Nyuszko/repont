import { describe, expect, it } from 'vitest';
import { UPGRADE_IDS } from '../src/game/ids';
import {
  activeQuest,
  collectorLevelSum,
  isClaimable,
  isClaimed,
  isComplete,
  QUESTS,
  questPercent,
  questProgress,
} from '../src/game/quests';
import { createInitialState } from '../src/game/state';

describe('küldetés definíciók', () => {
  it('minden küldetés egyedi azonosítóval rendelkezik', () => {
    const ids = QUESTS.map((quest) => quest.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('minden küldetésnek van célja és jutalma', () => {
    for (const quest of QUESTS) {
      expect(quest.goal).toBeGreaterThan(0);
      expect(quest.reward.money).toBeGreaterThan(0);
      expect(quest.name.length).toBeGreaterThan(0);
    }
  });

  it('a fejlesztéses küldetéseknek van célja', () => {
    for (const quest of QUESTS.filter((q) => q.metric === 'upgrade')) {
      expect(quest.targetId).toBeTruthy();
      expect(entryExists(quest.targetId ?? '')).toBe(true);
    }
  });
});

function entryExists(id: string): boolean {
  return QUESTS.some((quest) => quest.targetId === id);
}

describe('küldetés haladás', () => {
  it('az első küldetés az első palacknál teljesül', () => {
    const quest = QUESTS[0];
    expect(quest).toBeDefined();
    if (!quest) return;
    const state = createInitialState(0);
    expect(isComplete(state, quest)).toBe(false);
    state.totalBottles = 1;
    expect(isComplete(state, quest)).toBe(true);
    expect(isClaimable(state, quest)).toBe(true);
  });

  it('gyűjtőszám összeadva minden gyűjtővel', () => {
    const state = createInitialState(0);
    expect(collectorLevelSum(state)).toBe(0);
    state.upgrades[UPGRADE_IDS.collectorBela] = 2;
    state.upgrades[UPGRADE_IDS.collectorGyula] = 1;
    expect(collectorLevelSum(state)).toBe(3);
  });

  it('a százalék 100-nál nem megy feljebb', () => {
    const quest = QUESTS[0];
    expect(quest).toBeDefined();
    if (!quest) return;
    const state = createInitialState(0);
    state.totalBottles = 999;
    expect(questPercent(state, quest)).toBe(100);
  });

  it('az aktív küldetés a még nem igazolt első', () => {
    const state = createInitialState(0);
    const first = QUESTS[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(activeQuest(state)?.id).toBe(first.id);
    state.quests[first.id] = { progress: first.goal, claimed: true };
    expect(activeQuest(state)?.id).not.toBe(first.id);
  });

  it('minden küldetés igazolása után nincs aktív küldetés', () => {
    const state = createInitialState(0);
    const quests: Record<string, { progress: number; claimed: boolean }> = {};
    for (const quest of QUESTS) quests[quest.id] = { progress: quest.goal, claimed: true };
    state.quests = quests;
    expect(activeQuest(state)).toBeNull();
  });

  it('igazolt küldetés nem újrafoglalható', () => {
    const quest = QUESTS[0];
    expect(quest).toBeDefined();
    if (!quest) return;
    const state = createInitialState(0);
    state.totalBottles = 10;
    state.quests[quest.id] = { progress: quest.goal, claimed: true };
    expect(isClaimed(state, quest)).toBe(true);
    expect(isClaimable(state, quest)).toBe(false);
  });

  it('a prémium stat külön számolódik', () => {
    const quest = QUESTS.find((q) => q.metric === 'totalPremiumBottles');
    expect(quest).toBeDefined();
    if (!quest) return;
    const state = createInitialState(0);
    state.totalBottles = 500;
    state.totalPremiumBottles = 3;
    expect(questProgress(state, quest)).toBe(3);
  });
});

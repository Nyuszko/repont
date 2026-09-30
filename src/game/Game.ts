import * as THREE from 'three';
import { SoundEngine } from '../audio/SoundEngine';
import { formatFt } from '../core/format';
import { GameLoop } from '../core/GameLoop';
import { SaveManager } from '../core/SaveManager';
import { Store } from '../core/Store';
import { CollectorManager } from '../three/Collector';
import { PopupEffects } from '../three/Effects';
import { BottleField, type ActiveBottle } from '../three/BottleField';
import { Machine } from '../three/Machine';
import { SceneManager } from '../three/SceneManager';
import { World } from '../three/World';
import { BOTTLE_TYPES, BOTTLE_TYPE_IDS, randomBottleType } from './bottles';
import { bottleValue, upgradeLevel } from './economy';
import { PointerInteractions } from './Interactions';
import { capacity, collectorSpecs, machineInterval, spawnInterval, targetBottles } from './progression';
import { emptyInventory } from './state';
import type { BottleTypeId, GameState } from './types';
import { entryById, entryCost, isCollector, SHOP_ENTRIES } from './upgrades';
import { Hud } from '../ui/hud';
import { Toaster } from '../ui/Toast';
import { UpgradePanel } from '../ui/upgrade-panel';

const MACHINE_POINT = new THREE.Vector3(0, 0.08, 4.6);
const AUTOSAVE_SECONDS = 10;
const RATE_WINDOW_MS = 60_000;

export class Game {
  private readonly store: Store<GameState>;
  private readonly saves: SaveManager;
  private readonly scene: SceneManager;
  private readonly machine: Machine;
  private readonly bottles: BottleField;
  private readonly collectors: CollectorManager;
  private readonly effects: PopupEffects;
  private readonly hud: Hud;
  private readonly shop: UpgradePanel;
  private readonly toaster: Toaster;
  private readonly sound = new SoundEngine();
  private readonly loop: GameLoop;
  private readonly interactions: PointerInteractions;

  private spawnTimer = 0;
  private playAccumulator = 0;
  private autosaveAccumulator = 0;
  private readonly acceptTimes: number[] = [];

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.saves = new SaveManager(window.localStorage);
    this.store = new Store<GameState>(this.saves.load());

    this.scene = new SceneManager(canvas);
    this.scene.scene.add(new World().group);

    this.machine = new Machine((type, source) => this.onAccept(type, source));
    this.machine.group.position.set(0, 0.08, 3.2);
    this.scene.scene.add(this.machine.group);

    this.bottles = new BottleField(this.scene.scene);
    this.collectors = new CollectorManager(this.scene.scene, {
      bottles: this.bottles,
      machinePoint: MACHINE_POINT,
      onDeliver: (type) => this.onDeliver(type),
    });

    this.effects = new PopupEffects(uiRoot, this.scene.camera);
    this.toaster = new Toaster(uiRoot);

    const layer = document.createElement('div');
    layer.className = 'ui-layer';
    uiRoot.appendChild(layer);

    this.shop = new UpgradePanel(
      layer,
      () => this.store.get(),
      (entryId) => this.buy(entryId),
    );

    this.hud = new Hud(layer, {
      onInsert: () => this.insertAll(),
      onToggleShop: () => {
        this.shop.toggle();
        this.hud.setShopOpen(this.shop.isOpen);
      },
    });

    this.sound.setEnabled(this.store.get().soundEnabled);
    this.collectors.sync(collectorSpecs(this.store.get(), SHOP_ENTRIES));

    this.store.subscribe(() => this.refreshUi());
    this.refreshUi();

    this.interactions = new PointerInteractions(
      canvas,
      this.scene.camera,
      this.bottles,
      this.machine,
      {
        onBottle: (bottle) => this.collect(bottle),
        onMachine: () => this.insertAll(),
      },
    );

    canvas.addEventListener('pointerdown', () => this.sound.unlock());
    window.addEventListener('beforeunload', this.persist);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.loop = new GameLoop((dt) => this.tick(dt));
  }

  start(): void {
    this.loop.start();
  }

  private tick(dt: number): void {
    const state = this.store.get();

    this.spawnTimer -= dt;
    const spawnEvery = spawnInterval(state);
    if (this.spawnTimer <= 0) {
      this.spawnTimer = spawnEvery;
      if (this.bottles.count < targetBottles(state)) this.bottles.spawn(randomBottleType());
    }

    this.collectors.update(dt);
    this.machine.update(dt, state.totalBottles, this.machine.pending > capacity(state), machineInterval(state));
    this.bottles.update(dt);
    this.scene.update();
    this.scene.render();

    this.playAccumulator += dt;
    if (this.playAccumulator >= 1) {
      const added = this.playAccumulator;
      this.playAccumulator = 0;
      this.store.update((prev) => ({ playTime: prev.playTime + added }));
    }

    this.autosaveAccumulator += dt;
    if (this.autosaveAccumulator >= AUTOSAVE_SECONDS) {
      this.autosaveAccumulator = 0;
      this.persist();
    }
  }

  private collect(bottle: ActiveBottle): void {
    const position = bottle.group.position.clone();
    const type = bottle.type;
    this.bottles.remove(bottle);
    this.sound.pop();
    this.store.update((state) => ({
      inventory: { ...state.inventory, [type.id]: state.inventory[type.id] + 1 },
    }));
    this.effects.spawnText(position, `+1 ${type.name}`, type.color);
  }

  private insertAll(): void {
    const state = this.store.get();
    const queue: BottleTypeId[] = [];
    for (const id of BOTTLE_TYPE_IDS) {
      for (let i = 0; i < state.inventory[id]; i++) queue.push(id);
    }
    if (queue.length === 0) {
      this.sound.deny();
      return;
    }
    if (this.machine.pending + queue.length > capacity(state)) {
      this.sound.deny();
      this.toaster.show('A gép tele van! Fejleszd a kapacitást!', 'error');
      return;
    }
    this.store.update({ inventory: emptyInventory() });
    this.machine.enqueue(queue);
  }

  private onDeliver(type: BottleTypeId): void {
    this.machine.enqueue([type], 'collector');
  }

  private onAccept(type: BottleTypeId, source: 'player' | 'collector'): void {
    const state = this.store.get();
    const value = bottleValue(state, BOTTLE_TYPES[type]);
    const position = this.machine.slotWorldPosition(new THREE.Vector3());
    this.effects.spawnText(position, `+${formatFt(value)}`, '#ffd23f');

    if (source === 'collector' || type === 'premium') this.sound.cash();
    else this.sound.clink();

    this.acceptTimes.push(Date.now());
    this.store.update((prev) => ({
      money: prev.money + value,
      totalMoney: prev.totalMoney + value,
      totalBottles: prev.totalBottles + 1,
    }));
  }

  private buy(entryId: string): boolean {
    const entry = entryById(entryId);
    if (!entry) return false;

    const state = this.store.get();
    const level = upgradeLevel(state, entry.id);
    if (level >= entry.maxLevel) {
      this.sound.deny();
      return false;
    }

    const cost = entryCost(entry, level);
    if (state.money < cost) {
      this.sound.deny();
      return false;
    }

    this.store.update((prev) => ({
      money: prev.money - cost,
      upgrades: { ...prev.upgrades, [entry.id]: level + 1 },
    }));

    if (isCollector(entry)) {
      this.collectors.sync(collectorSpecs(this.store.get(), SHOP_ENTRIES));
      this.toaster.show(`${entry.icon} ${entry.name} felvette a munkát!`, 'success');
    } else {
      this.toaster.show(`${entry.icon} ${entry.name} → ${level + 1}. szint`, 'success');
    }

    this.sound.upgrade();
    this.persist();
    return true;
  }

  private refreshUi(): void {
    const state = this.store.get();
    this.hud.refresh(state, {
      queue: this.machine.pending,
      capacity: capacity(state),
      ratePerMin: this.ratePerMin(),
      collectors: this.collectors.count,
    });
    if (this.shop.isOpen) this.shop.refresh();
  }

  private ratePerMin(): number {
    const now = Date.now();
    while (this.acceptTimes.length > 0 && now - (this.acceptTimes[0] ?? 0) > RATE_WINDOW_MS) {
      this.acceptTimes.shift();
    }
    return this.acceptTimes.length;
  }

  private persist = (): void => {
    this.saves.save(this.store.get());
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) this.persist();
  };

  dispose(): void {
    this.loop.stop();
    this.interactions.dispose();
    window.removeEventListener('beforeunload', this.persist);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.persist();
    this.scene.dispose();
  }
}

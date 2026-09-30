import * as THREE from 'three';
import { SoundEngine } from '../audio/SoundEngine';
import { formatFt } from '../core/format';
import { GameLoop } from '../core/GameLoop';
import { SaveManager } from '../core/SaveManager';
import { Store } from '../core/Store';
import { BOTTLE_TYPES, BOTTLE_TYPE_IDS, randomBottleType } from './bottles';
import { bottleValue } from './economy';
import { PointerInteractions } from './Interactions';
import { emptyInventory } from './state';
import type { BottleTypeId, GameState } from './types';
import { PopupEffects } from '../three/Effects';
import { BottleField, type ActiveBottle } from '../three/BottleField';
import { Machine } from '../three/Machine';
import { SceneManager } from '../three/SceneManager';
import { World } from '../three/World';
import { Hud } from '../ui/hud';

const SPAWN_INTERVAL = 0.9;
const TARGET_BOTTLES = 12;
const AUTOSAVE_MS = 10_000;

export class Game {
  private readonly store: Store<GameState>;
  private readonly saves: SaveManager;
  private readonly scene: SceneManager;
  private readonly machine: Machine;
  private readonly bottles: BottleField;
  private readonly effects: PopupEffects;
  private readonly hud: Hud;
  private readonly sound = new SoundEngine();
  private readonly loop: GameLoop;
  private readonly interactions: PointerInteractions;

  private spawnTimer = 0;
  private playAccumulator = 0;
  private autosaveTimer = 0;

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.saves = new SaveManager(window.localStorage);
    this.store = new Store<GameState>(this.saves.load());

    this.scene = new SceneManager(canvas);
    this.scene.scene.add(new World().group);

    this.machine = new Machine((type) => this.onAccept(type));
    this.machine.group.position.set(0, 0.08, 3.2);
    this.scene.scene.add(this.machine.group);

    this.bottles = new BottleField(this.scene.scene);
    this.effects = new PopupEffects(uiRoot, this.scene.camera);

    const layer = document.createElement('div');
    layer.className = 'ui-layer';
    uiRoot.appendChild(layer);
    this.hud = new Hud(layer, () => this.insertAll());
    this.store.subscribe((state) => this.hud.refresh(state));
    this.hud.refresh(this.store.get());

    this.sound.setEnabled(this.store.get().soundEnabled);

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
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = SPAWN_INTERVAL;
      if (this.bottles.count < TARGET_BOTTLES) this.bottles.spawn(randomBottleType());
    }

    this.machine.update(dt, this.store.get().totalBottles);
    this.bottles.update(dt);
    this.scene.update();
    this.scene.render();

    this.playAccumulator += dt;
    if (this.playAccumulator >= 1) {
      const added = this.playAccumulator;
      this.playAccumulator = 0;
      this.store.update((state) => ({ playTime: state.playTime + added }));
    }

    this.autosaveTimer += dt;
    if (this.autosaveTimer * 1000 >= AUTOSAVE_MS) {
      this.autosaveTimer = 0;
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
    if (this.machine.busy) {
      this.sound.deny();
      return;
    }
    const inventory = this.store.get().inventory;
    const queue: BottleTypeId[] = [];
    for (const id of BOTTLE_TYPE_IDS) {
      for (let i = 0; i < inventory[id]; i++) queue.push(id);
    }
    if (queue.length === 0) {
      this.sound.deny();
      return;
    }
    this.store.update({ inventory: emptyInventory() });
    this.machine.enqueue(queue);
  }

  private onAccept(type: BottleTypeId): void {
    const state = this.store.get();
    const value = bottleValue(state, BOTTLE_TYPES[type]);
    this.effects.spawnText(this.machine.slotWorldPosition(new THREE.Vector3()), `+${formatFt(value)}`, '#ffd23f');
    if (type === 'premium') this.sound.cash();
    else this.sound.clink();
    this.store.update((prev) => ({
      money: prev.money + value,
      totalMoney: prev.totalMoney + value,
      totalBottles: prev.totalBottles + 1,
    }));
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

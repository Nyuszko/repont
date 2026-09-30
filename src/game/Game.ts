import * as THREE from 'three';
import { SoundEngine } from '../audio/SoundEngine';
import { formatFt } from '../core/format';
import { GameLoop } from '../core/GameLoop';
import { SaveManager } from '../core/SaveManager';
import { SAVE_KEY } from '../core/SaveManager';
import { Store } from '../core/Store';
import { CollectorManager } from '../three/Collector';
import { PopupEffects } from '../three/Effects';
import { BottleField, type ActiveBottle } from '../three/BottleField';
import { DayNightCycle } from '../three/DayNightCycle';
import { Machine } from '../three/Machine';
import { ParticleBurst } from '../three/ParticleBurst';
import { SceneManager } from '../three/SceneManager';
import { World } from '../three/World';
import { BOTTLE_TYPES, BOTTLE_TYPE_IDS, randomBottleType } from './bottles';
import { bottleValue, upgradeLevel } from './economy';
import { PointerInteractions } from './Interactions';
import { capacity, collectorSpecs, machineInterval, spawnInterval, targetBottles } from './progression';
import { emptyInventory } from './state';
import type { BottleTypeId, GameState } from './types';
import { entryById, entryCost, isCollector, SHOP_ENTRIES } from './upgrades';
import { isClaimable, isClaimed, QUESTS } from './quests';
import { locationById, START_LOCATION } from './locations';
import { canPrestige, prestigeGain } from './prestige';
import { Hud } from '../ui/hud';
import { LocationPanel } from '../ui/location-panel';
import { QuestPanel, QuestTracker } from '../ui/quest-panel';
import { SettingsPanel } from '../ui/settings-panel';
import { StatsPanel } from '../ui/stats-panel';
import { Toaster } from '../ui/Toast';
import { Tutorial } from '../ui/Tutorial';
import { UpgradePanel } from '../ui/upgrade-panel';

const MACHINE_POINT = new THREE.Vector3(0, 0.08, 4.6);
const AUTOSAVE_SECONDS = 10;
const UI_REFRESH_SECONDS = 0.5;
const OFFLINE_MIN_SECONDS = 120;
const OFFLINE_CAP_MINUTES = 480;
const OFFLINE_EFFICIENCY = 0.5;

const BOTTLE_COLORS: Record<BottleTypeId, number> = {
  pet: 0x7ec8ff,
  doboz: 0xff8a80,
  zsugoritott: 0xbaffc9,
  premium: 0xffd23f,
};
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
  private readonly quests: QuestPanel;
  private readonly settings: SettingsPanel;
  private readonly locations: LocationPanel;
  private readonly stats: StatsPanel;
  private readonly tracker: QuestTracker;
  private readonly tutorial: Tutorial;
  private readonly particles: ParticleBurst;
  private readonly dayNight: DayNightCycle;
  private readonly world: World;
  private readonly toaster: Toaster;
  private readonly sound = new SoundEngine();
  private readonly loop: GameLoop;
  private readonly interactions: PointerInteractions;

  private spawnTimer = 0;
  private playAccumulator = 0;
  private autosaveAccumulator = 0;
  private uiAccumulator = 0;
  private readonly acceptTimes: number[] = [];
  private readonly flags = { collected: false, inserted: false, bought: false };

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.saves = new SaveManager(window.localStorage);
    this.store = new Store<GameState>(this.saves.load());

    this.scene = new SceneManager(canvas);
    this.world = new World();
    this.scene.scene.add(this.world.group);

    this.dayNight = new DayNightCycle(this.scene.scene);
    for (const material of this.world.lampMaterials) this.dayNight.registerLamp(material);
    this.particles = new ParticleBurst(this.scene.scene);

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

    this.shop = new UpgradePanel(layer, () => this.store.get(), (entryId) => this.buy(entryId));

    this.quests = new QuestPanel(layer, () => this.store.get(), (questId) =>
      this.claimQuest(questId),
    );
    this.tracker = new QuestTracker(layer);
    this.settings = new SettingsPanel(layer, () => this.store.get(), {
      onToggleSound: () => this.toggleSound(),
      onExport: () => this.exportSave(),
      onImport: () => this.importSave(),
      onReset: () => this.resetGame(),
    });
    this.locations = new LocationPanel(layer, () => this.store.get(), {
      onTravel: (id) => this.travelTo(id),
      onUnlock: (id) => this.unlockLocation(id),
      onPrestige: () => this.doPrestige(),
    });
    this.stats = new StatsPanel(layer);
    this.tutorial = new Tutorial(layer, () => ({
      state: this.store.get(),
      collected: this.flags.collected,
      inserted: this.flags.inserted,
      bought: this.flags.bought,
    }));

    this.hud = new Hud(layer, {
      onInsert: () => this.insertAll(),
      onToggleShop: () => {
        this.closePanels();
        this.shop.toggle();
        this.hud.setShopOpen(this.shop.isOpen);
      },
      onToggleQuests: () => {
        this.closePanels();
        this.quests.toggle();
        this.hud.setQuestsOpen(this.quests.isOpen);
      },
      onToggleSettings: () => {
        this.closePanels();
        this.settings.toggle();
        this.hud.setSettingsOpen(this.settings.isOpen);
        this.settings.refresh();
      },
      onToggleLocations: () => {
        this.closePanels();
        this.locations.toggle();
        this.hud.setLocationsOpen(this.locations.isOpen);
      },
      onToggleStats: () => {
        this.closePanels();
        this.stats.toggle();
        this.hud.setStatsOpen(this.stats.isOpen);
        if (this.stats.isOpen) this.refreshStats();
      },
    });

    this.sound.setEnabled(this.store.get().soundEnabled);
    this.collectors.sync(collectorSpecs(this.store.get(), SHOP_ENTRIES));
    const startLocation = locationById(this.store.get().locationId);
    if (startLocation) this.world.applyPalette(startLocation.palette);

    this.store.subscribe(() => this.refreshUi());
    this.refreshUi();
    this.offerOfflineEarnings();

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
    this.machine.update(
      dt,
      state.totalBottles,
      this.machine.pending > capacity(state),
      machineInterval(state),
    );
    this.bottles.update(dt);
    this.particles.update(dt);
    this.dayNight.update(dt);
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

    this.uiAccumulator += dt;
    if (this.uiAccumulator >= UI_REFRESH_SECONDS) {
      this.uiAccumulator = 0;
      this.tutorial.update();
      this.tracker.refresh(this.store.get());
    }
  }

  private collect(bottle: ActiveBottle): void {
    const position = bottle.group.position.clone();
    const type = bottle.type;
    this.bottles.remove(bottle);
    this.sound.pop();
    this.flags.collected = true;
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
    this.flags.inserted = true;
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

    this.particles.burst(position, BOTTLE_COLORS[type], type === 'premium' ? 16 : 8);
    this.acceptTimes.push(Date.now());
    this.store.update((prev) => ({
      money: prev.money + value,
      totalMoney: prev.totalMoney + value,
      totalBottles: prev.totalBottles + 1,
      totalPremiumBottles:
        type === 'premium' ? prev.totalPremiumBottles + 1 : prev.totalPremiumBottles,
    }));
    this.checkQuestCompletions();
  }

  private checkQuestCompletions(): void {
    const state = this.store.get();
    for (const def of QUESTS) {
      if (isClaimable(state, def)) {
        this.toaster.show(`${def.icon} Küldetés kész: ${def.name}!`, 'success');
        this.sound.quest();
      }
    }
  }

  private claimQuest(questId: string): boolean {
    const def = QUESTS.find((quest) => quest.id === questId);
    if (!def) return false;
    const state = this.store.get();
    if (isClaimed(state, def) || !isClaimable(state, def)) {
      this.sound.deny();
      return false;
    }

    this.store.update((prev) => {
      const upgrades = def.reward.upgrade
        ? { ...prev.upgrades, [def.reward.upgrade]: (prev.upgrades[def.reward.upgrade] ?? 0) + 1 }
        : { ...prev.upgrades };
      return {
        money: prev.money + def.reward.money,
        upgrades,
        quests: { ...prev.quests, [def.id]: { progress: def.goal, claimed: true } },
      };
    });

    this.sound.quest();
    this.toaster.show(`${def.icon} ${def.name}: +${formatFt(def.reward.money)}`, 'success');
    this.collectors.sync(collectorSpecs(this.store.get(), SHOP_ENTRIES));
    this.persist();
    return true;
  }

  private closePanels(): void {
    if (this.shop.isOpen) {
      this.shop.toggle();
      this.hud.setShopOpen(false);
    }
    if (this.quests.isOpen) {
      this.quests.toggle();
      this.hud.setQuestsOpen(false);
    }
    if (this.settings.isOpen) {
      this.settings.toggle();
      this.hud.setSettingsOpen(false);
    }
    if (this.locations.isOpen) {
      this.locations.toggle();
      this.hud.setLocationsOpen(false);
    }
    if (this.stats.isOpen) {
      this.stats.toggle();
      this.hud.setStatsOpen(false);
    }
  }

  private travelTo(locationId: string): void {
    const state = this.store.get();
    const location = locationById(locationId);
    if (!location || !state.unlockedLocations.includes(locationId)) return;
    this.store.update({ locationId });
    this.world.applyPalette(location.palette);
    this.machine.group.visible = true;
    this.toaster.show(location.banner, 'success');
    this.sound.cash();
    this.persist();
  }

  private unlockLocation(locationId: string): void {
    const state = this.store.get();
    const location = locationById(locationId);
    if (!location) return;
    if (state.unlockedLocations.includes(locationId)) {
      this.travelTo(locationId);
      return;
    }
    if (state.money < location.cost) {
      this.sound.deny();
      this.toaster.show('Nincs elég pénzed erre a helyszínre', 'error');
      return;
    }
    this.store.update((prev) => ({
      money: prev.money - location.cost,
      unlockedLocations: [...prev.unlockedLocations, locationId],
      locationId,
    }));
    this.world.applyPalette(location.palette);
    this.toaster.show(`${location.banner} megnyitva!`, 'success');
    this.sound.upgrade();
    this.persist();
  }

  private doPrestige(): void {
    const state = this.store.get();
    if (!canPrestige(state)) {
      this.sound.deny();
      return;
    }
    const gain = prestigeGain(state);
    const bonus = gain.bonusMoney;
    this.store.update(() => ({
      money: bonus,
      totalMoney: bonus,
      totalBottles: 0,
      totalPremiumBottles: 0,
      inventory: emptyInventory(),
      upgrades: {},
      quests: {},
      prestigeCount: gain.count,
      prestigeMultiplier: gain.multiplier,
      locationId: START_LOCATION,
      unlockedLocations: [START_LOCATION],
    }));
    this.collectors.sync(collectorSpecs(this.store.get(), SHOP_ENTRIES));
    this.world.applyPalette(locationById(START_LOCATION)?.palette);
    this.toaster.show(`🎉 Franchise #${gain.count}: ×${gain.multiplier.toFixed(2)} érték!`, 'success');
    this.sound.quest();
    this.persist();
  }

  private refreshStats(): void {
    this.stats.refresh({
      state: this.store.get(),
      ratePerMin: this.ratePerMin(),
      queue: this.machine.pending,
      capacity: capacity(this.store.get()),
      collectors: this.collectors.count,
      offlineMinutes: OFFLINE_CAP_MINUTES,
    });
  }

  private toggleSound(): void {
    const enabled = !this.store.get().soundEnabled;
    this.store.update({ soundEnabled: enabled });
    this.sound.setEnabled(enabled);
    this.settings.refresh();
    if (enabled) this.sound.unlock();
    this.toaster.show(enabled ? '🔊 Hang bekapcsolva' : '🔇 Hang kikapcsolva');
  }

  private exportSave(): void {
    const data = this.saves.exportData(this.store.get());
    void navigator.clipboard
      ?.writeText(data)
      .then(() => this.toaster.show('💾 A mentés a vágólapra került', 'success'))
      .catch(() => window.prompt('Másold ki a mentést:', data));
  }

  private importSave(): void {
    const input = window.prompt('Illeszd be a mentés szövegét:');
    if (!input) return;
    const imported = this.saves.importData(input);
    if (!imported) {
      this.sound.deny();
      this.toaster.show('A mentés nem olvasható', 'error');
      return;
    }
    this.store.update(imported);
    this.sound.setEnabled(imported.soundEnabled);
    this.collectors.sync(collectorSpecs(imported, SHOP_ENTRIES));
    this.toaster.show('📥 Mentés betöltve', 'success');
    this.persist();
  }

  private resetGame(): void {
    const confirmed = window.confirm('Biztosan új játékot kezdesz? Minden előrelépés elvész.');
    if (!confirmed) return;
    window.localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  }

  private offerOfflineEarnings(): void {
    const state = this.store.get();
    const awaySeconds = Math.floor((Date.now() - state.lastSeen) / 1000);
    if (awaySeconds < OFFLINE_MIN_SECONDS || state.totalBottles === 0) return;

    const minutes = Math.min(awaySeconds / 60, OFFLINE_CAP_MINUTES);
    const value = this.estimateOfflineValue(minutes);
    if (value <= 0) return;

    this.store.update((prev) => ({ money: prev.money + value }));
    this.toaster.show(`💤 Távolléted alatt: +${formatFt(value)}`, 'success');
    this.sound.cash();
  }

  private estimateOfflineValue(minutes: number): number {
    if (this.collectors.count === 0) return 0;
    const perMinute = this.ratePerMin();
    if (perMinute <= 0) return 0;
    return Math.floor(perMinute * minutes * OFFLINE_EFFICIENCY);
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
    this.flags.bought = true;
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
    this.tracker.refresh(state);
    if (this.shop.isOpen) this.shop.refresh();
    if (this.quests.isOpen) this.quests.refresh();
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

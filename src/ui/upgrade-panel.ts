import { formatFt } from '../core/format';
import { upgradeLevel } from '../game/economy';
import { effectText } from '../game/progression';
import type { GameState } from '../game/types';
import {
  entryCost,
  isCollector,
  SHOP_CATEGORY_LABELS,
  SHOP_CATEGORY_ORDER,
  SHOP_ENTRIES,
  type ShopEntry,
} from '../game/upgrades';
import { Panel } from './Panel';

interface Row {
  entry: ShopEntry;
  root: HTMLElement;
  effect: HTMLElement;
  level: HTMLElement;
  label: HTMLElement;
  cost: HTMLElement;
  button: HTMLButtonElement;
}

export class UpgradePanel {
  private readonly panel: Panel;
  private readonly rows = new Map<string, Row>();

  constructor(
    container: HTMLElement,
    private getState: () => GameState,
    private onBuy: (entryId: string) => boolean,
  ) {
    this.panel = new Panel(container, 'Fejlesztések', () => undefined);
    this.build(this.panel.content);
  }

  get isOpen(): boolean {
    return this.panel.isOpen;
  }

  toggle(): void {
    this.panel.toggle();
    if (this.panel.isOpen) this.refresh();
  }

  refresh(): void {
    const state = this.getState();
    for (const row of this.rows.values()) {
      const level = upgradeLevel(state, row.entry.id);
      const maxed = level >= row.entry.maxLevel;
      const cost = entryCost(row.entry, level);
      row.effect.textContent = effectText(row.entry, level);
      row.level.textContent = `Lv. ${level}`;
      row.cost.textContent = maxed ? '' : formatFt(cost);
      row.label.textContent = maxed ? 'Teljes' : isCollector(row.entry) ? 'Bérelés' : 'Fejleszt';
      row.button.disabled = maxed || state.money < cost;
      row.root.classList.toggle('maxed', maxed);
      row.root.classList.toggle('affordable', !maxed && state.money >= cost);
    }
  }

  private build(container: HTMLElement): void {
    for (const category of SHOP_CATEGORY_ORDER) {
      const entries = SHOP_ENTRIES.filter((entry) => entry.category === category);
      if (entries.length === 0) continue;

      const heading = document.createElement('h3');
      heading.className = 'panel-subtitle';
      heading.textContent = SHOP_CATEGORY_LABELS[category];
      container.appendChild(heading);

      for (const entry of entries) {
        container.appendChild(this.buildRow(entry));
      }
    }

    const hint = document.createElement('p');
    hint.className = 'panel-hint';
    hint.textContent =
      'A gyűjtők maguktól szedik össze és hordják be a palackokat. Ha a sor megtelik, a gép megáll — fejleszd a kapacitást!';
    container.appendChild(hint);
  }

  private buildRow(entry: ShopEntry): HTMLElement {
    const root = document.createElement('article');
    root.className = 'shop-row';
    root.innerHTML = `
      <div class="shop-icon"></div>
      <div class="shop-main">
        <div class="shop-head">
          <span class="shop-name"></span>
          <span class="shop-level"></span>
        </div>
        <div class="shop-desc"></div>
        <div class="shop-effect"></div>
      </div>
      <button class="shop-buy" type="button">
        <span class="shop-label"></span>
        <span class="shop-cost"></span>
      </button>`;

    const icon = root.querySelector('.shop-icon');
    const name = root.querySelector('.shop-name');
    const desc = root.querySelector('.shop-desc');
    const effect = root.querySelector('.shop-effect');
    const level = root.querySelector('.shop-level');
    const label = root.querySelector('.shop-label');
    const cost = root.querySelector('.shop-cost');
    const button = root.querySelector('.shop-buy');

    if (
      !(icon instanceof HTMLElement) ||
      !(name instanceof HTMLElement) ||
      !(desc instanceof HTMLElement) ||
      !(effect instanceof HTMLElement) ||
      !(level instanceof HTMLElement) ||
      !(label instanceof HTMLElement) ||
      !(cost instanceof HTMLElement) ||
      !(button instanceof HTMLButtonElement)
    ) {
      throw new Error(`Fejlesztés sor nem építhető: ${entry.id}`);
    }

    icon.textContent = entry.icon;
    name.textContent = entry.name;
    desc.textContent = entry.desc;

    button.addEventListener('click', () => {
      this.onBuy(entry.id);
      this.refresh();
    });

    this.rows.set(entry.id, { entry, root, effect, level, label, cost, button });
    return root;
  }
}

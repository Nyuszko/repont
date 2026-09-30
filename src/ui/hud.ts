import { formatFt, formatInt } from '../core/format';
import type { GameState } from '../game/types';

export interface MachineInfo {
  queue: number;
  capacity: number;
  ratePerMin: number;
  collectors: number;
}

export class Hud {
  private readonly moneyEl: HTMLElement;
  private readonly statEl: HTMLElement;
  private readonly invEl: HTMLElement;
  private readonly queueEl: HTMLElement;
  private readonly hintEl: HTMLElement;
  private readonly buttonEl: HTMLButtonElement;
  private readonly shopButtonEl: HTMLButtonElement;

  constructor(
    root: HTMLElement,
    private handlers: {
      onInsert: () => void;
      onToggleShop: () => void;
    },
  ) {
    root.innerHTML = `
      <div class="hud-top-left">
        <div class="pill pill-money" id="hud-money">0 Ft</div>
        <div class="pill pill-sub" id="hud-stat">Visszaváltva: 0 db</div>
        <div class="pill pill-sub pill-queue hidden" id="hud-queue"></div>
      </div>
      <div class="hud-top-right">
        <div class="hud-nav">
          <button class="btn-nav" id="btn-shop" type="button">🛠️ Fejlesztések</button>
        </div>
        <div class="pill pill-inv" id="hud-inv">0 db</div>
      </div>
      <div class="hud-bottom">
        <div class="hint" id="hud-hint">Kattints a palackokra, majd nyomd meg a Bedobás gombot!</div>
        <button class="btn-insert" id="btn-insert" disabled>Bedobás (0)</button>
      </div>`;

    const money = root.querySelector('#hud-money');
    const stat = root.querySelector('#hud-stat');
    const queue = root.querySelector('#hud-queue');
    const inv = root.querySelector('#hud-inv');
    const hint = root.querySelector('#hud-hint');
    const insert = root.querySelector('#btn-insert');
    const shop = root.querySelector('#btn-shop');

    if (
      !(money instanceof HTMLElement) ||
      !(stat instanceof HTMLElement) ||
      !(queue instanceof HTMLElement) ||
      !(inv instanceof HTMLElement) ||
      !(hint instanceof HTMLElement) ||
      !(insert instanceof HTMLButtonElement) ||
      !(shop instanceof HTMLButtonElement)
    ) {
      throw new Error('HUD elemek nem elérhetők');
    }

    this.moneyEl = money;
    this.statEl = stat;
    this.queueEl = queue;
    this.invEl = inv;
    this.hintEl = hint;
    this.buttonEl = insert;
    this.shopButtonEl = shop;

    this.buttonEl.addEventListener('click', () => this.handlers.onInsert());
    this.shopButtonEl.addEventListener('click', () => this.handlers.onToggleShop());
  }

  refresh(state: GameState, machine: MachineInfo): void {
    const inventoryCount = Object.values(state.inventory).reduce((sum, n) => sum + n, 0);

    this.moneyEl.textContent = formatFt(state.money);
    this.statEl.textContent =
      machine.ratePerMin > 0
        ? `${formatInt(state.totalBottles)} db · ${machine.ratePerMin.toFixed(1)} db/perc`
        : `Visszaváltva: ${formatInt(state.totalBottles)} db`;

    this.invEl.textContent =
      machine.collectors > 0
        ? `${formatInt(inventoryCount)} db · ${formatInt(machine.collectors)} gyűjtő`
        : `${formatInt(inventoryCount)} db`;

    const jammed = machine.queue > machine.capacity;
    this.queueEl.classList.toggle('hidden', machine.queue === 0);
    this.queueEl.classList.toggle('jammed', jammed);
    this.queueEl.textContent = jammed
      ? `Gép tele: ${formatInt(machine.queue)}/${formatInt(machine.capacity)}`
      : `Sor: ${formatInt(machine.queue)}/${formatInt(machine.capacity)}`;

    this.hintEl.classList.toggle('hidden', state.totalBottles > 0);
    this.buttonEl.disabled = inventoryCount === 0 || jammed;
    this.buttonEl.textContent = `Bedobás (${formatInt(inventoryCount)})`;
  }

  setShopOpen(open: boolean): void {
    this.shopButtonEl.classList.toggle('active', open);
  }
}

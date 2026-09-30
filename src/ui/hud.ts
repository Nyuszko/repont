import { BOTTLE_TYPE_IDS } from '../game/bottles';
import type { GameState } from '../game/types';
import { formatFt, formatInt } from '../core/format';

export class Hud {
  private moneyEl: HTMLElement;
  private statEl: HTMLElement;
  private invEl: HTMLElement;
  private hintEl: HTMLElement;
  private buttonEl: HTMLButtonElement;

  constructor(root: HTMLElement, onInsert: () => void) {
    root.innerHTML = `
      <div class="hud-top-left">
        <div class="pill pill-money" id="hud-money">0 Ft</div>
        <div class="pill pill-sub" id="hud-stat">Visszaváltva: 0 db</div>
      </div>
      <div class="hud-top-right">
        <div class="pill pill-inv" id="hud-inv">0 db</div>
      </div>
      <div class="hud-bottom">
        <div class="hint" id="hud-hint">Kattints a palackokra a felvételhez, majd nyomd meg a Bedobás gombot!</div>
        <button class="btn-insert" id="btn-insert" disabled>Bedobás (0)</button>
      </div>`;

    const money = root.querySelector('#hud-money');
    const stat = root.querySelector('#hud-stat');
    const inv = root.querySelector('#hud-inv');
    const hint = root.querySelector('#hud-hint');
    const button = root.querySelector('#btn-insert');
    if (
      !(money instanceof HTMLElement) ||
      !(stat instanceof HTMLElement) ||
      !(inv instanceof HTMLElement) ||
      !(hint instanceof HTMLElement) ||
      !(button instanceof HTMLButtonElement)
    ) {
      throw new Error('HUD elemek nem elérhetők');
    }
    this.moneyEl = money;
    this.statEl = stat;
    this.invEl = inv;
    this.hintEl = hint;
    this.buttonEl = button;

    this.buttonEl.addEventListener('click', onInsert);
  }

  refresh(state: GameState): void {
    this.moneyEl.textContent = formatFt(state.money);
    this.statEl.textContent = `Visszaváltva: ${formatInt(state.totalBottles)} db`;

    const count = BOTTLE_TYPE_IDS.reduce((sum, id) => sum + state.inventory[id], 0);
    this.invEl.textContent = `${formatInt(count)} db`;

    this.hintEl.classList.toggle('hidden', state.totalBottles > 0);
    this.buttonEl.disabled = count === 0;
    this.buttonEl.textContent = `Bedobás (${formatInt(count)})`;
  }
}

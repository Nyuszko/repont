import { formatFt, formatInt } from '../core/format';
import {
  activeQuest,
  isClaimable,
  isClaimed,
  questPercent,
  questProgress,
  QUESTS,
  type QuestDef,
} from '../game/quests';
import type { GameState } from '../game/types';
import { Panel } from './Panel';

interface QuestRow {
  def: QuestDef;
  root: HTMLElement;
  progressBar: HTMLElement;
  progressText: HTMLElement;
  button: HTMLButtonElement;
}

export class QuestPanel {
  private readonly panel: Panel;
  private readonly rows = new Map<string, QuestRow>();

  constructor(
    container: HTMLElement,
    private getState: () => GameState,
    private onClaim: (questId: string) => boolean,
  ) {
    this.panel = new Panel(container, 'Küldetések', () => undefined);
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
      const progress = Math.min(questProgress(state, row.def), row.def.goal);
      const claimed = isClaimed(state, row.def);
      const claimable = isClaimable(state, row.def);
      row.progressBar.style.width = `${questPercent(state, row.def)}%`;
      row.progressText.textContent = `${formatInt(progress)} / ${formatInt(row.def.goal)}`;
      row.button.hidden = !claimable;
      row.button.disabled = !claimable;
      row.root.classList.toggle('claimed', claimed);
      row.root.classList.toggle('claimable', claimable);
    }
  }

  private build(container: HTMLElement): void {
    for (const def of QUESTS) {
      container.appendChild(this.buildRow(def));
    }

    const hint = document.createElement('p');
    hint.className = 'panel-hint';
    hint.textContent = 'A küldetések sorrendben követik egymást. A teljesített jutalmat kattintással veheted fel.';
    container.appendChild(hint);
  }

  private buildRow(def: QuestDef): HTMLElement {
    const root = document.createElement('article');
    root.className = 'quest-row';
    root.innerHTML = `
      <div class="quest-icon"></div>
      <div class="quest-main">
        <div class="quest-name"></div>
        <div class="quest-desc"></div>
        <div class="quest-bar"><div class="quest-bar-fill"></div></div>
        <div class="quest-foot">
          <span class="quest-progress"></span>
          <span class="quest-reward"></span>
        </div>
      </div>
      <button class="quest-claim" type="button" hidden>Jutalom</button>`;

    const icon = root.querySelector('.quest-icon');
    const name = root.querySelector('.quest-name');
    const desc = root.querySelector('.quest-desc');
    const bar = root.querySelector('.quest-bar-fill');
    const progress = root.querySelector('.quest-progress');
    const reward = root.querySelector('.quest-reward');
    const button = root.querySelector('.quest-claim');

    if (
      !(icon instanceof HTMLElement) ||
      !(name instanceof HTMLElement) ||
      !(desc instanceof HTMLElement) ||
      !(bar instanceof HTMLElement) ||
      !(progress instanceof HTMLElement) ||
      !(reward instanceof HTMLElement) ||
      !(button instanceof HTMLButtonElement)
    ) {
      throw new Error(`Küldetés sor nem építhető: ${def.id}`);
    }

    icon.textContent = def.icon;
    name.textContent = def.name;
    desc.textContent = def.desc;
    reward.textContent = formatFt(def.reward.money);

    button.addEventListener('click', () => {
      this.onClaim(def.id);
      this.refresh();
    });

    this.rows.set(def.id, {
      def,
      root,
      progressBar: bar,
      progressText: progress,
      button,
    });
    return root;
  }
}

export class QuestTracker {
  private readonly root: HTMLElement;
  private readonly name: HTMLElement;
  private readonly bar: HTMLElement;
  private readonly text: HTMLElement;
  private lastId: string | null = null;

  constructor(container: HTMLElement) {
    this.root = document.createElement('aside');
    this.root.className = 'quest-tracker';
    this.root.innerHTML = `
      <div class="quest-tracker-head">
        <span class="quest-tracker-icon">📜</span>
        <span class="quest-tracker-name"></span>
      </div>
      <div class="quest-tracker-bar"><div class="quest-tracker-fill"></div></div>
      <div class="quest-tracker-text"></div>`;

    const icon = this.root.querySelector('.quest-tracker-icon');
    const name = this.root.querySelector('.quest-tracker-name');
    const bar = this.root.querySelector('.quest-tracker-fill');
    const text = this.root.querySelector('.quest-tracker-text');

    if (
      !(icon instanceof HTMLElement) ||
      !(name instanceof HTMLElement) ||
      !(bar instanceof HTMLElement) ||
      !(text instanceof HTMLElement)
    ) {
      throw new Error('Küldetés követő nem építhető');
    }

    this.name = name;
    this.bar = bar;
    this.text = text;
    container.appendChild(this.root);
  }

  refresh(state: GameState): void {
    const quest = activeQuest(state);
    if (!quest) {
      this.root.classList.add('hidden');
      this.lastId = null;
      return;
    }

    this.root.classList.remove('hidden');
    if (this.lastId !== quest.id) {
      this.lastId = quest.id;
      this.name.textContent = quest.name;
    }
    this.bar.style.width = `${questPercent(state, quest)}%`;
    this.text.textContent = `${formatInt(Math.min(questProgress(state, quest), quest.goal))} / ${formatInt(quest.goal)}${isClaimable(state, quest) ? ' · JUTALOM!' : ''}`;
  }
}

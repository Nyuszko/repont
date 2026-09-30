import { formatFt, formatInt, formatShort } from '../core/format';
import type { GameState } from '../game/types';
import { Panel } from './Panel';

export interface StatsPanelInfo {
  state: GameState;
  ratePerMin: number;
  queue: number;
  capacity: number;
  collectors: number;
  offlineMinutes: number;
}

export class StatsPanel {
  private readonly panel: Panel;
  private readonly body: HTMLElement;

  constructor(container: HTMLElement) {
    this.panel = new Panel(container, 'Statisztikák', () => undefined);
    this.body = this.panel.content;
  }

  get isOpen(): boolean {
    return this.panel.isOpen;
  }

  toggle(): void {
    this.panel.toggle();
  }

  refresh(info: StatsPanelInfo): void {
    const { state } = info;
    const rows: Array<[string, string]> = [
      ['Összes bevétel', formatShort(state.totalMoney) + ' Ft'],
      ['Összes visszaváltott palack', formatInt(state.totalBottles) + ' db'],
      ['Prémium üveg', formatInt(state.totalPremiumBottles) + ' db'],
      ['Aktuális sebesség', `${info.ratePerMin.toFixed(1)} db/perc`],
      ['Palack a sorban', `${formatInt(info.queue)} / ${formatInt(info.capacity)}`],
      ['Gyűjtők', `${formatInt(info.collectors)} fő`],
      ['Franchise szorzó', `×${state.prestigeMultiplier.toFixed(2)}`],
      ['Játékidő', formatDurationShort(state.playTime)],
      ['Offline limit', `${Math.floor(info.offlineMinutes / 60)} óra`],
      ['Helyszín', state.locationId],
      ['Fejlesztések', `${Object.keys(state.upgrades).length} db`],
      ['Teljesített küldetések', `${Object.values(state.quests).filter((q) => q.claimed).length} db`],
    ];

    this.body.innerHTML = `
      <h3 class="panel-subtitle">Karakter</h3>
      <div class="stats-grid"></div>
      <p class="panel-hint">A franchise visszaindítja a fejlesztéseket, de cserébe minden palack többet ér örökre.</p>`;

    const grid = this.body.querySelector('.stats-grid');
    if (!(grid instanceof HTMLElement)) return;

    for (const [label, value] of rows) {
      const row = document.createElement('div');
      row.className = 'stats-row';
      const key = document.createElement('span');
      key.textContent = label;
      const val = document.createElement('span');
      val.className = 'stats-value';
      val.textContent = value;
      row.append(key, val);
      grid.appendChild(row);
    }

    const money = document.createElement('p');
    money.className = 'panel-hint';
    money.textContent = `Készpénz: ${formatFt(state.money)}`;
    this.body.appendChild(money);
  }
}

function formatDurationShort(seconds: number): string {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours} ó ${minutes} p`;
  if (minutes > 0) return `${minutes} p ${total % 60} mp`;
  return `${total} mp`;
}

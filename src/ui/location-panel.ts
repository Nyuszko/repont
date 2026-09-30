import { formatShort } from '../core/format';
import { isUnlocked, LOCATIONS, nextLocation, type LocationDef } from '../game/locations';
import { canPrestige, prestigeMultiplierFor } from '../game/prestige';
import type { GameState } from '../game/types';
import { Panel } from './Panel';

export class LocationPanel {
  private readonly panel: Panel;
  private readonly rows = new Map<string, { root: HTMLElement; button: HTMLButtonElement }>();

  constructor(
    container: HTMLElement,
    private getState: () => GameState,
    private handlers: {
      onTravel: (locationId: string) => void;
      onUnlock: (locationId: string) => void;
      onPrestige: () => void;
    },
  ) {
    this.panel = new Panel(container, 'Helyszínek és franchise', () => undefined);
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
    const next = nextLocation(state);

    for (const [id, row] of this.rows) {
      const unlocked = isUnlocked(state, id);
      const isCurrent = state.locationId === id;
      const affordable = state.money >= (LOCATIONS.find((l) => l.id === id)?.cost ?? 0);
      row.root.classList.toggle('current', isCurrent);
      row.button.hidden = isCurrent;
      if (unlocked) {
        row.button.textContent = isCurrent ? 'Itt vagy' : 'Utazás';
        row.button.disabled = isCurrent;
      } else {
        row.button.textContent = `Megnyitás · ${formatShort(
          LOCATIONS.find((l) => l.id === id)?.cost ?? 0,
        )} Ft`;
        row.button.disabled = !affordable || id !== next?.id;
      }
    }

    const prestige = this.panel.content.querySelector('#prestige-state');
    if (prestige instanceof HTMLElement) {
      prestige.textContent = `Jelenlegi szorzó: ×${state.prestigeMultiplier.toFixed(2)} · ${
        state.prestigeCount
      } franchise`;
    }
  }

  private build(container: HTMLElement): void {
    for (const location of LOCATIONS) {
      container.appendChild(this.buildRow(location));
    }

    const heading = document.createElement('h3');
    heading.className = 'panel-subtitle';
    heading.textContent = 'Franchise';
    container.appendChild(heading);

    const box = document.createElement('div');
    box.className = 'prestige-box';
    box.innerHTML = `
      <p class="prestige-desc">Újrakezdesz mindent, de a palackérték örökre +25%-kal nő minden egyes franchise-szal.</p>
      <div class="prestige-state" id="prestige-state"></div>
      <button class="prestige-button" type="button"></button>`;

    const button = box.querySelector('.prestige-button');
    if (!(button instanceof HTMLButtonElement)) throw new Error('Franchise gomb nem építhető');
    button.addEventListener('click', () => {
      const state = this.getState();
      if (!canPrestige(state)) return;
      const confirmed = window.confirm(
        `Biztosan franchise-szt indítasz? Minden fejlesztésed és pénzed elfogy, cserébe a szorzód ${prestigeMultiplierFor(
          state.prestigeCount + 1,
        ).toFixed(2)} lesz.`,
      );
      if (confirmed) this.handlers.onPrestige();
    });

    container.appendChild(box);
  }

  private buildRow(location: LocationDef): HTMLElement {
    const root = document.createElement('article');
    root.className = 'location-row';
    root.innerHTML = `
      <div class="location-banner"></div>
      <div class="location-main">
        <div class="location-name"></div>
        <div class="location-desc"></div>
        <div class="location-bonus"></div>
      </div>
      <button class="location-button" type="button" hidden></button>`;

    const banner = root.querySelector('.location-banner');
    const name = root.querySelector('.location-name');
    const desc = root.querySelector('.location-desc');
    const bonus = root.querySelector('.location-bonus');
    const button = root.querySelector('.location-button');

    if (
      !(banner instanceof HTMLElement) ||
      !(name instanceof HTMLElement) ||
      !(desc instanceof HTMLElement) ||
      !(bonus instanceof HTMLElement) ||
      !(button instanceof HTMLButtonElement)
    ) {
      throw new Error(`Helyszín sor nem építhető: ${location.id}`);
    }

    banner.textContent = location.banner;
    name.textContent = location.name;
    desc.textContent = location.desc;
    bonus.textContent = `+${Math.round(location.spawnBonus * 100 - 100)}% palack sűrűség`;

    button.addEventListener('click', () => {
      const state = this.getState();
      if (isUnlocked(state, location.id)) this.handlers.onTravel(location.id);
      else this.handlers.onUnlock(location.id);
    });

    this.rows.set(location.id, { root, button });
    return root;
  }
}

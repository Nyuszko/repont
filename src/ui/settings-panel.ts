import type { GameState } from '../game/types';
import { Panel } from './Panel';

export class SettingsPanel {
  private readonly panel: Panel;
  private soundButton: HTMLButtonElement;

  constructor(
    container: HTMLElement,
    private getState: () => GameState,
    private handlers: {
      onToggleSound: () => void;
      onExport: () => void;
      onImport: () => void;
      onReset: () => void;
    },
  ) {
    this.panel = new Panel(container, 'Beállítások', () => undefined);
    const body = this.panel.content;
    const state = this.getState();

    const soundRow = this.buildSection('Hang');
    this.soundButton = this.buildButton(
      state.soundEnabled ? '🔊 Hang be' : '🔇 Hang ki',
      'Hang effektek ki- és bekapcsolása',
      () => this.handlers.onToggleSound(),
    );
    soundRow.appendChild(this.soundButton);

    const saveRow = this.buildSection('Mentés');
    saveRow.appendChild(
      this.buildButton('💾 Mentés exportálása', 'A játékállapot szöveges másolata', () =>
        this.handlers.onExport(),
      ),
    );
    saveRow.appendChild(
      this.buildButton('📥 Mentés importálása', 'Korábbi mentés visszatöltése', () =>
        this.handlers.onImport(),
      ),
    );

    const dangerRow = this.buildSection('Új játék');
    dangerRow.appendChild(
      this.buildButton('🗑️ Mindent elveszít', 'Törli az összes mentett adatot', () =>
        this.handlers.onReset(),
      ),
    );

    const info = document.createElement('p');
    info.className = 'panel-hint';
    info.textContent = `Játékidő: ${formatDuration(state.playTime)} · ${state.totalBottles} palack · ${state.prestigeCount} franchise`;
    body.appendChild(info);
  }

  get isOpen(): boolean {
    return this.panel.isOpen;
  }

  toggle(): void {
    this.panel.toggle();
  }

  refresh(): void {
    const state = this.getState();
    this.soundButton.textContent = state.soundEnabled ? '🔊 Hang be' : '🔇 Hang ki';
  }

  private buildSection(title: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'settings-section';
    const heading = document.createElement('h3');
    heading.className = 'panel-subtitle';
    heading.textContent = title;
    section.appendChild(heading);
    this.panel.content.appendChild(section);
    return section;
  }

  private buildButton(label: string, title: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'settings-button';
    button.type = 'button';
    button.textContent = label;
    button.title = title;
    button.addEventListener('click', onClick);
    return button;
  }
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours} óra ${minutes} perc`;
  if (minutes > 0) return `${minutes} perc ${total % 60} mp`;
  return `${total} mp`;
}

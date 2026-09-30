import type { GameState } from '../game/types';

export interface TutorialProgress {
  state: GameState;
  collected: boolean;
  inserted: boolean;
  bought: boolean;
}

export interface TutorialStep {
  id: string;
  text: string;
  done: (progress: TutorialProgress) => boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'gyujt',
    text: 'Kattints egy palackra a földön, hogy felveved!',
    done: (p) => p.collected,
  },
  {
    id: 'dobd',
    text: 'Most nyomd meg a Bedobás gombot — így lesz belőle Ft!',
    done: (p) => p.inserted,
  },
  {
    id: 'fejleszt',
    text: 'Nyisd meg a Fejlesztések gombot és vegyél valamit!',
    done: (p) => p.bought,
  },
];

export class Tutorial {
  private readonly root: HTMLElement;
  private readonly text: HTMLElement;
  private readonly dots: HTMLElement;
  private index: number;
  private finishedState = false;

  constructor(
    container: HTMLElement,
    private getProgress: () => TutorialProgress,
    private onFinished?: () => void,
  ) {
    this.root = document.createElement('aside');
    this.root.className = 'tutorial';
    this.root.innerHTML = `
      <div class="tutorial-head">Kezdő lépések <span class="tutorial-dots"></span></div>
      <div class="tutorial-text"></div>`;

    const text = this.root.querySelector('.tutorial-text');
    const dots = this.root.querySelector('.tutorial-dots');
    if (!(text instanceof HTMLElement) || !(dots instanceof HTMLElement)) {
      throw new Error('Tutorial nem építhető');
    }
    this.text = text;
    this.dots = dots;
    container.appendChild(this.root);

    const progress = this.getProgress();
    this.index = progress.state.totalBottles > 0 ? 1 : 0;
    if (progress.state.totalBottles > 0 && Object.keys(progress.state.upgrades).length > 0) {
      this.index = TUTORIAL_STEPS.length;
    }
    this.render();
  }

  get finished(): boolean {
    return this.finishedState;
  }

  update(): void {
    if (this.finishedState) return;
    const step = TUTORIAL_STEPS[this.index];
    if (step && step.done(this.getProgress())) {
      this.index += 1;
      this.render();
    }
  }

  private render(): void {
    const step = TUTORIAL_STEPS[this.index];
    if (!step) {
      this.finishedState = true;
      this.root.classList.add('hidden');
      this.onFinished?.();
      return;
    }

    this.root.classList.remove('hidden');
    this.text.textContent = step.text;
    this.dots.textContent = `${this.index + 1} / ${TUTORIAL_STEPS.length}`;
  }
}

export class Panel {
  readonly content: HTMLElement;
  readonly root: HTMLElement;

  private isOpenState = false;

  constructor(container: HTMLElement, title: string, onClose: () => void) {
    const root = document.createElement('section');
    root.className = 'panel';
    root.innerHTML = `
      <header class="panel-head">
        <h2 class="panel-title"></h2>
        <button class="panel-close" type="button" aria-label="Bezárás">✕</button>
      </header>
      <div class="panel-body"></div>`;

    const titleEl = root.querySelector('.panel-title');
    const closeBtn = root.querySelector('.panel-close');
    const body = root.querySelector('.panel-body');
    if (!(titleEl instanceof HTMLElement) || !(body instanceof HTMLElement)) {
      throw new Error('Panel elemek nem elérhetők');
    }
    titleEl.textContent = title;
    this.content = body;
    this.root = root;

    if (closeBtn instanceof HTMLButtonElement) {
      closeBtn.addEventListener('click', () => {
        this.close();
        onClose();
      });
    }

    container.appendChild(root);
  }

  get isOpen(): boolean {
    return this.isOpenState;
  }

  open(): void {
    this.isOpenState = true;
    this.root.classList.add('open');
  }

  close(): void {
    this.isOpenState = false;
    this.root.classList.remove('open');
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }
}

const MAX_VISIBLE = 4;

export type ToastKind = 'info' | 'success' | 'error';

export class Toaster {
  private readonly stack: HTMLElement;

  constructor(container: HTMLElement) {
    this.stack = document.createElement('div');
    this.stack.className = 'toast-stack';
    container.appendChild(this.stack);
  }

  show(text: string, kind: ToastKind = 'info'): void {
    const el = document.createElement('div');
    el.className = `toast toast-${kind}`;
    el.textContent = text;
    this.stack.appendChild(el);

    while (this.stack.childElementCount > MAX_VISIBLE) {
      this.stack.firstElementChild?.remove();
    }

    window.setTimeout(() => {
      el.classList.add('leaving');
      window.setTimeout(() => el.remove(), 300);
    }, 2200);
  }
}

import * as THREE from 'three';

export class PopupEffects {
  private projected = new THREE.Vector3();

  constructor(
    private container: HTMLElement,
    private camera: THREE.Camera,
  ) {}

  spawnText(worldPos: THREE.Vector3, text: string, color: string): void {
    this.projected.copy(worldPos).project(this.camera);
    if (this.projected.z > 1) return;
    const x = (this.projected.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-this.projected.y * 0.5 + 0.5) * window.innerHeight;
    const el = document.createElement('div');
    el.className = 'popup';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    this.container.appendChild(el);
    window.setTimeout(() => el.remove(), 1100);
  }
}

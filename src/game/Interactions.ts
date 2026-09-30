import * as THREE from 'three';
import type { ActiveBottle, BottleField } from '../three/BottleField';
import type { Machine } from '../three/Machine';

interface InteractionHandlers {
  onBottle: (bottle: ActiveBottle) => void;
  onMachine: () => void;
}

const CLICK_MAX_DISTANCE = 8;
const CLICK_MAX_MS = 400;

export class PointerInteractions {
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private downX = 0;
  private downY = 0;
  private downTime = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private camera: THREE.Camera,
    private bottles: BottleField,
    private machine: Machine,
    private handlers: InteractionHandlers,
  ) {
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
  }

  private onPointerDown = (event: PointerEvent): void => {
    this.downX = event.clientX;
    this.downY = event.clientY;
    this.downTime = performance.now();
  };

  private onPointerUp = (event: PointerEvent): void => {
    const moved = Math.hypot(event.clientX - this.downX, event.clientY - this.downY);
    const elapsed = performance.now() - this.downTime;
    if (moved > CLICK_MAX_DISTANCE || elapsed > CLICK_MAX_MS) return;

    this.ndc.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.ndc, this.camera);

    const bottle = this.bottles.pick(this.ndc, this.camera);
    if (bottle) {
      this.handlers.onBottle(bottle);
      return;
    }

    const hit = this.raycaster.intersectObjects(this.machine.pickTargets, false);
    if (hit.length > 0) this.handlers.onMachine();
  };

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
  }
}

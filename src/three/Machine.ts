import * as THREE from 'three';
import type { BottleTypeId } from '../game/types';

const CHEW_TIME = 0.16;

export type InsertSource = 'player' | 'collector';

interface QueueItem {
  type: BottleTypeId;
  source: InsertSource;
}
interface BuiltMachine {
  screenTex: THREE.CanvasTexture;
  screenCtx: CanvasRenderingContext2D;
  slotGlow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  body: THREE.Mesh;
}

export class Machine {
  readonly group = new THREE.Group();
  readonly pickTargets: THREE.Mesh[] = [];

  private queue: QueueItem[] = [];
  private acceptTimer = 0;
  private chew = 0;
  private time = 0;
  private screenCount = -1;
  private screenJammed = false;
  private jammed = false;
  private screenTex: THREE.CanvasTexture;
  private screenCtx: CanvasRenderingContext2D;
  private slotGlow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private body: THREE.Mesh;

  constructor(private onAccept: (type: BottleTypeId, source: InsertSource) => void) {
    const built = this.build();
    this.screenTex = built.screenTex;
    this.screenCtx = built.screenCtx;
    this.slotGlow = built.slotGlow;
    this.body = built.body;
  }

  get busy(): boolean {
    return this.queue.length > 0;
  }

  get jammedState(): boolean {
    return this.jammed;
  }

  get pending(): number {
    return this.queue.length;
  }

  enqueue(types: BottleTypeId[], source: InsertSource = 'player'): void {
    for (const type of types) this.queue.push({ type, source });
  }

  slotWorldPosition(target: THREE.Vector3): THREE.Vector3 {
    return this.group.localToWorld(target.set(0, 1.38, 0.75));
  }

  update(dt: number, totalBottles: number, jammed: boolean, interval: number): void {
    this.time += dt;
    this.jammed = jammed;

    this.acceptTimer -= dt;
    if (!jammed && this.queue.length > 0 && this.acceptTimer <= 0) {
      const item = this.queue.shift();
      if (item !== undefined) {
        this.onAccept(item.type, item.source);
        this.acceptTimer = interval;
        this.chew = CHEW_TIME;
      }
    }

    this.chew = Math.max(0, this.chew - dt);
    const chewScale = 1 - 0.035 * (this.chew / CHEW_TIME);
    this.body.scale.set(1, chewScale, 1);

    const pulse = 0.5 + 0.4 * Math.sin(this.time * 7);
    const target = jammed ? pulse : this.queue.length > 0 ? pulse * 0.8 : 0.12;
    this.slotGlow.material.opacity +=
      (target - this.slotGlow.material.opacity) * Math.min(1, dt * 12);
    const glowColor = jammed ? 0xff4d3d : 0xffd23f;
    this.slotGlow.material.color.setHex(glowColor);

    if (totalBottles !== this.screenCount || jammed !== this.screenJammed) {
      this.screenCount = totalBottles;
      this.screenJammed = jammed;
      this.drawScreen(totalBottles);
    }
  }

  private build(): BuiltMachine {
    const lambert = (color: number): THREE.MeshLambertMaterial =>
      new THREE.MeshLambertMaterial({ color });

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.14, 1.05), lambert(0x2b2f33));
    base.position.y = 0.07;
    this.group.add(base);
    this.pickTargets.push(base);

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.2, 0.95), lambert(0x17934d));
    body.position.y = 1.24;
    body.castShadow = true;
    this.group.add(body);
    this.pickTargets.push(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.16, 1.06), lambert(0xffd23f));
    roof.position.y = 2.42;
    roof.castShadow = true;
    this.group.add(roof);
    this.pickTargets.push(roof);

    const front = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.9, 0.06), lambert(0x0f6e3a));
    front.position.set(0, 1.24, 0.505);
    this.group.add(front);
    this.pickTargets.push(front);

    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const signCtx = signCanvas.getContext('2d');
    if (!signCtx) throw new Error('Canvas 2D nem elérhető');
    signCtx.fillStyle = '#06331e';
    signCtx.fillRect(0, 0, 512, 128);
    signCtx.fillStyle = '#ffd23f';
    signCtx.font = 'bold 76px sans-serif';
    signCtx.textAlign = 'center';
    signCtx.textBaseline = 'middle';
    signCtx.fillText('REPONT', 256, 68);
    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.35),
      new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false }),
    );
    sign.position.set(0, 2.42, 0.54);
    this.group.add(sign);

    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 256;
    screenCanvas.height = 128;
    const screenCtx = screenCanvas.getContext('2d');
    if (!screenCtx) throw new Error('Canvas 2D nem elérhető');
    const screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.colorSpace = THREE.SRGBColorSpace;

    const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.62, 0.05), lambert(0x062b1a));
    bezel.position.set(0, 1.85, 0.545);
    this.group.add(bezel);
    this.pickTargets.push(bezel);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.52),
      new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }),
    );
    screen.position.set(0, 1.85, 0.575);
    this.group.add(screen);

    const slotBlock = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.3, 0.12), lambert(0x0b5c31));
    slotBlock.position.set(0, 1.38, 0.55);
    this.group.add(slotBlock);
    this.pickTargets.push(slotBlock);

    const hole = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.08), lambert(0x101010));
    hole.position.set(0, 1.38, 0.615);
    this.group.add(hole);

    const slotGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.07),
      new THREE.MeshBasicMaterial({
        color: 0xffd23f,
        transparent: true,
        opacity: 0.12,
        toneMapped: false,
      }),
    );
    slotGlow.position.set(0, 1.38, 0.66);
    this.group.add(slotGlow);

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.72, 0.05), lambert(0x0d5c33));
    door.position.set(0, 0.62, 0.535);
    this.group.add(door);
    this.pickTargets.push(door);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.03), lambert(0xffd23f));
    handle.position.set(0, 0.62, 0.565);
    this.group.add(handle);

    for (const sx of [-0.77, 0.77]) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.6, 0.7), lambert(0xffd23f));
      stripe.position.set(sx, 1.3, 0);
      this.group.add(stripe);
    }

    return { screenTex, screenCtx, slotGlow, body };
  }

  private drawScreen(count: number): void {
    const ctx = this.screenCtx;
    ctx.fillStyle = '#03130b';
    ctx.fillRect(0, 0, 256, 128);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#37e08a';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('REPONT', 128, 32);
    if (this.screenJammed) {
      ctx.fillStyle = '#ff4d3d';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText('DUPLT!', 128, 84);
      ctx.font = '15px sans-serif';
      ctx.fillText('sürgősen ürítés', 128, 110);
    } else {
      ctx.fillStyle = '#eafff3';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText(count.toLocaleString('hu-HU'), 128, 84);
      ctx.fillStyle = '#37e08a';
      ctx.font = '15px sans-serif';
      ctx.fillText('visszaváltva', 128, 110);
    }
    this.screenTex.needsUpdate = true;
  }
}

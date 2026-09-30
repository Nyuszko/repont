import * as THREE from 'three';
import { BOTTLE_TYPES } from '../game/bottles';
import type { ActiveCollectorSpec } from '../game/progression';
import type { BottleTypeId } from '../game/types';
import { surfaceHeightAt, type BottleField } from './BottleField';

const MAX_COLLECTORS = 10;
const WANDER_AREA = { minX: -13, maxX: 13, minZ: -0.3, maxZ: 5.4 };
const ARRIVE_EPSILON = 0.3;

type CollectorMode = 'wander' | 'seek' | 'deliver';

export interface CollectorDeps {
  bottles: BottleField;
  machinePoint: THREE.Vector3;
  onDeliver: (type: BottleTypeId, collectorName: string) => void;
}

export class Collector {
  readonly group = new THREE.Group();

  private readonly legs: THREE.Mesh[] = [];
  private readonly carrySlot: THREE.Mesh;
  private readonly shirt: THREE.MeshLambertMaterial;
  private mode: CollectorMode = 'wander';
  private target = new THREE.Vector3();
  private carried: BottleTypeId | null = null;
  private walkPhase = 0;
  private wait = 0;
  private name = 'Gyűjtő';
  private speed = 1.5;

  constructor(private deps: CollectorDeps) {
    this.shirt = new THREE.MeshLambertMaterial({ color: 0x4a90d9 });
    const skin = new THREE.MeshLambertMaterial({ color: 0xf0c9a0 });
    const trouser = new THREE.MeshLambertMaterial({ color: 0x37474f });
    const shoe = new THREE.MeshLambertMaterial({ color: 0x263238 });

    const legGeo = new THREE.BoxGeometry(0.11, 0.42, 0.13);
    for (const x of [-0.09, 0.09]) {
      const leg = new THREE.Mesh(legGeo, trouser);
      leg.geometry.translate(0, -0.21, 0);
      leg.position.set(x, 0.42, 0);
      leg.castShadow = true;
      this.group.add(leg);
      this.legs.push(leg);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.18), shoe);
      foot.position.set(x, 0.03, 0.02);
      this.group.add(foot);
    }

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.52, 0.22), this.shirt);
    body.position.y = 0.68;
    body.castShadow = true;
    this.group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), skin);
    head.position.y = 1.03;
    head.castShadow = true;
    this.group.add(head);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.28), this.shirt);
    cap.position.y = 1.12;
    this.group.add(cap);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.36, 0.1), skin);
    arm.position.set(0.2, 0.7, 0);
    arm.castShadow = true;
    this.group.add(arm);

    this.carrySlot = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.17, 0.13),
      new THREE.MeshLambertMaterial({ color: 0xffffff }),
    );
    this.carrySlot.position.set(0.2, 0.86, 0.06);
    this.carrySlot.visible = false;
    this.group.add(this.carrySlot);

    this.placeRandomly();
    this.pickWanderTarget();
  }

  configure(spec: ActiveCollectorSpec, fallback: ActiveCollectorSpec): void {
    const active = spec.speed > 0 ? spec : fallback;
    this.name = active.name;
    this.speed = active.speed;
    this.shirt.color.setHex(active.color);
  }

  update(dt: number): void {
    if (this.wait > 0) {
      this.wait -= dt;
      this.animateIdle(dt);
      return;
    }

    if (this.mode === 'seek') {
      const bottle = this.deps.bottles.nearest(this.group.position, 30);
      if (!bottle) {
        this.beginWander();
      } else {
        this.target.copy(bottle.group.position);
      }
    }

    const distance = this.stepToward(dt, this.target);

    if (distance < ARRIVE_EPSILON) {
      if (this.mode === 'seek') this.pickUpReachedBottle();
      else if (this.mode === 'deliver') this.handOver();
      else if (this.deps.bottles.count > 0) {
        this.mode = 'seek';
      } else {
        this.wait = 0.4;
        this.pickWanderTarget();
      }
    }
  }

  private beginWander(): void {
    this.mode = 'wander';
    this.pickWanderTarget();
  }

  private pickUpReachedBottle(): void {
    const bottle = this.deps.bottles.nearest(this.group.position, 1);
    if (!bottle) {
      this.beginWander();
      return;
    }
    this.deps.bottles.remove(bottle);
    this.carried = bottle.type.id;
    const material = this.carrySlot.material;
    if (material instanceof THREE.MeshLambertMaterial) {
      material.color.set(BOTTLE_TYPES[bottle.type.id].color);
    }
    this.carrySlot.visible = true;
    this.mode = 'deliver';
    this.target.copy(this.deps.machinePoint);
  }

  private handOver(): void {
    if (this.carried !== null) this.deps.onDeliver(this.carried, this.name);
    this.carried = null;
    this.carrySlot.visible = false;
    this.wait = 0.2;
    this.beginWander();
  }

  private placeRandomly(): void {
    this.group.position.set(
      WANDER_AREA.minX + Math.random() * (WANDER_AREA.maxX - WANDER_AREA.minX),
      0,
      WANDER_AREA.minZ + Math.random() * (WANDER_AREA.maxZ - WANDER_AREA.minZ),
    );
    this.group.position.y = surfaceHeightAt(this.group.position.z);
  }

  private pickWanderTarget(): void {
    this.target.set(
      WANDER_AREA.minX + Math.random() * (WANDER_AREA.maxX - WANDER_AREA.minX),
      0,
      WANDER_AREA.minZ + Math.random() * (WANDER_AREA.maxZ - WANDER_AREA.minZ),
    );
    this.target.y = surfaceHeightAt(this.target.z);
  }

  private stepToward(dt: number, target: THREE.Vector3): number {
    const position = this.group.position;
    const dx = target.x - position.x;
    const dz = target.z - position.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.001) return distance;

    const move = Math.min(this.speed * dt, distance);
    position.x += (dx / distance) * move;
    position.z += (dz / distance) * move;
    position.y = surfaceHeightAt(position.z);
    this.group.rotation.y = Math.atan2(dx, dz);
    this.walkPhase += dt * 9;
    this.animateWalk();
    return distance;
  }

  private animateWalk(): void {
    const swing = Math.sin(this.walkPhase) * 0.6;
    const [left, right] = this.legs;
    if (left) left.rotation.x = swing;
    if (right) right.rotation.x = -swing;
  }

  private animateIdle(dt: number): void {
    this.walkPhase += dt;
    const swing = Math.sin(this.walkPhase) * 0.05;
    const [left, right] = this.legs;
    if (left) left.rotation.x = swing;
    if (right) right.rotation.x = -swing;
  }
}

export class CollectorManager {
  private readonly collectors: Collector[] = [];
  private readonly root: THREE.Group;

  constructor(
    parent: THREE.Object3D,
    private deps: CollectorDeps,
  ) {
    this.root = new THREE.Group();
    parent.add(this.root);
  }

  get count(): number {
    return this.collectors.length;
  }

  sync(specs: ActiveCollectorSpec[]): void {
    const totalLevels = specs.reduce((sum, spec) => sum + spec.level, 0);
    const desired = Math.min(totalLevels, MAX_COLLECTORS);
    const fallback: ActiveCollectorSpec = specs[0] ?? {
      id: 'fallback',
      name: 'Gyűjtő',
      level: 1,
      speed: 1.5,
      color: 0x4a90d9,
    };
    const ordered = [...specs].sort((a, b) => b.speed - a.speed);

    while (this.collectors.length < desired) {
      const collector = new Collector(this.deps);
      collector.configure(ordered[this.collectors.length] ?? fallback, fallback);
      this.root.add(collector.group);
      this.collectors.push(collector);
    }

    while (this.collectors.length > desired) {
      const removed = this.collectors.pop();
      if (removed) this.root.remove(removed.group);
    }

    for (let i = 0; i < this.collectors.length; i++) {
      this.collectors[i]?.configure(ordered[i] ?? fallback, fallback);
    }
  }

  update(dt: number): void {
    for (const collector of this.collectors) collector.update(dt);
  }
}

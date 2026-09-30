import * as THREE from 'three';
import type { BottleType, BottleTypeId } from '../game/types';

export interface ActiveBottle {
  group: THREE.Group;
  type: BottleType;
  baseY: number;
  phase: number;
}

const MAX_BOTTLES = 60;
const AREA = { minX: -14, maxX: 14, minZ: -0.5, maxZ: 5.6 };

export class BottleField {
  readonly active: ActiveBottle[] = [];

  private pools = new Map<BottleTypeId, THREE.Group[]>();
  private root: THREE.Group;
  private raycaster = new THREE.Raycaster();
  private time = 0;

  constructor(parent: THREE.Object3D) {
    this.root = new THREE.Group();
    parent.add(this.root);
  }

  get count(): number {
    return this.active.length;
  }

  spawn(type: BottleType): ActiveBottle | null {
    if (this.active.length >= MAX_BOTTLES) return null;
    const group = this.acquire(type.id);
    const pos = this.randomPosition();
    group.position.copy(pos);
    group.rotation.y = Math.random() * Math.PI * 2;
    this.root.add(group);
    const bottle: ActiveBottle = { group, type, baseY: pos.y, phase: Math.random() * Math.PI * 2 };
    this.active.push(bottle);
    return bottle;
  }

  pick(ndc: THREE.Vector2, camera: THREE.Camera): ActiveBottle | null {
    if (this.active.length === 0) return null;
    this.raycaster.setFromCamera(ndc, camera);
    const groups: THREE.Object3D[] = this.active.map((b) => b.group);
    const hits = this.raycaster.intersectObjects(groups, true);
    const hit = hits[0];
    if (!hit) return null;
    let node: THREE.Object3D | null = hit.object;
    while (node !== null && !groups.includes(node)) node = node.parent;
    if (node === null) return null;
    return this.active.find((b) => b.group === node) ?? null;
  }

  remove(bottle: ActiveBottle): void {
    const index = this.active.indexOf(bottle);
    if (index >= 0) this.active.splice(index, 1);
    this.root.remove(bottle.group);
    const pool = this.pools.get(bottle.type.id) ?? [];
    pool.push(bottle.group);
    this.pools.set(bottle.type.id, pool);
  }

  update(dt: number): void {
    this.time += dt;
    for (const bottle of this.active) {
      bottle.group.rotation.y += dt * 0.7;
      bottle.group.position.y = bottle.baseY + 0.015 * Math.sin(this.time * 2 + bottle.phase);
    }
  }

  private acquire(id: BottleTypeId): THREE.Group {
    const pool = this.pools.get(id);
    const cached = pool?.pop();
    if (cached) return cached;
    return buildBottle(id);
  }

  private randomPosition(): THREE.Vector3 {
    for (let attempt = 0; attempt < 20; attempt++) {
      const x = AREA.minX + Math.random() * (AREA.maxX - AREA.minX);
      const z = AREA.minZ + Math.random() * (AREA.maxZ - AREA.minZ);
      const blocked = (Math.abs(x) < 1.9 && z > 1.5 && z < 5.4) || (Math.abs(x - 3.4) < 1.3 && Math.abs(z - 2.4) < 0.9);
      if (!blocked) {
        const onWalk = z > 1.95 && z < 6.05;
        return new THREE.Vector3(x, onWalk ? 0.08 : 0, z);
      }
    }
    return new THREE.Vector3(5, 0, 2.5);
  }
}

function buildBottle(id: BottleTypeId): THREE.Group {
  const group = new THREE.Group();
  const add = (mesh: THREE.Mesh): void => {
    mesh.castShadow = true;
    group.add(mesh);
  };

  if (id === 'pet') {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.095, 0.3, 10),
      new THREE.MeshLambertMaterial({ color: 0x7ec8ff, transparent: true, opacity: 0.9 }),
    );
    body.position.y = 0.16;
    add(body);
    const shoulder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.085, 0.08, 10),
      new THREE.MeshLambertMaterial({ color: 0x7ec8ff, transparent: true, opacity: 0.9 }),
    );
    shoulder.position.y = 0.35;
    add(shoulder);
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.07, 10),
      new THREE.MeshLambertMaterial({ color: 0x7ec8ff }),
    );
    neck.position.y = 0.42;
    add(neck);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.045, 10),
      new THREE.MeshLambertMaterial({ color: 0x1565c0 }),
    );
    cap.position.y = 0.47;
    add(cap);
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(0.098, 0.098, 0.11, 10),
      new THREE.MeshLambertMaterial({ color: 0xf4f1e8 }),
    );
    label.position.y = 0.17;
    add(label);
  } else if (id === 'doboz') {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.105, 0.3, 12),
      new THREE.MeshLambertMaterial({ color: 0xd64541 }),
    );
    body.position.y = 0.15;
    add(body);
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.025, 12),
      new THREE.MeshLambertMaterial({ color: 0xcfd2d6 }),
    );
    top.position.y = 0.31;
    add(top);
    const tab = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.012, 0.04),
      new THREE.MeshLambertMaterial({ color: 0x9aa0a6 }),
    );
    tab.position.set(0.03, 0.33, 0);
    add(tab);
  } else if (id === 'zsugoritott') {
    const body = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.13, 0),
      new THREE.MeshLambertMaterial({ color: 0xa5d66f }),
    );
    body.scale.set(1, 0.7, 0.75);
    body.position.y = 0.1;
    add(body);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8),
      new THREE.MeshLambertMaterial({ color: 0x2e7d32 }),
    );
    cap.position.set(0.1, 0.1, 0);
    add(cap);
  } else {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.1, 0.3, 10),
      new THREE.MeshLambertMaterial({ color: 0x1f7a33, transparent: true, opacity: 0.95 }),
    );
    body.position.y = 0.15;
    add(body);
    const shoulder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.075, 0.08, 10),
      new THREE.MeshLambertMaterial({ color: 0x1f7a33 }),
    );
    shoulder.position.y = 0.33;
    add(shoulder);
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.08, 10),
      new THREE.MeshLambertMaterial({ color: 0x1f7a33 }),
    );
    neck.position.y = 0.4;
    add(neck);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.05, 8),
      new THREE.MeshLambertMaterial({ color: 0xffd23f }),
    );
    cap.position.y = 0.46;
    add(cap);
  }

  return group;
}

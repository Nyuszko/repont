import * as THREE from 'three';

interface BuildingDef {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: number;
}

const BUILDINGS: BuildingDef[] = [
  { x: -17, z: -13, w: 9, h: 10, d: 8, color: 0xd9a08a },
  { x: -5.5, z: -14, w: 8, h: 14, d: 8, color: 0x9fb8c9 },
  { x: 5.5, z: -13, w: 8, h: 8, d: 8, color: 0xc9b7a0 },
  { x: 17, z: -14, w: 9, h: 12, d: 8, color: 0xa8c3a0 },
];

const TREES: Array<[number, number]> = [
  [-9.5, 0.4],
  [-7.5, -1.6],
  [9, 0.6],
  [7, -1.8],
  [14, 0.2],
  [-14, -0.6],
];

const BUSHES: Array<[number, number]> = [
  [-3.2, 1.4],
  [2.2, 1.2],
  [4.8, 0.9],
  [-11, 1.3],
  [11.5, 1.1],
];

const LAMP_XS = [-12, -4, 4, 12];

export class World {
  readonly group = new THREE.Group();
  readonly lampMaterials: THREE.MeshLambertMaterial[] = [];

  constructor() {
    this.buildGround();
    this.buildStreet();
    this.buildBuildings();
    this.buildTrees();
    this.buildBushes();
    this.buildLamps();
    this.buildProps();
  }

  private buildGround(): void {
    const grass = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshLambertMaterial({ color: 0x5da45f }),
    );
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    this.group.add(grass);
  }

  private buildStreet(): void {
    const nearWalk = new THREE.Mesh(
      new THREE.BoxGeometry(120, 0.08, 4),
      new THREE.MeshLambertMaterial({ color: 0xb9b3a5 }),
    );
    nearWalk.position.set(0, 0.04, 4);
    nearWalk.receiveShadow = true;
    this.group.add(nearWalk);

    const farWalk = new THREE.Mesh(
      new THREE.BoxGeometry(120, 0.08, 2),
      new THREE.MeshLambertMaterial({ color: 0xb9b3a5 }),
    );
    farWalk.position.set(0, 0.04, 14);
    farWalk.receiveShadow = true;
    this.group.add(farWalk);

    const asphalt = new THREE.Mesh(
      new THREE.BoxGeometry(120, 0.06, 7),
      new THREE.MeshLambertMaterial({ color: 0x3d4045 }),
    );
    asphalt.position.set(0, 0.03, 9.5);
    asphalt.receiveShadow = true;
    this.group.add(asphalt);

    const dashMat = new THREE.MeshLambertMaterial({ color: 0xf4f1e8 });
    const dashGeo = new THREE.BoxGeometry(1.1, 0.012, 0.14);
    for (let x = -30; x <= 30; x += 3) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.position.set(x, 0.066, 9.5);
      this.group.add(dash);
    }

    const curbMat = new THREE.MeshLambertMaterial({ color: 0xcfcbc0 });
    for (const z of [6.05, 12.95]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(120, 0.1, 0.25), curbMat);
      curb.position.set(0, 0.05, z);
      curb.receiveShadow = true;
      this.group.add(curb);
    }
  }

  private buildBuildings(): void {
    for (const def of BUILDINGS) {
      const tex = makeWindowTexture();
      tex.repeat.set(Math.max(1, Math.round(def.w / 3)), Math.max(1, Math.round(def.h / 3)));
      const mat = new THREE.MeshLambertMaterial({ color: def.color, map: tex });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.h, def.d), mat);
      mesh.position.set(def.x, def.h / 2, def.z);
      this.group.add(mesh);

      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(def.w + 0.5, 0.35, def.d + 0.5),
        new THREE.MeshLambertMaterial({ color: 0x5c5650 }),
      );
      roof.position.set(def.x, def.h + 0.17, def.z);
      this.group.add(roof);
    }
  }

  private buildTrees(): void {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6d4c33 });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x3f8f46 });
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.17, 1.2, 8);
    const leafGeo = new THREE.IcosahedronGeometry(0.95, 0);
    for (const [x, z] of TREES) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.6;
      trunk.castShadow = true;
      tree.add(trunk);
      const blob1 = new THREE.Mesh(leafGeo, leafMat);
      blob1.position.y = 1.6;
      blob1.castShadow = true;
      tree.add(blob1);
      const blob2 = new THREE.Mesh(leafGeo, leafMat);
      blob2.position.set(0.4, 1.25, 0.15);
      blob2.scale.setScalar(0.6);
      blob2.castShadow = true;
      tree.add(blob2);
      tree.position.set(x, 0, z);
      tree.rotation.y = Math.random() * Math.PI;
      this.group.add(tree);
    }
  }

  private buildBushes(): void {
    const geo = new THREE.IcosahedronGeometry(0.45, 0);
    for (const [x, z] of BUSHES) {
      const mat = new THREE.MeshLambertMaterial({
        color: Math.random() < 0.5 ? 0x3d8046 : 0x468f4f,
      });
      const bush = new THREE.Mesh(geo, mat);
      bush.scale.set(1, 0.7, 1);
      bush.position.set(x, 0.28, z);
      bush.rotation.y = Math.random() * Math.PI;
      bush.castShadow = true;
      this.group.add(bush);
    }
  }

  private buildLamps(): void {
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x3b4046 });
    const headMat = new THREE.MeshLambertMaterial({
      color: 0x6b7076,
      emissive: 0xfff3c4,
      emissiveIntensity: 0.7,
    });
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.09, 3.6, 8);
    for (const x of LAMP_XS) {
      const lamp = new THREE.Group();
      const lampHeadMat = headMat.clone();
      this.lampMaterials.push(lampHeadMat);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 1.8;
      pole.castShadow = true;
      lamp.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.7), poleMat);
      arm.position.set(0, 3.55, 0.3);
      lamp.add(arm);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.34), lampHeadMat);
      head.position.set(0, 3.5, 0.62);
      lamp.add(head);
      lamp.position.set(x, 0.08, 5.55);
      this.group.add(lamp);
    }
  }

  private buildProps(): void {
    const bench = new THREE.Group();
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x8a5a33 });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.45), woodMat);
    seat.position.y = 0.5;
    seat.castShadow = true;
    bench.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.06), woodMat);
    back.position.set(0, 0.75, -0.2);
    back.castShadow = true;
    bench.add(back);
    for (const lx of [-0.6, 0.6]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.4), metalMat);
      leg.position.set(lx, 0.25, 0);
      bench.add(leg);
    }
    bench.position.set(3.4, 0.08, 2.4);
    this.group.add(bench);

    const bin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.24, 0.7, 10),
      new THREE.MeshLambertMaterial({ color: 0x3f7d4e }),
    );
    bin.position.set(-1.9, 0.43, 3.6);
    bin.castShadow = true;
    this.group.add(bin);
    const binRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.06, 10),
      new THREE.MeshLambertMaterial({ color: 0x2c5c38 }),
    );
    binRim.position.set(-1.9, 0.8, 3.6);
    this.group.add(binRim);
  }
}

function makeWindowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D nem elérhető');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 128, 128);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const lit = Math.random() < 0.35;
      ctx.fillStyle = lit ? '#ffe9a8' : '#3a4a5f';
      ctx.fillRect(14 + col * 28, 14 + row * 28, 18, 18);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

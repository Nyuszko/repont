import * as THREE from 'three';

const DAY_LENGTH_SECONDS = 180;

interface SkyKey {
  sky: number;
  fog: number;
  sun: number;
  ambient: number;
  intensity: number;
  lamps: number;
}

const KEYS: Array<{ at: number; values: SkyKey }> = [
  {
    at: 0,
    values: {
      sky: 0x0b1d3a,
      fog: 0x0b1d3a,
      sun: 0x6f86c9,
      ambient: 0x2b3a5c,
      intensity: 0.35,
      lamps: 1,
    },
  },
  {
    at: 0.22,
    values: {
      sky: 0x8ecae6,
      fog: 0x8ecae6,
      sun: 0xfff2cc,
      ambient: 0xcfe8ff,
      intensity: 2.2,
      lamps: 0.25,
    },
  },
  {
    at: 0.5,
    values: {
      sky: 0x9fd0ea,
      fog: 0x9fd0ea,
      sun: 0xfff6dd,
      ambient: 0xd8ecff,
      intensity: 2.5,
      lamps: 0.1,
    },
  },
  {
    at: 0.74,
    values: {
      sky: 0xe88f5c,
      fog: 0xd97a52,
      sun: 0xffb27a,
      ambient: 0xffc9a3,
      intensity: 1.5,
      lamps: 0.7,
    },
  },
  {
    at: 0.87,
    values: {
      sky: 0x2c3e6b,
      fog: 0x2c3e6b,
      sun: 0x8a9ad0,
      ambient: 0x3d4a70,
      intensity: 0.5,
      lamps: 1,
    },
  },
  {
    at: 1,
    values: {
      sky: 0x0b1d3a,
      fog: 0x0b1d3a,
      sun: 0x6f86c9,
      ambient: 0x2b3a5c,
      intensity: 0.35,
      lamps: 1,
    },
  },
];

export class DayNightCycle {
  private readonly hemisphere: THREE.HemisphereLight;
  private readonly sun: THREE.DirectionalLight;
  private readonly lampMaterials: THREE.MeshLambertMaterial[] = [];
  private phase = 0.3;
  private current: SkyKey;

  constructor(
    private scene: THREE.Scene,
    private exposureBase = 1,
  ) {
    this.hemisphere = new THREE.HemisphereLight(0xcfe8ff, 0x51704f, 0.9);
    this.sun = new THREE.DirectionalLight(0xfff2cc, 2.2);
    scene.add(this.hemisphere);
    scene.add(this.sun);

    this.current = this.sample(0.3);
    this.apply(this.current);
  }

  registerLamp(material: THREE.MeshLambertMaterial): void {
    this.lampMaterials.push(material);
  }

  setSunShadows(configured: boolean): void {
    this.sun.castShadow = configured;
  }

  update(dt: number): void {
    this.phase = (this.phase + dt / DAY_LENGTH_SECONDS) % 1;
    const next = this.sample(this.phase);
    this.current = this.lerp(this.current, next, Math.min(1, dt * 1.5));
    this.apply(this.current);
  }

  get isNight(): boolean {
    return this.current.lamps > 0.5;
  }

  get timeOfDay(): string {
    const hour = Math.floor(this.phase * 24);
    return `${hour.toString().padStart(2, '0')}:${Math.floor((this.phase * 24 % 1) * 60)
      .toString()
      .padStart(2, '0')}`;
  }

  private apply(key: SkyKey): void {
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.setHex(key.sky);
    }
    if (this.scene.fog instanceof THREE.Fog) this.scene.fog.color.setHex(key.fog);
    this.sun.color.setHex(key.sun);
    this.sun.intensity = key.intensity * this.exposureBase;
    this.hemisphere.color.setHex(key.ambient);
    this.hemisphere.intensity = 0.35 + key.intensity * 0.3;
    for (const material of this.lampMaterials) {
      material.emissiveIntensity = 0.15 + key.lamps * 1.5;
    }
  }

  private sample(phase: number): SkyKey {
    const first = KEYS[0];
    const last = KEYS[KEYS.length - 1];
    if (!first || !last) throw new Error('A napi ciklus nincs definiálva');
    let lower = first;
    let upper = last;
    for (let i = 0; i < KEYS.length - 1; i++) {
      const a = KEYS[i];
      const b = KEYS[i + 1];
      if (a && b && phase >= a.at && phase <= b.at) {
        lower = a;
        upper = b;
        break;
      }
    }
    const span = upper.at - lower.at;
    const t = span <= 0 ? 0 : (phase - lower.at) / span;
    return {
      sky: mixHex(lower.values.sky, upper.values.sky, t),
      fog: mixHex(lower.values.fog, upper.values.fog, t),
      sun: mixHex(lower.values.sun, upper.values.sun, t),
      ambient: mixHex(lower.values.ambient, upper.values.ambient, t),
      intensity: lerp(lower.values.intensity, upper.values.intensity, t),
      lamps: lerp(lower.values.lamps, upper.values.lamps, t),
    };
  }

  private lerp(from: SkyKey, to: SkyKey, t: number): SkyKey {
    return {
      sky: mixHex(from.sky, to.sky, t),
      fog: mixHex(from.fog, to.fog, t),
      sun: mixHex(from.sun, to.sun, t),
      ambient: mixHex(from.ambient, to.ambient, t),
      intensity: lerp(from.intensity, to.intensity, t),
      lamps: lerp(from.lamps, to.lamps, t),
    };
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixHex(from: number, to: number, t: number): number {
  const r = Math.round(lerp((from >> 16) & 0xff, (to >> 16) & 0xff, t));
  const g = Math.round(lerp((from >> 8) & 0xff, (to >> 8) & 0xff, t));
  const b = Math.round(lerp(from & 0xff, to & 0xff, t));
  return (r << 16) | (g << 8) | b;
}

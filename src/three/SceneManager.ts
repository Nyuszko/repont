import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.background = new THREE.Color(0x8ecae6);
    this.scene.fog = new THREE.Fog(0x8ecae6, 40, 120);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 300);
    this.camera.position.set(8.5, 6.2, 11);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 1.3, 2.5);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 45;
    this.controls.maxPolarAngle = 1.42;
    this.controls.minPolarAngle = 0.15;
    this.controls.update();

    this.applyQuality();

    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);
    this.onResize();
  }

  get isMobile(): boolean {
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820;
  }

  private applyQuality(): void {
    const mobile = this.isMobile;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    this.renderer.shadowMap.enabled = !mobile;
    this.controls.rotateSpeed = mobile ? 0.75 : 0.55;
    this.controls.zoomSpeed = mobile ? 1 : 0.85;
  }

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.applyQuality();
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  update(): void {
    this.controls.update();
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    this.controls.dispose();
    this.renderer.dispose();
  }
}

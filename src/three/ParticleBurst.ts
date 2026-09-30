import * as THREE from 'three';

const MAX_PARTICLES = 60;
const GRAVITY = -9.5;

interface Particle {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshLambertMaterial>;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ParticleBurst {
  private readonly particles: Particle[] = [];
  private readonly pool: THREE.Mesh<THREE.SphereGeometry, THREE.MeshLambertMaterial>[] = [];
  private readonly root = new THREE.Group();
  private readonly geometry = new THREE.SphereGeometry(0.055, 5, 4);

  constructor(parent: THREE.Object3D) {
    parent.add(this.root);
  }

  burst(position: THREE.Vector3, color: number, count = 8, power = 2.4): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;
      const mesh = this.pool.pop() ?? new THREE.Mesh(this.geometry, burstMaterial());
      mesh.material.color.setHex(color);
      mesh.position.copy(position);
      mesh.scale.setScalar(0.8 + Math.random() * 0.7);
      this.root.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * power * (0.4 + Math.random() * 0.8),
        power * (0.5 + Math.random()),
        Math.sin(angle) * power * (0.4 + Math.random() * 0.8),
      );

      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.45,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      if (!particle) continue;
      particle.life += dt;
      if (particle.life >= particle.maxLife) {
        this.retire(particle, i);
        continue;
      }
      particle.velocity.y += GRAVITY * dt;
      particle.mesh.position.addScaledVector(particle.velocity, dt);
      particle.mesh.rotation.x += dt * 6;
      particle.mesh.rotation.z += dt * 5;
      const remaining = 1 - particle.life / particle.maxLife;
      particle.mesh.scale.setScalar(Math.max(0.05, remaining * 1.1));
    }
  }

  private retire(particle: Particle, index: number): void {
    this.root.remove(particle.mesh);
    particle.mesh.material.dispose();
    this.pool.push(particle.mesh);
    this.particles.splice(index, 1);
  }
}

function burstMaterial(): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: 0xffffff });
}

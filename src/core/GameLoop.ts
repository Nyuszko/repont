export class GameLoop {
  private rafId = 0;
  private last = 0;
  private running = false;

  constructor(private tick: (dt: number) => void) {}

  private frame = (time: number): void => {
    const dt = Math.min(0.1, (time - this.last) / 1000);
    this.last = time;
    this.tick(dt);
    if (this.running) this.rafId = requestAnimationFrame(this.frame);
  };

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }
}

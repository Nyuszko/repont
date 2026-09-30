interface ToneOptions {
  freq: number;
  endFreq?: number;
  dur: number;
  type: OscillatorType;
  gain: number;
  delay?: number;
}

export class SoundEngine {
  enabled = true;
  private ctx: AudioContext | null = null;

  unlock(): void {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) this.ctx = new Ctor();
    }
    void this.ctx?.resume();
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
  }

  private tone(opts: ToneOptions): void {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const t0 = this.ctx.currentTime + (opts.delay ?? 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = opts.type;
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.endFreq), t0 + opts.dur);
    }
    gain.gain.setValueAtTime(opts.gain, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.02);
  }

  pop(): void {
    this.tone({ freq: 340, endFreq: 120, dur: 0.1, type: 'sine', gain: 0.18 });
  }

  clink(): void {
    this.tone({ freq: 1900, endFreq: 1500, dur: 0.07, type: 'triangle', gain: 0.1 });
    this.tone({ freq: 2600, dur: 0.05, type: 'triangle', gain: 0.05, delay: 0.03 });
  }

  cash(): void {
    this.tone({ freq: 880, dur: 0.09, type: 'sine', gain: 0.14 });
    this.tone({ freq: 1318.5, dur: 0.16, type: 'sine', gain: 0.14, delay: 0.07 });
  }

  upgrade(): void {
    this.tone({ freq: 523.25, dur: 0.09, type: 'triangle', gain: 0.13 });
    this.tone({ freq: 659.25, dur: 0.09, type: 'triangle', gain: 0.13, delay: 0.07 });
    this.tone({ freq: 783.99, dur: 0.18, type: 'triangle', gain: 0.14, delay: 0.14 });
  }

  deny(): void {
    this.tone({ freq: 170, endFreq: 110, dur: 0.14, type: 'square', gain: 0.07 });
  }
}

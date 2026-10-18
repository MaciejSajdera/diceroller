/**
 * Audio system for dice roller - uses Web Audio API to generate sounds
 */

type RandomSource = () => number;

const defaultRandom: RandomSource = () => Math.random();

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private enabled = true;

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      // Lazy initialization - will be created on first user interaction
    }
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (this.ctx && this.ctx.state === 'closed') {
      this.ctx = null;
    }
    if (!this.ctx && typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        this.ctx = new AudioContext();
      } catch {
        this.enabled = false;
        return null;
      }
    }
    return this.ctx;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }

  /**
   * Play dice roll sound - multiple quick impacts with decay
   */
  playRoll(rng: RandomSource = defaultRandom): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const impacts = 3 + Math.floor(rng() * 3); // 3-5 bounces

    for (let i = 0; i < impacts; i++) {
      const delay = i * 0.04 + rng() * 0.02;
      const volume = 0.15 * (1 - i / impacts) * (0.8 + rng() * 0.4);
      this.playImpact(ctx, now + delay, volume, 80 + rng() * 120);
    }
  }

  private playImpact(ctx: AudioContext, time: number, volume: number, baseFreq: number): void {
    // Noise burst for impact
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      const envelope = Math.exp(-i / (bufferSize * 0.2));
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = baseFreq;
    filter.Q.value = 5;

    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.15);
  }

  /**
   * Play button click sound
   */
  playClick(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Play success sound (e.g., winning pattern)
   */
  playSuccess(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const delay = i * 0.08;
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.4);
    });
  }

  /**
   * Play alert sound (e.g., jail in Monopoly, critical fail)
   */
  playAlert(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      const delay = i * 0.15;
      osc.frequency.setValueAtTime(440, now + delay);
      osc.frequency.setValueAtTime(330, now + delay + 0.06);

      gain.gain.setValueAtTime(0.1, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.12);
    }
  }
}

export const audioSystem = new AudioSystem();

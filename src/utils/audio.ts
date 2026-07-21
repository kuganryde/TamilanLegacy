/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientOscs: OscillatorNode[] = [];
  private ambientGain: GainNode | null = null;

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAmbient();
    } else {
      this.startAmbient();
    }
  }

  toggleMute(): boolean {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  getMuteState(): boolean {
    return this.isMuted;
  }

  playBell() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Resonant high-pitch frequency simulating a bronze temple bell
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(660, now); // E5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(990, now); // B5 (fifth harmonic adds bell character)

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 2.6);
    osc2.stop(now + 2.6);
  }

  playYazh(frequency: number = 440) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Plucked string sound
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.9);
  }

  playDrum(isHeavy: boolean = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Deep thud representing Mridangam/Thavil
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = isHeavy ? 100 : 150;
    const endFreq = isHeavy ? 40 : 60;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  playSabotageAlert() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.3);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  startAmbient() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ambientOscs.length > 0) return;

    const now = this.ctx.currentTime;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0, now);
    this.ambientGain.gain.linearRampToValueAtTime(0.03, now + 2.0); // very soft
    this.ambientGain.connect(this.ctx.destination);

    // Drone 1: Root Tanpura pitch
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, now); // A2 (deep drone)
    
    // Low-pass filter to make it warm and soft
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);

    // Drone 2: Fifth
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(165, now); // E3

    osc1.connect(filter);
    filter.connect(this.ambientGain);

    osc2.connect(this.ambientGain);

    osc1.start(now);
    osc2.start(now);

    this.ambientOscs = [osc1, osc2];
  }

  stopAmbient() {
    if (!this.ctx || this.ambientOscs.length === 0) return;
    
    const now = this.ctx.currentTime;
    if (this.ambientGain) {
      try {
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
        this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.5);
      } catch (e) {}
    }

    setTimeout(() => {
      this.ambientOscs.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {}
      });
      this.ambientOscs = [];
      this.ambientGain = null;
    }, 600);
  }
}

export const audio = new SoundEngine();

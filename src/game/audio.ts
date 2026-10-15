/**
 * Procedural Web Audio API sound generator for Drift King 3D.
 * 100% zero external sound file dependencies (Zero-404).
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  
  // Engine audio nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Tire screech audio nodes
  private screechSource: AudioBufferSourceNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;
  private screechGain: GainNode | null = null;

  // Nitro boost noise
  private nitroGain: GainNode | null = null;
  private nitroFilter: BiquadFilterNode | null = null;

  private isInitialized: boolean = false;

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupEngineSynth();
      this.setupTireScreechSynth();
      this.setupNitroSynth();
      this.isInitialized = true;
    } catch {
      // AudioContext may fail if not supported
    }
  }

  public resume() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private setupEngineSynth() {
    if (!this.ctx) return;

    // Dual oscillator for rich throaty sports exhaust sound
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineGain = this.ctx.createGain();

    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2.type = 'triangle';

    this.engineOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A
    this.engineOsc2.frequency.setValueAtTime(55 * 1.5, this.ctx.currentTime); // 5th harmonic

    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(350, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  private setupTireScreechSynth() {
    if (!this.ctx) return;

    // Generate 2 seconds of looping colored noise for tire screeching
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.8;
    }

    const screech = this.ctx.createBufferSource();
    screech.buffer = noiseBuffer;
    screech.loop = true;

    this.screechFilter = this.ctx.createBiquadFilter();
    this.screechFilter.type = 'bandpass';
    this.screechFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.screechFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    screech.connect(this.screechFilter);
    this.screechFilter.connect(this.screechGain);
    this.screechGain.connect(this.ctx.destination);

    screech.start();
    this.screechSource = screech;
  }

  private setupNitroSynth() {
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 1.5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const nitroSource = this.ctx.createBufferSource();
    nitroSource.buffer = noiseBuffer;
    nitroSource.loop = true;

    this.nitroFilter = this.ctx.createBiquadFilter();
    this.nitroFilter.type = 'highpass';
    this.nitroFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    nitroSource.connect(this.nitroFilter);
    this.nitroFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.ctx.destination);

    nitroSource.start();
  }

  public updateEngine(rpmRatio: number, speedRatio: number, isAccelerating: boolean) {
    if (!this.ctx || this.isMuted || !this.engineGain || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter) return;

    const t = this.ctx.currentTime;
    // Base frequency from 45Hz idle to 320Hz redline
    const baseFreq = 45 + rpmRatio * 220 + speedRatio * 80;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, t, 0.05);

    // Filter opens up as RPM climbs
    const cutoff = 300 + rpmRatio * 1800;
    this.engineFilter.frequency.setTargetAtTime(cutoff, t, 0.05);

    // Volume level
    const targetGain = isAccelerating ? 0.18 : 0.08 + speedRatio * 0.06;
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.05);
  }

  public updateDriftScreech(slipIntensity: number) {
    if (!this.ctx || this.isMuted || !this.screechGain || !this.screechFilter) return;

    const t = this.ctx.currentTime;
    // Slip intensity 0.0 to 1.0
    const gain = Math.min(0.25, slipIntensity * 0.25);
    this.screechGain.gain.setTargetAtTime(gain, t, 0.04);

    // Modulate pitch slightly with intensity
    const freq = 1000 + slipIntensity * 600;
    this.screechFilter.frequency.setTargetAtTime(freq, t, 0.05);
  }

  public setNitroBoost(active: boolean) {
    if (!this.ctx || this.isMuted || !this.nitroGain) return;
    const t = this.ctx.currentTime;
    this.nitroGain.gain.setTargetAtTime(active ? 0.16 : 0.0, t, 0.05);
  }

  public playDriftChime(comboLevel: number) {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      // Pentatonic scale arpeggio based on combo
      const pitches = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      const freq = pitches[Math.min(pitches.length - 1, comboLevel - 1)] || 880;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, t + 0.15);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    } catch {
      // ignore
    }
  }

  public playImpactSound(intensity: number = 0.5) {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);

      const targetGain = Math.min(0.3, intensity * 0.3);
      gain.gain.setValueAtTime(targetGain, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.26);
    } catch {
      // ignore
    }
  }

  public stopAll() {
    if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    if (this.screechGain) this.screechGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    if (this.nitroGain) this.nitroGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAll();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const soundManager = new SoundSystem();

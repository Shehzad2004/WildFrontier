/**
 * Procedural Web Audio Engine for Wild Frontier
 * Synthesizes 100% of the game's audio procedurally to guarantee zero missing assets or 404s.
 */

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private wildlifeGain: GainNode | null = null;

  // Ambient nodes
  private isAmbientRunning = false;
  private ambientSources: AudioNode[] = [];
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  private masterVol = 0.8;
  private ambientVol = 0.6;
  private effectsVol = 0.8;
  private wildlifeVol = 0.7;
  private muted = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientVol, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.effectsGain = this.ctx.createGain();
      this.effectsGain.gain.setValueAtTime(this.effectsVol, this.ctx.currentTime);
      this.effectsGain.connect(this.masterGain);

      this.wildlifeGain = this.ctx.createGain();
      this.wildlifeGain.gain.setValueAtTime(this.wildlifeVol, this.ctx.currentTime);
      this.wildlifeGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(master: number, ambient: number, effects: number, wildlife: number, muted = false) {
    this.masterVol = master;
    this.ambientVol = ambient;
    this.effectsVol = effects;
    this.wildlifeVol = wildlife;
    this.muted = muted;

    if (this.ctx && this.masterGain && this.ambientGain && this.effectsGain && this.wildlifeGain) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(muted ? 0 : master, t, 0.05);
      this.ambientGain.gain.setTargetAtTime(ambient, t, 0.05);
      this.effectsGain.gain.setTargetAtTime(effects, t, 0.05);
      this.wildlifeGain.gain.setTargetAtTime(wildlife, t, 0.05);
    }
  }

  public startAmbient() {
    this.initCtx();
    if (this.isAmbientRunning || !this.ctx || !this.ambientGain) return;
    this.isAmbientRunning = true;

    // 1. Wind in canopy (filtered noise with slow sine LFO)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 450;
    filter.Q.value = 1.2;

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.25;

    whiteNoise.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.ambientGain);

    whiteNoise.start();
    lfo.start();
    this.ambientSources.push(whiteNoise, lfo, filter, windGain);

    // 2. Periodic procedural bird & jungle chirps
    this.scheduleNextBirdCall();
  }

  private scheduleNextBirdCall() {
    if (!this.isAmbientRunning) return;
    const delay = 3500 + Math.random() * 6000;
    setTimeout(() => {
      if (this.isAmbientRunning) {
        this.playBirdChirp();
        this.scheduleNextBirdCall();
      }
    }, delay);
  }

  public playBirdChirp() {
    if (!this.ctx || !this.wildlifeGain || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 2200 + Math.random() * 800;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq - 200, t + 0.18);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.wildlifeGain);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playFootstep(surface: 'grass' | 'mud' | 'rock' | 'water') {
    this.initCtx();
    if (!this.ctx || !this.effectsGain || this.muted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    if (surface === 'water') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    } else if (surface === 'rock') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.07);
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(150, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    } else if (surface === 'mud') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.14);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    } else {
      // Grass / Leaves
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.09);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, t);
      filter.Q.value = 1.0;
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playGunshot(weaponId: string) {
    this.initCtx();
    if (!this.ctx || !this.effectsGain || this.muted) return;
    const t = this.ctx.currentTime;

    if (weaponId === 'bow') {
      // Bow release twang & whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.effectsGain);
      osc.start(t);
      osc.stop(t + 0.22);
      return;
    }

    if (weaponId === 'dart_gun') {
      // Pneumatic gas puff
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 0.18);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.effectsGain);
      noise.start(t);
      return;
    }

    // Heavy rifle / revolver blast
    // 1. Noise transient explosion
    const noiseLen = this.ctx.sampleRate * 0.45;
    const noiseBuffer = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.2));
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(3200, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(400, t + 0.4);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.effectsGain);
    noise.start(t);

    // 2. Low-frequency punch / thud
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(weaponId === 'rifle' ? 140 : 180, t);
    subOsc.frequency.exponentialRampToValueAtTime(35, t + 0.25);
    subGain.gain.setValueAtTime(0.8, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    subOsc.connect(subGain);
    subGain.connect(this.effectsGain);
    subOsc.start(t);
    subOsc.stop(t + 0.32);
  }

  public playReload() {
    this.initCtx();
    if (!this.ctx || !this.effectsGain || this.muted) return;
    const t = this.ctx.currentTime;

    // Bolt slide / metal click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.setValueAtTime(1400, t + 0.08);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.effectsGain);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  public playTigerGrowl() {
    this.initCtx();
    if (!this.ctx || !this.wildlifeGain || this.muted) return;
    const t = this.ctx.currentTime;

    // Deep modulating guttural roar
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(85, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.4);
    osc.frequency.exponentialRampToValueAtTime(55, t + 1.2);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(25, t);
    lfoGain.gain.setValueAtTime(40, t);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);

    osc.connect(gain);
    gain.connect(this.wildlifeGain);

    osc.start(t);
    lfo.start(t);
    osc.stop(t + 1.35);
    lfo.stop(t + 1.35);
  }

  public playDeerAlarm() {
    this.initCtx();
    if (!this.ctx || !this.wildlifeGain || this.muted) return;
    const t = this.ctx.currentTime;

    // High wheezing alarm snort
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.25);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.wildlifeGain);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  public playBoarGrunt() {
    this.initCtx();
    if (!this.ctx || !this.wildlifeGain || this.muted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.linearRampToValueAtTime(75, t + 0.18);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.wildlifeGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playCrocodileHiss() {
    this.initCtx();
    if (!this.ctx || !this.wildlifeGain || this.muted) return;
    const t = this.ctx.currentTime;

    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.6, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.value = 2.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.wildlifeGain);
    noise.start(t);
  }

  public playHitMarker() {
    this.initCtx();
    if (!this.ctx || !this.effectsGain || this.muted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.setValueAtTime(2200, t + 0.04);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.effectsGain);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  public playCameraShutter() {
    this.initCtx();
    if (!this.ctx || !this.effectsGain || this.muted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.setValueAtTime(400, t + 0.06);
    osc.frequency.setValueAtTime(1200, t + 0.12);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.effectsGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playPlayerHurt() {
    this.initCtx();
    if (!this.ctx || !this.effectsGain || this.muted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.effectsGain);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  public playInteract() {
    this.initCtx();
    if (!this.ctx || !this.effectsGain || this.muted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.effectsGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playDogBark() {
    this.initCtx();
    if (!this.ctx || !this.wildlifeGain || this.muted) return;
    const t = this.ctx.currentTime;

    // Dual formant canine bark (sharp woof)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(340, t);
    osc1.frequency.exponentialRampToValueAtTime(160, t + 0.12);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(480, t);
    osc2.frequency.exponentialRampToValueAtTime(220, t + 0.14);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.wildlifeGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.2);
    osc2.stop(t + 0.2);
  }

  public playDogWhine() {
    this.initCtx();
    if (!this.ctx || !this.wildlifeGain || this.muted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.35);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc.connect(gain);
    gain.connect(this.wildlifeGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  public playMissionComplete() {
    this.initCtx();
    if (!this.ctx || !this.effectsGain || this.muted) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const t = this.ctx!.currentTime + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.effectsGain!);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  public updateEngineSound(active: boolean, speedNorm: number) {
    this.initCtx();
    if (!this.ctx || !this.effectsGain) return;

    if (!active) {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
        this.engineOsc = null;
      }
      if (this.engineGain) {
        this.engineGain.disconnect();
        this.engineGain = null;
      }
      return;
    }

    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.effectsGain);
      this.engineOsc.start();
    }

    if (this.engineOsc && this.engineGain) {
      const targetFreq = 50 + speedNorm * 160;
      this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
      this.engineGain.gain.setTargetAtTime(this.muted ? 0 : 0.12 + speedNorm * 0.15, this.ctx.currentTime, 0.1);
    }
  }

  public stopAll() {
    this.ambientSources.forEach(src => {
      try {
        if ('stop' in src && typeof (src as AudioScheduledSourceNode).stop === 'function') {
          (src as AudioScheduledSourceNode).stop();
        }
        src.disconnect();
      } catch {
        // ignore
      }
    });
    this.ambientSources = [];
    this.isAmbientRunning = false;
    this.updateEngineSound(false, 0);
  }
}

export const soundEngine = new SoundEngine();

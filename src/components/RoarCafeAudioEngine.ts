// Web Audio API generative soundscape engine for ROAR Café Chill
// Synthesizes warm lo-fi Rhodes chords, Highland rain texture, and cozy Phin coffee bar ambiance.

export type CafeTrackId = 'highland_dawn' | 'dalat_rain' | 'reserve_night' | 'midnight_vinyl';

export interface CafeAudioState {
  playing: boolean;
  trackId: CafeTrackId;
  lofi: number;
  rain: number;
  cafe: number;
}

interface TrackConfig {
  bpm: number;
  chords: number[][];
  melody: number[];
}

const TRACKS: Record<CafeTrackId, TrackConfig> = {
  highland_dawn: {
    bpm: 72,
    chords: [
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [164.81, 196.0, 246.94, 293.66], // Em7
      [146.83, 174.61, 220.0, 261.63, 329.63], // Dm9
      [130.81, 164.81, 196.0, 246.94, 293.66], // Cmaj9
    ],
    melody: [523.25, 659.25, 587.33, 440.0, 523.25, 392.0, 440.0, 329.63],
  },
  dalat_rain: {
    bpm: 68,
    chords: [
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
      [196.0, 246.94, 293.66, 329.63], // G6
    ],
    melody: [659.25, 587.33, 523.25, 440.0, 392.0, 440.0, 523.25, 493.88],
  },
  reserve_night: {
    bpm: 64,
    chords: [
      [146.83, 174.61, 220.0, 261.63], // Dm7
      [196.0, 246.94, 293.66, 349.23], // G7sus4
      [164.81, 196.0, 246.94, 293.66], // Em7
      [220.0, 261.63, 329.63, 392.0], // Am7
    ],
    melody: [440.0, 523.25, 493.88, 392.0, 349.23, 329.63, 293.66, 329.63],
  },
  midnight_vinyl: {
    bpm: 60,
    chords: [
      [130.81, 164.81, 196.0, 246.94, 293.66], // Cmaj9
      [110.0, 164.81, 196.0, 246.94, 261.63], // Am9
      [146.83, 174.61, 220.0, 261.63, 329.63], // Dm9
      [196.0, 246.94, 293.66, 349.23], // G13
    ],
    melody: [392.0, 440.0, 493.88, 523.25, 440.0, 392.0, 329.63, 293.66],
  },
};

class RoarCafeAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lofiGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private cafeGain: GainNode | null = null;

  private rainNode: AudioBufferSourceNode | null = null;
  private cafeNode: AudioBufferSourceNode | null = null;
  private chordTimer: number | null = null;
  private dripTimer: number | null = null;

  private playing = false;
  private trackId: CafeTrackId = 'highland_dawn';
  private stepIdx = 0;

  private lofiLevel = 0.65;
  private rainLevel = 0.35;
  private cafeLevel = 0.25;

  private listeners = new Set<(state: CafeAudioState) => void>();

  public getState(): CafeAudioState {
    return {
      playing: this.playing,
      trackId: this.trackId,
      lofi: Math.round(this.lofiLevel * 100),
      rain: Math.round(this.rainLevel * 100),
      cafe: Math.round(this.cafeLevel * 100),
    };
  }

  public subscribe(listener: (state: CafeAudioState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snap = this.getState();
    this.listeners.forEach((cb) => {
      try {
        cb(snap);
      } catch {
        // ignore listener errors
      }
    });
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0001;
      this.masterGain.connect(this.ctx.destination);

      this.lofiGain = this.ctx.createGain();
      this.lofiGain.gain.value = this.lofiLevel * 0.26;
      this.lofiGain.connect(this.masterGain);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.value = this.rainLevel * 0.16;
      this.rainGain.connect(this.masterGain);

      this.cafeGain = this.ctx.createGain();
      this.cafeGain.gain.value = this.cafeLevel * 0.14;
      this.cafeGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private createPinkNoiseBuffer(ctx: AudioContext, seconds = 3): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * seconds;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private startAmbientLoops() {
    const ctx = this.ensureContext();
    if (!ctx || !this.rainGain || !this.cafeGain) return;

    if (!this.rainNode) {
      const noiseBuf = this.createPinkNoiseBuffer(ctx, 4);
      const rainSrc = ctx.createBufferSource();
      rainSrc.buffer = noiseBuf;
      rainSrc.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 1050;
      rainFilter.Q.value = 0.55;

      rainSrc.connect(rainFilter);
      rainFilter.connect(this.rainGain);
      rainSrc.start();
      this.rainNode = rainSrc;
    }

    if (!this.cafeNode) {
      const noiseBuf = this.createPinkNoiseBuffer(ctx, 3);
      const cafeSrc = ctx.createBufferSource();
      cafeSrc.buffer = noiseBuf;
      cafeSrc.loop = true;

      const warmFilter = ctx.createBiquadFilter();
      warmFilter.type = 'lowpass';
      warmFilter.frequency.value = 420;

      cafeSrc.connect(warmFilter);
      warmFilter.connect(this.cafeGain);
      cafeSrc.start();
      this.cafeNode = cafeSrc;
    }
  }

  private playWarmNote(freq: number, startTime: number, duration: number, volume: number) {
    if (!this.ctx || !this.lofiGain) return;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const noteGain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq * 2, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(920, startTime);
    filter.frequency.exponentialRampToValueAtTime(340, startTime + duration);

    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(volume, startTime + 0.045);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    const harmonicGain = this.ctx.createGain();
    harmonicGain.gain.value = 0.14;

    osc.connect(filter);
    subOsc.connect(harmonicGain);
    harmonicGain.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.lofiGain);

    osc.start(startTime);
    subOsc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    subOsc.stop(startTime + duration + 0.05);
  }

  private playPhinDrip() {
    if (!this.playing || !this.ctx || !this.cafeGain || this.cafeLevel <= 0.03) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const baseFreq = 720 + Math.random() * 440;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.48, now + 0.065);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(g);
    g.connect(this.cafeGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  private scheduleChordBeat = () => {
    if (!this.playing || !this.ctx) return;
    const track = TRACKS[this.trackId] || TRACKS.highland_dawn;
    const barDurationSec = (60 / track.bpm) * 4;
    const now = this.ctx.currentTime + 0.04;
    const chord = track.chords[this.stepIdx % track.chords.length];

    chord.forEach((freq, idx) => {
      this.playWarmNote(freq, now + idx * 0.03, barDurationSec * 0.92, 0.18);
    });

    const m1 = track.melody[(this.stepIdx * 2) % track.melody.length];
    const m2 = track.melody[(this.stepIdx * 2 + 1) % track.melody.length];
    this.playWarmNote(m1, now + barDurationSec * 0.25, barDurationSec * 0.48, 0.12);
    if (this.stepIdx % 2 === 0) {
      this.playWarmNote(m2, now + barDurationSec * 0.62, barDurationSec * 0.36, 0.1);
    }

    this.stepIdx += 1;
    this.chordTimer = window.setTimeout(this.scheduleChordBeat, barDurationSec * 1000);
  };

  private scheduleNextDrip = () => {
    if (!this.playing) return;
    this.playPhinDrip();
    const delayMs = 950 + Math.random() * 1900;
    this.dripTimer = window.setTimeout(this.scheduleNextDrip, delayMs);
  };

  public start() {
    if (this.playing) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    this.playing = true;
    this.startAmbientLoops();
    this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    this.masterGain.gain.setTargetAtTime(1, ctx.currentTime, 0.18);
    this.scheduleChordBeat();
    this.scheduleNextDrip();
    this.notify();
  }

  public stop() {
    this.playing = false;
    if (this.chordTimer !== null) {
      window.clearTimeout(this.chordTimer);
      this.chordTimer = null;
    }
    if (this.dripTimer !== null) {
      window.clearTimeout(this.dripTimer);
      this.dripTimer = null;
    }
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.14);
    }
    this.notify();
  }

  public setTrack(id: CafeTrackId) {
    this.trackId = id;
    this.stepIdx = 0;
    if (this.playing) {
      if (this.chordTimer !== null) {
        window.clearTimeout(this.chordTimer);
        this.chordTimer = null;
      }
      this.scheduleChordBeat();
    }
    this.notify();
  }

  public setLevels(levels: { lofi?: number; rain?: number; cafe?: number }) {
    const ctx = this.ctx;
    if (levels.lofi !== undefined) {
      this.lofiLevel = Math.max(0, Math.min(1, levels.lofi));
      if (ctx && this.lofiGain) {
        this.lofiGain.gain.setTargetAtTime(this.lofiLevel * 0.26, ctx.currentTime, 0.08);
      }
    }
    if (levels.rain !== undefined) {
      this.rainLevel = Math.max(0, Math.min(1, levels.rain));
      if (ctx && this.rainGain) {
        this.rainGain.gain.setTargetAtTime(this.rainLevel * 0.16, ctx.currentTime, 0.08);
      }
    }
    if (levels.cafe !== undefined) {
      this.cafeLevel = Math.max(0, Math.min(1, levels.cafe));
      if (ctx && this.cafeGain) {
        this.cafeGain.gain.setTargetAtTime(this.cafeLevel * 0.14, ctx.currentTime, 0.08);
      }
    }
    this.notify();
  }
}

export const roarCafeAudio = new RoarCafeAudioEngine();

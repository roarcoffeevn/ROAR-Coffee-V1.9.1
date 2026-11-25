// Lightweight Web Audio API synthesizer for ROAR Play & Win mini-games
class RoarGameSoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  tick() {
    this.playTone(720, 0.04, 'triangle', 0.045);
  }

  flip() {
    this.playTone(520, 0.07, 'sine', 0.05);
  }

  match() {
    this.playTone(587.33, 0.09, 'sine', 0.07, 0);
    this.playTone(880, 0.14, 'sine', 0.07, 0.07);
  }

  catchGood() {
    this.playTone(660, 0.07, 'triangle', 0.06, 0);
    this.playTone(990, 0.11, 'triangle', 0.06, 0.05);
  }

  catchGolden() {
    this.playTone(784, 0.08, 'sine', 0.08, 0);
    this.playTone(1046.5, 0.09, 'sine', 0.08, 0.06);
    this.playTone(1318.5, 0.16, 'sine', 0.08, 0.12);
  }

  catchBad() {
    this.playTone(190, 0.16, 'sawtooth', 0.055, 0);
    this.playTone(135, 0.2, 'sawtooth', 0.055, 0.08);
  }

  rattle() {
    this.playTone(320, 0.035, 'triangle', 0.04, 0);
    this.playTone(460, 0.035, 'triangle', 0.035, 0.04);
  }

  fortuneReveal() {
    this.playTone(587.33, 0.14, 'sine', 0.07, 0);
    this.playTone(783.99, 0.18, 'sine', 0.07, 0.1);
    this.playTone(1174.66, 0.28, 'triangle', 0.08, 0.2);
  }

  pickupBlock() {
    this.playTone(540, 0.04, 'sine', 0.035, 0);
  }

  placeBlock() {
    this.playTone(210, 0.06, 'sine', 0.075, 0);
    this.playTone(480, 0.045, 'triangle', 0.045, 0.015);
  }

  clearLine(combo = 1, lineCount = 1) {
    const scaleStep = [523.25, 587.33, 659.25, 783.99, 880.0, 987.77, 1046.5, 1174.66];
    const base = scaleStep[Math.min(Math.max(combo - 1, 0), scaleStep.length - 1)];
    this.playTone(base, 0.1, 'triangle', 0.075, 0);
    this.playTone(base * 1.25, 0.12, 'sine', 0.07, 0.045);
    this.playTone(base * 1.5, 0.18, 'triangle', 0.08, 0.09);
    if (lineCount >= 2 || combo >= 3) {
      this.playTone(base * 2, 0.24, 'sine', 0.065, 0.14);
    }
  }

  gameOver() {
    this.playTone(330, 0.16, 'triangle', 0.06, 0);
    this.playTone(261.63, 0.22, 'triangle', 0.06, 0.12);
  }

  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.22, 'triangle', 0.08, idx * 0.09);
    });
  }

  private lofiTimer: number | null = null;
  private lofiStep = 0;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  public lofiActive = false;

  cubeWhoosh(combo = 1) {
    const base = 440 + Math.min(combo, 10) * 42;
    this.playTone(base, 0.075, 'sine', 0.055, 0);
    this.playTone(base * 1.45, 0.11, 'triangle', 0.05, 0.03);
  }

  cubeWhooshChill(combo = 1) {
    // Soft warm marimba / wooden ceramic ASMR tap
    const pentatonic = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    const freq = pentatonic[(combo - 1) % pentatonic.length] || 329.63;
    this.playTone(freq, 0.14, 'sine', 0.048, 0);
    this.playTone(freq * 2, 0.09, 'sine', 0.018, 0.02);
  }

  chillBell() {
    this.playTone(528, 0.65, 'sine', 0.06, 0);
    this.playTone(792, 0.55, 'sine', 0.04, 0.12);
    this.playTone(1056, 0.75, 'sine', 0.035, 0.25);
  }

  cubeBlocked() {
    this.playTone(170, 0.09, 'sawtooth', 0.045, 0);
    this.playTone(125, 0.11, 'triangle', 0.05, 0.04);
  }

  cubeSmash() {
    this.playTone(260, 0.08, 'square', 0.06, 0);
    this.playTone(740, 0.12, 'triangle', 0.06, 0.03);
  }

  cubeShuffle() {
    [440, 554.37, 659.25, 880].forEach((f, idx) => {
      this.playTone(f, 0.07, 'sine', 0.045, idx * 0.045);
    });
  }

  coinClink() {
    this.playTone(987.77, 0.08, 'sine', 0.055, 0);
    this.playTone(1318.51, 0.14, 'sine', 0.06, 0.055);
  }

  private playLofiChord() {
    if (!this.lofiActive || this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    // Warm jazz progression: Cmaj9 -> Am9 -> Fmaj7 -> G6
    const chords = [
      [261.63, 329.63, 392.0, 493.88, 587.33],
      [220.0, 261.63, 329.63, 392.0, 493.88],
      [174.61, 220.0, 261.63, 329.63, 440.0],
      [196.0, 246.94, 293.66, 329.63, 440.0],
    ];
    const chord = chords[this.lofiStep % chords.length];
    this.lofiStep += 1;

    const now = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(0.032, now + 0.35);
    master.gain.exponentialRampToValueAtTime(0.001, now + 2.35);

    filter.connect(master);
    master.connect(ctx.destination);

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      osc.connect(filter);
      osc.start(now + idx * 0.04);
      osc.stop(now + 2.45);
    });
  }

  startLofi(): boolean {
    if (this.lofiActive) return true;
    const prevMuted = this.muted;
    if (prevMuted) this.muted = false;
    const ctx = this.ensureContext();
    if (!ctx) return false;

    this.lofiActive = true;
    this.lofiStep = 0;

    // Soft cafe rain / espresso ambient noise bed
    try {
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 2.4;
      }
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 680;
      filter.Q.value = 0.7;

      const nGain = ctx.createGain();
      nGain.gain.value = 0.015;

      src.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);
      src.start();
      this.noiseSource = src;
      this.noiseGain = nGain;
    } catch {
      // ignore noise fallback
    }

    this.playLofiChord();
    this.lofiTimer = window.setInterval(() => {
      this.playLofiChord();
    }, 2400);
    return true;
  }

  private dojoTimer: number | null = null;
  private dojoStep = 0;
  public dojoBgmActive = false;

  private playDojoBar() {
    if (!this.dojoBgmActive || this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    // Energetic Japanese Hirajoshi pentatonic shamisen/koto + Taiko pulse (128 BPM 8th-note steps)
    const melody = [
      293.66, 0, 349.23, 440.0, 587.33, 0, 523.25, 440.0,
      392.0, 0, 440.0, 523.25, 440.0, 349.23, 293.66, 0,
    ];
    const stepMs = 195;
    const idx = this.dojoStep % melody.length;
    this.dojoStep += 1;

    const note = melody[idx];
    if (note > 0) {
      // Plucked shamisen string transient
      this.playTone(note, 0.16, 'triangle', 0.036, 0);
      this.playTone(note * 2, 0.07, 'sine', 0.015, 0);
    }

    // Taiko downbeats & hyoshigi woodblock accent
    if (idx % 4 === 0) {
      this.playPitchSweep(115, 42, 0.16, 'sine', 0.065, 0);
    } else if (idx % 4 === 2) {
      this.playNoiseBurst(0.035, 1900, 'bandpass', 0.025, 0, 1200);
    }
    if (idx === 14) {
      this.playTone(1240, 0.035, 'square', 0.018, stepMs / 2000);
    }
  }

  startDojoBgm(): boolean {
    if (this.dojoBgmActive) return true;
    if (this.lofiActive) this.stopLofi();
    if (this.muted) return false;
    const ctx = this.ensureContext();
    if (!ctx) return false;
    this.dojoBgmActive = true;
    this.dojoStep = 0;
    this.playDojoBar();
    this.dojoTimer = window.setInterval(() => {
      this.playDojoBar();
    }, 195);
    return true;
  }

  stopDojoBgm() {
    this.dojoBgmActive = false;
    if (this.dojoTimer !== null) {
      window.clearInterval(this.dojoTimer);
      this.dojoTimer = null;
    }
  }

  toggleDojoBgm(): boolean {
    if (this.dojoBgmActive) {
      this.stopDojoBgm();
      return false;
    }
    if (this.muted) {
      this.muted = false;
    }
    return this.startDojoBgm();
  }

  stopLofi() {
    this.lofiActive = false;
    if (this.lofiTimer !== null) {
      window.clearInterval(this.lofiTimer);
      this.lofiTimer = null;
    }
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch {
        // ignore
      }
      this.noiseSource = null;
    }
    if (this.noiseGain) {
      try {
        this.noiseGain.disconnect();
      } catch {
        // ignore
      }
      this.noiseGain = null;
    }
  }

  cubeHover() {
    this.playTone(620, 0.025, 'sine', 0.022, 0);
    this.playTone(840, 0.02, 'triangle', 0.015, 0.012);
  }

  fireworkBurst(pitchOffset = 0) {
    const base = 680 + pitchOffset * 110;
    this.playTone(base, 0.06, 'sine', 0.055, 0);
    this.playTone(base * 1.4, 0.09, 'triangle', 0.065, 0.045);
    this.playTone(base * 1.85, 0.14, 'sine', 0.05, 0.09);
    this.playTone(base * 2.25, 0.18, 'triangle', 0.04, 0.13);
  }

  private playNoiseBurst(
    duration: number,
    filterFreq: number,
    filterType: BiquadFilterType = 'lowpass',
    gainVal = 0.09,
    delay = 0,
    endFreq?: number
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime + delay;
      const sampleCount = Math.max(256, Math.floor(ctx.sampleRate * duration));
      const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < sampleCount; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(filterFreq, now);
      if (endFreq) {
        filter.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + duration);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
      src.stop(now + duration + 0.02);
    } catch {
      // ignore audio node errors
    }
  }

  private playPitchSweep(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.08,
    delay = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  victoryFanfare() {
    // Triumphant brass + sparkling chime fanfare
    const seq: Array<[number, number, number, OscillatorType, number]> = [
      [523.25, 0.16, 0.0, 'triangle', 0.075],
      [659.25, 0.16, 0.1, 'triangle', 0.075],
      [783.99, 0.18, 0.2, 'triangle', 0.08],
      [1046.5, 0.38, 0.31, 'triangle', 0.09],
      [783.99, 0.15, 0.52, 'sine', 0.06],
      [1046.5, 0.62, 0.64, 'triangle', 0.09],
      [1318.51, 0.62, 0.64, 'sine', 0.07],
      [1567.98, 0.68, 0.68, 'sine', 0.045],
    ];
    for (const [f, d, delay, type, g] of seq) {
      this.playTone(f, d, type, g, delay);
    }
  }

  candySwap() {
    this.playPitchSweep(420, 680, 0.085, 'sine', 0.045, 0);
    this.playTone(740, 0.055, 'triangle', 0.032, 0.025);
  }

  candyMatch(combo = 1) {
    // Lush rising pentatonic / Lydian bell cascade
    const notes = [523.25, 587.33, 659.25, 783.99, 880, 987.77, 1046.5, 1174.66, 1318.51];
    const base = notes[Math.min(Math.max(combo - 1, 0), notes.length - 1)];
    this.playTone(base, 0.14, 'sine', 0.062, 0);
    this.playTone(base * 1.25, 0.16, 'triangle', 0.052, 0.04);
    this.playTone(base * 1.5, 0.22, 'sine', 0.048, 0.08);
    if (combo >= 2) {
      this.playTone(base * 2, 0.26, 'sine', 0.038, 0.12);
    }
    if (combo >= 4) {
      this.playTone(base * 2.5, 0.3, 'triangle', 0.035, 0.16);
    }
  }

  candyBoom() {
    // Epic sub-bass boom + filtered impact blast + sugar crystal burst
    this.playPitchSweep(155, 34, 0.38, 'sine', 0.13, 0);
    this.playPitchSweep(240, 52, 0.26, 'triangle', 0.09, 0.01);
    this.playNoiseBurst(0.34, 980, 'lowpass', 0.11, 0, 140);
    this.playTone(587.33, 0.16, 'sine', 0.045, 0.06);
    this.playTone(880, 0.2, 'triangle', 0.04, 0.11);
  }

  thunderZap() {
    // High-voltage electric arc crackle + deep rolling thunder rumble
    this.playNoiseBurst(0.14, 3400, 'bandpass', 0.09, 0, 750);
    this.playPitchSweep(2150, 420, 0.15, 'sawtooth', 0.045, 0.01);
    this.playPitchSweep(1640, 290, 0.18, 'square', 0.03, 0.045);
    this.playPitchSweep(110, 38, 0.44, 'sine', 0.11, 0.04);
    this.playNoiseBurst(0.45, 360, 'lowpass', 0.095, 0.06, 95);
  }

  colorBombBlast() {
    // Cosmic prism sweep + resonant chord + sub drop
    this.playPitchSweep(170, 38, 0.42, 'sine', 0.12, 0);
    this.playNoiseBurst(0.32, 2200, 'bandpass', 0.07, 0.02, 420);
    [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((f, idx) => {
      this.playTone(f, 0.28, idx % 2 === 0 ? 'sine' : 'triangle', 0.055, idx * 0.035);
    });
  }

  stripedLaser() {
    // Classic Candy Crush Striped row/col sweep zip
    this.playPitchSweep(1480, 340, 0.19, 'sawtooth', 0.055, 0);
    this.playPitchSweep(980, 1960, 0.14, 'sine', 0.06, 0.02);
    this.playNoiseBurst(0.18, 2800, 'bandpass', 0.06, 0, 900);
  }

  wrappedDoubleBoom() {
    // Classic Wrapped Candy double pop-boom!
    this.playPitchSweep(180, 48, 0.18, 'sine', 0.11, 0);
    this.playNoiseBurst(0.16, 850, 'lowpass', 0.09, 0, 180);
    this.playPitchSweep(145, 32, 0.36, 'sine', 0.14, 0.16);
    this.playNoiseBurst(0.3, 1150, 'lowpass', 0.11, 0.16, 120);
    this.playTone(783.99, 0.18, 'triangle', 0.055, 0.2);
  }

  sugarCrushFanfare() {
    // Joyful celebratory Sugar Crush arpeggio + sparkle chimes
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
    notes.forEach((f, idx) => {
      this.playTone(f, 0.24, idx % 2 === 0 ? 'triangle' : 'sine', 0.065, idx * 0.055);
    });
  }

  hintChime() {
    this.playTone(880, 0.12, 'sine', 0.042, 0);
    this.playTone(1318.5, 0.18, 'sine', 0.042, 0.07);
  }

  ninjaWhoosh(speedRatio = 1) {
    // Crisp aerodynamic katana air-cut swoosh
    const clamped = Math.min(2.2, Math.max(0.6, speedRatio));
    this.playNoiseBurst(0.11, 1450 * clamped, 'bandpass', 0.055 * Math.min(1.4, clamped), 0, 420);
    this.playPitchSweep(620 * clamped, 240, 0.09, 'sine', 0.03, 0);
  }

  ninjaSlice(combo = 1, isCrit = false) {
    // Crisp wet fruit-splitting slash + melodic katana chime
    this.playNoiseBurst(0.085, 2900, 'highpass', 0.075, 0, 950);
    this.playPitchSweep(540, 175, 0.08, 'triangle', 0.075, 0);
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
    const note = scale[Math.min(Math.max(combo - 1, 0), scale.length - 1)];
    this.playTone(note, 0.14, 'sine', 0.055, 0.01);
    if (isCrit) {
      this.playTone(1567.98, 0.22, 'triangle', 0.07, 0.02);
      this.playTone(2093.0, 0.26, 'sine', 0.05, 0.06);
    }
  }

  ninjaComboBlitz(count = 3) {
    const base = count >= 5 ? 659.25 : 523.25;
    this.playTone(base, 0.12, 'triangle', 0.07, 0);
    this.playTone(base * 1.25, 0.14, 'triangle', 0.075, 0.045);
    this.playTone(base * 1.5, 0.18, 'sine', 0.08, 0.09);
    this.playTone(base * 2, 0.26, 'triangle', 0.075, 0.14);
  }

  ninjaFreeze() {
    [1318.5, 1567.98, 1760, 2093].forEach((f, idx) => {
      this.playTone(f, 0.28, 'sine', 0.05, idx * 0.045);
    });
    this.playNoiseBurst(0.24, 4200, 'highpass', 0.045, 0.02, 1800);
  }

  ninjaFrenzy() {
    this.playPitchSweep(220, 660, 0.24, 'sawtooth', 0.05, 0);
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      this.playTone(f, 0.18, 'triangle', 0.065, 0.06 + idx * 0.05);
    });
  }

  ninjaBomb() {
    // Cinematic sub-bass detonation + debris blast
    this.playPitchSweep(140, 26, 0.62, 'sine', 0.16, 0);
    this.playPitchSweep(220, 38, 0.48, 'sawtooth', 0.08, 0);
    this.playNoiseBurst(0.58, 1200, 'lowpass', 0.14, 0, 95);
    this.playNoiseBurst(0.32, 3200, 'bandpass', 0.08, 0.02, 380);
  }

  ninjaPomegranateHit(hits = 1) {
    const f = 320 + Math.min(hits, 24) * 38;
    this.playTone(f, 0.07, 'triangle', 0.075, 0);
    this.playNoiseBurst(0.055, 2200, 'bandpass', 0.06, 0, 800);
  }

  ninjaPomegranateBoom() {
    this.playPitchSweep(165, 32, 0.45, 'sine', 0.14, 0);
    this.playNoiseBurst(0.4, 1800, 'lowpass', 0.12, 0, 140);
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      this.playTone(f, 0.28, 'triangle', 0.07, 0.04 + i * 0.04);
    });
  }

  dojoGong() {
    // Authentic bronze temple gong + wooden hyoshigi clapper for Ready/Go transition
    this.playTone(130.81, 1.15, 'sine', 0.12, 0);
    this.playTone(196.0, 0.95, 'triangle', 0.055, 0.01);
    this.playTone(261.63, 0.85, 'sine', 0.04, 0.02);
    this.playNoiseBurst(0.06, 1650, 'bandpass', 0.06, 0, 900);
    this.playTone(1180, 0.045, 'square', 0.024, 0.02);
  }

  dojoScrollOpen() {
    this.playNoiseBurst(0.16, 2100, 'bandpass', 0.055, 0, 620);
    this.playTone(587.33, 0.14, 'sine', 0.045, 0.03);
    this.playTone(880.0, 0.2, 'triangle', 0.05, 0.09);
  }

  bombRaysPreBlast() {
    // Dramatic white light-ray surge right before bomb white-out
    this.playPitchSweep(180, 920, 0.36, 'sawtooth', 0.065, 0);
    this.playNoiseBurst(0.32, 3400, 'bandpass', 0.08, 0, 900);
  }

  mergeDrop() {
    this.playPitchSweep(280, 145, 0.08, 'sine', 0.06, 0);
  }

  mergePop(tier = 1) {
    const base = 340 + Math.min(tier, 9) * 65;
    this.playPitchSweep(base * 0.72, base * 1.4, 0.11, 'sine', 0.08, 0);
    this.playTone(base, 0.14, 'triangle', 0.07, 0.02);
    this.playTone(base * 1.5, 0.18, 'sine', 0.05, 0.06);
    if (tier >= 6) {
      this.playNoiseBurst(0.14, 2400, 'bandpass', 0.06, 0.02, 700);
      this.playTone(base * 2, 0.24, 'triangle', 0.055, 0.09);
    }
  }

  tileTap() {
    this.playTone(620, 0.045, 'triangle', 0.06, 0);
    this.playTone(940, 0.035, 'sine', 0.035, 0.015);
  }

  tileTripleClear(combo = 1) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
    const base = scale[Math.min(Math.max(combo - 1, 0), scale.length - 1)];
    this.playTone(base, 0.11, 'triangle', 0.07, 0);
    this.playTone(base * 1.25, 0.13, 'sine', 0.065, 0.045);
    this.playTone(base * 1.5, 0.2, 'triangle', 0.07, 0.09);
  }

  liquidPour(pitchIdx = 0) {
    const base = 420 + (pitchIdx % 6) * 55;
    this.playNoiseBurst(0.22, 1350, 'bandpass', 0.045, 0, 720);
    this.playPitchSweep(base, base * 1.48, 0.2, 'sine', 0.055, 0.02);
    this.playTone(base * 1.6, 0.1, 'sine', 0.04, 0.14);
  }

  tubeComplete() {
    this.playTone(987.77, 0.16, 'sine', 0.065, 0);
    this.playTone(1318.51, 0.24, 'triangle', 0.07, 0.07);
    this.playTone(1760.0, 0.3, 'sine', 0.05, 0.14);
  }

  baristaServe(combo = 1) {
    this.playTone(1318.51, 0.18, 'sine', 0.08, 0);
    this.playTone(1760.0, 0.22, 'triangle', 0.065, 0.06);
    if (combo >= 2) {
      this.playTone(2093.0, 0.26, 'sine', 0.06, 0.12);
    }
  }

  baristaWrong() {
    this.playNoiseBurst(0.18, 2200, 'highpass', 0.05, 0, 900);
    this.playTone(185, 0.18, 'sawtooth', 0.05, 0.02);
  }

  boltUnscrew() {
    this.playPitchSweep(460, 880, 0.09, 'triangle', 0.06, 0);
    this.playTone(1120, 0.05, 'sine', 0.04, 0.05);
  }

  boltScrewIn() {
    this.playPitchSweep(780, 380, 0.08, 'triangle', 0.06, 0);
    this.playTone(320, 0.06, 'sine', 0.05, 0.04);
  }

  woodFall() {
    this.playPitchSweep(190, 72, 0.18, 'triangle', 0.08, 0);
    this.playNoiseBurst(0.14, 720, 'lowpass', 0.075, 0.01, 200);
  }

  toggleLofi(): boolean {
    if (this.lofiActive) {
      this.stopLofi();
      return false;
    }
    return this.startLofi();
  }
}

export const gameSound = new RoarGameSoundEngine();


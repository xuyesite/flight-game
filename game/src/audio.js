// Sky Courier: Ring Run — tiny WebAudio sound engine.
// One job: every sound is synthesized at run time; no audio files, no network.
export class SoundEngine {
  constructor() {
    this.context = null;
    this.muted = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.engineFilter = null;
  }

  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    this.context = new Ctor();
    this.engineGain = this.context.createGain();
    this.engineGain.gain.value = 0;
    this.engineFilter = this.context.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 420;
    this.engineOsc = this.context.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 68;
    this.engineOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.context.destination);
    this.engineOsc.start();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.engineGain) this.engineGain.gain.value = 0;
  }

  setEngine(throttle, running) {
    if (!this.context || !this.engineOsc || this.muted) return;
    const target = running ? 0.035 + throttle * 0.05 : 0;
    this.engineGain.gain.setTargetAtTime(target, this.context.currentTime, 0.12);
    this.engineOsc.frequency.setTargetAtTime(58 + throttle * 66, this.context.currentTime, 0.15);
  }

  blip(freq, dur, type, vol) {
    if (!this.context || this.muted) return;
    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol || 0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  ringChime() {
    this.blip(880, 0.22, 'sine', 0.16);
    setTimeout(() => this.blip(1318, 0.3, 'sine', 0.14), 70);
  }

  starBlip() {
    this.blip(1174, 0.14, 'triangle', 0.13);
  }

  fuelBlip() {
    this.blip(523, 0.16, 'sine', 0.13);
    setTimeout(() => this.blip(784, 0.2, 'sine', 0.12), 80);
  }

  crashThud() {
    if (!this.context || this.muted) return;
    const t = this.context.currentTime;
    const len = Math.floor(this.context.sampleRate * 0.35);
    const buffer = this.context.createBuffer(1, len, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.context.createBufferSource();
    src.buffer = buffer;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    src.connect(gain);
    gain.connect(this.context.destination);
    src.start(t);
    this.blip(110, 0.4, 'sawtooth', 0.1);
  }

  winArpeggio() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, i) => setTimeout(() => this.blip(n, 0.32, 'triangle', 0.15), i * 110));
  }
}

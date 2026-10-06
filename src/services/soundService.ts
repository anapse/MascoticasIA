/**
 * Web Audio API Sound Service for Mascoticas IA
 * Ultra-lightweight, zero external MP3s, 100% synthesized gentle tones.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private thinkingOscillator: OscillatorNode | null = null;
  private thinkingGain: GainNode | null = null;
  private isMuted: boolean = false;
  private danceTimer: ReturnType<typeof setInterval> | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Safe audio unlock on user interaction
   */
  public unlockAudio() {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  /**
   * Short gentle click for buttons
   */
  public playButton() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  /**
   * Cheerful 2-tone welcome sound when entering the room
   */
  public playEnter() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [
        { freq: 523.25, time: 0, dur: 0.12 }, // C5
        { freq: 659.25, time: 0.12, dur: 0.18 }, // E5
        { freq: 783.99, time: 0.28, dur: 0.25 }, // G5
      ].forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        gain.gain.setValueAtTime(0.09, now + note.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + note.time);
        osc.stop(now + note.time + note.dur);
      });
    } catch {}
  }

  /**
   * Eating sound (cute gentle munching)
   */
  public playEat() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.18, 0.36].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now + offset);
        osc.frequency.exponentialRampToValueAtTime(220, now + offset + 0.1);

        gain.gain.setValueAtTime(0.1, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } catch {}
  }

  /**
   * Sleeping sound (soft lullaby tone)
   */
  public playSleep() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.5);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {}
  }

  /**
   * Laughing sound (cheerful bouncy tones)
   */
  public playLaugh() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [520, 680, 560, 720, 600, 780];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.07);
      });
    } catch {}
  }

  /**
   * Dancing sound (upbeat rhythmic chime)
   */
  public playDance() {
    this.startDanceMusic(20000);
  }

  /**
   * Local dance loop: short musical patterns, randomly selected and repeated.
   * Uses only Web Audio API; no external audio files or network requests.
   */
  public startDanceMusic(durationMs = 20000) {
    if (this.isMuted) return;
    this.stopDanceMusic();
    const ctx = this.getContext();
    if (!ctx) return;

    const playPattern = () => {
      if (this.isMuted) return;
      const patterns = [
        [440, 554.37, 659.25, 554.37, 783.99, 659.25],
        [523.25, 659.25, 783.99, 659.25, 880, 783.99],
        [392, 493.88, 587.33, 493.88, 659.25, 587.33],
        [659.25, 783.99, 880, 783.99, 659.25, 523.25],
      ];
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      const now = ctx.currentTime;
      pattern.forEach((freq, i) => {
        const start = now + i * 0.16;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.045, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.14);
      });
    };

    playPattern();
    this.danceTimer = setInterval(playPattern, 1100);
    window.setTimeout(() => this.stopDanceMusic(), durationMs);
  }

  public stopDanceMusic() {
    if (this.danceTimer) {
      clearInterval(this.danceTimer);
      this.danceTimer = null;
    }
  }

  /**
   * Thinking waiting sound (starts soft periodic pulse)
   */
  public startThinking() {
    if (this.isMuted) return;
    this.stopThinking();
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);

      // Low volume ambient pulse
      gain.gain.setValueAtTime(0.02, now);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      this.thinkingOscillator = osc;
      this.thinkingGain = gain;
    } catch {}
  }

  /**
   * Stop thinking sound
   */
  public stopThinking() {
    if (this.thinkingOscillator) {
      try {
        this.thinkingOscillator.stop();
        this.thinkingOscillator.disconnect();
      } catch {}
      this.thinkingOscillator = null;
    }
    if (this.thinkingGain) {
      try {
        this.thinkingGain.disconnect();
      } catch {}
      this.thinkingGain = null;
    }
  }

  /**
   * Success sound when response arrives
   */
  public playSuccess() {
    this.stopThinking();
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }
}

export const soundService = new SoundService();

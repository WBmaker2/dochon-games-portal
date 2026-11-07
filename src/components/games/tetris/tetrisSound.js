// src/components/games/tetris/tetrisSound.js

export class TetrisSoundManager {
  constructor() {
    this.audioContext = null;
    this.isPlayingTheme = false;
    this.isMuted = false;
    this.tempo = 140;
    this.noteDuration = 60 / this.tempo;
    this.timerID = null;
    this.sequenceIndex = 0;
    this.nextNoteTime = 0;

    this.melody = [
      ['E5', 1], ['B4', 0.5], ['C5', 0.5], ['D5', 1], ['C5', 0.5], ['B4', 0.5],
      ['A4', 1], ['A4', 0.5], ['C5', 0.5], ['E5', 1], ['D5', 0.5], ['C5', 0.5],
      ['B4', 1.5], ['C5', 0.5], ['D5', 1], ['E5', 1],
      ['C5', 1], ['A4', 1], ['A4', 1], [null, 1],
      ['D5', 1.5], ['F5', 0.5], ['A5', 1], ['G5', 0.5], ['F5', 0.5],
      ['E5', 1.5], ['C5', 0.5], ['E5', 1], ['D5', 0.5], ['C5', 0.5],
      ['B4', 1], ['B4', 0.5], ['C5', 0.5], ['D5', 1], ['E5', 1],
      ['C5', 1], ['A4', 1], ['A4', 1], [null, 1]
    ];

    this.frequencies = {
      'B4': 493.88,
      'C5': 523.25,
      'D5': 587.33,
      'E5': 659.25,
      'F5': 698.46,
      'G5': 783.99,
      'A4': 440.00,
      'A5': 880.00
    };
  }

  init() {
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.isMuted) {
      this.stopTheme();
    }
  }

  playTheme() {
    if (this.isPlayingTheme || this.isMuted) return;
    this.init();
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    this.isPlayingTheme = true;
    this.sequenceIndex = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    this.scheduleNotes();
  }

  stopTheme() {
    this.isPlayingTheme = false;
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  scheduleNotes() {
    if (!this.isPlayingTheme || !this.audioContext) return;
    if (this.nextNoteTime < this.audioContext.currentTime) {
      this.nextNoteTime = this.audioContext.currentTime;
    }
    while (this.nextNoteTime < this.audioContext.currentTime + 0.1) {
      this.playNote(this.melody[this.sequenceIndex]);
      this.advanceNote();
    }
    this.timerID = setTimeout(() => this.scheduleNotes(), 25);
  }

  playNote(noteInfo) {
    try {
      const noteName = noteInfo[0];
      const duration = noteInfo[1] * this.noteDuration;
      if (noteName && this.frequencies[noteName] && this.audioContext) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'square';
        osc.frequency.value = this.frequencies[noteName];
        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(this.nextNoteTime);
        osc.stop(this.nextNoteTime + duration - 0.05);

        gain.gain.setValueAtTime(0.06, this.nextNoteTime);
        gain.gain.exponentialRampToValueAtTime(0.005, this.nextNoteTime + duration - 0.05);
      }
    } catch (e) {
      // Audio node scheduling guard
    }
  }

  advanceNote() {
    const duration = this.melody[this.sequenceIndex][1] * this.noteDuration;
    this.nextNoteTime += duration;
    this.sequenceIndex = (this.sequenceIndex + 1) % this.melody.length;
  }

  playSFX(type, param = null) {
    if (this.isMuted) return;
    this.init();
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    const now = this.audioContext.currentTime;

    if (type === 'move') {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'rotate') {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'drop') {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'clear') {
      const lines = param || 1;
      const pitches = [523.25, 659.25, 783.99, 1046.5];
      pitches.slice(0, lines).forEach((freq, idx) => {
        const noteStart = now + idx * 0.06;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.12, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.15);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.15);
      });
    } else if (type === 'gameover') {
      [440, 415.3, 392, 349.2].forEach((freq, idx) => {
        const noteStart = now + idx * 0.1;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.1, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.12);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.12);
      });
    }
  }
}

export const tetrisSound = new TetrisSoundManager();

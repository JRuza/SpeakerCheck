import { AudioEngine } from './Engine';

export class Generator {
    private engine: AudioEngine;
    private oscillator: OscillatorNode | null = null;
    private gainNode: GainNode;
    private pannerNode: StereoPannerNode;

    constructor() {
        this.engine = AudioEngine.getInstance();
        const ctx = this.engine.getContext();

        this.gainNode = ctx.createGain();
        this.pannerNode = ctx.createStereoPanner();

        // Chain: Panner -> Gain -> Master
        // Oscillator will connect to Panner
        this.pannerNode.connect(this.gainNode);
        this.gainNode.connect(this.engine.getMasterGain());

        this.gainNode.gain.value = 0; // Muted by default
    }

    public setPan(pan: number) {
        // -1: Left, 0: Center, 1: Right
        this.pannerNode.pan.value = pan;
    }

    public playSine(frequency: number) {
        this.stop();
        const ctx = this.engine.getContext();
        this.oscillator = ctx.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
        this.oscillator.connect(this.pannerNode);
        this.gainNode.gain.setValueAtTime(0.5, ctx.currentTime); // Safe volume
        this.oscillator.start();
    }

    public playSweep(startFreq: number, endFreq: number, duration: number) {
        this.stop();
        const ctx = this.engine.getContext();
        this.oscillator = ctx.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime);
        this.oscillator.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);

        this.oscillator.connect(this.pannerNode);
        this.gainNode.gain.setValueAtTime(0.5, ctx.currentTime);

        this.oscillator.start();
        this.oscillator.stop(ctx.currentTime + duration);
    }

    public stop() {
        if (this.oscillator) {
            try {
                this.oscillator.stop();
                this.oscillator.disconnect();
            } catch (e) {
                // Ignore errors if already stopped
            }
            this.oscillator = null;
        }
        this.gainNode.gain.cancelScheduledValues(0);
        this.gainNode.gain.value = 0;
    }
}

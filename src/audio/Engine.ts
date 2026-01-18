
export class AudioEngine {
  private static instance: AudioEngine;
  public context: AudioContext;
  public masterGain: GainNode;

  private constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public getContext(): AudioContext {
    return this.context;
  }

  public getMasterGain(): GainNode {
    return this.masterGain;
  }

  public async resume(): Promise<void> {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  public suspend(): void {
    if (this.context.state === 'running') {
      this.context.suspend();
    }
  }
}

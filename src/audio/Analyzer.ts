import { AudioEngine } from './Engine';

export class Analyzer {
    private engine: AudioEngine;
    private analyserNode: AnalyserNode;
    private dataArray: Uint8Array;
    private bufferLength: number;

    constructor(fftSize: number = 2048) {
        this.engine = AudioEngine.getInstance();
        this.analyserNode = this.engine.getContext().createAnalyser();
        this.analyserNode.fftSize = fftSize;
        this.bufferLength = this.analyserNode.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
    }

    public connectSource(source: AudioNode) {
        source.connect(this.analyserNode);
    }

    public disconnectSource(source: AudioNode) {
        source.disconnect(this.analyserNode);
    }

    public getFrequencyData(): Uint8Array {
        this.analyserNode.getByteFrequencyData(this.dataArray as Uint8Array<ArrayBuffer>);
        return this.dataArray;
    }

    public getTimeDomainData(): Uint8Array {
        this.analyserNode.getByteTimeDomainData(this.dataArray as Uint8Array<ArrayBuffer>);
        return this.dataArray;
    }

    public getBufferLength(): number {
        return this.bufferLength;
    }
}

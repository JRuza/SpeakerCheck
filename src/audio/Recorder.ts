import { AudioEngine } from './Engine';

export class Recorder {
    private engine: AudioEngine;
    private stream: MediaStream | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;

    private mediaRecorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];

    constructor() {
        this.engine = AudioEngine.getInstance();
    }

    public async start(): Promise<MediaStreamAudioSourceNode> {
        const ctx = this.engine.getContext();
        this.chunks = [];

        // Request microphone access.
        // We disable some processing to get "rawer" audio for measurement.
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
                video: false,
            });

            this.sourceNode = ctx.createMediaStreamSource(this.stream);

            // Setup MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.chunks.push(e.data);
                }
            };
            this.mediaRecorder.start();

            return this.sourceNode;
        } catch (err) {
            console.error('Error accessing microphone:', err);
            throw err;
        }
    }

    public stop(): Promise<AudioBuffer> {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                reject('Recorder not active');
                return;
            }

            this.mediaRecorder.onstop = async () => {
                const blob = new Blob(this.chunks, { type: 'audio/webm' });
                const arrayBuffer = await blob.arrayBuffer();
                try {
                    // Need to decode with a fresh context usually or the same one
                    const audioBuffer = await this.engine.getContext().decodeAudioData(arrayBuffer);
                    this.cleanup();
                    resolve(audioBuffer);
                } catch (e) {
                    this.cleanup();
                    reject(e);
                }
            };

            this.mediaRecorder.stop();
        });
    }

    private cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        this.mediaRecorder = null;
        this.chunks = [];
    }
}

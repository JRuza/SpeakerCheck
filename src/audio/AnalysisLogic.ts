export interface AnalysisResult {
    frequencies: Float32Array;
    magnitudes: Float32Array; // 0.0 to 1.0 (Linear gain approximation)
}

export class AudioAnalysisLogic {
    /**
     * Computes Frequency Response by mapping Time to Frequency for a known Sweep.
     * Assumes the input was a logarithmic sine sweep.
     */
    public static computeFrequencyResponse(
        buffer: AudioBuffer,
        sweepDuration: number = 10, // Updated to match new sweep duration
        startFreq: number = 20,
        endFreq: number = 20000
    ): AnalysisResult {
        const channelData = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;
        const totalSamples = buffer.length;

        // We want a resolution of roughly N points on the graph
        const resolution = 200;
        const frequencies = new Float32Array(resolution);
        const magnitudes = new Float32Array(resolution);

        // Helper to get frequency at time t for exponential sweep
        // f(t) = f_start * (f_end / f_start) ^ (t / duration)
        const k = Math.pow(endFreq / startFreq, 1 / sweepDuration);
        const getFreq = (t: number) => startFreq * Math.pow(k, t);

        // We only care about the part of the buffer where the sweep actually happened.
        // The user might have recorded silences.
        // Ideally we cross-correlate to find the start, but for MVP let's assume
        // the max volume part is the sweep or just process the whole distinct signal.

        // Simplification: We blindly map the first 'sweepDuration' seconds of the buffer 
        // to the frequency range. If the recording is longer, we might crop or just use the whole valid part.
        // ISSUE: Latency. If there is 0.5s silence at start, our 20Hz mapping will be noise.
        // FIX: Find the first sample exceeding a threshold.

        let startIndex = 0;
        const threshold = 0.01;
        for (let i = 0; i < totalSamples; i++) {
            if (Math.abs(channelData[i]) > threshold) {
                startIndex = i;
                break;
            }
        }

        const validDurationSamples = Math.floor(sampleRate * sweepDuration);
        // Slice width in samples
        const step = Math.floor(validDurationSamples / resolution);

        for (let i = 0; i < resolution; i++) {
            const startSample = startIndex + (i * step);
            if (startSample + step > totalSamples) break;

            // Calculate RMS for this chunk
            let sumSq = 0;
            for (let j = 0; j < step; j++) {
                const val = channelData[startSample + j];
                sumSq += val * val;
            }
            const rms = Math.sqrt(sumSq / step);

            // Map to frequency
            // Time relative to start of sweep
            const t = (i * step) / sampleRate;
            const freq = getFreq(t);

            frequencies[i] = freq;
            magnitudes[i] = rms;
        }

        return { frequencies, magnitudes };
    }
}

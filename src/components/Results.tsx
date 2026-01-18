import { useEffect, useRef, useState } from 'react';
import { FrequencyGraph } from './FrequencyGraph';
import { AudioAnalysisLogic } from '../audio/AnalysisLogic';
import type { AnalysisResult } from '../audio/AnalysisLogic';

interface ResultsProps {
    buffer: AudioBuffer;
    onRestart: () => void;
}

export function Results({ buffer, onRestart }: ResultsProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);

    useEffect(() => {
        // Waveform drawing
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // High DPI
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;

        // Draw background
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, height);

        // Draw Waveform of the collected buffer
        const channelData = buffer.getChannelData(0); // Mono or Left
        const step = Math.ceil(channelData.length / width);
        const amp = height / 2;

        ctx.fillStyle = '#38bdf8';

        // We'll draw a compressed waveform (rms/peak per pixel)
        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = channelData[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }

            // Draw bar
            ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }

        // Compute Frequency Response
        const result = AudioAnalysisLogic.computeFrequencyResponse(buffer);
        setAnalysisData(result);

    }, [buffer]);

    const handlePlay = () => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>Test Results</h2>
            <p>Recorded {buffer.duration.toFixed(2)}s of audio.</p>

            <canvas ref={canvasRef} style={{ width: '100%', height: '100px', borderRadius: '0.5rem', marginBottom: '1rem' }} />

            {analysisData && <FrequencyGraph data={analysisData} />}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                <button onClick={handlePlay}>Play Recording</button>
                <button onClick={onRestart}>Start New Test</button>
            </div>
        </div>
    );
}

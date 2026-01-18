import { useEffect, useRef } from 'react';
import { Analyzer } from '../audio/Analyzer';

interface VisualizerProps {
    analyzer: Analyzer;
    mode: 'waveform' | 'spectrum';
}

export function Visualizer({ analyzer, mode }: VisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle high density displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const draw = () => {
            const width = rect.width;
            const height = rect.height;
            const bufferLength = analyzer.getBufferLength();
            let dataArray: Uint8Array;

            // Clear canvas
            ctx.fillStyle = '#1e293b'; // Panel BG
            ctx.fillRect(0, 0, width, height);

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#38bdf8'; // Accent color
            ctx.beginPath();

            if (mode === 'waveform') {
                dataArray = analyzer.getTimeDomainData();
                const sliceWidth = width * 1.0 / bufferLength;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = v * height / 2;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);

                    x += sliceWidth;
                }
                ctx.lineTo(width, height / 2);
            } else {
                dataArray = analyzer.getFrequencyData();
                const barWidth = (width / bufferLength) * 2.5;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * height;
                    ctx.fillStyle = `hsl(${i / bufferLength * 360}, 100%, 50%)`;
                    ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
                return; // Fill rects handling coloring themselves
            }

            ctx.stroke();
            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [analyzer, mode]);

    return <canvas ref={canvasRef} />;
}

import { useEffect, useRef } from 'react';
import type { AnalysisResult } from '../audio/AnalysisLogic';

interface FrequencyGraphProps {
    data: AnalysisResult;
}

export function FrequencyGraph({ data }: FrequencyGraphProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
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

        const w = rect.width;
        const h = rect.height;

        // BG
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, w, h);

        // Draw Grid (Logarithmic-ish visual help)
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.font = '10px Inter';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'right';

        ctx.beginPath();
        // Simple vertical lines
        for (let i = 1; i < 10; i++) {
            const x = (i / 10) * w;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }

        // Horizontal dB lines
        // 0dB (1.0), -6dB (0.5), -12dB (0.25), -20dB (0.1)
        const dbLevels = [
            { db: 0, mag: 1.0 },
            { db: -6, mag: 0.5 },
            { db: -12, mag: 0.25 },
            { db: -20, mag: 0.1 }
        ];

        dbLevels.forEach(level => {
            const y = h - (level.mag * h);
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            // We'll draw text in a second pass or now? 
            // Better to stroke lines first then text.
        });
        ctx.stroke();

        // Draw Labels
        dbLevels.forEach(level => {
            const y = h - (level.mag * h);
            ctx.fillText(`${level.db} dB`, w - 5, y + 3); // Right aligned
        });


        // Helper to map frequency to X coordinate (Log scale)
        // log(f) mapped to width
        const minF = 20;
        const maxF = 20000;
        const minLog = Math.log10(minF);
        const maxLog = Math.log10(maxF);

        const getX = (freq: number) => {
            const fLog = Math.log10(Math.max(freq, minF));
            return ((fLog - minLog) / (maxLog - minLog)) * w;
        };

        // Draw Ideal Line (Flat at roughly 0.5 magnitude for visual reference)
        // Assuming generator volume was 0.5.
        ctx.strokeStyle = '#4ade80'; // Green
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        const idealY = h - (0.5 * h); // Middle
        ctx.moveTo(0, idealY);
        ctx.lineTo(w, idealY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#4ade80';
        ctx.font = '12px Inter';
        ctx.fillText("Ideal Reference", 10, idealY - 5);


        // Draw Actual Curve
        ctx.strokeStyle = '#38bdf8'; // Blue
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < data.frequencies.length; i++) {
            const freq = data.frequencies[i];
            const mag = data.magnitudes[i];

            const x = getX(freq);
            const y = h - (mag * h); // 1.0 is top, 0.0 is bottom

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Fill under curve
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.fill();

    }, [data]);

    return (
        <div style={{ marginTop: '1rem' }}>
            <h3>Frequency Response</h3>
            <canvas ref={canvasRef} style={{ width: '100%', height: '250px', borderRadius: '0.5rem', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                <span>20Hz</span>
                <span>100Hz</span>
                <span>1kHz</span>
                <span>10kHz</span>
                <span>20kHz</span>
            </div>
        </div>
    );
}

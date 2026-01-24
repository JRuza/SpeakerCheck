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

            <DeviationGraph data={data} />
        </div>
    );
}

function DeviationGraph({ data }: { data: AnalysisResult }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = rect.height;

        // Background
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < 10; i++) {
            const x = (i / 10) * w;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }
        // Horizontal lines at 0dB, ±6dB, ±12dB
        const deviationLevels = [0, 6, -6, 12, -12];
        deviationLevels.forEach(db => {
            const y = h / 2 - (db / 24) * h; // ±12dB range
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        });
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#64748b';
        ctx.font = '10px Inter';
        ctx.textAlign = 'right';
        deviationLevels.forEach(db => {
            const y = h / 2 - (db / 24) * h;
            ctx.fillText(`${db > 0 ? '+' : ''}${db} dB`, w - 5, y + 3);
        });

        // Zero line (ideal)
        ctx.strokeStyle = '#4ade80';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Calculate deviation from average magnitude (shows frequency response shape)
        // Use the average magnitude as the reference level
        let totalMag = 0;
        let validCount = 0;
        for (let i = 0; i < data.magnitudes.length; i++) {
            if (data.magnitudes[i] > 0.01) { // Ignore very quiet samples
                totalMag += data.magnitudes[i];
                validCount++;
            }
        }
        const averageMagnitude = validCount > 0 ? totalMag / validCount : 0.5;

        const minF = 20;
        const maxF = 20000;
        const minLog = Math.log10(minF);
        const maxLog = Math.log10(maxF);

        const getX = (freq: number) => {
            const fLog = Math.log10(Math.max(freq, minF));
            return ((fLog - minLog) / (maxLog - minLog)) * w;
        };

        // Draw deviation curve with color coding
        for (let i = 0; i < data.frequencies.length - 1; i++) {
            const freq = data.frequencies[i];
            const mag = data.magnitudes[i];

            // Convert to dB deviation from average
            const deviationDB = mag > 0.001 ? 20 * Math.log10(mag / averageMagnitude) : -60;

            const x1 = getX(freq);
            const y1 = h / 2 - (deviationDB / 24) * h; // Map ±12dB to canvas

            const nextFreq = data.frequencies[i + 1];
            const nextMag = data.magnitudes[i + 1];
            const nextDeviationDB = nextMag > 0.001 ? 20 * Math.log10(nextMag / averageMagnitude) : -60;
            const x2 = getX(nextFreq);
            const y2 = h / 2 - (nextDeviationDB / 24) * h;

            // Color code based on deviation
            if (Math.abs(deviationDB) < 3) {
                ctx.strokeStyle = '#4ade80'; // Green: good
            } else if (Math.abs(deviationDB) < 6) {
                ctx.strokeStyle = '#fbbf24'; // Yellow: warning
            } else {
                ctx.strokeStyle = '#ef4444'; // Red: problem
            }

            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x1, Math.max(0, Math.min(h, y1)));
            ctx.lineTo(x2, Math.max(0, Math.min(h, y2)));
            ctx.stroke();
        }

    }, [data]);

    return (
        <div style={{ marginTop: '1.5rem' }}>
            <h3>Deviation from Ideal</h3>
            <canvas ref={canvasRef} style={{ width: '100%', height: '150px', borderRadius: '0.5rem', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                    <span style={{ color: '#4ade80' }}>● Good (&lt;3dB)</span>
                    <span style={{ color: '#fbbf24' }}>● Warning (3-6dB)</span>
                    <span style={{ color: '#ef4444' }}>● Problem (&gt;6dB)</span>
                </div>
            </div>
        </div>
    );
}

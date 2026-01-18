import { useState } from 'react';
import { Generator } from '../audio/Generator';
import { Recorder } from '../audio/Recorder';
import { Analyzer } from '../audio/Analyzer';

interface ControlPanelProps {
    onStart: () => void;
    onStop: (testType: string, channel: string) => void;
    generator: Generator;
    recorder: Recorder;
    inputAnalyzer: Analyzer;
}

export function ControlPanel({ onStart, onStop, generator, recorder, inputAnalyzer }: ControlPanelProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [testType, setTestType] = useState<'tone' | 'sweep'>('sweep');
    const [channel, setChannel] = useState<'both' | 'left' | 'right'>('both');

    const handleStart = async () => {
        try {
            // Set Pan based on selection
            let panValue = 0;
            if (channel === 'left') panValue = -1;
            if (channel === 'right') panValue = 1;
            generator.setPan(panValue);

            // 1. Start Recording First
            const source = await recorder.start();
            inputAnalyzer.connectSource(source);

            // 2. Wait a tiny bit (optional) or start playing
            if (testType === 'tone') {
                generator.playSine(1000); // 1kHz test
            } else {
                generator.playSweep(20, 20000, 10); // 10s sweep (extended for better problem detection)
            }

            setIsPlaying(true);
            onStart();
        } catch (e) {
            console.error(e);
            alert('Could not start audio. Please allow microphone access.');
        }
    };

    const handleStop = () => {
        setIsPlaying(false);
        onStop(testType, channel);
    };

    return (
        <div className="control-panel" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                disabled={isPlaying}
                style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
            >
                <option value="both">Both Channels (Stereo)</option>
                <option value="left">Left Only</option>
                <option value="right">Right Only</option>
            </select>

            <select
                value={testType}
                onChange={(e) => setTestType(e.target.value as any)}
                disabled={isPlaying}
                style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
            >
                <option value="sweep">Frequency Sweep (20Hz - 20kHz)</option>
                <option value="tone">1kHz Tone</option>
            </select>

            {!isPlaying ? (
                <button onClick={handleStart}>Start Test</button>
            ) : (
                <button onClick={handleStop} style={{ backgroundColor: '#ef4444' }}>Stop</button>
            )}
        </div>
    );
}

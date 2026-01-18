import { useState, useMemo, useEffect } from 'react';
import './index.css';
import { ControlPanel } from './components/ControlPanel';
import { Visualizer } from './components/Visualizer';
import { Results } from './components/Results';
import { HistoryList } from './components/HistoryList';
import { FrequencyGraph } from './components/FrequencyGraph'; // [NEW]
import { AudioEngine } from './audio/Engine';
import { Generator } from './audio/Generator';
import { Recorder } from './audio/Recorder';
import { Analyzer } from './audio/Analyzer';
import { HistoryStorage } from './utils/HistoryStorage';
import type { TestRecord } from './utils/HistoryStorage';
import { AudioAnalysisLogic } from './audio/AnalysisLogic';

function App() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const engine = useMemo(() => AudioEngine.getInstance(), []);
  const generator = useMemo(() => new Generator(), []);
  const recorder = useMemo(() => new Recorder(), []);
  // We use two analyzers? Or just input. Let's record input.
  // Actually, we might want to see output too, but let's focus on input visual first.
  const inputAnalyzer = useMemo(() => new Analyzer(), []);

  const [isStarted, setIsStarted] = useState(false);
  const [resultBuffer, setResultBuffer] = useState<AudioBuffer | null>(null);
  const [history, setHistory] = useState<TestRecord[]>([]);
  // We need to know context for saving history (channel/type).
  // Lifting state strictly would be better, but we can capture it in handleStop via refs or just state if available.
  // Actually, ControlPanel manages that state locally. We need to lift it or pass a callback that includes it.
  // Let's refactor ControlPanel slightly or just accept that 'handleStop' needs args.

  // Quick fix: View Mode for History
  const [viewingRecord, setViewingRecord] = useState<TestRecord | null>(null);

  useEffect(() => {
    setHistory(HistoryStorage.getHistory());
  }, []);

  const handleTestComplete = async (buffer: AudioBuffer, type: 'tone' | 'sweep', channel: 'left' | 'right' | 'both') => {
    setIsStarted(false);
    setResultBuffer(buffer);
    setViewingRecord(null);

    // Analyze immediately to save
    const analysis = AudioAnalysisLogic.computeFrequencyResponse(buffer); // Re-compute for storage

    HistoryStorage.saveTest({
      type,
      channel,
      analysis,
      timestamp: Date.now() // Add timestamp for sorting/display
    });
    setHistory(HistoryStorage.getHistory());
  };

  const handleStop = async (type: 'tone' | 'sweep', channel: 'left' | 'right' | 'both') => {
    // This wrapper is needed because ControlPanel calls onStop. 
    // We actually need ControlPanel to pass back data on stop.
    setIsStarted(false);
    generator.stop();
    try {
      const buffer = await recorder.stop();
      handleTestComplete(buffer, type, channel);
    } catch (e) {
      console.error(e);
    }
  };

  // Resume context on first click interaction if needed, handled by start button logic partially.

  return (
    <div className="container">
      <header>
        <h1>Speaker Check</h1>
        <p>Analyze your car speakers with precision.</p>
      </header>
      <main>
        {viewingRecord ? (
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #334155' }}>
            {/* Reusing Results component but maybe in 'History Mode' */}
            {/* OR just showing the graph directly since we don't have the buffer for replay */}
            <div style={{ textAlign: 'center' }}>
              <h2>History View</h2>
              <p>{viewingRecord.type.toUpperCase()} - {viewingRecord.channel.toUpperCase()}</p>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(viewingRecord.timestamp).toLocaleString()}</p>

              <div style={{ marginTop: '2rem' }}>
                <FrequencyGraph data={viewingRecord.analysis} />
              </div>
              <button onClick={() => setViewingRecord(null)}>Back to New Test</button>
            </div>
          </div>
        ) : resultBuffer ? (
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #334155' }}>
            <Results buffer={resultBuffer} onRestart={() => setResultBuffer(null)} />
          </div>
        ) : (
          <div>
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #334155' }}>
              <ControlPanel
                onStart={() => setIsStarted(true)}
                onStop={(type, channel) => handleStop(type as any, channel as any)}
                generator={generator}
                recorder={recorder}
                inputAnalyzer={inputAnalyzer}
              />

              <div style={{ position: 'relative' }}>
                <h3>Microphone Input</h3>
                <Visualizer analyzer={inputAnalyzer} mode="waveform" />
              </div>
            </div>

            <HistoryList history={history} onSelect={(r) => {
              setViewingRecord(r);
              setResultBuffer(null);
            }} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

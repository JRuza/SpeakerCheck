import type { TestRecord } from '../utils/HistoryStorage';

interface HistoryListProps {
    history: TestRecord[];
    onSelect: (record: TestRecord) => void;
}

export function HistoryList({ history, onSelect }: HistoryListProps) {
    if (history.length === 0) return null;

    return (
        <div style={{
            marginTop: '2rem',
            background: '#1e293b',
            padding: '1rem',
            borderRadius: '1rem',
            border: '1px solid #334155'
        }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#94a3b8' }}>Recent Tests</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {history.map(record => (
                    <button
                        key={record.id}
                        onClick={() => onSelect(record)}
                        style={{
                            background: '#0f172a',
                            border: '1px solid #334155',
                            padding: '0.75rem',
                            color: '#e2e8f0',
                            textAlign: 'left',
                            cursor: 'pointer',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 600 }}>
                                {record.type === 'sweep' ? 'Sweep' : 'Tone'} ({record.channel})
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {new Date(record.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                        <span style={{ color: '#38bdf8', fontSize: '0.9rem' }}>View &rarr;</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

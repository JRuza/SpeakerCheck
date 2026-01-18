import type { AnalysisResult } from '../audio/AnalysisLogic';

export interface TestRecord {
    id: string;
    timestamp: number;
    type: 'tone' | 'sweep';
    channel: 'left' | 'right' | 'both';
    analysis: AnalysisResult;
}

const STORAGE_KEY = 'speaker_check_history';
const MAX_ITEMS = 10;

export class HistoryStorage {
    static getHistory(): TestRecord[] {
        try {
            const json = localStorage.getItem(STORAGE_KEY);
            if (!json) return [];

            // Need to revive Float32Arrays because JSON stringify converts them to objects/arrays
            const data = JSON.parse(json);
            return data.map((item: any) => ({
                ...item,
                analysis: {
                    frequencies: new Float32Array(Object.values(item.analysis.frequencies)),
                    magnitudes: new Float32Array(Object.values(item.analysis.magnitudes))
                }
            }));
        } catch (e) {
            console.error("Failed to load history", e);
            return [];
        }
    }

    static saveTest(test: Omit<TestRecord, 'id' | 'timestamp'> & { timestamp?: number }) {
        const history = HistoryStorage.getHistory();
        const newRecord: TestRecord = {
            ...test,
            id: crypto.randomUUID(),
            timestamp: test.timestamp || Date.now()
        };

        history.unshift(newRecord);

        if (history.length > MAX_ITEMS) {
            history.pop();
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save history - likely quota exceeded", e);
        }
    }
}

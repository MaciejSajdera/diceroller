import { modeLabel, type HistoryEntry } from '../types';

const time = (ts: number) => new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const day = (ts: number) => new Date(ts).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });

export function History({ items, onClear }: { items: HistoryEntry[]; onClear: () => void }) {
  const today = new Date().toDateString();
  return (
    <details className="panel history">
      <summary>Historia ({items.length})</summary>
      {items.length === 0 ? (
        <p className="muted small">Brak rzutów.</p>
      ) : (
        <>
          <ol className="history-list">
            {items.map((h) => (
              <li key={h.id}>
                <time dateTime={new Date(h.ts).toISOString()}>
                  {new Date(h.ts).toDateString() === today ? time(h.ts) : `${day(h.ts)} ${time(h.ts)}`}
                </time>
                <span className="h-mode">{modeLabel(h.mode)}</span>
                <span className="h-result">{h.result}</span>
                <span className="h-detail muted small">{h.detail}</span>
              </li>
            ))}
          </ol>
          <button type="button" className="secondary danger" onClick={() => confirm('Wyczyścić historię rzutów?') && onClear()}>
            Wyczyść historię
          </button>
        </>
      )}
    </details>
  );
}

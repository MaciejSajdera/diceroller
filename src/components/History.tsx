import { modeLabel, type HistoryEntry } from '../types';

const time = (ts: number) => new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const day = (ts: number) => new Date(ts).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

const shareResult = async (item: HistoryEntry) => {
  if (!canShare) return;
  
  const mode = modeLabel(item.mode);
  const text = `🎲 ${mode}\n${item.detail}\n= ${item.result}`;
  
  try {
    await navigator.share({ text, title: 'Kości - Wynik rzutu' });
  } catch (err) {
    // User cancelled or error occurred
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('Share failed:', err);
    }
  }
};

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
                <div className="h-detail muted small">
                  {h.detail}
                  {canShare && (
                    <button
                      type="button"
                      className="share-btn"
                      onClick={() => shareResult(h)}
                      aria-label="Udostępnij wynik"
                      title="Udostępnij"
                    >
                      📤
                    </button>
                  )}
                </div>
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

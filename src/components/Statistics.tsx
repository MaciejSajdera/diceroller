import { modeLabel, type HistoryEntry } from '../types';
import type { Stats } from '../stats';
import { getTopModes, formatLastRoll } from '../stats';

interface Props {
  stats: Stats;
  history: readonly HistoryEntry[];
}

export function Statistics({ stats, history }: Props) {
  const topModes = getTopModes(stats);
  const hasRolls = stats.totalRolls > 0;

  if (!hasRolls) {
    return (
      <details className="panel">
        <summary>📊 Statystyki</summary>
        <p className="hint" style={{ padding: '12px 0' }}>
          Brak rzutów. Zacznij grać, aby zobaczyć statystyki!
        </p>
      </details>
    );
  }

  return (
    <details className="panel">
      <summary>📊 Statystyki</summary>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalRolls}</div>
          <div className="stat-label">Wszystkich rzutów</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{history.length}</div>
          <div className="stat-label">W historii</div>
        </div>
        
        {stats.streaks.currentStreak > 0 && (
          <div className="stat-card highlight">
            <div className="stat-value">🔥 {stats.streaks.currentStreak}</div>
            <div className="stat-label">Seria dni</div>
          </div>
        )}
        
        {stats.streaks.longestStreak > 1 && (
          <div className="stat-card">
            <div className="stat-value">⭐ {stats.streaks.longestStreak}</div>
            <div className="stat-label">Najdłuższa seria</div>
          </div>
        )}
      </div>

      {topModes.length > 0 && (
        <>
          <h4 className="stats-heading">Ulubione tryby</h4>
          <div className="mode-stats">
            {topModes.map(({ mode, count }) => {
              const percentage = Math.round((count / stats.totalRolls) * 100);
              return (
                <div key={mode} className="mode-stat">
                  <div className="mode-stat-header">
                    <span className="mode-stat-name">{modeLabel(mode)}</span>
                    <span className="mode-stat-count">{count}</span>
                  </div>
                  <div className="mode-stat-bar">
                    <div className="mode-stat-fill" style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="mode-stat-percent">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="stats-footer">
        Ostatni rzut: {formatLastRoll(stats.lastRollTime)}
      </div>
    </details>
  );
}

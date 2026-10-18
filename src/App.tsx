import { useCallback, useState, useEffect } from 'react';
import { usePersistentState } from './storage';
import { MODES, uid, type HistoryEntry, type ModeId, type UserPreset } from './types';
import { audioSystem } from './audio';
import { emptyStats, updateStatsFromHistory, type Stats } from './stats';
import { History } from './components/History';
import { Statistics } from './components/Statistics';
import { Catan } from './modes/Catan';
import { Monopoly } from './modes/Monopoly';
import { Yahtzee } from './modes/Yahtzee';
import { Dnd } from './modes/Dnd';
import { Warhammer } from './modes/Warhammer';
import { Risk } from './modes/Risk';
import { Custom } from './modes/Custom';

const HISTORY_MAX = 50;

export function App() {
  const [mode, setMode] = usePersistentState<ModeId>('mode', 'catan');
  const [history, setHistory] = usePersistentState<HistoryEntry[]>('history', []);
  const [presets, setPresets] = usePersistentState<UserPreset[]>('presets', []);
  const [vibrate, setVibrate] = usePersistentState('vibrate', true);
  const [sound, setSound] = usePersistentState('sound', true);
  const [stats, setStats] = usePersistentState<Stats>('stats', emptyStats());
  const [rollKey, setRollKey] = useState(0);
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  useEffect(() => {
    audioSystem.setEnabled(sound);
  }, [sound]);

  // Update stats when history changes
  useEffect(() => {
    setStats((prevStats) => updateStatsFromHistory(history, prevStats));
  }, [history, setStats]);

  const onRolled = useCallback(
    (detail: string, result: string) => {
      setRollKey((k) => k + 1);
      setHistory((h) => [{ id: uid(), ts: Date.now(), mode, detail, result }, ...h].slice(0, HISTORY_MAX));
      if (vibrate && canVibrate) navigator.vibrate(30);
      if (sound) audioSystem.playRoll();
    },
    [mode, vibrate, sound, canVibrate, setHistory],
  );

  const props = { onRolled, rollKey };
  const presetProps = { presets, setPresets };

  return (
    <div className="app">
      <header className="top">
        <h1>🎲 Kości</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {canVibrate && (
            <label className="check small">
              <input type="checkbox" checked={vibrate} onChange={(e) => setVibrate(e.target.checked)} />
              Wibracje
            </label>
          )}
          <label className="check small">
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
            Dźwięk
          </label>
        </div>
      </header>
      <nav className="tabs" aria-label="Tryb gry">
        {MODES.map((m) => (
          <button type="button" key={m.id} className={m.id === mode ? 'on' : ''} aria-pressed={m.id === mode} onClick={() => setMode(m.id)}>
            {m.label}
          </button>
        ))}
      </nav>
      <main>
        <h2 className="sr-only">{MODES.find((m) => m.id === mode)?.label}</h2>
        {mode === 'catan' && <Catan {...props} />}
        {mode === 'monopoly' && <Monopoly {...props} />}
        {mode === 'yahtzee' && <Yahtzee {...props} />}
        {mode === 'dnd' && <Dnd {...props} {...presetProps} />}
        {mode === 'warhammer' && <Warhammer {...props} />}
        {mode === 'risk' && <Risk {...props} />}
        {mode === 'custom' && <Custom {...props} {...presetProps} />}
        <Statistics stats={stats} history={history} />
        <History items={history} onClear={() => setHistory([])} />
      </main>
    </div>
  );
}

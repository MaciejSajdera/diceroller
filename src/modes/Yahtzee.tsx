import { useState } from 'react';
import { rerollUnheld, sum, yahtzeePattern, YAHTZEE_MAX_ROLLS } from '../dice';
import { Die } from '../components/Die';
import { RollButton } from '../components/Controls';
import type { ModeProps } from '../types';

const N = 5;

export function Yahtzee({ onRolled, rollKey }: ModeProps) {
  const [vals, setVals] = useState<number[]>(() => Array(N).fill(1));
  const [held, setHeld] = useState<boolean[]>(() => Array(N).fill(false));
  const [rollNo, setRollNo] = useState(0);
  const done = rollNo >= YAHTZEE_MAX_ROLLS;

  const roll = () => {
    if (done) return;
    const h = rollNo === 0 ? Array(N).fill(false) : held;
    const v = rerollUnheld(vals, h);
    setVals(v);
    setHeld(h);
    setRollNo(rollNo + 1);
    const p = yahtzeePattern(v);
    onRolled(`Rzut ${rollNo + 1}/3: ${v.join(' ')}`, `${sum(v)}${p ? ` · ${p}` : ''}`);
  };
  const reset = () => {
    setRollNo(0);
    setHeld(Array(N).fill(false));
  };
  const toggle = (i: number) => {
    if (rollNo === 0 || done) return;
    setHeld(held.map((x, j) => (j === i ? !x : x)));
  };
  const pattern = rollNo > 0 ? yahtzeePattern(vals) : null;

  return (
    <section className="mode">
      <p className="hint">
        {rollNo === 0 ? 'Nowa tura — rzuć wszystkimi kośćmi.' : done ? 'Koniec tury. Zapisz wynik i zacznij nową.' : 'Dotknij kość, aby ją zablokować.'}
      </p>
      <div className="dice-row five">
        {vals.map((v, i) => (
          <Die
            key={i}
            value={rollNo === 0 ? null : v}
            sides={6}
            rollKey={held[i] ? undefined : rollKey}
            held={held[i]}
            onToggle={rollNo > 0 && !done ? () => toggle(i) : undefined}
          />
        ))}
      </div>
      <div className="result" aria-live="polite" aria-atomic="true">
        <span className="muted">Rzut {rollNo}/{YAHTZEE_MAX_ROLLS}</span>
        {rollNo > 0 && <span className="big">{sum(vals)}</span>}
        {pattern && <span className="badge win">{pattern}</span>}
      </div>
      <div className="actions">
        <button type="button" className="secondary" onClick={reset} disabled={rollNo === 0}>Nowa tura</button>
      </div>
      <RollButton onRoll={done ? reset : roll} label={done ? 'Nowa tura' : rollNo === 0 ? 'Rzuć' : `Przerzuć (zostało ${YAHTZEE_MAX_ROLLS - rollNo})`} />
    </section>
  );
}

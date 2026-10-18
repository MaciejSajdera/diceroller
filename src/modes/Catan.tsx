import { useState } from 'react';
import { rollDice, sum } from '../dice';
import { Die } from '../components/Die';
import { RollButton } from '../components/Controls';
import type { ModeProps } from '../types';

export function Catan({ onRolled, rollKey, use3D }: ModeProps) {
  const [vals, setVals] = useState<number[] | null>(null);
  const total = vals ? sum(vals) : null;
  const roll = () => {
    const v = rollDice(2, 6);
    setVals(v);
    const s = sum(v);
    onRolled(`2k6: ${v.join(' + ')}`, s === 7 ? '7 — złodziej!' : String(s));
  };
  return (
    <section className="mode">
      <div className="dice-row">
        <Die value={vals?.[0] ?? null} sides={6} rollKey={rollKey} tone={total === 7 ? 'alert' : undefined} use3D={use3D} />
        <Die value={vals?.[1] ?? null} sides={6} rollKey={rollKey} tone={total === 7 ? 'alert' : undefined} use3D={use3D} />
      </div>
      <div className="result" aria-live="polite" aria-atomic="true">
        {total == null ? (
          <span className="muted">Rzuć 2k6</span>
        ) : total === 7 ? (
          <><span className="big alert">7</span><span className="badge alert">Złodziej! Odrzucanie kart i przesunięcie złodzieja</span></>
        ) : (
          <><span className="big">{total}</span><span className="muted">suma</span></>
        )}
      </div>
      <RollButton onRoll={roll} />
    </section>
  );
}

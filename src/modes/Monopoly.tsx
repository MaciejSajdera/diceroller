import { useState } from 'react';
import { isDouble, nextDoublesState, rollDice, sum } from '../dice';
import { Die } from '../components/Die';
import { RollButton } from '../components/Controls';
import type { ModeProps } from '../types';

export function Monopoly({ onRolled, rollKey }: ModeProps) {
  const [vals, setVals] = useState<number[] | null>(null);
  const [streak, setStreak] = useState(0);
  const [jail, setJail] = useState(false);

  const roll = () => {
    const v = rollDice(2, 6);
    const dbl = isDouble(v);
    // po więzieniu zaczynamy nową serię
    const next = nextDoublesState(jail ? 0 : streak, dbl);
    setVals(v);
    setStreak(next.streak);
    setJail(next.jail);
    const s = sum(v);
    onRolled(`2k6: ${v.join(' + ')}`, next.jail ? `${s}, 3. dublet — do więzienia!` : dbl ? `${s}, dublet (${next.streak}/3)` : String(s));
  };
  const dbl = vals ? isDouble(vals) : false;

  return (
    <section className="mode">
      <div className="dice-row">
        <Die value={vals?.[0] ?? null} sides={6} rollKey={rollKey} tone={dbl ? 'win' : undefined} />
        <Die value={vals?.[1] ?? null} sides={6} rollKey={rollKey} tone={dbl ? 'win' : undefined} />
      </div>
      <div className="result" aria-live="polite" aria-atomic="true">
        {vals == null ? (
          <span className="muted">Rzuć 2k6</span>
        ) : (
          <>
            <span className="big">{sum(vals)}</span>
            {jail ? (
              <span className="badge alert">Trzeci dublet z rzędu — idziesz do więzienia!</span>
            ) : dbl ? (
              <span className="badge win">Dublet! Rzucasz jeszcze raz</span>
            ) : (
              <span className="muted">Koniec ruchu</span>
            )}
          </>
        )}
      </div>
      <div className="streak" aria-label={`Dublety z rzędu: ${streak} z 3`}>
        Dublety z rzędu:
        {[1, 2, 3].map((i) => (
          <span key={i} className={`pip ${i <= streak ? (jail ? 'alert' : 'on') : ''}`} aria-hidden="true" />
        ))}
        <button type="button" className="link" onClick={() => { setStreak(0); setJail(false); }} disabled={streak === 0}>
          Następny gracz
        </button>
      </div>
      <RollButton onRoll={roll} />
    </section>
  );
}

import { useState } from 'react';
import { rollRisk, type RiskResult } from '../dice';
import { Die } from '../components/Die';
import { RollButton, Segmented } from '../components/Controls';
import { usePersistentState } from '../storage';
import type { ModeProps } from '../types';

export function Risk({ onRolled, rollKey }: ModeProps) {
  const [cfg, setCfg] = usePersistentState('risk', { att: 3, def: 2 });
  const [res, setRes] = useState<RiskResult | null>(null);
  const roll = () => {
    const r = rollRisk(cfg.att, cfg.def);
    setRes(r);
    onRolled(`${cfg.att} vs ${cfg.def}: [${r.attacker.join(' ')}] vs [${r.defender.join(' ')}]`, `Atak −${r.attackerLosses}, Obrona −${r.defenderLosses}`);
  };
  return (
    <section className="mode">
      <div className="controls two">
        <Segmented label="Atakujący" value={cfg.att} onChange={(att) => setCfg({ ...cfg, att })} options={[1, 2, 3].map((n) => ({ value: n, label: `${n}k6` }))} />
        <Segmented label="Obrońca" value={cfg.def} onChange={(def) => setCfg({ ...cfg, def })} options={[1, 2].map((n) => ({ value: n, label: `${n}k6` }))} />
      </div>
      <div className="risk">
        <div className="risk-col">
          <h3 className="att">Atak</h3>
          {(res?.attacker ?? Array(cfg.att).fill(null)).map((v, i) => {
            const p = res?.pairs[i];
            return <Die key={i} value={v} sides={6} rollKey={rollKey} small tone={p ? (p.attackerWins ? 'win' : 'lose') : res ? 'dim' : undefined} label={`Atak, kość ${i + 1}: ${v ?? '?'}`} />;
          })}
        </div>
        <div className="risk-col">
          <h3 className="def">Obrona</h3>
          {(res?.defender ?? Array(cfg.def).fill(null)).map((v, i) => {
            const p = res?.pairs[i];
            return <Die key={i} value={v} sides={6} rollKey={rollKey} small tone={p ? (p.attackerWins ? 'lose' : 'win') : res ? 'dim' : undefined} label={`Obrona, kość ${i + 1}: ${v ?? '?'}`} />;
          })}
        </div>
      </div>
      <div className="result" aria-live="polite" aria-atomic="true">
        {res ? (
          <div className="losses">
            <span>Atak traci: <b className="att">{res.attackerLosses}</b></span>
            <span>Obrona traci: <b className="def">{res.defenderLosses}</b></span>
          </div>
        ) : (
          <span className="muted">Kości porównywane od najwyższych, remis wygrywa obrońca</span>
        )}
      </div>
      <RollButton onRoll={roll} />
    </section>
  );
}

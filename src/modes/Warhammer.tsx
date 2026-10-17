import { useState } from 'react';
import { rollWarhammer, type WarhammerResult } from '../dice';
import { Die } from '../components/Die';
import { RollButton, Stepper } from '../components/Controls';
import { usePersistentState } from '../storage';
import type { ModeProps } from '../types';

export function Warhammer({ onRolled, rollKey }: ModeProps) {
  const [cfg, setCfg] = usePersistentState('warhammer', { pool: 10, hit: 3, woundOn: true, wound: 4 });
  const [res, setRes] = useState<(WarhammerResult & { hit: number; wound: number }) | null>(null);
  const roll = () => {
    const r = rollWarhammer(cfg.pool, cfg.hit, cfg.woundOn ? cfg.wound : null);
    setRes({ ...r, hit: cfg.hit, wound: cfg.wound });
    onRolled(
      `${cfg.pool}k6, trafienie ${cfg.hit}+${cfg.woundOn ? `, rana ${cfg.wound}+` : ''}`,
      `${r.hits} traf.${r.wounds != null ? ` → ${r.wounds} ran` : ''}`,
    );
  };
  const sorted = (xs: number[]) => [...xs].sort((a, b) => b - a);
  return (
    <section className="mode">
      <div className="controls">
        <Stepper label="Pula kości" value={cfg.pool} min={1} max={60} onChange={(pool) => setCfg({ ...cfg, pool })} format={(v) => `${v}k6`} />
        <Stepper label="Trafienie" value={cfg.hit} min={2} max={6} onChange={(hit) => setCfg({ ...cfg, hit })} format={(v) => `${v}+`} />
        <label className="check">
          <input type="checkbox" checked={cfg.woundOn} onChange={(e) => setCfg({ ...cfg, woundOn: e.target.checked })} />
          Rzut na rany (przerzut trafień)
        </label>
        {cfg.woundOn && <Stepper label="Rana" value={cfg.wound} min={2} max={6} onChange={(wound) => setCfg({ ...cfg, wound })} format={(v) => `${v}+`} />}
      </div>
      <div className="result" aria-live="polite" aria-atomic="true">
        {res ? (
          <div className="losses">
            <span>Trafienia: <b className="win">{res.hits}</b>/{res.hitRolls.length}</span>
            {res.wounds != null && <span>Rany: <b className="win">{res.wounds}</b>/{res.hits}</span>}
          </div>
        ) : (
          <span className="muted">Rzuć pulą kości</span>
        )}
      </div>
      {res && (
        <>
          <div className="pool" aria-label="Rzuty na trafienie">
            {sorted(res.hitRolls).map((v, i) => <Die key={i} value={v} sides={6} small rollKey={rollKey} tone={v >= res.hit ? 'hit' : 'miss'} />)}
          </div>
          {res.woundRolls && res.woundRolls.length > 0 && (
            <>
              <h3 className="sub">Rany</h3>
              <div className="pool" aria-label="Rzuty na rany">
                {sorted(res.woundRolls).map((v, i) => <Die key={i} value={v} sides={6} small rollKey={rollKey} tone={v >= res.wound ? 'hit' : 'miss'} />)}
              </div>
            </>
          )}
        </>
      )}
      <RollButton onRoll={roll} />
    </section>
  );
}

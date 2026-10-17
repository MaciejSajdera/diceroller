import { useState } from 'react';
import { DIE_TYPES, formatGroups, rollGroups, type GroupsRoll } from '../dice';
import { Die } from '../components/Die';
import { RollButton, Stepper } from '../components/Controls';
import { Presets } from '../components/Presets';
import { usePersistentState } from '../storage';
import type { CustomConfig, ModeProps, UserPreset } from '../types';

const DEFAULT: CustomConfig = { groups: [{ count: 1, sides: 8 }, { count: 1, sides: 6 }], modifier: 0 };
const describe = (c: CustomConfig) => formatGroups(c.groups, c.modifier);
const fmtMod = (m: number) => (m > 0 ? `+${m}` : m < 0 ? `−${Math.abs(m)}` : '0');

export function Custom({ onRolled, rollKey, presets, setPresets }: ModeProps & {
  presets: UserPreset[]; setPresets: (fn: (p: UserPreset[]) => UserPreset[]) => void;
}) {
  const [cfg, setCfg] = usePersistentState<CustomConfig>('custom', DEFAULT);
  const [res, setRes] = useState<GroupsRoll | null>(null);
  const setGroup = (i: number, patch: Partial<CustomConfig['groups'][number]>) =>
    setCfg({ ...cfg, groups: cfg.groups.map((g, j) => (j === i ? { ...g, ...patch } : g)) });

  const roll = () => {
    const r = rollGroups(cfg.groups, cfg.modifier);
    setRes(r);
    onRolled(`${describe(cfg)}: ${r.groups.map((g) => g.values.join(', ')).join(' | ')}`, String(r.total));
  };

  return (
    <section className="mode">
      <div className="controls">
        {cfg.groups.map((g, i) => (
          <div className="group-row" key={i}>
            <Stepper label={`Grupa ${i + 1}`} value={g.count} min={1} max={30} onChange={(count) => setGroup(i, { count })} format={(v) => `${v}×`} />
            <label className="select">
              <span className="stepper-label">Kość</span>
              <select value={g.sides} onChange={(e) => setGroup(i, { sides: Number(e.target.value) })} aria-label={`Grupa ${i + 1}: rodzaj kości`}>
                {DIE_TYPES.map((d) => <option key={d} value={d}>k{d}</option>)}
              </select>
            </label>
            <button type="button" className="icon" aria-label={`Usuń grupę ${i + 1}`} disabled={cfg.groups.length <= 1}
              onClick={() => setCfg({ ...cfg, groups: cfg.groups.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
        <div className="controls two">
          <button type="button" className="secondary" disabled={cfg.groups.length >= 8}
            onClick={() => setCfg({ ...cfg, groups: [...cfg.groups, { count: 1, sides: 6 }] })}>+ Dodaj grupę</button>
          <Stepper label="Modyfikator" value={cfg.modifier} min={-50} max={50} onChange={(modifier) => setCfg({ ...cfg, modifier })} format={fmtMod} />
        </div>
      </div>
      <div className="result" aria-live="polite" aria-atomic="true">
        {res ? (
          <>
            <span className="big">{res.total}</span>
            <span className="muted">{formatGroups(res.groups, res.modifier)}</span>
          </>
        ) : (
          <span className="muted">{describe(cfg)}</span>
        )}
      </div>
      {res && (
        <div className="pool">
          {res.groups.flatMap((g, gi) => g.values.map((v, i) => (
            <Die key={`${gi}-${i}`} value={v} sides={g.sides} small rollKey={rollKey} />
          )))}
        </div>
      )}
      <Presets kind="custom" current={cfg} describe={describe} onLoad={setCfg} presets={presets} setPresets={setPresets} />
      <RollButton onRoll={roll} />
    </section>
  );
}

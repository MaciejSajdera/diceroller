import { useState } from 'react';
import { DIE_TYPES, formatGroups, resolveAdvantage, rollDice, sum, type AdvantageMode } from '../dice';
import { Die } from '../components/Die';
import { RollButton, Segmented, Stepper } from '../components/Controls';
import { Presets } from '../components/Presets';
import { usePersistentState } from '../storage';
import type { DndConfig, ModeProps, UserPreset } from '../types';

export const DND_DEFAULT: DndConfig = { sides: 20, count: 1, modifier: 0, adv: 'none' };

const fmtMod = (m: number) => (m > 0 ? `+${m}` : m < 0 ? `−${Math.abs(m)}` : '0');

export function describeDnd(c: DndConfig): string {
  if (c.sides === 20 && c.adv !== 'none') return `k20 ${c.adv === 'advantage' ? 'z przewagą' : 'z utrudnieniem'}${c.modifier ? ` ${fmtMod(c.modifier)}` : ''}`;
  return formatGroups([{ count: c.count, sides: c.sides }], c.modifier);
}

interface Result {
  cfg: DndConfig;
  values: number[];
  keptIndex: number | null; // przy przewadze/utrudnieniu
  total: number;
}

export function Dnd({ onRolled, rollKey, presets, setPresets }: ModeProps & {
  presets: UserPreset[]; setPresets: (fn: (p: UserPreset[]) => UserPreset[]) => void;
}) {
  const [cfg, setCfg] = usePersistentState<DndConfig>('dnd', DND_DEFAULT);
  const [res, setRes] = useState<Result | null>(null);
  const advActive = cfg.sides === 20 && cfg.adv !== 'none';

  const roll = () => {
    let r: Result;
    if (advActive) {
      const a = resolveAdvantage(rollDice(2, 20), cfg.adv, cfg.modifier);
      r = { cfg, values: a.rolls, keptIndex: a.keptIndex, total: a.total };
    } else {
      const values = rollDice(cfg.count, cfg.sides);
      r = { cfg, values, keptIndex: null, total: sum(values) + cfg.modifier };
    }
    setRes(r);
    onRolled(`${describeDnd(cfg)}: ${r.values.join(', ')}`, String(r.total));
  };

  const nat = res && res.cfg.sides === 20 && (res.keptIndex != null || res.values.length === 1)
    ? res.values[res.keptIndex ?? 0] : null;

  return (
    <section className="mode">
      <div className="controls">
        <Segmented label="Kość" grid value={cfg.sides} onChange={(sides) => setCfg({ ...cfg, sides })}
          options={DIE_TYPES.map((d) => ({ value: d, label: `k${d}` }))} />
        <div className="controls two">
          <Stepper label="Liczba" value={advActive ? 1 : cfg.count} min={1} max={20} disabled={advActive} onChange={(count) => setCfg({ ...cfg, count })} />
          <Stepper label="Modyfikator" value={cfg.modifier} min={-20} max={30} onChange={(modifier) => setCfg({ ...cfg, modifier })} format={fmtMod} />
        </div>
        {cfg.sides === 20 && (
          <Segmented<AdvantageMode> label="Przewaga (2k20)" value={cfg.adv} onChange={(adv) => setCfg({ ...cfg, adv })}
            options={[{ value: 'disadvantage', label: 'Utrudnienie' }, { value: 'none', label: 'Brak' }, { value: 'advantage', label: 'Przewaga' }]} />
        )}
      </div>
      <div className="result" aria-live="polite" aria-atomic="true">
        {res ? (
          <>
            <span className="big">{res.total}</span>
            <span className="muted">{describeDnd(res.cfg)}{res.cfg.modifier ? ` (kości ${res.total - res.cfg.modifier}, mod. ${fmtMod(res.cfg.modifier)})` : ''}</span>
            {nat === 20 && <span className="badge win">Naturalna 20!</span>}
            {nat === 1 && <span className="badge alert">Naturalna 1</span>}
          </>
        ) : (
          <span className="muted">{describeDnd(cfg)}</span>
        )}
      </div>
      {res && (
        <div className="pool">
          {res.values.map((v, i) => (
            <Die key={i} value={v} sides={res.cfg.sides} small={res.values.length > 4} rollKey={rollKey}
              tone={res.keptIndex == null ? undefined : i === res.keptIndex ? 'hit' : 'dim'} />
          ))}
        </div>
      )}
      <Presets kind="dnd" current={cfg} describe={describeDnd} onLoad={setCfg} presets={presets} setPresets={setPresets} />
      <RollButton onRoll={roll} />
    </section>
  );
}

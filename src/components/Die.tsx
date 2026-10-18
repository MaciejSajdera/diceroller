import { Dice3D } from './Dice3D';

interface Props {
  value: number | null;
  sides: number;
  rollKey?: number;
  held?: boolean;
  onToggle?: () => void;
  tone?: 'hit' | 'miss' | 'win' | 'lose' | 'dim' | 'alert';
  small?: boolean;
  label?: string;
  use3D?: boolean;
}

/** Pojedyncza kość. Klikalna tylko gdy podano onToggle (blokowanie w trybie Kości). */
export function Die({ value, sides, rollKey, held, onToggle, tone, small, label, use3D }: Props) {
  // If 3D is enabled and value is set, use 3D renderer
  if (use3D && value !== null && !small) {
    return (
      <div className={['die-3d-container', held && 'held', tone && `tone-${tone}`].filter(Boolean).join(' ')}>
        <Dice3D value={value} sides={sides} rollKey={rollKey} />
        {held && <small className="die-3d-label">🔒 k{sides}</small>}
      </div>
    );
  }

  const cls = ['die', `d${sides}`, small && 'mini', held && 'held', tone && `tone-${tone}`].filter(Boolean).join(' ');
  const text = value ?? '?';
  const aria = label ?? `k${sides}: ${value ?? 'nie rzucono'}${held ? ', zablokowana' : ''}`;
  const content = (
    <>
      <span className="die-val" key={rollKey}>{text}</span>
      <small>{held ? '🔒' : `k${sides}`}</small>
    </>
  );
  if (onToggle) {
    return (
      <button type="button" className={cls} onClick={onToggle} aria-pressed={!!held} aria-label={aria}>
        {content}
      </button>
    );
  }
  return (
    <div className={cls} role="img" aria-label={aria}>
      {content}
    </div>
  );
}

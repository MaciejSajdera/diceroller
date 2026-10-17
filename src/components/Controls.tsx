import { useEffect, useRef } from 'react';

export function Stepper({
  label, value, min, max, onChange, format, disabled,
}: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
  format?: (v: number) => string; disabled?: boolean;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="stepper" aria-disabled={disabled || undefined}>
      <span className="stepper-label">{label}</span>
      <div className="stepper-row">
        <button type="button" aria-label={`${label}: zmniejsz`} disabled={disabled || value <= min} onClick={() => onChange(clamp(value - 1))}>−</button>
        <output aria-live="polite" aria-label={label}>{format ? format(value) : value}</output>
        <button type="button" aria-label={`${label}: zwiększ`} disabled={disabled || value >= max} onClick={() => onChange(clamp(value + 1))}>+</button>
      </div>
    </div>
  );
}

export function Segmented<T extends string | number>({
  label, options, value, onChange, grid,
}: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; grid?: boolean }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      <span className="stepper-label">{label}</span>
      <div className={grid ? 'seg-row grid4' : 'seg-row'}>
        {options.map((o) => (
          <button type="button" key={String(o.value)} aria-pressed={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(t.tagName));

/** Duży przycisk "Rzuć" + skrót spacji (gdy fokus nie jest na polu/przycisku). */
export function RollButton({ onRoll, disabled, label = 'Rzuć' }: { onRoll: () => void; disabled?: boolean; label?: string }) {
  const ref = useRef(onRoll);
  ref.current = onRoll;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      if (!disabled) ref.current();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [disabled]);
  return (
    <div className="roll-bar">
      <button type="button" className="roll-btn" onClick={onRoll} disabled={disabled}>
        {label}
      </button>
    </div>
  );
}

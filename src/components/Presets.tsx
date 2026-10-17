import { useState } from 'react';
import { uid, type CustomConfig, type DndConfig, type UserPreset } from '../types';

type Kind = UserPreset['kind'];
type ConfigOf<K extends Kind> = K extends 'dnd' ? DndConfig : CustomConfig;

interface Props<K extends Kind> {
  kind: K;
  current: ConfigOf<K>;
  describe: (c: ConfigOf<K>) => string;
  onLoad: (c: ConfigOf<K>) => void;
  presets: UserPreset[];
  setPresets: (fn: (p: UserPreset[]) => UserPreset[]) => void;
}

export function Presets<K extends Kind>({ kind, current, describe, onLoad, presets, setPresets }: Props<K>) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const mine = presets.filter((p) => p.kind === kind);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim() || describe(current);
    setPresets((ps) => [...ps, { id: uid(), name: n, kind, config: structuredClone(current) } as UserPreset]);
    setName('');
  };
  const rename = (id: string) => {
    const n = editName.trim();
    if (n) setPresets((ps) => ps.map((p) => (p.id === id ? { ...p, name: n } : p)));
    setEditing(null);
  };
  const remove = (p: UserPreset) => {
    if (confirm(`Usunąć preset „${p.name}”?`)) setPresets((ps) => ps.filter((x) => x.id !== p.id));
  };

  return (
    <details className="panel">
      <summary>Moje presety ({mine.length})</summary>
      <form className="preset-save" onSubmit={save}>
        <input aria-label="Nazwa presetu" placeholder={`Nazwa, np. ${describe(current)}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        <button type="submit" className="secondary">Zapisz</button>
      </form>
      {mine.length === 0 ? (
        <p className="muted small">Brak zapisanych presetów.</p>
      ) : (
        <ul className="preset-list">
          {mine.map((p) => (
            <li key={p.id}>
              {editing === p.id ? (
                <form className="preset-save" onSubmit={(e) => { e.preventDefault(); rename(p.id); }}>
                  <input aria-label="Nowa nazwa" value={editName} autoFocus onChange={(e) => setEditName(e.target.value)} maxLength={40} />
                  <button type="submit" className="secondary">OK</button>
                  <button type="button" className="link" onClick={() => setEditing(null)}>Anuluj</button>
                </form>
              ) : (
                <>
                  <button type="button" className="preset-load" onClick={() => onLoad(structuredClone(p.config) as ConfigOf<K>)} aria-label={`Wczytaj preset ${p.name}`}>
                    <b>{p.name}</b>
                    <span className="muted small">{describe(p.config as ConfigOf<K>)}</span>
                  </button>
                  <button type="button" className="icon" aria-label={`Zmień nazwę ${p.name}`} onClick={() => { setEditing(p.id); setEditName(p.name); }}>✎</button>
                  <button type="button" className="icon" aria-label={`Usuń ${p.name}`} onClick={() => remove(p)}>✕</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

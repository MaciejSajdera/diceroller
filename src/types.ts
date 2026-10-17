import type { AdvantageMode, DiceGroup } from './dice';

export type ModeId = 'catan' | 'monopoly' | 'yahtzee' | 'dnd' | 'warhammer' | 'risk' | 'custom';

export const MODES: { id: ModeId; label: string }[] = [
  { id: 'catan', label: 'Catan' },
  { id: 'monopoly', label: 'Monopoly' },
  { id: 'yahtzee', label: 'Kości' },
  { id: 'dnd', label: 'D&D' },
  { id: 'warhammer', label: 'Warhammer' },
  { id: 'risk', label: 'Ryzyko' },
  { id: 'custom', label: 'Własny' },
];

export const modeLabel = (id: ModeId) => MODES.find((m) => m.id === id)?.label ?? id;

export interface HistoryEntry {
  id: string;
  ts: number;
  mode: ModeId;
  detail: string; // np. "2k6: 3 + 4"
  result: string; // np. "7"
}

export interface DndConfig {
  sides: number;
  count: number;
  modifier: number;
  adv: AdvantageMode;
}

export interface CustomConfig {
  groups: DiceGroup[];
  modifier: number;
}

export type UserPreset =
  | { id: string; name: string; kind: 'dnd'; config: DndConfig }
  | { id: string; name: string; kind: 'custom'; config: CustomConfig };

export interface ModeProps {
  /** Zapis do historii + haptyka. */
  onRolled: (detail: string, result: string) => void;
  /** Animacja włączona dla ostatniego rzutu — licznik używany jako key. */
  rollKey: number;
}

export const uid = () =>
  typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

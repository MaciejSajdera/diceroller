/**
 * Silnik kości — czysty moduł TS bez zależności od Reacta/DOM.
 * Losowość: crypto.getRandomValues + rejection sampling (bez biasu modulo).
 */

export type RandomSource = (buf: Uint32Array<ArrayBuffer>) => unknown;

export const DIE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const;
export type DieSides = (typeof DIE_TYPES)[number];

const UINT32_RANGE = 2 ** 32;

export const cryptoSource: RandomSource = (buf) => {
  crypto.getRandomValues(buf);
};

/**
 * Zwraca liczbę całkowitą z przedziału [1, sides], jednostajnie.
 * Odrzuca wartości z "ogona" zakresu 2^32, który nie dzieli się równo przez `sides`.
 */
export function rollDie(sides: number, rng: RandomSource = cryptoSource): number {
  if (!Number.isInteger(sides) || sides < 1 || sides > UINT32_RANGE) {
    throw new RangeError(`Nieprawidłowa liczba ścianek: ${sides}`);
  }
  const limit = UINT32_RANGE - (UINT32_RANGE % sides); // największa wielokrotność sides <= 2^32
  const buf = new Uint32Array(1);
  // Prawdopodobieństwo odrzucenia < 50%, więc pętla kończy się szybko.
  for (;;) {
    rng(buf);
    const x = buf[0];
    if (x < limit) return (x % sides) + 1;
  }
}

export function rollDice(count: number, sides: number, rng: RandomSource = cryptoSource): number[] {
  if (!Number.isInteger(count) || count < 0) throw new RangeError(`Nieprawidłowa liczba kości: ${count}`);
  return Array.from({ length: count }, () => rollDie(sides, rng));
}

export const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);

// ---------- Grupy kości + modyfikator (tryb Własny / D&D) ----------

export interface DiceGroup {
  count: number;
  sides: number;
}

export interface GroupResult extends DiceGroup {
  values: number[];
  subtotal: number;
}

export interface GroupsRoll {
  groups: GroupResult[];
  modifier: number;
  total: number;
}

export function rollGroups(groups: readonly DiceGroup[], modifier = 0, rng: RandomSource = cryptoSource): GroupsRoll {
  const results = groups.map((g) => {
    const values = rollDice(g.count, g.sides, rng);
    return { ...g, values, subtotal: sum(values) };
  });
  return { groups: results, modifier, total: sum(results.map((r) => r.subtotal)) + modifier };
}

export function formatGroups(groups: readonly DiceGroup[], modifier = 0): string {
  const parts = groups.filter((g) => g.count > 0).map((g) => `${g.count}k${g.sides}`);
  let s = parts.join(' + ') || '—';
  if (modifier > 0) s += ` + ${modifier}`;
  if (modifier < 0) s += ` − ${Math.abs(modifier)}`;
  return s;
}

// ---------- Przewaga / utrudnienie ----------

export type AdvantageMode = 'none' | 'advantage' | 'disadvantage';

export interface AdvantageRoll {
  rolls: number[]; // 1 lub 2 rzuty k20
  kept: number;
  keptIndex: number;
  modifier: number;
  total: number;
}

export function rollD20(mode: AdvantageMode, modifier = 0, rng: RandomSource = cryptoSource): AdvantageRoll {
  const rolls = rollDice(mode === 'none' ? 1 : 2, 20, rng);
  return resolveAdvantage(rolls, mode, modifier);
}

export function resolveAdvantage(rolls: readonly number[], mode: AdvantageMode, modifier = 0): AdvantageRoll {
  let keptIndex = 0;
  if (rolls.length > 1) {
    if (mode === 'advantage') keptIndex = rolls[1] > rolls[0] ? 1 : 0;
    else if (mode === 'disadvantage') keptIndex = rolls[1] < rolls[0] ? 1 : 0;
  }
  const kept = rolls[keptIndex];
  return { rolls: [...rolls], kept, keptIndex, modifier, total: kept + modifier };
}

// ---------- Progi sukcesu, dublety ----------

export function countSuccesses(values: readonly number[], threshold: number): number {
  return values.filter((v) => v >= threshold).length;
}

/** Dublet = co najmniej 2 kości i wszystkie mają tę samą wartość. */
export function isDouble(values: readonly number[]): boolean {
  return values.length >= 2 && values.every((v) => v === values[0]);
}

// ---------- Monopoly ----------

export interface DoublesState {
  streak: number; // liczba dubletów z rzędu w tej turze
  jail: boolean; // trzeci dublet z rzędu
}

/** Aktualizuje licznik dubletów. Trzeci dublet z rzędu = więzienie i reset licznika na kolejną turę. */
export function nextDoublesState(prevStreak: number, double: boolean): DoublesState {
  if (!double) return { streak: 0, jail: false };
  const streak = prevStreak + 1;
  return streak >= 3 ? { streak: 3, jail: true } : { streak, jail: false };
}

// ---------- Yahtzee / Kości ----------

export const YAHTZEE_MAX_ROLLS = 3;

/** Przerzuca kości, które nie są zablokowane. */
export function rerollUnheld(
  values: readonly number[],
  held: readonly boolean[],
  rng: RandomSource = cryptoSource,
): number[] {
  return values.map((v, i) => (held[i] ? v : rollDie(6, rng)));
}

/** Najwyższy układ (opis po polsku) — podpowiedź, nie pełna tabela punktów. */
export function yahtzeePattern(values: readonly number[]): string | null {
  if (values.length !== 5) return null;
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const c = [...counts.values()].sort((a, b) => b - a);
  const uniq = new Set(values);
  const has = (...xs: number[]) => xs.every((x) => uniq.has(x));
  if (c[0] === 5) return 'Generał (Yahtzee)!';
  if (c[0] === 4) return 'Kareta';
  if (c[0] === 3 && c[1] === 2) return 'Full';
  if (has(1, 2, 3, 4, 5) || has(2, 3, 4, 5, 6)) return 'Duży strit';
  if (has(1, 2, 3, 4) || has(2, 3, 4, 5) || has(3, 4, 5, 6)) return 'Mały strit';
  if (c[0] === 3) return 'Trójka';
  if (c[0] === 2 && c[1] === 2) return 'Dwie pary';
  if (c[0] === 2) return 'Para';
  return null;
}

// ---------- Ryzyko (Risk) ----------

export interface RiskResult {
  attacker: number[]; // posortowane malejąco
  defender: number[]; // posortowane malejąco
  pairs: { a: number; d: number; attackerWins: boolean }[];
  attackerLosses: number;
  defenderLosses: number;
}

const desc = (xs: readonly number[]) => [...xs].sort((a, b) => b - a);

/** Porównanie par od najwyższych; remis wygrywa obrońca. */
export function resolveRisk(attackerRolls: readonly number[], defenderRolls: readonly number[]): RiskResult {
  const attacker = desc(attackerRolls);
  const defender = desc(defenderRolls);
  const n = Math.min(attacker.length, defender.length);
  const pairs = Array.from({ length: n }, (_, i) => ({
    a: attacker[i],
    d: defender[i],
    attackerWins: attacker[i] > defender[i],
  }));
  const defenderLosses = pairs.filter((p) => p.attackerWins).length;
  return { attacker, defender, pairs, attackerLosses: n - defenderLosses, defenderLosses };
}

export function rollRisk(attackers: number, defenders: number, rng: RandomSource = cryptoSource): RiskResult {
  if (attackers < 1 || attackers > 3) throw new RangeError('Atakujący: 1–3 kości');
  if (defenders < 1 || defenders > 2) throw new RangeError('Obrońca: 1–2 kości');
  return resolveRisk(rollDice(attackers, 6, rng), rollDice(defenders, 6, rng));
}

// ---------- Warhammer ----------

export interface WarhammerResult {
  hitRolls: number[];
  hits: number;
  woundRolls: number[] | null;
  wounds: number | null;
}

export function rollWarhammer(
  pool: number,
  hitOn: number,
  woundOn: number | null,
  rng: RandomSource = cryptoSource,
): WarhammerResult {
  const hitRolls = rollDice(pool, 6, rng);
  const hits = countSuccesses(hitRolls, hitOn);
  if (woundOn == null) return { hitRolls, hits, woundRolls: null, wounds: null };
  const woundRolls = rollDice(hits, 6, rng);
  return { hitRolls, hits, woundRolls, wounds: countSuccesses(woundRolls, woundOn) };
}

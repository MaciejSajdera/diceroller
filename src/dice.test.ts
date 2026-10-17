import { describe, expect, it } from 'vitest';
import {
  countSuccesses, formatGroups, isDouble, nextDoublesState, rerollUnheld, resolveAdvantage, resolveRisk,
  rollD20, rollDie, rollDice, rollGroups, rollRisk, rollWarhammer, yahtzeePattern, DIE_TYPES, type RandomSource,
} from './dice';

/** Deterministyczne źródło: zwraca kolejne surowe wartości uint32. */
function seq(...raw: number[]): RandomSource & { calls: number } {
  let i = 0;
  const f = ((buf: Uint32Array<ArrayBuffer>) => {
    buf[0] = raw[i++ % raw.length];
    f.calls++;
    return buf;
  }) as RandomSource & { calls: number };
  f.calls = 0;
  return f;
}
/** Źródło dające kości o zadanych wartościach (dla danej liczby ścianek). */
const faces = (...vals: number[]) => seq(...vals.map((v) => v - 1));

describe('rollDie', () => {
  it('zwraca wartości w zakresie dla wszystkich typów kości', () => {
    for (const s of DIE_TYPES) {
      for (let i = 0; i < 2000; i++) {
        const v = rollDie(s);
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(s);
        expect(Number.isInteger(v)).toBe(true);
      }
    }
  });

  it('odrzuca wartości z ogona zakresu (rejection sampling)', () => {
    // dla k6: 2^32 % 6 = 4, limit = 2^32 - 4. Wartości >= limit muszą zostać odrzucone.
    const limit = 2 ** 32 - (2 ** 32 % 6);
    const rng = seq(limit, limit + 3, 7);
    expect(rollDie(6, rng)).toBe((7 % 6) + 1);
    expect(rng.calls).toBe(3);
  });

  it('akceptuje ostatnią wartość poniżej limitu', () => {
    const limit = 2 ** 32 - (2 ** 32 % 6);
    const rng = seq(limit - 1);
    expect(rollDie(6, rng)).toBe(((limit - 1) % 6) + 1);
    expect(rng.calls).toBe(1);
  });

  it('dla potęg dwójki nic nie odrzuca', () => {
    const rng = seq(2 ** 32 - 1);
    expect(rollDie(8, rng)).toBe(8);
    expect(rng.calls).toBe(1);
  });

  it('rzuca błąd dla złej liczby ścianek', () => {
    expect(() => rollDie(0)).toThrow();
    expect(() => rollDie(2.5)).toThrow();
  });

  it('rozkład k6 jest mniej więcej równomierny', () => {
    const n = 60000;
    const counts = new Array(7).fill(0);
    for (let i = 0; i < n; i++) counts[rollDie(6)]++;
    // chi-kwadrat, 5 stopni swobody; próg 25 ≈ p < 0.0002 — test praktycznie nie flakuje
    const exp = n / 6;
    const chi = counts.slice(1).reduce((a, c) => a + (c - exp) ** 2 / exp, 0);
    expect(chi).toBeLessThan(25);
  });
});

describe('rollDice / rollGroups / formatGroups', () => {
  it('rzuca zadaną liczbę kości', () => {
    expect(rollDice(5, 6)).toHaveLength(5);
    expect(rollDice(0, 6)).toEqual([]);
  });

  it('sumuje grupy i modyfikator', () => {
    const r = rollGroups([{ count: 2, sides: 6 }, { count: 1, sides: 8 }], 3, faces(4, 5, 8));
    expect(r.groups[0].values).toEqual([4, 5]);
    expect(r.groups[1].values).toEqual([8]);
    expect(r.total).toBe(4 + 5 + 8 + 3);
  });

  it('formatuje opis', () => {
    expect(formatGroups([{ count: 2, sides: 6 }, { count: 1, sides: 20 }], -2)).toBe('2k6 + 1k20 − 2');
    expect(formatGroups([{ count: 1, sides: 100 }], 5)).toBe('1k100 + 5');
  });
});

describe('przewaga / utrudnienie', () => {
  it('przewaga bierze wyższy', () => {
    const r = resolveAdvantage([7, 15], 'advantage', 2);
    expect(r.kept).toBe(15);
    expect(r.keptIndex).toBe(1);
    expect(r.total).toBe(17);
  });
  it('utrudnienie bierze niższy', () => {
    expect(resolveAdvantage([7, 15], 'disadvantage').kept).toBe(7);
  });
  it('bez przewagi rzuca jedną k20', () => {
    const r = rollD20('none', 0, faces(12));
    expect(r.rolls).toEqual([12]);
    expect(r.total).toBe(12);
  });
  it('z przewagą rzuca dwie k20', () => {
    expect(rollD20('advantage', -1, faces(3, 19)).total).toBe(18);
  });
});

describe('sukcesy i dublety', () => {
  it('liczy kości >= progu', () => {
    expect(countSuccesses([1, 2, 3, 4, 5, 6], 3)).toBe(4);
    expect(countSuccesses([], 3)).toBe(0);
  });
  it('wykrywa dublet', () => {
    expect(isDouble([3, 3])).toBe(true);
    expect(isDouble([3, 4])).toBe(false);
    expect(isDouble([3])).toBe(false);
  });
});

describe('Monopoly — dublety z rzędu', () => {
  it('trzeci dublet = więzienie', () => {
    let s = nextDoublesState(0, true);
    expect(s).toEqual({ streak: 1, jail: false });
    s = nextDoublesState(s.streak, true);
    expect(s).toEqual({ streak: 2, jail: false });
    s = nextDoublesState(s.streak, true);
    expect(s).toEqual({ streak: 3, jail: true });
  });
  it('brak dubletu zeruje licznik', () => {
    expect(nextDoublesState(2, false)).toEqual({ streak: 0, jail: false });
  });
});

describe('Yahtzee', () => {
  it('przerzuca tylko niezablokowane', () => {
    const r = rerollUnheld([1, 2, 3, 4, 5], [true, false, true, false, true], faces(6, 6));
    expect(r).toEqual([1, 6, 3, 6, 5]);
  });
  it('rozpoznaje układy', () => {
    expect(yahtzeePattern([4, 4, 4, 4, 4])).toBe('Generał (Yahtzee)!');
    expect(yahtzeePattern([4, 4, 4, 4, 1])).toBe('Kareta');
    expect(yahtzeePattern([2, 2, 3, 3, 3])).toBe('Full');
    expect(yahtzeePattern([2, 3, 4, 5, 6])).toBe('Duży strit');
    expect(yahtzeePattern([1, 2, 3, 4, 6])).toBe('Mały strit');
    expect(yahtzeePattern([1, 1, 3, 3, 6])).toBe('Dwie pary');
    expect(yahtzeePattern([1, 2, 4, 5, 1])).toBe('Para');
    expect(yahtzeePattern([1, 2, 4, 5, 3])).toBe('Duży strit');
  });
});

describe('Ryzyko', () => {
  it('porównuje posortowane pary, remis dla obrońcy', () => {
    const r = resolveRisk([3, 6, 4], [4, 6]);
    expect(r.attacker).toEqual([6, 4, 3]);
    expect(r.defender).toEqual([6, 4]);
    expect(r.attackerLosses).toBe(2);
    expect(r.defenderLosses).toBe(0);
  });
  it('atakujący wygrywa obie pary', () => {
    const r = resolveRisk([6, 5, 1], [4, 4]);
    expect(r.defenderLosses).toBe(2);
    expect(r.attackerLosses).toBe(0);
  });
  it('1 vs 2 porównuje tylko jedną parę', () => {
    const r = resolveRisk([5], [6, 1]);
    expect(r.pairs).toHaveLength(1);
    expect(r.attackerLosses).toBe(1);
  });
  it('waliduje liczbę kości', () => {
    expect(() => rollRisk(4, 2)).toThrow();
    expect(() => rollRisk(3, 3)).toThrow();
    expect(rollRisk(3, 2).pairs).toHaveLength(2);
  });
});

describe('Warhammer', () => {
  it('liczy trafienia i rany', () => {
    // trafienia: 1,3,5,6 przy 3+ → 3 trafienia; rany: 2,4,6 przy 4+ → 2
    const r = rollWarhammer(4, 3, 4, faces(1, 3, 5, 6, 2, 4, 6));
    expect(r.hits).toBe(3);
    expect(r.woundRolls).toEqual([2, 4, 6]);
    expect(r.wounds).toBe(2);
  });
  it('bez kroku ran', () => {
    const r = rollWarhammer(3, 4, null, faces(4, 4, 1));
    expect(r.hits).toBe(2);
    expect(r.wounds).toBeNull();
  });
});

import { describe, expect, it } from 'vitest'
import {
  SAVINGS_DEFAULTS,
  calculate,
  monthlyRate,
  monthsLabel,
  toCsv,
  type SavingsInput,
} from '@/lib/savings'

const base: SavingsInput = { ...SAVINGS_DEFAULTS, g: 0, meta: 0 }

describe('lib/savings', () => {
  it('la tasa mensual equivale a la nominal capitalizable', () => {
    expect(monthlyRate(12, 12)).toBeCloseTo(0.01, 12)
    expect(Math.pow(1 + monthlyRate(10, 1), 12)).toBeCloseTo(1.1, 12)
  })

  it('coincide con la fórmula cerrada de valor futuro (aporte al final)', () => {
    const p = { ...base, p0: 10000, ap: 2000, r: 10, m: 12, n: 20 }
    const i = 0.1 / 12
    const N = 240
    const fv = p.p0 * (1 + i) ** N + p.ap * (((1 + i) ** N - 1) / i)
    const r = calculate(p)
    expect(r.balance).toBeCloseTo(fv, 4)
    expect(r.contributed).toBe(10000 + 2000 * 240)
    expect(r.interest).toBeCloseTo(fv - r.contributed, 4)
  })

  it('el aporte al inicio del mes es una anualidad anticipada', () => {
    const p = { ...base, p0: 0, ap: 1000, r: 8, n: 10 }
    const i = 0.08 / 12
    const N = 120
    const due = 1000 * (((1 + i) ** N - 1) / i) * (1 + i)
    expect(calculate({ ...p, timing: 'inicio' }).balance).toBeCloseTo(due, 4)
    expect(calculate({ ...p, timing: 'inicio' }).balance).toBeGreaterThan(
      calculate({ ...p, timing: 'fin' }).balance,
    )
  })

  it('con tasa 0 el saldo es la suma de lo aportado', () => {
    const r = calculate({ ...base, r: 0, p0: 5000, ap: 100, n: 3 })
    expect(r.balance).toBeCloseTo(5000 + 3600, 8)
    expect(r.interest).toBeCloseTo(0, 8)
  })

  it('el incremento anual sube la aportación cada aniversario', () => {
    const r = calculate({ ...base, r: 0, p0: 0, ap: 1000, g: 10, n: 3 })
    expect(r.rows.map((x) => Math.round(x.monthly))).toEqual([1000, 1000, 1100, 1210])
    expect(r.deposits).toBeCloseTo(12 * (1000 + 1100 + 1210), 6)
  })

  it('la tabla anual cuadra: saldo = aportado + interés acumulado', () => {
    const r = calculate(SAVINGS_DEFAULTS)
    expect(r.rows).toHaveLength(SAVINGS_DEFAULTS.n + 1)
    for (const row of r.rows) {
      expect(row.balance).toBeCloseTo(row.contributed + row.interestTotal, 4)
    }
    const sumInterest = r.rows.reduce((s, x) => s + x.interest, 0)
    expect(sumInterest).toBeCloseTo(r.interest, 4)
  })

  it('la aportación necesaria lleva exactamente a la meta', () => {
    const p = { ...SAVINGS_DEFAULTS, meta: 3000000 }
    const r = calculate(p)
    expect(r.requiredMonthly).not.toBeNull()
    const hit = calculate({ ...p, ap: r.requiredMonthly! })
    expect(hit.balance).toBeCloseTo(p.meta, 2)
  })

  it('detecta el mes en que se alcanza la meta', () => {
    const r = calculate({ ...base, r: 0, p0: 0, ap: 1000, n: 5, meta: 12000 })
    expect(r.goalMonth).toBe(12)
    expect(calculate({ ...base, p0: 50000, meta: 10000 }).goalMonth).toBe(0)
    expect(calculate({ ...base, r: 0, p0: 0, ap: 10, n: 1, meta: 1e6 }).goalMonth).toBeNull()
  })

  it('el saldo real descuenta la inflación del plazo', () => {
    const r = calculate({ ...base, inf: 5 })
    expect(r.real).toBeCloseTo(r.balance / 1.05 ** base.n, 6)
  })

  it('no produce NaN en los extremos', () => {
    for (const r of [0, 50])
      for (const n of [1, 60])
        for (const m of [1, 365]) {
          const out = calculate({ ...SAVINGS_DEFAULTS, r, n, m, p0: 0, ap: 0 })
          expect(Number.isFinite(out.balance)).toBe(true)
          expect(Number.isFinite(out.real)).toBe(true)
        }
  })

  it('monthsLabel y toCsv', () => {
    expect(monthsLabel(0)).toBe('de inmediato')
    expect(monthsLabel(13)).toBe('1 año y 1 mes')
    expect(monthsLabel(26)).toBe('2 años y 2 meses')
    const csv = toCsv(calculate({ ...base, n: 2 }).rows).split('\n')
    expect(csv).toHaveLength(4)
    expect(csv[0].startsWith('Año,')).toBe(true)
  })
})

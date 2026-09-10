import { describe, expect, it } from 'vitest'
import golden from './golden.json'
import { SIMS, SIM_BY_ID } from '@/lib/sims'
import { DEFAULT_SEED, cv, invNorm, normals, rng } from '@/lib/stats'
import { mmc } from '@/lib/sims/queueing'
import { fmt, money } from '@/lib/format'

type GoldenModule = {
  metrics: { label: string; value: string; note: string }[]
  chartTitle: string
  chartNote: string
  controls: {
    label: string
    min: number
    max: number
    step: number
    value: number
    display: string
    help: string
  }[]
}

const GOLDEN = golden as unknown as Record<string, GoldenModule>
const CTX = { seed: DEFAULT_SEED, week: 8 }

describe('lib/stats', () => {
  it('invNorm reproduce los cuantiles conocidos', () => {
    expect(invNorm(0.95)).toBeCloseTo(1.6449, 3)
    expect(invNorm(0.99)).toBeCloseTo(2.3263, 3)
    expect(invNorm(0.5)).toBeCloseTo(0, 6)
    expect(invNorm(0.975)).toBeCloseTo(1.95996, 4)
  })

  it('invNorm es simétrica alrededor de 0.5', () => {
    for (const p of [0.6, 0.8, 0.9, 0.995]) {
      expect(invNorm(p)).toBeCloseTo(-invNorm(1 - p), 6)
    }
  })

  it('rng es determinista y vive en [0, 1)', () => {
    const a = Array.from({ length: 50 }, rng(DEFAULT_SEED))
    const b = Array.from({ length: 50 }, rng(DEFAULT_SEED))
    expect(a).toEqual(b)
    for (const v of a) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('normals produce choques deterministas y sin NaN', () => {
    const z = normals(DEFAULT_SEED, 500)
    expect(z).toEqual(normals(DEFAULT_SEED, 500))
    expect(z.every(Number.isFinite)).toBe(true)
    const mean = z.reduce((s, x) => s + x, 0) / z.length
    expect(Math.abs(mean)).toBeLessThan(0.25)
  })

  it('cv devuelve σ/μ y 0 si la media no es positiva', () => {
    expect(cv([10, 10, 10])).toBeCloseTo(0, 12)
    expect(cv([0, 0, 0])).toBe(0)
    expect(cv([2, 4, 6])).toBeCloseTo(Math.sqrt(8 / 3) / 4, 10)
  })
})

describe('lib/format', () => {
  it('formatea en es-MX', () => {
    expect(fmt(1234567, 0)).toBe('1,234,567')
    expect(fmt(3.14159, 2)).toBe('3.14')
    expect(money(1500)).toBe('$1,500')
  })

  it('representa el infinito con ∞', () => {
    expect(fmt(Infinity)).toBe('∞')
  })
})

describe('cola M/M/c', () => {
  it('coincide con los valores de libro para M/M/1', () => {
    // λ = 6, μ = 10 → ρ = 0.6, Lq = ρ²/(1−ρ) = 0.9, Wq = Lq/λ = 0.15
    const r = mmc(6, 10, 1)
    expect(r.rho).toBeCloseTo(0.6, 10)
    expect(r.Lq).toBeCloseTo(0.9, 10)
    expect(r.Wq).toBeCloseTo(0.15, 10)
    expect(r.W).toBeCloseTo(0.25, 10)
    expect(r.L).toBeCloseTo(1.5, 10)
  })

  it('devuelve ∞ cuando el sistema está saturado (ρ ≥ 1)', () => {
    const r = mmc(40, 10, 4)
    expect(r.rho).toBeGreaterThanOrEqual(1)
    expect(r.Wq).toBe(Infinity)
    expect(r.Lq).toBe(Infinity)
    expect(r.Pw).toBe(1)
  })

  it('L = λ·W (ley de Little) en varios puntos de operación', () => {
    for (const [lam, mu, c] of [
      [34, 12, 3],
      [10, 8, 2],
      [55, 20, 4],
    ]) {
      const r = mmc(lam, mu, c)
      expect(r.L).toBeCloseTo(lam * r.W, 8)
    }
  })
})

describe('paridad con el prototipo de Claude Design', () => {
  it('cubre los ocho módulos', () => {
    expect(SIMS).toHaveLength(8)
    expect(Object.keys(GOLDEN).sort()).toEqual(SIMS.map((s) => s.id).sort())
  })

  for (const sim of SIMS) {
    describe(`${sim.num} · ${sim.title}`, () => {
      const expected = GOLDEN[sim.id]
      const result = sim.run(sim.defaults, CTX)

      it('produce las seis tarjetas de resultado con los mismos valores', () => {
        expect(result.metrics).toEqual(expected.metrics)
      })

      it('declara los mismos parámetros, rangos, pasos y valores por defecto', () => {
        expect(
          sim.params.map((p) => ({
            label: p.label,
            min: p.min,
            max: p.max,
            step: p.step,
            value: sim.defaults[p.key],
            display: p.format
              ? p.format(sim.defaults[p.key])
              : fmt(sim.defaults[p.key], p.step < 1 ? 2 : 0),
            help: p.help,
          })),
        ).toEqual(expected.controls)
      })

      it('conserva el título y la nota del gráfico principal', () => {
        expect(result.chart.title).toBe(expected.chartTitle)
        expect(result.chart.note).toBe(expected.chartNote)
      })
    })
  }
})

describe('robustez de los simuladores', () => {
  /** Barre cada parámetro por sus extremos y su punto medio. */
  function sweep(simId: string) {
    const sim = SIM_BY_ID[simId]
    const cases: Record<string, number>[] = [{ ...sim.defaults }]
    for (const spec of sim.params) {
      for (const v of [spec.min, (spec.min + spec.max) / 2, spec.max]) {
        cases.push({ ...sim.defaults, [spec.key]: v })
      }
    }
    return { sim, cases }
  }

  for (const s of SIMS) {
    it(`${s.num} · ${s.title} nunca produce NaN ni "NaN" en los extremos`, () => {
      const { sim, cases } = sweep(s.id)
      for (const p of cases) {
        for (const week of [2, 8, 40, 60]) {
          const r = sim.run(p, { seed: DEFAULT_SEED, week })

          expect(r.metrics).toHaveLength(6)
          for (const m of r.metrics) {
            expect(m.value, `${sim.id} ${JSON.stringify(p)} → ${m.label}`).not.toMatch(/NaN|undefined/)
            expect(m.note).not.toMatch(/NaN|undefined/)
          }

          for (const chart of [r.chart, r.chart2]) {
            if (!chart) continue
            expect(chart.data.length).toBeGreaterThan(0)
            for (const row of chart.data) {
              for (const [k, v] of Object.entries(row)) {
                if (typeof v === 'number') {
                  expect(Number.isNaN(v), `${sim.id} → ${k}`).toBe(false)
                }
              }
            }
          }
        }
      }
    })
  }

  it('la saturación de la cola se muestra como ∞ y no como NaN', () => {
    const r = SIM_BY_ID['colas'].run(
      { lam: 90, mu: 1, c: 1, e1: 40, e2: 30, e3: 45 },
      CTX,
    )
    const wq = r.metrics.find((m) => m.label.startsWith('Espera en fila'))
    expect(wq?.value).toBe('∞')
    expect(r.metrics[0].note).toContain('saturado')
  })

  it('las simulaciones con semilla son reproducibles', () => {
    for (const id of ['punto-reorden', 'revision', 'efecto-latigo']) {
      const sim = SIM_BY_ID[id]
      const a = sim.run(sim.defaults, CTX)
      const b = sim.run(sim.defaults, CTX)
      expect(a.metrics).toEqual(b.metrics)
      expect(a.chart.data).toEqual(b.chart.data)
    }
  })

  it('el Beer Game avanza con la semana y acumula costo', () => {
    const sim = SIM_BY_ID['beer-game']
    const w8 = sim.run(sim.defaults, { seed: DEFAULT_SEED, week: 8 })
    const w20 = sim.run(sim.defaults, { seed: DEFAULT_SEED, week: 20 })
    expect(w8.metrics[0].value).toBe('8')
    expect(w20.metrics[0].value).toBe('20')
    expect(w20.chart.data.length).toBeGreaterThan(w8.chart.data.length)
    expect(w20.actions?.map((a) => a.kind)).toEqual(['week+1', 'week+5', 'week=40', 'reset'])
  })

  it('cada módulo declara ruta, número y área únicos', () => {
    expect(new Set(SIMS.map((s) => s.route)).size).toBe(8)
    expect(SIMS.map((s) => s.num)).toEqual(['01', '02', '03', '04', '05', '06', '07', '08'])
  })

  it('todos los parámetros por defecto caen dentro de su rango', () => {
    for (const sim of SIMS) {
      for (const spec of sim.params) {
        const v = sim.defaults[spec.key]
        expect(v, `${sim.id}.${spec.key}`).toBeGreaterThanOrEqual(spec.min)
        expect(v, `${sim.id}.${spec.key}`).toBeLessThanOrEqual(spec.max)
      }
    }
  })
})

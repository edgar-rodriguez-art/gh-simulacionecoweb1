/**
 * Calculadora de ahorro e inversión con interés compuesto (módulo 09).
 *
 * Lógica pura, sin React: la página sólo mapea esta salida a controles,
 * gráficos y tabla, así que todo se prueba sin montar la interfaz.
 *
 * Modelo mensual: la tasa nominal anual `r`, capitalizable `m` veces al año,
 * se convierte a su equivalente mensual efectiva
 *   i = (1 + r/m)^(m/12) − 1
 * y el saldo avanza mes a mes con la aportación de ese mes, que crece un
 * `g`% cada aniversario. Con aporte al inicio del mes el depósito gana el
 * interés de ese mismo mes (anualidad anticipada); al final, no.
 */

export type Timing = 'inicio' | 'fin'

export type SavingsInput = {
  /** Inversión inicial. */
  p0: number
  /** Aportación mensual del primer año. */
  ap: number
  /** Tasa nominal anual en %. */
  r: number
  /** Capitalizaciones por año (1, 2, 4, 12, 365). */
  m: number
  /** Plazo en años. */
  n: number
  /** Incremento anual de la aportación en %. */
  g: number
  /** Inflación anual esperada en %. */
  inf: number
  /** Meta de ahorro; 0 = sin meta. */
  meta: number
  timing: Timing
}

export type YearRow = {
  year: number
  /** Aportación mensual vigente durante ese año. */
  monthly: number
  /** Depositado durante el año (sin la inversión inicial). */
  deposits: number
  /** Interés ganado durante el año. */
  interest: number
  /** Inversión inicial + todas las aportaciones al cierre del año. */
  contributed: number
  /** Interés acumulado al cierre del año. */
  interestTotal: number
  balance: number
  /** Saldo al cierre en pesos de hoy. */
  real: number
}

export type SavingsResult = {
  rows: YearRow[]
  balance: number
  contributed: number
  deposits: number
  interest: number
  real: number
  /** Tasa efectiva anual equivalente, en %. */
  tea: number
  /** Tasa real anual (Fisher), en %. */
  realRate: number
  /** Meses hasta alcanzar la meta dentro del plazo; null si no se alcanza o no hay meta. */
  goalMonth: number | null
  /** Aportación mensual inicial necesaria para llegar a la meta en el plazo. */
  requiredMonthly: number | null
}

export const FREQUENCIES: { m: number; label: string }[] = [
  { m: 1, label: 'Anual' },
  { m: 2, label: 'Semestral' },
  { m: 4, label: 'Trimestral' },
  { m: 12, label: 'Mensual' },
  { m: 365, label: 'Diaria' },
]

export const SAVINGS_DEFAULTS: SavingsInput = {
  p0: 10000,
  ap: 2000,
  r: 10,
  m: 12,
  n: 20,
  g: 3,
  inf: 4,
  meta: 1000000,
  timing: 'fin',
}

export const PRESETS: { id: string; label: string; note: string; r: number }[] = [
  { id: 'conservador', label: 'Conservador', note: 'Deuda gubernamental, pagarés', r: 7 },
  { id: 'moderado', label: 'Moderado', note: 'Portafolio mixto', r: 10 },
  { id: 'agresivo', label: 'Agresivo', note: 'Renta variable de largo plazo', r: 13 },
]

/** Tasa mensual efectiva equivalente a `r`% nominal capitalizable `m` veces al año. */
export function monthlyRate(r: number, m: number): number {
  return Math.pow(1 + r / 100 / m, m / 12) - 1
}

type Sim = { months: number[]; rows: YearRow[]; balance: number; deposits: number }

function simulate(p: SavingsInput, apOverride?: number): Sim {
  const i = monthlyRate(p.r, p.m)
  const N = Math.round(p.n * 12)
  const ap0 = apOverride ?? p.ap

  let bal = p.p0
  let deposits = 0
  let yDeposits = 0
  let yInterest = 0
  let interestTotal = 0
  let monthly = ap0
  const months: number[] = [bal]
  const rows: YearRow[] = [
    {
      year: 0,
      monthly: ap0,
      deposits: 0,
      interest: 0,
      contributed: p.p0,
      interestTotal: 0,
      balance: bal,
      real: bal,
    },
  ]

  for (let t = 1; t <= N; t++) {
    // La aportación sube al iniciar cada año, a partir del segundo.
    monthly = ap0 * Math.pow(1 + p.g / 100, Math.floor((t - 1) / 12))
    let earned: number
    if (p.timing === 'inicio') {
      earned = (bal + monthly) * i
      bal = bal + monthly + earned
    } else {
      earned = bal * i
      bal = bal + earned + monthly
    }
    deposits += monthly
    yDeposits += monthly
    yInterest += earned
    interestTotal += earned
    months.push(bal)

    if (t % 12 === 0 || t === N) {
      const year = t / 12
      rows.push({
        year,
        monthly,
        deposits: yDeposits,
        interest: yInterest,
        contributed: p.p0 + deposits,
        interestTotal,
        balance: bal,
        real: bal / Math.pow(1 + p.inf / 100, year),
      })
      yDeposits = 0
      yInterest = 0
    }
  }

  return { months, rows, balance: bal, deposits }
}

export function calculate(p: SavingsInput): SavingsResult {
  const sim = simulate(p)
  const contributed = p.p0 + sim.deposits

  let goalMonth: number | null = null
  let requiredMonthly: number | null = null
  if (p.meta > 0) {
    const idx = sim.months.findIndex((b) => b >= p.meta)
    goalMonth = idx >= 0 ? idx : null

    // El saldo final es lineal en la aportación inicial: FV(a) = FV(0) + a·k.
    const base = simulate(p, 0).balance
    const k = simulate(p, 1).balance - base
    requiredMonthly = base >= p.meta ? 0 : k > 0 ? (p.meta - base) / k : null
  }

  return {
    rows: sim.rows,
    balance: sim.balance,
    contributed,
    deposits: sim.deposits,
    interest: sim.balance - contributed,
    real: sim.balance / Math.pow(1 + p.inf / 100, p.n),
    tea: (Math.pow(1 + p.r / 100 / p.m, p.m) - 1) * 100,
    realRate: ((1 + p.r / 100) / (1 + p.inf / 100) - 1) * 100,
    goalMonth,
    requiredMonthly,
  }
}

/** Texto “X años y Y meses” para un número de meses. */
export function monthsLabel(t: number): string {
  const y = Math.floor(t / 12)
  const mo = t % 12
  const parts: string[] = []
  if (y > 0) parts.push(y + (y === 1 ? ' año' : ' años'))
  if (mo > 0) parts.push(mo + (mo === 1 ? ' mes' : ' meses'))
  return parts.length ? parts.join(' y ') : 'de inmediato'
}

/** Tabla anual como CSV (separador coma, punto decimal) para hojas de cálculo. */
export function toCsv(rows: YearRow[]): string {
  const head = [
    'Año',
    'Aportación mensual',
    'Depositado en el año',
    'Interés del año',
    'Total aportado',
    'Interés acumulado',
    'Saldo',
    'Saldo en pesos de hoy',
  ]
  const lines = rows.map((r) =>
    [
      r.year,
      r.monthly,
      r.deposits,
      r.interest,
      r.contributed,
      r.interestTotal,
      r.balance,
      r.real,
    ]
      .map((v, j) => (j === 0 ? String(v) : v.toFixed(2)))
      .join(','),
  )
  return [head.join(','), ...lines].join('\n')
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ResultCard } from '@/components/ResultCard'
import { ExplainPanel } from '@/components/ExplainPanel'
import { SAVINGS_MODULE } from '@/content/modules'
import { fmt, money } from '@/lib/format'
import { DARK, GREY, INK, RED } from '@/lib/sims/types'
import {
  FREQUENCIES,
  PRESETS,
  SAVINGS_DEFAULTS,
  calculate,
  monthsLabel,
  toCsv,
  type SavingsInput,
  type YearRow,
} from '@/lib/savings'

const BG = '#f3f2f2'
const GRID = '#d7d3d3'
const AXIS_TEXT = '#605d5d'

const panel = 'bg-[var(--color-bg)] p-[18px]'
const panelEdge = { boxShadow: '0 0 0 1px var(--color-divider)' }

type NumKey = Exclude<keyof SavingsInput, 'timing'>

type FieldSpec = {
  key: NumKey
  label: string
  help: string
  /** Rango del slider; el campo de texto admite hasta `hardMax`. */
  min: number
  max: number
  step: number
  hardMax: number
  unit: 'money' | 'pct' | 'years'
}

const MAIN_FIELDS: FieldSpec[] = [
  {
    key: 'p0',
    label: 'Inversión inicial',
    help: 'Lo que deposita hoy para arrancar.',
    min: 0,
    max: 1000000,
    step: 1000,
    hardMax: 100000000,
    unit: 'money',
  },
  {
    key: 'ap',
    label: 'Aportación mensual',
    help: 'Lo que ahorra cada mes durante el primer año.',
    min: 0,
    max: 50000,
    step: 100,
    hardMax: 10000000,
    unit: 'money',
  },
  {
    key: 'r',
    label: 'Rendimiento anual esperado',
    help: 'Tasa nominal antes de impuestos y comisiones.',
    min: 0,
    max: 25,
    step: 0.25,
    hardMax: 50,
    unit: 'pct',
  },
  {
    key: 'n',
    label: 'Plazo',
    help: 'Años que dejará trabajar el dinero.',
    min: 1,
    max: 50,
    step: 1,
    hardMax: 60,
    unit: 'years',
  },
]

const EXTRA_FIELDS: FieldSpec[] = [
  {
    key: 'g',
    label: 'Incremento anual de la aportación',
    help: 'Cuánto sube su ahorro mensual cada año (aumentos de sueldo).',
    min: 0,
    max: 15,
    step: 0.5,
    hardMax: 30,
    unit: 'pct',
  },
  {
    key: 'inf',
    label: 'Inflación anual esperada',
    help: 'Para traducir el saldo a poder de compra de hoy.',
    min: 0,
    max: 15,
    step: 0.25,
    hardMax: 30,
    unit: 'pct',
  },
  {
    key: 'meta',
    label: 'Meta de ahorro',
    help: 'Opcional. Déjela en 0 si no tiene una cifra objetivo.',
    min: 0,
    max: 10000000,
    step: 10000,
    hardMax: 1000000000,
    unit: 'money',
  },
]

const ALL_FIELDS = [...MAIN_FIELDS, ...EXTRA_FIELDS]

function display(spec: FieldSpec, v: number): string {
  if (spec.unit === 'money') return fmt(v, 0)
  if (spec.unit === 'pct') return fmt(v, 2)
  return fmt(v, 0)
}

function parseNumber(raw: string): number {
  // es-MX: coma de miles, punto decimal.
  const clean = raw.replace(/[^\d.]/g, '')
  return clean === '' ? NaN : Number(clean)
}

/** Lee el escenario del query string, acotado a rangos válidos. */
function readParams(sp: URLSearchParams): SavingsInput {
  const out: SavingsInput = { ...SAVINGS_DEFAULTS }
  for (const f of ALL_FIELDS) {
    const raw = sp.get(f.key)
    if (raw === null) continue
    const v = Number(raw)
    if (Number.isFinite(v)) out[f.key] = Math.min(f.hardMax, Math.max(f.min, v))
  }
  const m = Number(sp.get('m'))
  if (FREQUENCIES.some((fq) => fq.m === m)) out.m = m
  const t = sp.get('t')
  if (t === 'inicio' || t === 'fin') out.timing = t
  return out
}

/* ── Controles ─────────────────────────────────────────────────────────── */

function NumberField({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec
  value: number
  onChange: (v: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const id = 'f-' + spec.key
  const prefix = spec.unit === 'money' ? '$' : null
  const suffix = spec.unit === 'pct' ? '%' : spec.unit === 'years' ? (value === 1 ? 'año' : 'años') : null

  const commit = (raw: string) => {
    const v = parseNumber(raw)
    if (Number.isFinite(v)) onChange(Math.min(spec.hardMax, Math.max(spec.min, v)))
  }

  return (
    <div className="flex flex-col gap-[6px] border-t border-[var(--color-neutral-300)] py-[11px]">
      <label htmlFor={id} className="text-[12.5px] leading-[1.25] font-semibold">
        {spec.label}
      </label>
      <div className="flex items-stretch border-2 border-[var(--color-text)] bg-[var(--color-bg)] focus-within:border-[var(--color-accent)]">
        {prefix ? (
          <span className="flex items-center pl-[10px] text-[16px] font-extrabold text-[var(--color-neutral-700)]">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={draft ?? display(spec, value)}
          onFocus={(e) => {
            setDraft(String(value))
            requestAnimationFrame(() => e.target.select())
          }}
          onChange={(e) => {
            setDraft(e.target.value)
            commit(e.target.value)
          }}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          className="w-full min-w-0 border-0 bg-transparent px-[8px] py-[7px] text-[17px] font-extrabold tracking-[-0.01em] outline-none"
          style={{ fontFamily: 'var(--font-heading)' }}
        />
        {suffix ? (
          <span className="flex items-center pr-[10px] text-[13px] font-extrabold text-[var(--color-neutral-700)]">
            {suffix}
          </span>
        ) : null}
      </div>
      <Slider
        aria-label={spec.label}
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={[Math.min(spec.max, value)]}
        onValueChange={(v) => onChange(v[0])}
        className="my-[6px]"
      />
      <div className="text-[11px] leading-[1.4] text-[var(--color-neutral-700)]">{spec.help}</div>
    </div>
  )
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-[6px] border-t border-[var(--color-neutral-300)] py-[11px]">
      <span className="text-[12.5px] leading-[1.25] font-semibold">{label}</span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-[2px] bg-[var(--color-text)] p-[2px]">
        {options.map((o) => {
          const on = o.value === value
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className="flex-[1_1_auto] cursor-pointer border-0 px-[10px] py-[7px] text-[12px] font-extrabold"
              style={{
                fontFamily: 'var(--font-heading)',
                background: on ? INK : BG,
                color: on ? BG : INK,
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Gráfico ───────────────────────────────────────────────────────────── */

type ChartRow = {
  x: number
  inicial: number
  aportes: number
  intereses: number
  total: number
}

function compact(n: number): string {
  const a = Math.abs(n)
  if (a >= 1e6) return '$' + fmt(n / 1e6, a >= 1e7 ? 0 : 1) + ' M'
  if (a >= 1e3) return '$' + fmt(n / 1e3, 0) + ' k'
  return '$' + fmt(n, 0)
}

const SERIES = [
  { key: 'inicial', label: 'Inversión inicial', color: DARK },
  { key: 'aportes', label: 'Aportaciones', color: GREY },
  { key: 'intereses', label: 'Intereses ganados', color: RED },
] as const

function ChartTooltip({
  active,
  payload,
  real,
}: {
  active?: boolean
  payload?: { payload: ChartRow }[]
  real: boolean
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div
      className="flex min-w-[190px] flex-col gap-[4px] bg-[var(--color-bg)] px-[12px] py-[10px] text-[12px]"
      style={{ border: '2px solid var(--color-text)' }}
    >
      <div className="text-[10.5px] font-extrabold tracking-[0.07em] uppercase">
        Año {fmt(row.x, row.x % 1 ? 1 : 0)}
        {real ? ' · pesos de hoy' : ''}
      </div>
      {[...SERIES].reverse().map((s) => (
        <div key={s.key} className="flex items-center justify-between gap-[14px]">
          <span className="flex items-center gap-[6px]">
            <span className="block h-[10px] w-[10px]" style={{ background: s.color }} />
            {s.label}
          </span>
          <span className="font-extrabold">{money(row[s.key])}</span>
        </div>
      ))}
      <div
        className="mt-[2px] flex justify-between gap-[14px] pt-[4px] font-extrabold"
        style={{ borderTop: '1px solid var(--color-neutral-300)' }}
      >
        <span>Saldo</span>
        <span className="text-[var(--color-accent-700)]">{money(row.total)}</span>
      </div>
    </div>
  )
}

function GrowthChart({
  rows,
  p,
  real,
}: {
  rows: YearRow[]
  p: SavingsInput
  real: boolean
}) {
  const data: ChartRow[] = rows.map((r) => {
    const k = real ? Math.pow(1 + p.inf / 100, r.year) : 1
    return {
      x: r.year,
      inicial: p.p0 / k,
      aportes: (r.contributed - p.p0) / k,
      intereses: r.interestTotal / k,
      total: r.balance / k,
    }
  })
  const showGoal = p.meta > 0 && !real

  return (
    <div className="w-full border border-[#d7d3d3] bg-[var(--color-bg)]">
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data} margin={{ top: 18, right: 18, bottom: 26, left: 8 }}>
          <CartesianGrid stroke={GRID} strokeWidth={1} vertical={false} />
          <XAxis
            type="number"
            dataKey="x"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v: number) => fmt(v, 0)}
            tick={{ fontSize: 11, fill: AXIS_TEXT }}
            tickLine={false}
            stroke={INK}
            strokeWidth={2}
            label={{
              value: 'AÑOS',
              position: 'insideBottom',
              offset: -16,
              style: { fontSize: 11, fontWeight: 800, fill: INK, letterSpacing: '0.06em' },
            }}
          />
          <YAxis
            type="number"
            domain={[0, 'auto']}
            tickFormatter={compact}
            tick={{ fontSize: 11, fill: AXIS_TEXT }}
            tickLine={false}
            stroke={INK}
            strokeWidth={2}
            width={64}
          />
          <Tooltip
            content={<ChartTooltip real={real} />}
            cursor={{ stroke: INK, strokeWidth: 1, strokeDasharray: '3 3' }}
            isAnimationActive={false}
          />
          {SERIES.map((s) => (
            <Area
              key={s.key}
              type="linear"
              dataKey={s.key}
              stackId="saldo"
              stroke={s.color}
              strokeWidth={1.5}
              fill={s.color}
              fillOpacity={s.key === 'intereses' ? 0.85 : 0.55}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          ))}
          <Line
            type="linear"
            dataKey="total"
            stroke={INK}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: INK, stroke: BG, strokeWidth: 2 }}
            isAnimationActive={false}
          />
          {showGoal ? (
            <ReferenceLine
              y={p.meta}
              stroke={INK}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              ifOverflow="extendDomain"
              label={{
                value: 'Meta ' + compact(p.meta),
                position: 'top',
                fill: INK,
                fontSize: 11,
                fontWeight: 800,
              }}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── Página ────────────────────────────────────────────────────────────── */

export default function CalculadoraAhorro() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [real, setReal] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [copied, setCopied] = useState(false)

  const tab = searchParams.get('tab') === 'doc' ? 'doc' : 'sim'
  const p = useMemo(() => readParams(searchParams), [searchParams])
  const res = useMemo(() => calculate(p), [p])

  const update = useCallback(
    (patch: Partial<SavingsInput>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(patch)) {
            const key = k === 'timing' ? 't' : k
            if (v === SAVINGS_DEFAULTS[k as keyof SavingsInput]) next.delete(key)
            else next.set(key, String(v))
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setTab = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value === 'doc') next.set('tab', 'doc')
          else next.delete('tab')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(id)
  }, [copied])

  const reset = () =>
    setSearchParams(tab === 'doc' ? { tab: 'doc' } : {}, { replace: true })

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
    } catch {
      window.prompt('Copie este enlace:', window.location.href)
    }
  }

  const downloadCsv = () => {
    const blob = new Blob(['﻿' + toCsv(res.rows)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plan-de-ahorro-${p.n}-anios.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Composición del saldo final.
  const share = (x: number) => (res.balance > 0 ? (x / res.balance) * 100 : 0)
  const parts = [
    { label: 'Inversión inicial', value: p.p0, color: DARK },
    { label: 'Aportaciones', value: res.deposits, color: GREY },
    { label: 'Intereses', value: Math.max(0, res.interest), color: RED },
  ]

  // Escenarios "¿y si…?" contra el plan actual.
  const insights = useMemo(() => {
    const out: { title: string; value: string; note: string; positive: boolean }[] = []
    const more = calculate({ ...p, ap: p.ap + 500 })
    out.push({
      title: 'Si ahorra $500 más al mes',
      value: '+' + money(more.balance - res.balance),
      note: `Termina con ${money(more.balance)}.`,
      positive: true,
    })
    const rate = calculate({ ...p, r: p.r + 1 })
    out.push({
      title: 'Con un punto más de rendimiento',
      value: '+' + money(rate.balance - res.balance),
      note: `Al ${fmt(p.r + 1, 2)}% anual.`,
      positive: true,
    })
    if (p.n > 5) {
      const late = calculate({ ...p, n: p.n - 5 })
      out.push({
        title: 'Si espera 5 años para empezar',
        value: '−' + money(res.balance - late.balance),
        note: `Misma fecha final: llegaría a ${money(late.balance)}.`,
        positive: false,
      })
    }
    return out
  }, [p, res.balance])

  const goal = (() => {
    if (p.meta <= 0) return null
    if (res.goalMonth !== null)
      return {
        ok: true,
        text:
          res.goalMonth === 0
            ? 'Su inversión inicial ya cubre la meta.'
            : `Alcanza su meta de ${money(p.meta)} en ${monthsLabel(res.goalMonth)}.`,
      }
    return {
      ok: false,
      text:
        res.requiredMonthly !== null
          ? `Le faltan ${money(p.meta - res.balance)} para su meta. Necesitaría aportar ${money(res.requiredMonthly)} al mes para lograrla en ${p.n} años.`
          : `Con rendimiento 0% no se alcanza la meta en ${p.n} años.`,
    }
  })()

  const metrics = [
    {
      label: 'Saldo final',
      value: money(res.balance),
      note: `Al cierre del año ${p.n}.`,
    },
    {
      label: 'Total aportado',
      value: money(res.contributed),
      note: 'Inversión inicial más aportaciones.',
    },
    {
      label: 'Intereses ganados',
      value: money(res.interest),
      note: fmt(share(res.interest), 0) + '% del saldo final.',
    },
    {
      label: 'Poder de compra hoy',
      value: money(res.real),
      note: `Descontando ${fmt(p.inf, 2)}% de inflación anual.`,
    },
    {
      label: 'Tasa efectiva anual',
      value: fmt(res.tea, 2) + '%',
      note: `Real: ${fmt(res.realRate, 2)}% sobre la inflación.`,
    },
    {
      label: 'Aportación mensual final',
      value: money(res.rows[res.rows.length - 1].monthly),
      note: p.g > 0 ? `Crece ${fmt(p.g, 1)}% cada año.` : 'Constante durante todo el plazo.',
    },
  ]

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-[20px]">
      <div className="flex flex-col gap-[18px]">
        <header className="flex flex-wrap items-end justify-between gap-[16px]">
          <div className="min-w-0 flex-[1_1_380px]">
            <div className="text-[11px] font-extrabold tracking-[0.1em] text-[var(--color-accent-700)] uppercase">
              Módulo {SAVINGS_MODULE.num} · {SAVINGS_MODULE.area}
            </div>
            <h1 className="my-[4px] mb-[6px] text-[clamp(26px,3.4vw,40px)]">
              {SAVINGS_MODULE.title}
            </h1>
            <p className="m-0 max-w-[70ch] text-[14.5px] text-pretty">{SAVINGS_MODULE.blurb}</p>
          </div>

          <TabsList>
            {(['sim', 'doc'] as const).map((v) => (
              <TabsTrigger
                key={v}
                value={v}
                style={{ background: tab === v ? INK : 'transparent', color: tab === v ? BG : INK }}
              >
                {v === 'sim' ? 'Simulador' : 'Explicación'}
              </TabsTrigger>
            ))}
          </TabsList>
        </header>
        <div className="h-[2px] bg-[var(--color-divider)]" />
      </div>

      <TabsContent value="sim">
        <div
          className="flex flex-wrap gap-[2px] bg-[var(--color-bg)]"
          style={{ border: '2px solid var(--color-divider)' }}
        >
          {/* ── Plan ─────────────────────────────────────────────── */}
          <section className={`${panel} min-w-[240px] flex-[1_1_300px]`} style={panelEdge}>
            <div className="flex items-baseline justify-between gap-[10px]">
              <h6 className="mt-0 mb-[4px]">Su plan</h6>
              <Button type="button" variant="ghost" onClick={reset} className="px-[6px] py-[3px]">
                Restablecer
              </Button>
            </div>
            <p className="text-muted mt-0 mb-[8px] text-[11.5px]">
              Escriba una cifra o arrastre el control: todo se recalcula al instante.
            </p>

            {MAIN_FIELDS.map((f) => (
              <NumberField key={f.key} spec={f} value={p[f.key]} onChange={(v) => update({ [f.key]: v })} />
            ))}

            <div className="flex flex-col gap-[6px] border-t border-[var(--color-neutral-300)] py-[11px]">
              <span className="text-[12.5px] leading-[1.25] font-semibold">Perfil de inversión</span>
              <div className="grid grid-cols-3 gap-[2px] bg-[var(--color-text)] p-[2px]">
                {PRESETS.map((pr) => {
                  const on = p.r === pr.r
                  return (
                    <button
                      key={pr.id}
                      type="button"
                      aria-pressed={on}
                      title={pr.note}
                      onClick={() => update({ r: pr.r })}
                      className="flex cursor-pointer flex-col items-start border-0 px-[8px] py-[6px] text-left"
                      style={{ background: on ? INK : BG, color: on ? BG : INK }}
                    >
                      <span className="text-[12px] font-extrabold" style={{ fontFamily: 'var(--font-heading)' }}>
                        {pr.label}
                      </span>
                      <span className="text-[11px] opacity-80">{pr.r}% anual</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Segmented
              label="Capitalización"
              options={FREQUENCIES.map((f) => ({ value: f.m, label: f.label }))}
              value={p.m}
              onChange={(m) => update({ m })}
            />
            <Segmented
              label="Momento de la aportación"
              options={[
                { value: 'inicio', label: 'Inicio de mes' },
                { value: 'fin', label: 'Fin de mes' },
              ]}
              value={p.timing}
              onChange={(timing) => update({ timing })}
            />

            <h6 className="mt-[14px] mb-[2px]">Ajustes finos</h6>
            {EXTRA_FIELDS.map((f) => (
              <NumberField key={f.key} spec={f} value={p[f.key]} onChange={(v) => update({ [f.key]: v })} />
            ))}
          </section>

          {/* ── Resultado ────────────────────────────────────────── */}
          <section
            className={`${panel} flex min-w-0 flex-[1_1_460px] flex-col gap-[16px]`}
            style={panelEdge}
          >
            <div className="flex flex-col gap-[4px]">
              <span className="text-[10.5px] font-extrabold tracking-[0.07em] text-[var(--color-neutral-700)] uppercase">
                En {p.n} {p.n === 1 ? 'año' : 'años'} tendría
              </span>
              <output
                data-testid="saldo-final"
                aria-live="polite"
                className="text-[clamp(34px,5.4vw,56px)] leading-[1] font-extrabold tracking-[-0.03em] break-all"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {money(res.balance)}
              </output>
              <span className="text-[13px] text-[var(--color-neutral-700)]">
                Equivale a <strong className="text-[var(--color-text)]">{money(res.real)}</strong> de
                hoy. Por cada peso aportado recibe{' '}
                <strong className="text-[var(--color-text)]">
                  {money(res.contributed > 0 ? res.balance / res.contributed : 0, 2)}
                </strong>
                .
              </span>
            </div>

            {/* Composición del saldo */}
            <div className="flex flex-col gap-[8px]">
              <div className="flex h-[16px] w-full" role="img" aria-label="Composición del saldo final">
                {parts.map((pt) =>
                  pt.value > 0 ? (
                    <div
                      key={pt.label}
                      style={{ width: share(pt.value) + '%', background: pt.color }}
                      title={`${pt.label}: ${money(pt.value)}`}
                    />
                  ) : null,
                )}
              </div>
              <div className="flex flex-wrap gap-x-[18px] gap-y-[4px]">
                {parts.map((pt) => (
                  <span key={pt.label} className="flex items-center gap-[6px] text-[11.5px]">
                    <span aria-hidden="true" className="block h-[10px] w-[10px]" style={{ background: pt.color }} />
                    <span className="font-semibold">{pt.label}</span>
                    <span className="text-[var(--color-neutral-700)]">
                      {money(pt.value)} · {fmt(share(pt.value), 0)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {goal ? (
              <div
                data-testid="meta"
                className="px-[12px] py-[10px] text-[13px] font-semibold"
                style={{
                  borderLeft: '4px solid ' + (goal.ok ? INK : RED),
                  background: goal.ok ? 'var(--color-surface)' : 'var(--color-accent-100)',
                }}
              >
                {goal.ok ? '✓ ' : ''}
                {goal.text}
              </div>
            ) : null}

            <figure className="m-0 flex flex-col gap-[10px]">
              <figcaption className="flex flex-wrap items-end justify-between gap-[10px]">
                <div className="flex flex-col gap-[2px]">
                  <h6 className="m-0">Crecimiento año por año</h6>
                  <div className="text-muted text-[11.5px]">
                    Pase el cursor sobre el gráfico para ver el desglose de cada año.
                  </div>
                </div>
                <div role="group" aria-label="Unidades del gráfico" className="flex border-2 border-[var(--color-text)]">
                  {[
                    { v: false, label: 'Nominal' },
                    { v: true, label: 'Pesos de hoy' },
                  ].map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      aria-pressed={real === o.v}
                      onClick={() => setReal(o.v)}
                      className="cursor-pointer border-0 px-[10px] py-[5px] text-[11.5px] font-extrabold"
                      style={{
                        fontFamily: 'var(--font-heading)',
                        background: real === o.v ? INK : 'transparent',
                        color: real === o.v ? BG : INK,
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </figcaption>
              <GrowthChart rows={res.rows} p={p} real={real} />
              <div className="flex flex-wrap gap-[14px]">
                {SERIES.map((s) => (
                  <span key={s.key} className="flex items-center gap-[6px] text-[11.5px] font-semibold">
                    <span aria-hidden="true" className="block h-[3px] w-[14px]" style={{ background: s.color }} />
                    {s.label}
                  </span>
                ))}
                {p.meta > 0 && !real ? (
                  <span className="flex items-center gap-[6px] text-[11.5px] font-semibold">
                    <span aria-hidden="true" className="block h-0 w-[14px] border-t-2 border-dashed" style={{ borderColor: INK }} />
                    Meta
                  </span>
                ) : null}
              </div>
            </figure>
          </section>

          {/* ── Tarjetas ─────────────────────────────────────────── */}
          <section className={`${panel} flex-[1_1_100%]`} style={panelEdge}>
            <h6 className="mt-0 mb-[12px]">Resultados</h6>
            <div
              className="grid gap-[2px] bg-[var(--color-divider)]"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}
            >
              {metrics.map((m) => (
                <ResultCard key={m.label} metric={m} />
              ))}
            </div>
          </section>

          {/* ── ¿Y si…? ──────────────────────────────────────────── */}
          <section className={`${panel} flex-[1_1_100%]`} style={panelEdge}>
            <h6 className="mt-0 mb-[12px]">¿Y si…?</h6>
            <div
              className="grid gap-[2px] bg-[var(--color-divider)]"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
            >
              {insights.map((it) => (
                <div key={it.title} className="flex flex-col gap-[3px] bg-[var(--color-bg)] px-[14px] py-[12px]">
                  <span className="text-[12px] font-semibold">{it.title}</span>
                  <span
                    className="text-[21px] leading-[1.1] font-extrabold tracking-[-0.02em]"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      color: it.positive ? INK : 'var(--color-accent-700)',
                    }}
                  >
                    {it.value}
                  </span>
                  <span className="text-[11px] text-[var(--color-neutral-700)]">{it.note}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Tabla y acciones ─────────────────────────────────── */}
          <section className={`${panel} flex min-w-0 flex-[1_1_100%] flex-col gap-[12px]`} style={panelEdge}>
            <div className="flex flex-wrap items-center justify-between gap-[10px]">
              <h6 className="m-0">Tabla de proyección</h6>
              <div className="flex flex-wrap gap-[8px]">
                <Button type="button" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable}>
                  {showTable ? 'Ocultar tabla' : 'Ver tabla anual'}
                </Button>
                <Button type="button" onClick={downloadCsv}>
                  Descargar CSV
                </Button>
                <Button type="button" variant="solid" onClick={copyLink}>
                  {copied ? '¡Enlace copiado!' : 'Copiar enlace del plan'}
                </Button>
              </div>
            </div>

            {showTable ? (
              <div className="max-h-[420px] overflow-auto border border-[#d7d3d3]">
                <table className="w-full border-collapse text-[12.5px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <thead className="sticky top-0 bg-[var(--color-text)] text-[var(--color-bg)]">
                    <tr>
                      {['Año', 'Aporte mensual', 'Depositado', 'Interés del año', 'Total aportado', 'Saldo', 'Pesos de hoy'].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-[10px] py-[8px] text-right text-[10.5px] font-extrabold tracking-[0.06em] whitespace-nowrap uppercase first:text-left"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {res.rows.slice(1).map((r) => (
                      <tr key={r.year} className="border-b border-[var(--color-neutral-300)] even:bg-[var(--color-neutral-200)]">
                        <td className="px-[10px] py-[6px] font-extrabold">{fmt(r.year, r.year % 1 ? 1 : 0)}</td>
                        <td className="px-[10px] py-[6px] text-right whitespace-nowrap">{money(r.monthly)}</td>
                        <td className="px-[10px] py-[6px] text-right whitespace-nowrap">{money(r.deposits)}</td>
                        <td className="px-[10px] py-[6px] text-right whitespace-nowrap text-[var(--color-accent-700)]">
                          {money(r.interest)}
                        </td>
                        <td className="px-[10px] py-[6px] text-right whitespace-nowrap">{money(r.contributed)}</td>
                        <td className="px-[10px] py-[6px] text-right font-extrabold whitespace-nowrap">{money(r.balance)}</td>
                        <td className="px-[10px] py-[6px] text-right whitespace-nowrap">{money(r.real)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted m-0 text-[12px]">
                Despliegue la tabla para ver cuánto deposita y cuánto interés gana cada año, o
                descárguela para abrirla en una hoja de cálculo.
              </p>
            )}
          </section>
        </div>
      </TabsContent>

      <TabsContent value="doc">
        <ExplainPanel simId={SAVINGS_MODULE.id} />
      </TabsContent>
    </Tabs>
  )
}

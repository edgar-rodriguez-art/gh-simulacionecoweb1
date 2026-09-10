import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ParamSlider } from '@/components/ParamSlider'
import { ResultCard } from '@/components/ResultCard'
import { ChartFrame } from '@/components/ChartFrame'
import { ExplainPanel } from '@/components/ExplainPanel'
import { DEFAULT_SEED } from '@/lib/stats'
import type { SimAction, Simulator } from '@/lib/sims/types'

const INK = '#201e1d'
const BG = '#f3f2f2'

const panel = 'bg-[var(--color-bg)] p-[18px]'
const panelEdge = { boxShadow: '0 0 0 1px var(--color-divider)' }

type AnyParams = Record<string, number>

/**
 * Encabezado del módulo + pestañas Simulador/Explicación + rejilla de paneles
 * (parámetros · gráficos · fila completa de resultados).
 *
 * Los parámetros viven en el query string, así que un escenario concreto se
 * comparte con solo copiar la URL. El estado sigue siendo local a la página.
 */
export function SimLayout<P extends AnyParams>({ sim }: { sim: Simulator<P> }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [week, setWeek] = useState(8)

  const tab = searchParams.get('tab') === 'doc' ? 'doc' : 'sim'

  // Defaults del simulador sobreescritos por lo que venga en la URL.
  const params = useMemo(() => {
    const out: AnyParams = { ...sim.defaults }
    for (const spec of sim.params) {
      const raw = searchParams.get(spec.key)
      if (raw === null) continue
      const v = Number(raw)
      if (Number.isFinite(v)) out[spec.key] = Math.min(spec.max, Math.max(spec.min, v))
    }
    return out
  }, [sim, searchParams])

  const setParam = useCallback(
    (key: string, v: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (v === sim.defaults[key]) next.delete(key)
          else next.set(key, String(v))
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams, sim.defaults],
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

  // Una sola corrida de la simulación por cambio de parámetros o de semana.
  const result = useMemo(
    () => sim.run(params as P, { seed: DEFAULT_SEED, week }),
    [sim, params, week],
  )

  const runAction = useCallback((a: SimAction) => {
    if (a.kind === 'week+1') setWeek((w) => Math.min(60, w + 1))
    else if (a.kind === 'week+5') setWeek((w) => Math.min(60, w + 5))
    else if (a.kind === 'week=40') setWeek(40)
    else setWeek(8)
  }, [])

  const actions = result.actions ?? []

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-[20px]">
      <div className="flex flex-col gap-[18px]">
        <header className="flex flex-wrap items-end justify-between gap-[16px]">
          <div className="min-w-0 flex-[1_1_380px]">
            <div className="text-[11px] font-extrabold tracking-[0.1em] text-[var(--color-accent-700)] uppercase">
              Módulo {sim.num} · {sim.area}
            </div>
            <h1 className="my-[4px] mb-[6px] text-[clamp(26px,3.4vw,40px)]">{sim.title}</h1>
            <p className="m-0 max-w-[70ch] text-[14.5px] text-pretty">{sim.blurb}</p>
          </div>

          <TabsList>
            <TabsTrigger
              value="sim"
              style={{
                background: tab === 'sim' ? INK : 'transparent',
                color: tab === 'sim' ? BG : INK,
              }}
            >
              Simulador
            </TabsTrigger>
            <TabsTrigger
              value="doc"
              style={{
                background: tab === 'doc' ? INK : 'transparent',
                color: tab === 'doc' ? BG : INK,
              }}
            >
              Explicación
            </TabsTrigger>
          </TabsList>
        </header>
        <div className="h-[2px] bg-[var(--color-divider)]" />
      </div>

      <TabsContent value="sim">
        <div
          className="flex flex-wrap gap-[2px] bg-[var(--color-bg)]"
          style={{ border: '2px solid var(--color-divider)' }}
        >
          <section className={`${panel} min-w-[240px] flex-[1_1_280px]`} style={panelEdge}>
            <h6 className="mt-0 mb-[4px]">Parámetros</h6>
            <p className="text-muted mt-0 mb-[6px] text-[11.5px]">
              Arrastre para recalcular en vivo.
            </p>

            {sim.params.map((spec) => (
              <ParamSlider
                key={spec.key}
                spec={spec}
                value={params[spec.key]}
                onChange={(v) => setParam(spec.key, v)}
              />
            ))}

            {actions.length > 0 ? (
              <div
                className="mt-[8px] flex flex-wrap gap-[8px] pt-[14px]"
                style={{ borderTop: '2px solid var(--color-divider)' }}
              >
                {actions.map((a) => (
                  <Button key={a.kind} type="button" onClick={() => runAction(a)}>
                    {a.label}
                  </Button>
                ))}
              </div>
            ) : null}
          </section>

          <section
            className={`${panel} flex min-w-0 flex-[1_1_420px] flex-col gap-[14px]`}
            style={panelEdge}
          >
            <ChartFrame spec={result.chart} />
            {result.chart2 ? (
              <div
                className="flex flex-col gap-[8px] pt-[10px]"
                style={{ borderTop: '1px solid var(--color-neutral-300)' }}
              >
                <ChartFrame spec={result.chart2} />
              </div>
            ) : null}
          </section>

          <section className={`${panel} flex-[1_1_100%]`} style={panelEdge}>
            <h6 className="mt-0 mb-[12px]">Resultados</h6>
            <div
              className="grid gap-[2px] bg-[var(--color-divider)]"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}
            >
              {result.metrics.map((m) => (
                <ResultCard key={m.label} metric={m} />
              ))}
            </div>
          </section>
        </div>
      </TabsContent>

      <TabsContent value="doc">
        <ExplainPanel simId={sim.id} />
      </TabsContent>
    </Tabs>
  )
}

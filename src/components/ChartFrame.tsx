import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { fmt } from '@/lib/format'
import { INK, type ChartSpec } from '@/lib/sims/types'

const GRID = '#d7d3d3'
const AXIS_TEXT = '#605d5d'

/** Mismo redondeo de ticks que el prototipo. */
function tick(n: number): string {
  if (!isFinite(n)) return '∞'
  return Math.abs(n) >= 10 ? fmt(n, 0) : fmt(n, 1)
}

const axisTick = { fontSize: 11, fill: AXIS_TEXT }
const axisLabelStyle = {
  fontSize: 11,
  fontWeight: 800,
  fill: INK,
  letterSpacing: '0.06em',
}

/**
 * Título · nota · gráfico en ResponsiveContainer (aspect 800/340) · leyenda
 * propia debajo con barras de 14×3 px. Sin curvas suavizadas, sin puntos por
 * dato, rejilla horizontal de 1 px y eje base tinta de 2 px.
 */
export function ChartFrame({ spec, headingLevel = 'h6' }: { spec: ChartSpec; headingLevel?: 'h6' }) {
  const Heading = headingLevel
  // En las barras el color ya está identificado por la etiqueta del eje X, así
  // que sólo llevan leyenda si el módulo la declara explícitamente.
  const legend =
    spec.legend ?? (spec.kind === 'bar' ? [] : spec.series.filter((s) => !s.hideFromLegend))

  return (
    <figure className="m-0 flex flex-col gap-[10px]">
      <figcaption className="flex flex-col gap-[2px]">
        <Heading className="m-0">{spec.title}</Heading>
        {spec.note ? <div className="text-muted text-[11.5px]">{spec.note}</div> : null}
      </figcaption>

      <div className="w-full border border-[#d7d3d3] bg-[var(--color-bg)]">
        <ResponsiveContainer width="100%" aspect={800 / 340}>
          {spec.kind === 'bar' ? renderBar(spec) : renderLine(spec)}
        </ResponsiveContainer>
      </div>

      {legend.length > 0 ? (
        <div className="flex flex-wrap gap-[14px]">
          {legend.map((l) => (
            <span
              key={l.label}
              className="flex items-center gap-[6px] text-[11.5px] font-semibold"
            >
              <span
                aria-hidden="true"
                className="block h-[3px] w-[14px]"
                style={{ background: l.color }}
              />
              {l.label}
            </span>
          ))}
        </div>
      ) : null}
    </figure>
  )
}

function renderLine(spec: ChartSpec) {
  const xTick = spec.xTick ?? tick
  const yTick = spec.yTick ?? tick

  return (
    <ComposedChart data={spec.data} margin={{ top: 16, right: 18, bottom: 30, left: 14 }}>
      <CartesianGrid stroke={GRID} strokeWidth={1} vertical={false} />
      <XAxis
        type="number"
        dataKey="x"
        domain={spec.xDomain ?? ['dataMin', 'dataMax']}
        allowDataOverflow
        tickFormatter={xTick}
        tick={axisTick}
        tickLine={false}
        stroke={INK}
        strokeWidth={2}
        label={{
          value: spec.xLabel.toUpperCase(),
          position: 'insideBottom',
          offset: -20,
          style: axisLabelStyle,
        }}
      />
      <YAxis
        type="number"
        domain={spec.yDomain ?? ['auto', 'auto']}
        allowDataOverflow={!!spec.yDomain}
        tickFormatter={yTick}
        tick={axisTick}
        tickLine={false}
        stroke={INK}
        strokeWidth={2}
        width={68}
        label={{
          value: spec.yLabel.toUpperCase(),
          angle: -90,
          position: 'insideLeft',
          style: { ...axisLabelStyle, textAnchor: 'middle' },
        }}
      />

      {spec.series.map((s) =>
        s.area ? (
          <Area
            key={s.key}
            type="linear"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={s.width ?? 1.5}
            fill={s.color}
            fillOpacity={0.16}
            dot={false}
            activeDot={false}
            connectNulls
            isAnimationActive={false}
          />
        ) : (
          <Line
            key={s.key}
            type="linear"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={s.width ?? 2.5}
            strokeDasharray={s.dashed ? '6 4' : undefined}
            dot={false}
            activeDot={false}
            connectNulls
            isAnimationActive={false}
          />
        ),
      )}

      {(spec.refLines ?? []).map((h, i) => (
        <ReferenceLine
          key={'h' + i}
          y={h.y}
          stroke={h.color}
          strokeWidth={1.5}
          strokeDasharray="5 4"
          ifOverflow="extendDomain"
          label={{
            value: h.label,
            position: 'insideTopRight',
            // Offset negativo: la etiqueta se apoya encima de la línea, como
            // en el prototipo, en vez de cruzarla.
            offset: -14,
            fill: h.color,
            fontSize: 11,
            fontWeight: 700,
          }}
        />
      ))}

      {(spec.refDots ?? []).map((d, i) => (
        <ReferenceDot
          key={'d' + i}
          x={d.x}
          y={d.y}
          r={5}
          fill={d.color}
          stroke="none"
          ifOverflow="hidden"
        />
      ))}
    </ComposedChart>
  )
}

function renderBar(spec: ChartSpec) {
  const key = spec.series[0]?.key ?? 'v'
  const yTick = spec.yTick ?? tick

  return (
    <BarChart data={spec.data} margin={{ top: 26, right: 18, bottom: 30, left: 14 }}>
      <CartesianGrid stroke={GRID} strokeWidth={1} vertical={false} />
      <XAxis
        dataKey="name"
        tick={{ fontSize: 11.5, fill: INK, fontWeight: 600 }}
        tickLine={false}
        stroke={INK}
        strokeWidth={2}
        interval={0}
        label={{
          value: spec.xLabel.toUpperCase(),
          position: 'insideBottom',
          offset: -20,
          style: axisLabelStyle,
        }}
      />
      <YAxis
        type="number"
        domain={spec.yDomain ?? [0, 'auto']}
        tickFormatter={yTick}
        tick={axisTick}
        tickLine={false}
        stroke={INK}
        strokeWidth={2}
        width={68}
        label={{
          value: spec.yLabel.toUpperCase(),
          angle: -90,
          position: 'insideLeft',
          style: { ...axisLabelStyle, textAnchor: 'middle' },
        }}
      />
      <Bar dataKey={key} isAnimationActive={false} maxBarSize={110}>
        {spec.data.map((row, i) => (
          <Cell key={i} fill={(row.color as string) ?? INK} />
        ))}
        <LabelList
          dataKey="note"
          position="top"
          style={{ fontSize: 12, fontWeight: 800, fill: INK }}
        />
      </Bar>

      {(spec.refLines ?? []).map((h, i) => (
        <ReferenceLine
          key={'h' + i}
          y={h.y}
          stroke={h.color}
          strokeWidth={1.5}
          strokeDasharray="5 4"
          ifOverflow="extendDomain"
          label={{
            value: h.label,
            position: 'insideTopRight',
            // Offset negativo: la etiqueta se apoya encima de la línea, como
            // en el prototipo, en vez de cruzarla.
            offset: -14,
            fill: h.color,
            fontSize: 11,
            fontWeight: 700,
          }}
        />
      ))}
    </BarChart>
  )
}

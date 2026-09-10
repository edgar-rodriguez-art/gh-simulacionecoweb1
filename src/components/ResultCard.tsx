import type { Metric } from '@/lib/sims/types'

/** Etiqueta versalita 10.5 px · valor Archivo 800 a 23 px · nota de 11 px. */
export function ResultCard({ metric }: { metric: Metric }) {
  return (
    <div
      data-testid="result-card"
      className="flex flex-col gap-[3px] bg-[var(--color-bg)] px-[14px] py-[12px]"
    >
      <span className="text-[10.5px] font-extrabold tracking-[0.07em] text-[var(--color-neutral-700)] uppercase">
        {metric.label}
      </span>
      <span
        className="text-[23px] leading-[1.05] font-extrabold tracking-[-0.02em]"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {metric.value}
      </span>
      <span className="text-[11px] leading-[1.35] text-[var(--color-neutral-700)]">
        {metric.note}
      </span>
    </div>
  )
}

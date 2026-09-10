import { fmt } from '@/lib/format'
import { Slider } from '@/components/ui/slider'
import type { ParamSpec } from '@/lib/sims/types'

type Props = {
  spec: ParamSpec<string>
  value: number
  onChange: (v: number) => void
}

/**
 * Etiqueta con símbolo · valor formateado a la derecha en rojo ·
 * slider · texto de ayuda de una línea. `aria-label` = etiqueta completa.
 */
export function ParamSlider({ spec, value, onChange }: Props) {
  const display = spec.format ? spec.format(value) : fmt(value, spec.step < 1 ? 2 : 0)

  return (
    <div className="flex flex-col gap-[5px] border-t border-[var(--color-neutral-300)] py-[10px]">
      <div className="flex items-baseline justify-between gap-[10px]">
        <span className="text-[12.5px] leading-[1.25] font-semibold">{spec.label}</span>
        <span
          className="text-[13.5px] font-extrabold whitespace-nowrap text-[var(--color-accent-700)]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {display}
        </span>
      </div>
      <Slider
        aria-label={spec.label}
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        className="my-[6px]"
      />
      <div className="text-[11px] leading-[1.4] text-[var(--color-neutral-700)]">{spec.help}</div>
    </div>
  )
}

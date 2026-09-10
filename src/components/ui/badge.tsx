import * as React from 'react'
import { cn } from '@/lib/utils'

/** Etiqueta de área: versalitas de 10 px dentro de un recuadro de 1 px. */
export function Badge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex items-center rounded-none border border-[var(--color-divider)] px-[6px] py-[2px] text-[10px] font-extrabold tracking-[0.08em] uppercase',
        className,
      )}
      {...props}
    />
  )
}

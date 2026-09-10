import * as React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { cn } from '@/lib/utils'

/** Regla de 2 px sobre el color divisor — el separador del sistema. */
export function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-[var(--color-divider)]',
        orientation === 'horizontal' ? 'h-[2px] w-full' : 'h-full w-[2px]',
        className,
      )}
      {...props}
    />
  )
}

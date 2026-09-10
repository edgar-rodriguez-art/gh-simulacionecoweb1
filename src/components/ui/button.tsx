import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Botón shadcn/ui. Radio 0, tipografía Archivo 800 y etiqueta alineada a la
 * izquierda — las tres reglas del sistema Modernist.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-start gap-[6px] rounded-none text-left font-extrabold transition-colors disabled:pointer-events-none disabled:opacity-45 [font-family:var(--font-heading)]",
  {
    variants: {
      variant: {
        outline:
          'border-2 border-[var(--color-text)] bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-text)] hover:text-[var(--color-bg)]',
        solid:
          'border-2 border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)] hover:bg-[var(--color-accent-700)] hover:border-[var(--color-accent-700)]',
        ghost:
          'border-0 bg-transparent text-[var(--color-text)] hover:bg-[var(--color-neutral-200)]',
      },
      size: {
        sm: 'px-3 py-[7px] text-[12.5px]',
        md: 'px-4 py-[9px] text-[13px]',
      },
    },
    defaultVariants: { variant: 'outline', size: 'sm' },
  },
)

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { buttonVariants }

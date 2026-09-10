import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

/**
 * Slider shadcn/ui sobre Radix, retunado al sistema Modernist:
 * pista de 4 px, pulgar cuadrado (radio 0) con borde tinta de 2 px.
 */
export function Slider({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-[4px] w-full grow overflow-hidden"
        style={{ background: 'var(--color-neutral-300)' }}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full"
          style={{ background: 'var(--color-accent)' }}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className="block size-[15px] shrink-0 cursor-grab transition-[background] active:cursor-grabbing"
        style={{
          background: 'var(--color-bg)',
          border: '2px solid var(--color-text)',
          borderRadius: 0,
        }}
      />
    </SliderPrimitive.Root>
  )
}

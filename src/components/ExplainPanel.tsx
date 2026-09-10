import { EXPLAIN } from '@/content/explain'

/** Artículo de la pestaña "Explicación". Ancho máximo 80ch. */
export function ExplainPanel({ simId }: { simId: string }) {
  const body = EXPLAIN[simId]

  return (
    <article className="flex max-w-[80ch] flex-col gap-[8px] text-[14.5px] leading-[1.6]">
      {body}
      <div className="mt-[8px] h-[2px] bg-[var(--color-divider)]" />
      <p className="text-muted text-[12px]">
        Los modelos son deliberadamente simples y didácticos: supuestos de linealidad, normalidad y
        estacionariedad. Sirven para entender la dirección y la magnitud aproximada de un efecto, no
        para sustituir un estudio con datos propios.
      </p>
    </article>
  )
}

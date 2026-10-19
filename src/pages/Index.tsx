import { Link } from 'react-router-dom'
import { MODULES } from '@/content/modules'
import { Badge } from '@/components/ui/badge'

/** Portada: nueve tarjetas, una por módulo. */
export default function Index() {
  return (
    <div className="flex flex-col gap-[24px]">
      <header className="flex max-w-[780px] flex-col gap-[8px]">
        <div className="text-[11px] font-extrabold tracking-[0.1em] text-[var(--color-accent-700)] uppercase">
          Nueve módulos · uso libre
        </div>
        <h1 className="m-0 text-[clamp(32px,4vw,46px)]">
          Ver el efecto antes de tomar la decisión
        </h1>
        <p className="max-w-[62ch] text-[16px] text-pretty">
          Ocho simulaciones interactivas de conceptos económicos, financieros, de inventarios,
          cadena de suministro y colas, más una calculadora para planear su propio ahorro. Mueva un parámetro y observe qué se mueve con él: precio de
          equilibrio, costo total, faltantes, amplificación de pedidos, tiempo de espera. Cada
          módulo trae una pestaña de explicación con fórmulas, significado de parámetros y uso en el
          negocio.
        </p>
      </header>

      <div className="h-[2px] bg-[var(--color-divider)]" />

      <div
        className="grid gap-[2px] bg-[var(--color-divider)]"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
      >
        {MODULES.map((m) => (
          <Link
            key={m.id}
            to={m.route}
            className="flex min-h-[184px] flex-col gap-[8px] bg-[var(--color-bg)] p-[18px] text-left text-[var(--color-text)] no-underline hover:bg-[var(--color-neutral-200)]"
          >
            <div className="flex w-full items-baseline justify-between">
              <span
                className="text-[26px] font-extrabold text-[var(--color-accent)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {m.num}
              </span>
              <Badge>{m.area}</Badge>
            </div>
            <div
              className="text-[19px] leading-[1.1] font-extrabold tracking-[-0.01em]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {m.title}
            </div>
            <div className="text-[12.5px] leading-[1.45] text-[var(--color-neutral-700)] text-pretty">
              {m.blurb}
            </div>
            <div className="mt-auto text-[11px] font-extrabold tracking-[0.06em] text-[var(--color-accent-700)] uppercase">
              Abrir simulador →
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

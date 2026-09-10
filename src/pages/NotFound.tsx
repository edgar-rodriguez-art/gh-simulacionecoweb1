import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex max-w-[62ch] flex-col gap-[8px]">
      <div className="text-[11px] font-extrabold tracking-[0.1em] text-[var(--color-accent-700)] uppercase">
        Error 404
      </div>
      <h1 className="m-0 text-[clamp(28px,3.4vw,42px)]">Esa ruta no existe</h1>
      <p className="text-[15px]">
        El laboratorio tiene ocho módulos. Vuelva al índice general y elija uno.
      </p>
      <Link to="/" className="text-[13px] font-extrabold tracking-[0.06em] uppercase">
        Ir al índice general →
      </Link>
    </div>
  )
}

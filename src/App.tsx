import { Suspense, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { MODULES } from '@/content/modules'

type NavEntry = { route: string; num: string; label: string }

const NAV: NavEntry[] = [
  { route: '/', num: '—', label: 'Índice general' },
  ...MODULES.map((m) => ({ route: m.route, num: m.num, label: m.title })),
]

/**
 * Shell de la aplicación: sidebar fija de 250 px con el índice y los ocho
 * módulos numerados, y el módulo activo en <Outlet/>. Por debajo de 700 px la
 * sidebar se convierte en un menú superior plegable.
 */
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-wrap items-stretch bg-[var(--color-bg)] text-[var(--color-text)]">
      <aside
        className={[
          'flex flex-[0_0_250px] flex-col gap-[18px] pt-[20px] pb-[40px]',
          'min-w-[210px] border-r-2 border-[var(--color-divider)]',
          'max-[700px]:flex-[1_1_100%] max-[700px]:border-r-0 max-[700px]:border-b-2 max-[700px]:pb-[12px]',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-[12px] px-[18px]">
          <div>
            <div className="text-[11px] font-extrabold tracking-[0.1em] text-[var(--color-accent-700)] uppercase">
              Laboratorio
            </div>
            <div
              className="mt-[4px] text-[22px] leading-[1.05] font-extrabold tracking-[-0.02em]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Simuladores de
              <br />
              economía y
              <br />
              operaciones
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="menu-modulos"
            className="hidden cursor-pointer border-2 border-[var(--color-text)] bg-[var(--color-bg)] px-[12px] py-[7px] text-[12.5px] font-extrabold max-[700px]:block"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {menuOpen ? 'Cerrar' : 'Módulos'}
          </button>
        </div>

        <div className="h-[2px] bg-[var(--color-divider)] max-[700px]:hidden" />

        <nav
          id="menu-modulos"
          aria-label="Módulos"
          className={[
            'flex flex-col',
            menuOpen ? 'max-[700px]:flex' : 'max-[700px]:hidden',
          ].join(' ')}
        >
          {NAV.map((it) => {
            const active = pathname === it.route
            return (
              <NavLink
                key={it.route}
                to={it.route}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex items-baseline gap-[10px] border-b border-[var(--color-neutral-300)]',
                  'px-[18px] py-[11px] text-[13.5px] leading-[1.25] no-underline',
                  active
                    ? 'bg-[#201e1d] text-[#f3f2f2]'
                    : 'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-neutral-200)]',
                ].join(' ')}
              >
                <span className="min-w-[18px] text-[11px] font-extrabold opacity-75">{it.num}</span>
                <span className="font-semibold">{it.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="text-muted px-[18px] text-[11px] leading-[1.5] max-[700px]:hidden">
          Cada módulo corre con matemática real. Los parámetros se ajustan en vivo y los resultados
          se recalculan al instante.
        </div>
      </aside>

      <main className="flex min-w-0 flex-[1_1_520px] flex-col gap-[20px] px-[28px] pt-[26px] pb-[60px] max-[560px]:px-[16px]">
        <Suspense
          fallback={
            <p className="text-muted m-0 text-[13px]" role="status">
              Cargando el módulo…
            </p>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

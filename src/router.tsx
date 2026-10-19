import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import App from '@/App'
import Index from '@/pages/Index'
import NotFound from '@/pages/NotFound'

/*
 * Los nueve módulos se cargan bajo demanda: la portada no necesita
 * Recharts, así que el primer render entra con una fracción del bundle.
 */
const OfertaDemanda = lazy(() => import('@/pages/OfertaDemanda'))
const InteresCompuesto = lazy(() => import('@/pages/InteresCompuesto'))
const Eoq = lazy(() => import('@/pages/Eoq'))
const PuntoReorden = lazy(() => import('@/pages/PuntoReorden'))
const Revision = lazy(() => import('@/pages/Revision'))
const EfectoLatigo = lazy(() => import('@/pages/EfectoLatigo'))
const BeerGame = lazy(() => import('@/pages/BeerGame'))
const Colas = lazy(() => import('@/pages/Colas'))
const CalculadoraAhorro = lazy(() => import('@/pages/CalculadoraAhorro'))

/**
 * React Router en modo librería (sin SSR). Una ruta por simulador para poder
 * compartir enlaces directos; el basename lo fija Vite según dónde se publique.
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <Index /> },
        { path: 'oferta-demanda', element: <OfertaDemanda /> },
        { path: 'interes-compuesto', element: <InteresCompuesto /> },
        { path: 'eoq', element: <Eoq /> },
        { path: 'punto-reorden', element: <PuntoReorden /> },
        { path: 'revision', element: <Revision /> },
        { path: 'efecto-latigo', element: <EfectoLatigo /> },
        { path: 'beer-game', element: <BeerGame /> },
        { path: 'colas', element: <Colas /> },
        { path: 'calculadora-ahorro', element: <CalculadoraAhorro /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)

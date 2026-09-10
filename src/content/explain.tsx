import type { ReactNode } from 'react'

/**
 * Contenido de la pestaña "Explicación", migrado literal desde el prototipo
 * `Simuladores Económicos.dc.html`. Cinco bloques fijos por módulo:
 * qué hace · fórmulas · parámetros · efectos · utilidad en los negocios.
 */

function Formula({ children }: { children: ReactNode }) {
  return (
    <p
      className="bg-[var(--color-surface)] p-[12px] font-semibold"
      style={{ fontFamily: 'var(--font-heading)', borderLeft: '3px solid var(--color-accent)' }}
    >
      {children}
    </p>
  )
}

export const EXPLAIN: Record<string, ReactNode> = {
  'oferta-demanda': (
    <>
      <h3>¿Qué hace esta simulación?</h3>
      <p>
        Construye un mercado de un solo bien con una curva de demanda descendente y una curva de
        oferta ascendente, y encuentra el punto donde ambas se cruzan: el precio y la cantidad de
        equilibrio. Al mover cualquier parámetro —o al aplicar un impuesto por unidad— el cruce se
        desplaza y se puede leer quién absorbe el cambio.
      </p>
      <h4>Fórmulas</h4>
      <Formula>
        Qd = a − b·P &nbsp;·&nbsp; Qs = c + d·(P − t)
        <br />
        P* = (a − c + d·t) / (b + d) &nbsp;·&nbsp; Q* = a − b·P*
        <br />
        Excedente del consumidor = ½ · Q* · (a/b − P*)
      </Formula>
      <h4>Parámetros</h4>
      <ul>
        <li>
          <strong>a — demanda máxima:</strong> cuánto se compraría si el precio fuera cero. Sube con
          el ingreso, la moda o la publicidad.
        </li>
        <li>
          <strong>b — sensibilidad de la demanda al precio:</strong> unidades que se pierden por
          cada peso de aumento. Alta en productos con sustitutos.
        </li>
        <li>
          <strong>c — oferta autónoma:</strong> cantidad que se produciría incluso a precio muy bajo
          (capacidad ya instalada).
        </li>
        <li>
          <strong>d — sensibilidad de la oferta:</strong> qué tan rápido reaccionan los productores
          a un mejor precio.
        </li>
        <li>
          <strong>t — impuesto por unidad:</strong> costo que se agrega al productor; desplaza la
          oferta hacia arriba.
        </li>
      </ul>
      <h4>Efectos que se observan</h4>
      <p>
        Con demanda rígida (b bajo), el impuesto lo paga casi todo el consumidor vía precio; con
        demanda elástica, lo absorbe el productor y la cantidad cae más. Un aumento de <em>a</em>{' '}
        sube precio y cantidad a la vez; un aumento de <em>d</em> baja el precio de equilibrio.
      </p>
      <h4>Utilidad en los negocios</h4>
      <p>
        Sirve para decidir precios y anticipar el efecto de un cambio de costos, de un impuesto o de
        la entrada de un competidor: si su demanda es elástica, trasladar costos al precio destruye
        volumen; si es rígida, hay margen para subir. También explica por qué una promoción agresiva
        puede mover más volumen que utilidad.
      </p>
    </>
  ),

  'interes-compuesto': (
    <>
      <h3>¿Qué hace esta simulación?</h3>
      <p>
        Proyecta mes a mes un capital con aportaciones periódicas, capitalización compuesta e
        inflación, separando cuánto del saldo final es dinero aportado y cuánto es interés generado.
        La curva real muestra el mismo saldo medido en poder de compra de hoy.
      </p>
      <h4>Fórmulas</h4>
      <Formula>
        FV = P₀·(1 + r/m)^(m·n) + A · [((1 + i_m)^N − 1) / i_m]
        <br />
        TEA = (1 + r/m)^m − 1
        <br />
        Saldo real = FV / (1 + infl)^n &nbsp;·&nbsp; Regla del 72: años ≈ 72 / r%
      </Formula>
      <h4>Parámetros</h4>
      <ul>
        <li>
          <strong>P₀ — capital inicial:</strong> el punto de partida; su efecto crece
          exponencialmente con el plazo.
        </li>
        <li>
          <strong>A — aporte mensual:</strong> disciplina de ahorro; domina el resultado en plazos
          cortos.
        </li>
        <li>
          <strong>r — tasa nominal anual:</strong> rendimiento antes de capitalizar y antes de
          inflación.
        </li>
        <li>
          <strong>m — capitalizaciones por año:</strong> cuántas veces al año se convierte el
          interés en capital; más capitalizaciones elevan la tasa efectiva.
        </li>
        <li>
          <strong>n — plazo en años:</strong> la variable más poderosa: el interés compuesto es no
          lineal en el tiempo.
        </li>
        <li>
          <strong>Inflación:</strong> descuenta el resultado a valor de hoy; una tasa nominal alta
          con inflación mayor destruye valor.
        </li>
      </ul>
      <h4>Efectos que se observan</h4>
      <p>
        Los primeros años la curva parece lineal porque el aporte pesa más que el interés; después
        el interés sobre interés se despega. Duplicar el plazo produce mucho más que duplicar el
        aporte. Con inflación cercana a la tasa, la curva real se aplana: hay ganancia nominal pero
        no de poder de compra.
      </p>
      <h4>Utilidad en los negocios</h4>
      <p>
        Es la base del valor del dinero en el tiempo: evaluar arrendar vs. comprar, comparar
        créditos con distinta capitalización, fijar tasas de descuento para un VPN, dimensionar un
        fondo de reposición de equipo o un plan de retiro. También muestra el costo real de
        financiar capital de trabajo con tarjeta o factoraje.
      </p>
    </>
  ),

  eoq: (
    <>
      <h3>¿Qué hace esta simulación?</h3>
      <p>
        Calcula el tamaño de pedido que minimiza el costo total de un inventario, sumando dos costos
        que se mueven en direcciones opuestas: pedir seguido cuesta en fletes y gestión; pedir mucho
        de golpe cuesta en almacenaje, capital y obsolescencia. La gráfica de costos permite
        comparar el lote que hoy se usa contra el lote óptimo.
      </p>
      <h4>Fórmulas</h4>
      <Formula>
        EOQ = √(2·D·S / H)
        <br />
        Costo total = (D/Q)·S + (Q/2)·H
        <br />
        Pedidos por año = D/Q &nbsp;·&nbsp; Ciclo = 365 / (D/Q)
      </Formula>
      <h4>Parámetros</h4>
      <ul>
        <li>
          <strong>D — demanda anual:</strong> unidades que se venderán en el año.
        </li>
        <li>
          <strong>S — costo por pedido:</strong> todo lo que cuesta colocar y recibir una orden, sin
          importar su tamaño (flete, inspección, papeleo).
        </li>
        <li>
          <strong>H — costo de mantener una unidad un año:</strong> almacén, seguro, merma y sobre
          todo el costo del capital inmovilizado.
        </li>
        <li>
          <strong>Q — lote actual:</strong> el tamaño que se pide hoy, para medir la penalización de
          no estar en el óptimo.
        </li>
      </ul>
      <h4>Efectos que se observan</h4>
      <p>
        La curva de costo total es muy plana alrededor del óptimo: equivocarse 20 % en el lote cuesta
        poco, lo que da libertad para redondear a empaque o camión completo. Si el costo de pedir
        baja (compras digitales), el óptimo se hace pequeño y frecuente; si sube el costo de
        capital, conviene pedir menos y más seguido.
      </p>
      <h4>Utilidad en los negocios</h4>
      <p>
        Define políticas de compra y de producción por lotes, sustenta negociaciones de mínimos con
        proveedores y justifica inversiones que reducen el costo de pedir o de preparar máquina —el
        argumento central detrás de lotes pequeños y flujo continuo.
      </p>
    </>
  ),

  'punto-reorden': (
    <>
      <h3>¿Qué hace esta simulación?</h3>
      <p>
        Simula día por día un inventario con demanda aleatoria y un tiempo de entrega fijo, y lanza
        un pedido cuando el nivel toca el punto de reorden. Se ve el patrón de diente de sierra, el
        colchón de seguridad y los momentos en que la demanda se come el colchón y aparece el
        faltante.
      </p>
      <h4>Fórmulas</h4>
      <Formula>
        Punto de reorden = d̄·L + z·σ_d·√L
        <br />
        Inventario de seguridad = z·σ_d·√L
        <br />
        Nivel de servicio → z (95 % ≈ 1.645 · 99 % ≈ 2.326)
      </Formula>
      <h4>Parámetros</h4>
      <ul>
        <li>
          <strong>d̄ — demanda diaria promedio.</strong>
        </li>
        <li>
          <strong>σ_d — desviación estándar de la demanda diaria:</strong> la incertidumbre, no el
          volumen; es la que obliga a tener colchón.
        </li>
        <li>
          <strong>L — tiempo de entrega (días):</strong> el riesgo crece con √L, así que acortar la
          entrega baja el inventario más de lo que la intuición sugiere.
        </li>
        <li>
          <strong>Nivel de servicio:</strong> probabilidad de no quedarse sin producto durante la
          entrega; fija z.
        </li>
      </ul>
      <h4>Efectos que se observan</h4>
      <p>
        Pasar de 95 % a 99.5 % de servicio cuesta un colchón desproporcionado: el último punto de
        servicio es el más caro. Duplicar el tiempo de entrega no duplica el colchón (crece con la
        raíz), pero duplicar la variabilidad sí lo duplica.
      </p>
      <h4>Utilidad en los negocios</h4>
      <p>
        Es la política de reposición del día a día: cuánto inventario de seguridad autorizar por
        SKU, qué prometer como nivel de servicio, y cómo cuantificar el beneficio de un proveedor
        más rápido o de un pronóstico menos ruidoso.
      </p>
    </>
  ),

  revision: (
    <>
      <h3>¿Qué hace esta simulación?</h3>
      <p>
        Corre en paralelo dos formas de decidir cuándo pedir, con la misma demanda aleatoria:
        revisión continua (se vigila el nivel todo el tiempo y se pide una cantidad fija Q al tocar
        el punto de reorden) y revisión periódica (se revisa cada T días y se pide lo necesario para
        llegar a un nivel objetivo).
      </p>
      <h4>Fórmulas</h4>
      <Formula>
        Continua (s,Q): s = d̄·L + z·σ·√L
        <br />
        Periódica (R,T): R = d̄·(T + L) + z·σ·√(T + L)
        <br />
        Colchón extra de la periódica ∝ √(T + L) − √L
      </Formula>
      <h4>Parámetros</h4>
      <ul>
        <li>
          <strong>T — periodo de revisión:</strong> cada cuántos días se mira el inventario; T
          grande simplifica la operación pero exige más colchón.
        </li>
        <li>
          <strong>Q — lote fijo de la política continua</strong> (típicamente el EOQ).
        </li>
        <li>
          <strong>d̄, σ, L, nivel de servicio:</strong> igual que en el punto de reorden.
        </li>
      </ul>
      <h4>Efectos que se observan</h4>
      <p>
        Con los mismos parámetros, la periódica siempre carga más inventario para dar el mismo
        servicio, porque queda ciega durante T días. Su ventaja aparece cuando revisar cuesta caro o
        cuando conviene consolidar pedidos de muchos artículos en un mismo embarque.
      </p>
      <h4>Utilidad en los negocios</h4>
      <p>
        Ayuda a elegir el modelo de reposición por familia de productos: continua para los artículos
        A de alto valor con lectura de inventario confiable; periódica para los C, para proveedores
        con visita programada o para consolidar flete. También cuantifica el ahorro de inventario
        que trae un punto de venta conectado en tiempo real.
      </p>
    </>
  ),

  'efecto-latigo': (
    <>
      <h3>¿Qué hace esta simulación?</h3>
      <p>
        Propaga una demanda del consumidor final a través de cuatro eslabones —minorista, mayorista,
        distribuidor y fábrica— donde cada uno pronostica, protege su inventario y pide a su
        proveedor. Se observa cómo un cambio moderado en el consumidor se convierte en oscilaciones
        violentas aguas arriba: el efecto látigo.
      </p>
      <h4>Fórmulas</h4>
      <Formula>
        Pronóstico: f_t = α·o_t + (1 − α)·f_(t−1)
        <br />
        Objetivo = f_t·(L + 1) + z·σ·√(L + 1)
        <br />
        Pedido = máx(0, objetivo − inventario − en tránsito)
        <br />
        Amplificación = CV(pedidos del eslabón) / CV(demanda final)
      </Formula>
      <h4>Parámetros</h4>
      <ul>
        <li>
          <strong>Variabilidad de la demanda (σ):</strong> el ruido que cada eslabón intenta
          interpretar.
        </li>
        <li>
          <strong>Salto de demanda:</strong> un cambio permanente de nivel en la semana 10, para ver
          la reacción en cadena.
        </li>
        <li>
          <strong>L — retraso de entrega entre eslabones:</strong> el combustible del látigo.
        </li>
        <li>
          <strong>α — reactividad del pronóstico:</strong> alto = se cree cada dato reciente y se
          sobrerreacciona; bajo = respuesta suave y tardía.
        </li>
        <li>
          <strong>z — agresividad del colchón:</strong> cuánta protección adicional se pide ante la
          incertidumbre.
        </li>
      </ul>
      <h4>Efectos que se observan</h4>
      <p>
        La amplificación crece con el retraso, con la reactividad del pronóstico y con el número de
        eslabones, aunque la demanda final sea estable. Bajar α o compartir la demanda real reduce el
        látigo más que cualquier aumento de inventario.
      </p>
      <h4>Utilidad en los negocios</h4>
      <p>
        Explica por qué la fábrica vive entre paros y horas extra mientras la tienda vende parejo, y
        justifica compartir el punto de venta con los proveedores, acortar tiempos de entrega, evitar
        promociones que distorsionan la señal y usar inventario administrado por el proveedor.
      </p>
    </>
  ),

  'beer-game': (
    <>
      <h3>¿Qué hace esta simulación?</h3>
      <p>
        Versión simplificada y por turnos del Beer Game: cuatro eslabones, pedidos y envíos con
        retraso, y una regla de decisión que el usuario controla. Se avanza semana por semana y se
        acumula el costo de inventario y de pedidos pendientes, para experimentar en carne propia la
        oscilación y su precio.
      </p>
      <h4>Fórmulas</h4>
      <Formula>
        Pedido = demanda percibida + β·(objetivo − posición de inventario)
        <br />
        Posición = inventario − pendientes + en tránsito
        <br />
        Costo = 1·inventario + 2·pendientes (por unidad y semana)
      </Formula>
      <h4>Parámetros</h4>
      <ul>
        <li>
          <strong>Demanda base y salto:</strong> el pedido semanal del consumidor y su cambio en la
          semana 5.
        </li>
        <li>
          <strong>Retraso de envío:</strong> semanas entre pedir y recibir.
        </li>
        <li>
          <strong>β — agresividad de corrección:</strong> qué fracción de la brecha se corrige en un
          solo pedido. Es la palanca del juego: valores altos generan pánico y oscilación.
        </li>
        <li>
          <strong>Inventario objetivo:</strong> el colchón que cada eslabón quiere mantener.
        </li>
      </ul>
      <h4>Efectos que se observan</h4>
      <p>
        Con β alto aparece el ciclo clásico: faltantes, sobrepedido, montaña de inventario,
        cancelaciones. Con β bajo y objetivo razonable el sistema se estabiliza rápido y el costo
        total cae, aunque se tolere un faltante inicial. La estructura del sistema, no la habilidad
        del jugador, produce la crisis.
      </p>
      <h4>Utilidad en los negocios</h4>
      <p>
        Es la herramienta clásica de capacitación para equipos de compras, planeación y ventas:
        demuestra que los picos de la cadena nacen de decisiones locales razonables y prepara el
        terreno para acuerdos de visibilidad, reglas de pedido estables y métricas compartidas en
        lugar de culpas.
      </p>
    </>
  ),

  colas: (
    <>
      <h3>¿Qué hace esta simulación?</h3>
      <p>
        Modela una fila de espera con llegadas aleatorias y varios servidores (M/M/c) y calcula
        tiempo de espera, gente en fila y utilización. Además compara la capacidad de tres etapas de
        un proceso para identificar el cuello de botella, que es el que fija el rendimiento de todo
        el flujo.
      </p>
      <h4>Fórmulas</h4>
      <Formula>
        ρ = λ / (c·μ) &nbsp;·&nbsp; Lq = P₀·a^c·ρ / (c!·(1 − ρ)²), a = λ/μ
        <br />
        Wq = Lq / λ &nbsp;·&nbsp; W = Wq + 1/μ &nbsp;·&nbsp; L = λ·W
        <br />
        Rendimiento del proceso = mín(λ, capacidad de cada etapa)
      </Formula>
      <h4>Parámetros</h4>
      <ul>
        <li>
          <strong>λ — tasa de llegadas:</strong> clientes u órdenes por hora.
        </li>
        <li>
          <strong>μ — tasa de servicio por servidor:</strong> cuántos atiende cada uno por hora.
        </li>
        <li>
          <strong>c — número de servidores:</strong> cajas, agentes, máquinas o muelles.
        </li>
        <li>
          <strong>Capacidad de las etapas 1–3:</strong> el ritmo máximo de cada paso del proceso.
        </li>
      </ul>
      <h4>Efectos que se observan</h4>
      <p>
        La espera no crece de forma lineal: entre 70 % y 85 % de utilización todavía es manejable, y
        de 90 % en adelante se dispara hacia el infinito. Sumar un servidor en una fila común rinde
        mucho más que tener filas separadas. Y añadir capacidad donde no está el cuello de botella
        no aumenta ni una unidad de rendimiento: solo crea inventario en proceso.
      </p>
      <h4>Utilidad en los negocios</h4>
      <p>
        Dimensiona personal por turno en tiendas, centros de contacto, urgencias, muelles de carga o
        mesas de servicio; fija la utilización objetivo de un recurso; y orienta la inversión al
        cuello de botella real en vez de repartirla parejo entre etapas.
      </p>
    </>
  ),
}

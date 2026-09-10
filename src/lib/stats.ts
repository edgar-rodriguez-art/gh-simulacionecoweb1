/**
 * Utilidades estadísticas. Portadas verbatim del prototipo
 * `Simuladores Económicos.dc.html` para que los resultados coincidan.
 *
 * No usar `Math.random()`: los módulos 04, 05 y 06 dependen de un LCG
 * determinista para que un mismo escenario dé siempre el mismo resultado.
 */

/** Inversa de la normal estándar — aproximación de Acklam. */
export function invNorm(p: number): number {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ]
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ]
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ]
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ]
  const pl = 0.02425
  let q: number, r: number
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p))
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    )
  }
  if (p > 1 - pl) {
    q = Math.sqrt(-2 * Math.log(1 - p))
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    )
  }
  q = p - 0.5
  r = q * q
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  )
}

/** Generador congruencial lineal determinista. */
export function rng(seed: number): () => number {
  let s = seed || 1
  return function () {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

/** n choques normales estándar por Box-Muller sobre el LCG. */
export function normals(seed: number, n: number): number[] {
  const u = rng(seed)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const a = Math.max(1e-9, u())
    const b = u()
    out.push(Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b))
  }
  return out
}

/** Coeficiente de variación σ/μ (0 si la media no es positiva). */
export function cv(arr: number[]): number {
  const m = arr.reduce((s, x) => s + x, 0) / arr.length
  const v = arr.reduce((s, x) => s + (x - m) * (x - m), 0) / arr.length
  return m > 0 ? Math.sqrt(v) / m : 0
}

/** Semilla por defecto del prototipo: 7 · 7919 + 13. */
export const DEFAULT_SEED = 7 * 7919 + 13

export function seedFrom(randomSeed = 7): number {
  return randomSeed * 7919 + 13
}

/** Formato de números en es-MX, idéntico al prototipo de Claude Design. */

export function fmt(x: number, d = 0): string {
  if (!isFinite(x)) return '∞'
  return Number(x).toLocaleString('es-MX', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
}

export function money(x: number, d = 0): string {
  return '$' + fmt(x, d)
}

export function pct(x: number, d = 1): string {
  return fmt(x, d) + '%'
}

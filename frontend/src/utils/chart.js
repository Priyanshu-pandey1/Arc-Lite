/**
 * Small chart math helpers used by the Analytics Dashboard.
 * All SVG coordinates are computed from data so switching the
 * time period (7D / 30D / 90D) redraws every chart.
 */

/** Catmull-Rom → cubic bezier: smooth curve through every point. */
export function smoothLine(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

/**
 * Sparkline for a KPI card: normalizes values into a 100×28 box and
 * returns the stroked line plus the filled area beneath it.
 */
export function sparklinePaths(values, width = 100, height = 28) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 3
  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: height - pad - ((v - min) / span) * (height - pad * 2),
  }))
  const line = smoothLine(points)
  const area = `${line} L ${width} ${height} L 0 ${height} Z`
  return { line, area }
}

/** Format a number with thousands separators: 1248 → "1,248". */
export function formatNumber(value) {
  return value.toLocaleString('en-US')
}

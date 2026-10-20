const formatters = {
  zero: new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }),
  one: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  two: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
}

export function numberText(value: number, digits = 0) {
  return (digits === 0 ? formatters.zero : digits === 1 ? formatters.one : formatters.two).format(value)
}

export function mi(value: number | null | undefined, digits?: number) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const decimals = digits ?? (Math.abs(value) < 1 ? 2 : 1)
  const amount = numberText(Math.abs(value), decimals)
  return `${value < -1e-9 ? '− ' : ''}R$ ${amount} mi`
}

export function percentage(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${numberText(value * 100, digits)}%`
}

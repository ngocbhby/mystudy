const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const optionLabel = (number: number): string => letters[number - 1] ?? String(number)

/** Chỉ cho mở liên kết https hoặc cùng origin (chặn javascript:, data:...). */
export function safeDocumentUrl(
  path: string | undefined,
  origin = window.location.origin,
): string | undefined {
  if (typeof path !== 'string') return undefined
  try {
    const url = new URL(path, origin)
    if (url.protocol === 'https:' || (url.protocol === 'http:' && url.origin === origin)) return url.href
  } catch {
    return undefined
  }
  return undefined
}

export function scoreOf(correct: number, total: number): number {
  return total === 0 ? 0 : (correct * 10) / total
}

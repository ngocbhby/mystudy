export const formatNumber = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format

export const formatScore = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
}).format

/** Chấp nhận "8,5" hoặc "8.5"; trả về NaN nếu không phải số thập phân hợp lệ (tối đa 2 chữ số lẻ). */
export const parseDecimal = (value: string): number =>
  /^\d+(?:[.,]\d{1,2})?$/.test(value.trim()) ? Number(value.trim().replace(',', '.')) : NaN

import { useEffect, useState } from 'react'

/** Giờ hiện tại, cập nhật mỗi 30 giây và khi cửa sổ lấy lại tiêu điểm (để ngày học đổi đúng lúc qua nửa đêm). */
export function useCurrentTime(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const update = () => setNow(new Date())
    const timer = window.setInterval(update, 30_000)
    window.addEventListener('focus', update)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', update)
    }
  }, [])
  return now
}

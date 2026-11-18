/**
 * Khóa lưu bài đang làm (sessionStorage) và kết quả gần nhất (localStorage) trên trình duyệt. Khóa gắn với người dùng
 * ("guest" khi chưa đăng nhập) để trên máy dùng chung, tài khoản này không thấy kết quả thi của tài khoản khác.
 */
const PRACTICE_PREFIX = 'mystudy_practice_'
const LATEST_PREFIX = 'mystudy_latest_attempt_'

export type StorageOwner = string

export const ownerOf = (userId: string | null | undefined): StorageOwner => userId ?? 'guest'
export const practiceKey = (owner: StorageOwner, examId: string) => `${PRACTICE_PREFIX}${owner}_${examId}`
export const latestKey = (owner: StorageOwner, examId: string) => `${LATEST_PREFIX}${owner}_${examId}`

function removeMatching(storage: Storage) {
  const keys: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key && (key.startsWith(PRACTICE_PREFIX) || key.startsWith(LATEST_PREFIX))) keys.push(key)
  }
  keys.forEach((key) => storage.removeItem(key))
}

/** Xóa mọi bài làm/kết quả lưu trên trình duyệt (khi đăng nhập, đăng xuất hoặc phiên hết hạn). */
export function clearPracticeStorage() {
  try {
    removeMatching(localStorage)
    removeMatching(sessionStorage)
  } catch {
    // Trình duyệt chặn bộ nhớ (chế độ riêng tư): không có gì để xóa.
  }
}

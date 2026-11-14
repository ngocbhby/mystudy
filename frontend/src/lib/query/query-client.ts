import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/http/api-error'

/** Chính sách cache mặc định; từng truy vấn có thể ghi đè staleTime theo độ biến động của dữ liệu. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        // Không thử lại lỗi 4xx (sai dữ liệu, chưa đăng nhập); chỉ thử lại lỗi mạng/máy chủ.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.isClientError) && failureCount < 2,
      },
      mutations: { retry: false },
    },
  })
}

/** Thời gian cache theo loại dữ liệu. */
export const staleTimes = {
  session: 5 * 60_000,
  static: 30 * 60_000, // kho đề thi gần như không đổi
  goal: 60_000,
  tasks: 30_000,
} as const

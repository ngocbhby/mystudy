import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clearPracticeStorage } from '@/features/exams/model/practice-storage'
import { staleTimes } from '@/lib/query/query-client'
import { authApi } from '../api/auth-api'
import { authKeys } from '../api/keys'
import type { Credentials, Session } from '../types'

export function useSession() {
  return useQuery({ queryKey: authKeys.session, queryFn: authApi.getSession, staleTime: staleTimes.session })
}

function useEstablishSession(mutationFn: (credentials: Credentials) => ReturnType<typeof authApi.login>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (user) => {
      // Người mới đăng nhập không được thấy bài làm/kết quả lưu của người dùng trước trên cùng trình duyệt.
      clearPracticeStorage()
      queryClient.setQueryData<Session>(authKeys.session, (old) => ({
        googleEnabled: old?.googleEnabled ?? false,
        user,
      }))
    },
  })
}

export const useLogin = () => useEstablishSession(authApi.login)
export const useRegister = () => useEstablishSession(authApi.register)

export function useResetPassword() {
  return useMutation({
    mutationFn: authApi.resetPassword,
  })
}

/** Xóa toàn bộ cache dữ liệu cá nhân khi đăng xuất hoặc khi phiên hết hạn. */
export function useResetSession() {
  const queryClient = useQueryClient()
  return () => {
    clearPracticeStorage()
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' })
    queryClient.setQueryData<Session>(authKeys.session, (old) => ({
      googleEnabled: old?.googleEnabled ?? false,
      user: null,
    }))
  }
}

export function useLogout() {
  const reset = useResetSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      reset()
      // Cookie CSRF đổi sau khi phiên bị hủy: nạp lại phiên ẩn danh để có token mới.
      await queryClient.invalidateQueries({ queryKey: authKeys.session })
    },
  })
}

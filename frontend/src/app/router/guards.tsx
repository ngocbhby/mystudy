import { Navigate, Outlet } from 'react-router'
import { useSession } from '@/features/auth/hooks/useSession'
import { ErrorNotice } from '@/shared/components/ErrorNotice'
import { LoadingState } from '@/shared/components/LoadingState'
import { paths } from './paths'

/** Chỉ cho người đã đăng nhập đi tiếp; chưa đăng nhập thì về trang đăng nhập. */
export function RequireAuth() {
  const session = useSession()
  if (session.isPending) return <LoadingState label="Đang kiểm tra phiên đăng nhập…" />
  if (session.isError) return <ErrorNotice error={session.error} onRetry={() => void session.refetch()} />
  return session.data.user ? <Outlet /> : <Navigate to={paths.home} replace />
}

/** Chỉ cho người dùng có quyền quản trị viên (ADMIN) truy cập. */
export function RequireAdmin() {
  const session = useSession()
  if (session.isPending) return <LoadingState label="Đang kiểm tra quyền quản trị…" />
  if (session.isError) return <ErrorNotice error={session.error} onRetry={() => void session.refetch()} />
  if (!session.data.user) return <Navigate to={paths.home} replace />
  if (session.data.user.role?.toUpperCase() !== 'ADMIN') return <Navigate to={paths.overview} replace />
  return <Outlet />
}

/** Trang đăng nhập: người đã đăng nhập được chuyển thẳng vào ứng dụng. */
export function RedirectIfAuthenticated() {
  const session = useSession()
  if (session.data?.user) return <Navigate to={paths.overview} replace />
  return <Outlet />
}

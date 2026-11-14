import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { env } from '@/config/env'
import { useResetSession } from '@/features/auth/hooks/useSession'
import { onUnauthenticated } from '@/lib/http/client'
import { createQueryClient } from '@/lib/query/query-client'
import { theme } from '@/app/theme/theme'

const Devtools = env.devtools
  ? lazy(() => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })))
  : null

/** Khi API báo phiên hết hạn: xóa cache cá nhân; RequireAuth sẽ đưa người dùng về đăng nhập. */
function SessionExpiryWatcher() {
  const reset = useResetSession()
  useEffect(() => onUnauthenticated(reset))
  return null
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SessionExpiryWatcher />
        {children}
      </ThemeProvider>
      {Devtools && (
        <Suspense>
          <Devtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}

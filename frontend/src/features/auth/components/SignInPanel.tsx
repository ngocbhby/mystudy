import { zodResolver } from '@hookform/resolvers/zod'
import GoogleIcon from '@mui/icons-material/Google'
import { Alert, Box, Button, Divider, Link, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ApiError } from '@/lib/http/api-error'
import { authApi } from '../api/auth-api'
import { useLogin, useRegister, useSession } from '../hooks/useSession'
import { loginSchema, registerSchema, type CredentialsForm } from '../model/credentials-schema'

type Mode = 'login' | 'register'

const callbackMessages: Record<string, string> = {
  cancelled: 'Bạn đã hủy đăng nhập. Bạn có thể thử lại.',
  expired: 'Yêu cầu đăng nhập đã hết hạn. Vui lòng thử lại.',
  failed: 'Không thể đăng nhập Google. Vui lòng thử lại.',
}

interface Props {
  /** Mã kết quả từ ?auth=... sau khi Google chuyển hướng về. */
  authResult?: string | null
}

export function SignInPanel({ authResult }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const session = useSession()
  const login = useLogin()
  const register = useRegister()
  const mutation = mode === 'login' ? login : register
  const registering = mode === 'register'

  const form = useForm<CredentialsForm>({
    resolver: zodResolver(registering ? registerSchema : loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const submit = form.handleSubmit((values) => {
    mutation.mutate(values, {
      onError: (error) => {
        if (error instanceof ApiError) {
          for (const [field, message] of Object.entries(error.fieldErrors)) {
            if (field === 'email' || field === 'password') form.setError(field, { message })
          }
        }
      },
    })
  })

  const switchMode = () => {
    setMode(registering ? 'login' : 'register')
    mutation.reset()
    form.clearErrors()
  }

  const ready = session.isSuccess
  const pageError = authResult ? callbackMessages[authResult] : undefined

  return (
    <Stack component="section" aria-labelledby="sign-in-title" spacing={2.5} sx={{ maxWidth: 420, width: '100%' }}>
      <Box>
        <Typography variant="overline" color="primary" sx={{ fontWeight: 600 }}>Chào mừng đến MyStudy</Typography>
        <Typography id="sign-in-title" variant="h1" component="h1">Sẵn sàng cho kỳ thi của bạn?</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>Lập lộ trình ôn thi theo thời gian của bạn</Typography>
      </Box>

      {session.isError && <Alert severity="error">Không thể kiểm tra phiên đăng nhập. Vui lòng tải lại trang.</Alert>}
      {pageError && <Alert severity="warning">{pageError}</Alert>}

      <Button
        variant="contained" size="large" startIcon={<GoogleIcon />} disabled={!ready || !session.data?.googleEnabled}
        href={authApi.googleLoginUrl}
      >
        {session.isPending ? 'Đang kiểm tra phiên đăng nhập…' : 'Tiếp tục với Google'}
      </Button>
      {ready && !session.data.googleEnabled && (
        <Typography variant="caption" color="text.secondary">Đăng nhập Google chưa được cấu hình.</Typography>
      )}

      <Divider>hoặc dùng email</Divider>

      <Stack component="form" spacing={1.5} noValidate onSubmit={submit}>
        <TextField
          label="Email" type="email" autoComplete="username" placeholder="ban@example.com"
          error={!!form.formState.errors.email} helperText={form.formState.errors.email?.message}
          slotProps={{ htmlInput: { maxLength: 254 } }} {...form.register('email')}
        />
        <TextField
          key={mode} label="Mật khẩu" type="password" autoComplete={registering ? 'new-password' : 'current-password'}
          error={!!form.formState.errors.password}
          helperText={form.formState.errors.password?.message ?? (registering ? 'Ít nhất 12 ký tự.' : undefined)}
          slotProps={{ htmlInput: { maxLength: 256 } }} {...form.register('password')}
        />
        {mutation.isError && <Alert severity="error" role="alert">{mutation.error.message}</Alert>}
        <Button type="submit" variant="outlined" size="large" disabled={!ready || mutation.isPending}>
          {mutation.isPending ? 'Đang xử lý…' : registering ? 'Tạo tài khoản' : 'Đăng nhập'}
        </Button>
        <Typography variant="body2" color="text.secondary" align="center">
          {registering ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
          <Link component="button" type="button" onClick={switchMode} disabled={mutation.isPending}>
            {registering ? 'Đăng nhập' : 'Đăng ký'}
          </Link>
        </Typography>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của MyStudy.
      </Typography>
    </Stack>
  )
}

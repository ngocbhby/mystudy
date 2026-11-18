import { zodResolver } from '@hookform/resolvers/zod'
import GoogleIcon from '@mui/icons-material/Google'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Box, Button, Divider, Link, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { colors } from '@/app/theme/theme'
import { ApiError } from '@/lib/http/api-error'
import { authApi } from '../api/auth-api'
import { useLogin, useRegister, useResetPassword, useSession } from '../hooks/useSession'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  type CredentialsForm,
} from '../model/credentials-schema'

type Mode = 'login' | 'register' | 'forgot'

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const session = useSession()
  const login = useLogin()
  const register = useRegister()
  const resetPassword = useResetPassword()

  const currentMutation =
    mode === 'login' ? login : mode === 'register' ? register : resetPassword

  const resolver =
    mode === 'register' ? registerSchema : mode === 'forgot' ? forgotPasswordSchema : loginSchema

  const form = useForm<CredentialsForm>({
    resolver: zodResolver(resolver),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const submit = form.handleSubmit((values) => {
    setSuccessMessage(null)

    if (mode === 'forgot') {
      resetPassword.mutate(
        {
          email: values.email,
          newPassword: values.password,
          confirmPassword: values.confirmPassword ?? '',
        },
        {
          onSuccess: () => {
            setSuccessMessage('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.')
            setMode('login')
            login.reset()
            register.reset()
            resetPassword.reset()
            form.reset({ email: values.email, password: '', confirmPassword: '' })
          },
          onError: (error) => {
            if (error instanceof ApiError) {
              for (const [field, message] of Object.entries(error.fieldErrors)) {
                if (field === 'email' || field === 'password' || field === 'confirmPassword') {
                  form.setError(field as keyof CredentialsForm, { message })
                }
              }
            }
          },
        },
      )
      return
    }

    if (mode === 'register') {
      register.mutate(
        {
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
        },
        {
          onError: (error) => {
            if (error instanceof ApiError) {
              for (const [field, message] of Object.entries(error.fieldErrors)) {
                if (field === 'email' || field === 'password' || field === 'confirmPassword') {
                  form.setError(field as keyof CredentialsForm, { message })
                }
              }
            }
          },
        },
      )
      return
    }

    // mode === 'login'
    login.mutate(
      { email: values.email, password: values.password },
      {
        onError: (error) => {
          if (error instanceof ApiError) {
            for (const [field, message] of Object.entries(error.fieldErrors)) {
              if (field === 'email' || field === 'password') {
                form.setError(field as keyof CredentialsForm, { message })
              }
            }
          }
        },
      },
    )
  })

  const switchMode = (newMode: Mode) => {
    setMode(newMode)
    login.reset()
    register.reset()
    resetPassword.reset()
    setSuccessMessage(null)
    form.clearErrors()
  }

  const ready = session.isSuccess
  const pageError = authResult ? callbackMessages[authResult] : undefined

  return (
    <Stack
      component="section"
      aria-labelledby="sign-in-title"
      spacing={2.5}
      sx={{ maxWidth: 480, width: '100%' }}
    >
      <Box>
        <Typography variant="overline" color="primary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
          {mode === 'forgot'
            ? 'Khôi phục tài khoản'
            : mode === 'register'
              ? 'Tạo tài khoản mới'
              : 'Chào mừng đến MyStudy'}
        </Typography>
        <Typography id="sign-in-title" variant="h1" component="h1" sx={{ mt: 1.5, lineHeight: 1.45 }}>
          {mode === 'forgot' ? (
            'Quên mật khẩu?'
          ) : mode === 'register' ? (
            <>
              Bắt đầu cùng
              <br />
              MyStudy
            </>
          ) : (
            <>
              Sẵn sàng cho
              <br />
              kỳ thi của bạn?
            </>
          )}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
          {mode === 'forgot'
            ? 'Nhập email tài khoản và mật khẩu mới để thiết lập lại quyền truy cập.'
            : 'Lập lộ trình ôn thi theo thời gian của bạn'}
        </Typography>
      </Box>

      {session.isError && (
        <Alert severity="error">Không thể kiểm tra phiên đăng nhập. Vui lòng tải lại trang.</Alert>
      )}
      {pageError && <Alert severity="warning">{pageError}</Alert>}
      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      {mode !== 'forgot' && (
        <>
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            sx={{ py: 1.6 }}
            disabled={!ready || !session.data?.googleEnabled}
            href={authApi.googleLoginUrl}
          >
            {session.isPending ? 'Đang kiểm tra phiên đăng nhập…' : 'Tiếp tục với Google'}
          </Button>
          {ready && !session.data.googleEnabled && (
            <Typography variant="caption" color="text.secondary">
              Đăng nhập Google chưa được cấu hình.
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary">
            Không cần ghi nhớ thêm mật khẩu.
          </Typography>

          <Divider sx={{ color: 'text.secondary', fontSize: 13 }}>hoặc dùng email</Divider>
        </>
      )}

      <Stack component="form" spacing={1.5} noValidate onSubmit={submit}>
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="ban@example.com"
          error={!!form.formState.errors.email}
          helperText={form.formState.errors.email?.message}
          slotProps={{ htmlInput: { maxLength: 254 } }}
          {...form.register('email')}
        />

        <TextField
          key={mode + '-pass'}
          label={mode === 'forgot' ? 'Mật khẩu mới' : 'Mật khẩu'}
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          error={!!form.formState.errors.password}
          helperText={
            form.formState.errors.password?.message ??
            (mode !== 'login' ? 'Ít nhất 12 ký tự.' : undefined)
          }
          slotProps={{ htmlInput: { maxLength: 256 } }}
          {...form.register('password')}
        />

        {mode !== 'login' && (
          <TextField
            key={mode + '-confirm'}
            label={mode === 'forgot' ? 'Xác nhận mật khẩu mới' : 'Xác nhận mật khẩu'}
            type="password"
            autoComplete="new-password"
            error={!!form.formState.errors.confirmPassword}
            helperText={
              form.formState.errors.confirmPassword?.message ??
              (mode === 'forgot'
                ? 'Nhập lại mật khẩu mới để xác nhận.'
                : 'Nhập lại mật khẩu để xác nhận.')
            }
            slotProps={{ htmlInput: { maxLength: 256 } }}
            {...form.register('confirmPassword')}
          />
        )}

        {mode === 'login' && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0.5 }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => switchMode('forgot')}
              disabled={currentMutation.isPending}
              sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Quên mật khẩu?
            </Link>
          </Box>
        )}

        {currentMutation.isError && (
          <Alert severity="error" role="alert">
            {currentMutation.error.message}
          </Alert>
        )}

        <Button
          type="submit"
          variant="soft"
          size="large"
          disabled={!ready || currentMutation.isPending}
          sx={{ py: 1.3, fontWeight: 600 }}
        >
          {currentMutation.isPending
            ? 'Đang xử lý…'
            : mode === 'forgot'
              ? 'Đặt lại mật khẩu'
              : mode === 'register'
                ? 'Tạo tài khoản'
                : 'Đăng nhập'}
        </Button>

        {mode === 'forgot' ? (
          <Box sx={{ textAlign: 'center', pt: 1 }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => switchMode('login')}
              disabled={currentMutation.isPending}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': { color: 'primary.main', textDecoration: 'underline' },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} /> Quay lại đăng nhập
            </Link>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center">
            {mode === 'register' ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
            <Link
              component="button"
              type="button"
              onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}
              disabled={currentMutation.isPending}
            >
              {mode === 'register' ? 'Đăng nhập' : 'Đăng ký'}
            </Link>
          </Typography>
        )}
      </Stack>

      <Box sx={{ bgcolor: colors.tile, borderRadius: 3, p: 2.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 15 }}>Hành trình học tập của riêng bạn</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Mục tiêu, lịch học và kết quả được lưu cùng tài khoản MyStudy của bạn.
        </Typography>
      </Box>

      <Typography variant="caption" color="text.secondary">
        Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của MyStudy.
      </Typography>
    </Stack>
  )
}

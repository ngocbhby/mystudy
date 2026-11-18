import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/http/api-error'
import { authApi } from '../api/auth-api'
import { SignInPanel } from './SignInPanel'

vi.mock('../api/auth-api', () => ({
  authApi: {
    getSession: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    resetPassword: vi.fn(),
    logout: vi.fn(),
    googleLoginUrl: '/api/auth/oauth2/google',
  },
}))

function renderPanel(authResult?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <SignInPanel authResult={authResult} />
    </QueryClientProvider>,
  )
  return client
}

describe('SignInPanel', () => {
  beforeEach(() => {
    vi.mocked(authApi.getSession).mockResolvedValue({ user: null, googleEnabled: true })
  })

  it('validates before calling the API', async () => {
    renderPanel()
    const user = userEvent.setup()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByText('Vui lòng nhập email.')).toBeInTheDocument()
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('logs in and stores the user in the session cache', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ id: 'u1', email: 'a@b.co', displayName: null })
    const client = renderPanel()
    const user = userEvent.setup()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeEnabled())
    await user.type(screen.getByLabelText('Email'), 'a@b.co')
    await user.type(screen.getByLabelText('Mật khẩu'), 'a-long-password-123')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    await waitFor(() => expect(authApi.login).toHaveBeenCalled())
    expect(vi.mocked(authApi.login).mock.calls[0]?.[0]).toEqual({
      email: 'a@b.co',
      password: 'a-long-password-123',
    })
    await waitFor(() =>
      expect(client.getQueryData(['auth', 'session'])).toMatchObject({ user: { id: 'u1' } }),
    )
  })

  it('shows the server message on bad credentials', async () => {
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError('BAD_CREDENTIALS', 'Email hoặc mật khẩu không đúng.', 401),
    )
    renderPanel()
    const user = userEvent.setup()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeEnabled())
    await user.type(screen.getByLabelText('Email'), 'a@b.co')
    await user.type(screen.getByLabelText('Mật khẩu'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng.')
  })

  it('switches to registration with the 12 character rule and confirm password requirement', async () => {
    renderPanel()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Đăng ký' }))
    expect(screen.getByText('Ít nhất 12 ký tự.')).toBeInTheDocument()

    // Mật khẩu quá ngắn
    await user.type(screen.getByLabelText('Email'), 'a@b.co')
    await user.type(screen.getByLabelText('Mật khẩu'), 'short')
    await user.type(screen.getByLabelText('Xác nhận mật khẩu'), 'short')
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    expect(await screen.findByText('Mật khẩu cần ít nhất 12 ký tự.')).toBeInTheDocument()
    expect(authApi.register).not.toHaveBeenCalled()

    // Mật khẩu xác nhận không khớp
    await user.clear(screen.getByLabelText('Mật khẩu'))
    await user.type(screen.getByLabelText('Mật khẩu'), 'a-long-password-123')
    await user.clear(screen.getByLabelText('Xác nhận mật khẩu'))
    await user.type(screen.getByLabelText('Xác nhận mật khẩu'), 'different-password-123')
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    expect(await screen.findByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument()
    expect(authApi.register).not.toHaveBeenCalled()

    // Khớp mật khẩu thành công
    vi.mocked(authApi.register).mockResolvedValue({ id: 'u2', email: 'a@b.co', displayName: null })
    await user.clear(screen.getByLabelText('Xác nhận mật khẩu'))
    await user.type(screen.getByLabelText('Xác nhận mật khẩu'), 'a-long-password-123')
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    await waitFor(() => expect(authApi.register).toHaveBeenCalled())
    expect(vi.mocked(authApi.register).mock.calls[0]?.[0]).toEqual({
      email: 'a@b.co',
      password: 'a-long-password-123',
      confirmPassword: 'a-long-password-123',
    })
  })

  it('handles forgot password flow', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValue(undefined)
    renderPanel()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Quên mật khẩu?' }))
    expect(screen.getByText('Quên mật khẩu?')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'new-password-123')
    await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'new-password-123')

    await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }))
    await waitFor(() => expect(authApi.resetPassword).toHaveBeenCalled())
    expect(vi.mocked(authApi.resetPassword).mock.calls[0]?.[0]).toEqual({
      email: 'user@example.com',
      newPassword: 'new-password-123',
      confirmPassword: 'new-password-123',
    })

    // Quay lại màn hình đăng nhập với thông báo thành công
    expect(await screen.findByText('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument()
  })

  it('explains a cancelled Google sign-in', async () => {
    renderPanel('cancelled')
    expect(await screen.findByText('Bạn đã hủy đăng nhập. Bạn có thể thử lại.')).toBeInTheDocument()
  })
})

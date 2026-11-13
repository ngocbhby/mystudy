import { useEffect, useState } from 'react'

const callbackMessages = {
  cancelled: 'Bạn đã hủy đăng nhập. Bạn có thể thử lại.',
  expired: 'Yêu cầu đăng nhập đã hết hạn. Vui lòng thử lại.',
  failed: 'Không thể đăng nhập Google. Vui lòng thử lại.',
  unavailable: 'Đăng nhập Google chưa được cấu hình.',
}

export function SignInPanel({ session, setSession, loadingSession, sessionError }) {
  const [pending, setPending] = useState('')
  const [emailMode, setEmailMode] = useState('login')
  const registering = emailMode === 'register'
  const [error, setError] = useState('')

  useEffect(() => {
    const url = new URL(window.location.href)
    const result = url.searchParams.get('auth')
    if (result !== null) {
      if (Object.hasOwn(callbackMessages, result)) setError(callbackMessages[result])
      url.searchParams.delete('auth')
      window.history.replaceState(window.history.state, '', url)
    }
  }, [])

  function startLogin(event) {
    if (!session?.configured) {
      event.preventDefault()
      setError(session
        ? callbackMessages.unavailable
        : 'Không thể kiểm tra phiên đăng nhập. Vui lòng tải lại trang.')
      return
    }
    setPending('google')
  }

  async function submitEmail(event) {
    event.preventDefault()
    const form = event.currentTarget
    const { email, password } = Object.fromEntries(new FormData(form))
    setError('')
    setPending('email')
    try {
      const response = await fetch(`/api/auth/${emailMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error ?? 'Không thể xác thực. Vui lòng thử lại.')
        return
      }
      form.reset()
      setEmailMode('login')
      setSession((current) => ({ ...current, user: result.user }))
    } catch {
      setError('Không thể kết nối với máy chủ. Vui lòng thử lại.')
    } finally {
      setPending('')
    }
  }

  let loginLabel = 'Tiếp tục với Google'
  if (loadingSession) loginLabel = 'Đang kiểm tra phiên đăng nhập…'
  if (pending === 'google') loginLabel = 'Đang kết nối với Google…'

  return (
    <section className="sign-in-panel" aria-labelledby="sign-in-title">
      <div className="sign-in-content">
        <p className="eyebrow">Chào mừng đến MyStudy</p>
        <h1 id="sign-in-title"><span>Sẵn sàng cho</span><span>kỳ thi của bạn?</span></h1>
        <p className="sign-in-description">Lập lộ trình ôn thi theo thời gian của bạn</p>
        <form action="/api/auth/google" method="post" onSubmit={startLogin}>
          <button className="auth-button" type="submit" disabled={loadingSession || Boolean(pending)}>
            {loginLabel}
          </button>
        </form>

        <p className="auth-divider">hoặc dùng email</p>

        <form className="email-form" method="post" onSubmit={submitEmail}>
          <label htmlFor="auth-email">Email</label>
          <input id="auth-email" name="email" type="email" autoComplete="username"
            placeholder="ban@example.com" maxLength={254} required />

          <label htmlFor="auth-password">Mật khẩu</label>
          <input key={emailMode} id="auth-password" name="password" type="password"
            autoComplete={registering ? 'new-password' : 'current-password'}
            aria-describedby={registering ? 'password-hint' : undefined}
            minLength={registering ? 12 : undefined} maxLength={256} required />
          {registering && <p id="password-hint" className="password-hint">Ít nhất 12 ký tự.</p>}

          <button className="auth-button email-submit" type="submit"
            disabled={loadingSession || Boolean(pending)}>
            {pending === 'email' ? 'Đang xử lý…' : registering ? 'Tạo tài khoản' : 'Đăng nhập'}
          </button>

          <p className="auth-switch">
            {registering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            {' '}
            <button type="button" disabled={Boolean(pending)} onClick={() => {
              setEmailMode(registering ? 'login' : 'register')
              setError('')
            }}>
              {registering ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          </p>
        </form>

        {(error || sessionError) && <p className="auth-error" role="alert">{error || sessionError}</p>}

        <div className="account-note">
          <p className="account-title">Hành trình học tập của riêng bạn</p>
          <p>Mục tiêu, lịch học và kết quả được lưu cùng tài khoản MyStudy của bạn.</p>
        </div>

        <p className="legal-note">
          Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của MyStudy.
        </p>
      </div>
    </section>
  )
}

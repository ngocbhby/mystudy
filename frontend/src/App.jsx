import { useEffect, useState } from 'react'
import { StudyWorkspace } from './features/study/StudyWorkspace.jsx'
import { SignInPanel } from './features/auth/SignInPanel.jsx'
import { isExamPage } from './features/exams/exam-paths.js'
import { StudyWeek } from './features/study/StudyWeek.jsx'

export function App() {
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/session', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error()
        return response.json()
      })
      .then((result) => { if (!controller.signal.aborted) setSession(result) })
      .catch(() => {
        if (!controller.signal.aborted) setSessionError('Không thể kiểm tra phiên đăng nhập. Vui lòng tải lại trang.')
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingSession(false) })
    return () => controller.abort()
  }, [])

  if (session?.user) return <StudyWorkspace key={session.user.id} user={session.user} onLogout={async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null)
    if (!response?.ok) throw new Error('Không thể đăng xuất. Vui lòng thử lại.')
    window.history.replaceState(null, '', '/')
    setSession((current) => ({ ...current, user: null }))
  }} />

  if (isExamPage(window.location.pathname)) return <StudyWorkspace />

  return (
    <main className="login-layout">
      <header className="brand">MyStudy</header>

      <SignInPanel session={session} setSession={setSession} loadingSession={loadingSession} sessionError={sessionError} />

      <section className="intro-panel" aria-labelledby="intro-title">
        <p className="intro-badge">Cùng bạn về đích THPT</p>
        <h2 id="intro-title" className="intro-title">
          <span>Mỗi ngày một chút.</span>
          <span>Tương lai gần hơn.</span>
        </h2>
        <p className="intro-description">
          Một lộ trình vừa sức, một mục tiêu rõ ràng.
          <br />
          Bắt đầu từ thời gian bạn có hôm nay.
        </p>
        <StudyWeek />
        <p className="intro-footer">Học đều đặn / Tiến bộ bền vững · <a href="/kho-de-thi">Kho đề thi</a></p>
      </section>
    </main>
  )
}

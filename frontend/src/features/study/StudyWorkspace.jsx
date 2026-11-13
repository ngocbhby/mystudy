import { useEffect, useState } from 'react'
import { saveGoal, studyRequest } from './study-api.js'
import { GoalSetup } from './GoalSetup.jsx'
import { Overview } from './overview/Overview.jsx'
import { StudyPlan } from './plan/StudyPlan.jsx'
import { ExamLibrary } from '../exams/ExamLibrary.jsx'
import { OnlineExam } from '../exams/OnlineExam.jsx'
import { isExamPage, onlineExamPath } from '../exams/exam-paths.js'

const routes = {
  overview: '/tong-quan', plan: '/lo-trinh', goal: '/thiet-lap-muc-tieu', exams: '/kho-de-thi', practice: '/thi-thu',
}

function ErrorNotice({ error, retry }) {
  return <div className="workspace-error"><p className="goal-error" role="alert">{error}</p>
    <button className="workspace-button" type="button" onClick={retry}>Thử lại</button></div>
}

export function StudyWorkspace({ user, onLogout }) {
  const [location, setLocation] = useState(window.location.pathname)
  const [load, setLoad] = useState({})
  const [attempt, setAttempt] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const publicExam = isExamPage(location)
  const userId = user?.id

  useEffect(() => {
    const onPopState = () => setLocation(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!userId || publicExam) return
    const controller = new AbortController()
    studyRequest('goal', { signal: controller.signal })
      .then((data) => setLoad({ data }))
      .catch((error) => {
        if (error.name !== 'AbortError') setLoad({ error: error.message })
      })
    return () => controller.abort()
  }, [attempt, userId, publicExam])

  const { data, error } = load
  const current = location === routes.goal ? 'goal'
    : location === routes.plan ? 'plan'
      : location === routes.exams ? 'exams'
        : publicExam ? 'practice' : 'overview'
  const screen = !publicExam && data && !data.plan && location !== routes.overview ? 'goal' : current
  const [, examId, examView] = onlineExamPath.exec(location) ?? []

  useEffect(() => {
    if (!data && !publicExam) return
    const name = { goal: 'Thiết lập mục tiêu', plan: 'Lộ trình', overview: 'Tổng quan', exams: 'Kho đề thi', practice: 'Thi thử' }[screen]
    document.title = name + ' | MyStudy'
    return () => { document.title = 'Đăng nhập | MyStudy' }
  }, [data, screen, publicExam])

  function navigate(target) {
    const path = routes[target]
    if (window.location.pathname !== path) window.history.pushState(null, '', path)
    setLocation(path)
    window.scrollTo(0, 0)
  }

  function linkTo(target) {
    return (event) => {
      if (!user || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      navigate(target)
    }
  }

  async function logout() {
    setLoggingOut(true)
    setLogoutError('')
    try {
      await onLogout()
    } catch (err) {
      setLogoutError(err.message)
    } finally {
      setLoggingOut(false)
    }
  }

  return <div className="workspace">
    <header className="workspace-header">
      <div className="workspace-nav-wrap">
        <a className="workspace-brand" href={routes.overview} onClick={linkTo('overview')}>MyStudy</a>
        <nav className="workspace-nav" aria-label="Điều hướng chính">
          <a href={routes.overview} onClick={linkTo('overview')} aria-current={screen === 'overview' ? 'page' : undefined}>Tổng quan</a>
          <a href={routes.plan} onClick={linkTo('plan')} aria-current={screen === 'plan' ? 'page' : undefined}>Lộ trình</a>
          <a href={routes.exams} onClick={linkTo('exams')} aria-current={screen === 'exams' ? 'page' : undefined}>Kho đề thi</a>
          <span aria-disabled="true" title="Chưa mở">Kho bài mẫu</span>
          <a href={routes.practice} onClick={linkTo('practice')} aria-current={screen === 'practice' ? 'page' : undefined}>Thi thử</a>
        </nav>
        {user ? <details className="workspace-account">
          <summary>Tài khoản <span aria-hidden="true">⌄</span></summary>
          <div className="workspace-account-menu">
            <p>{user.displayName || user.email || 'Tài khoản MyStudy'}</p>
            <button className="workspace-button" type="button" disabled={loggingOut} onClick={logout}>
              {loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
            </button>
            {logoutError && <p className="goal-error" role="alert">{logoutError}</p>}
          </div>
        </details> : <a className="workspace-account" href="/">Đăng nhập</a>}
      </div>
    </header>
    <main className="workspace-main">
      {screen === 'exams' ? <ExamLibrary />
        : screen === 'practice' ? <OnlineExam key={location} examId={examId} view={examView} />
        : error ? <ErrorNotice error={error} retry={() => { setLoad({}); setAttempt((value) => value + 1) }} />
        : !data ? <p role="status">Đang tải mục tiêu của bạn…</p>
          : screen === 'goal' ? <GoalSetup key={data.plan?.id} savedGoal={data.goal} saveGoal={saveGoal}
              onSaved={(result) => { setLoad({ data: result }); navigate('plan') }} />
            : screen === 'plan' ? <StudyPlan data={data} onSaved={(result) => setLoad({ data: result })}
                editHref={routes.goal} onEdit={linkTo('goal')} />
              : <Overview key={data.plan?.id ?? 'no-plan'} goal={data.goal} editHref={routes.goal} onEdit={linkTo('goal')} />}
    </main>
  </div>
}

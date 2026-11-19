import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/app/layout/AppLayout'
import { RedirectIfAuthenticated, RequireAdmin, RequireAuth } from './guards'
import { paths } from './paths'

/** Mỗi trang được tải theo yêu cầu (code splitting) qua `lazy`. */
export const router = createBrowserRouter([
  {
    element: <RedirectIfAuthenticated />,
    children: [
      {
        path: paths.home,
        lazy: async () => ({ Component: (await import('@/features/auth/pages/LoginPage')).default }),
      },
      { path: paths.login, element: <Navigate to={paths.home} replace /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      // Công khai: không cần đăng nhập.
      {
        path: paths.exams,
        lazy: async () => ({ Component: (await import('@/features/exams/pages/ExamLibraryPage')).default }),
      },
      {
        path: paths.samples,
        lazy: async () => ({ Component: (await import('@/features/samples/pages/SamplesPage')).default }),
      },
      {
        path: paths.practice,
        lazy: async () => ({
          Component: (await import('@/features/exams/pages/ExamPracticePage')).PracticeIndexPage,
        }),
      },
      {
        path: `${paths.practice}/:id/:view?`,
        lazy: async () => ({ Component: (await import('@/features/exams/pages/ExamPracticePage')).default }),
      },
      // Cần đăng nhập.
      {
        element: <RequireAuth />,
        children: [
          {
            path: paths.overview,
            lazy: async () => ({ Component: (await import('@/features/study/pages/OverviewPage')).default }),
          },
          {
            path: paths.plan,
            lazy: async () => ({ Component: (await import('@/features/study/pages/PlanPage')).default }),
          },
          {
            path: paths.goal,
            lazy: async () => ({ Component: (await import('@/features/study/pages/GoalPage')).default }),
          },
          {
            path: paths.analysis,
            lazy: async () => ({ Component: (await import('@/features/ai/pages/AnalysisPage')).default }),
          },
        ],
      },
      // Khu vực dành riêng cho Quản trị viên (ADMIN).
      {
        element: <RequireAdmin />,
        children: [
          {
            path: paths.adminExams,
            lazy: async () => ({ Component: (await import('@/features/admin/pages/AdminExamListPage')).default }),
          },
          {
            path: paths.adminNewExam,
            lazy: async () => ({ Component: (await import('@/features/admin/pages/AdminNewExamPage')).default }),
          },
        ],
      },
      { path: '*', element: <Navigate to={paths.home} replace /> },
    ],
  },
])

import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { ErrorNotice } from '@/shared/components/ErrorNotice'
import { LoadingState } from '@/shared/components/LoadingState'
import { PageHeader } from '@/shared/components/PageHeader'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { GoalForm } from '../components/GoalForm'
import { useStudyGoal } from '../hooks/useStudy'

export default function GoalPage() {
  useDocumentTitle('Thiết lập mục tiêu')
  const navigate = useNavigate()
  const goal = useStudyGoal()

  if (goal.isPending) return <LoadingState label="Đang tải mục tiêu của bạn…" />
  if (goal.isError) return <ErrorNotice error={goal.error} onRetry={() => void goal.refetch()} />

  return (
    <>
      <PageHeader
        eyebrow="BẮT ĐẦU HÀNH TRÌNH"
        title="Thiết lập mục tiêu"
        description="Bạn đặt đích đến. MyStudy chia nhỏ thành từng ngày."
      />
      <GoalForm
        key={goal.data.plan?.id ?? 'new'}
        savedGoal={goal.data.goal}
        onSaved={() => void navigate(paths.plan)}
      />
    </>
  )
}

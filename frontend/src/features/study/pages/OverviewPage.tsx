import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import { Alert, Box, Button, Card, Chip, LinearProgress, Stack, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatFullDate, getVietnamDate } from '@/lib/date/vietnam-date'
import { formatNumber, formatScore } from '@/lib/format'
import { ErrorNotice } from '@/shared/components/ErrorNotice'
import { LoadingState } from '@/shared/components/LoadingState'
import { useCurrentTime } from '@/shared/hooks/useCurrentTime'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { purposes, requiredSubjects, subjectName } from '../model/catalog'
import { useCompleteTask, useOverview, useStudyGoal } from '../hooks/useStudy'
import type { Goal, Task } from '../model/types'

const shortNames: Record<string, string> = { literature: 'Văn', english: 'Anh', civics: 'GDKT & PL' }

function taskCategory(task: Task): string {
  if (task.subjectCode === 'literature' && /^(Viết|Luyện đề)/.test(task.topic)) return 'Luyện viết'
  if (task.subjectCode === 'english' && /^(Đọc|Sắp xếp)/.test(task.topic)) return 'Đọc hiểu'
  return 'Củng cố kiến thức'
}

const isDerivative = (task: Task) => task.subjectCode === 'math' && task.topic === 'Đạo hàm và khảo sát hàm số'

function GoalSummary({ goal }: { goal: Goal }) {
  return (
    <Card component="section" aria-labelledby="overview-goal-title" sx={{ p: 2.5 }}>
      <Typography id="overview-goal-title" variant="h2">Đích đến của bạn</Typography>
      <Typography color="text.secondary" sx={{ mb: 1.5 }}>
        {purposes.find((p) => p.code === goal.purpose)?.label} · Còn {goal.months} tháng
      </Typography>
      <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, m: 0 }}>
        {[...requiredSubjects, ...goal.electiveCodes].map((code) => (
          <Box key={code} sx={{ textAlign: 'center' }}>
            <Typography component="dt" variant="caption" color="text.secondary">{shortNames[code] ?? subjectName(code)}</Typography>
            <Typography component="dd" sx={{ m: 0, fontWeight: 700, color: 'primary.main' }}>{formatScore(goal.scores[code] ?? 0)}</Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
        {formatNumber((goal.dailyMinutes * goal.days.length) / 60)} giờ/tuần · {goal.days.length} ngày học
      </Typography>
    </Card>
  )
}

function QuickStudy({ task, onComplete, saving, error, titleRef }: {
  task: Task; onComplete: () => void; saving: boolean; error?: string; titleRef: React.RefObject<HTMLHeadingElement | null>
}) {
  return (
    <Card component="section" id="quick-study" aria-labelledby="quick-study-title" sx={{ p: 2.5 }}>
      <Typography variant="overline" color="primary">Học nhanh / {task.minutes} phút</Typography>
      <Typography id="quick-study-title" variant="h2" ref={titleRef} tabIndex={-1} sx={{ outline: 'none' }}>
        {isDerivative(task) ? 'Nhớ quy tắc đạo hàm' : task.topic}
      </Typography>
      {isDerivative(task) ? (
        <Box sx={{ my: 1.5 }}>
          <Typography sx={{ fontFamily: 'monospace' }}>(xⁿ)′ = n·xⁿ⁻¹<br />(u + v)′ = u′ + v′<br />(u·v)′ = u′v + uv′</Typography>
          <Typography sx={{ mt: 1 }}>Ví dụ: y = x³ − 3x + 2 ⇒ y′ = 3x² − 3.</Typography>
        </Box>
      ) : (
        <Typography sx={{ my: 1.5 }}>{task.content}</Typography>
      )}
      {task.completed ? (
        <Chip icon={<CheckCircleIcon />} color="success" label="Đã hoàn thành" role="status" />
      ) : (
        <Button variant="contained" disabled={saving} onClick={onComplete}>{saving ? 'Đang lưu…' : 'Đánh dấu đã học'}</Button>
      )}
      {error && <Alert severity="error" role="alert" sx={{ mt: 1.5 }}>{error}</Alert>}
    </Card>
  )
}

export default function OverviewPage() {
  useDocumentTitle('Tổng quan')
  const today = getVietnamDate(useCurrentTime())
  const goalQuery = useStudyGoal()
  const hasPlan = Boolean(goalQuery.data?.goal)
  const overview = useOverview(today, hasPlan)
  const complete = useCompleteTask()
  const [selected, setSelected] = useState<string | null>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  if (goalQuery.isPending) return <LoadingState label="Đang tải mục tiêu của bạn…" />
  if (goalQuery.isError) return <ErrorNotice error={goalQuery.error} onRetry={() => void goalQuery.refetch()} />

  const goal = goalQuery.data.goal
  const tasks = overview.data?.tasks ?? []
  const activeTask = tasks.find((t) => t.id === selected) ?? tasks.find((t) => !t.completed) ?? tasks[0]
  const done = tasks.filter((t) => t.completed).length
  const streak = Math.max(overview.data?.streakDays ?? 0, done > 0 ? 1 : 0)

  const pick = (id: string) => {
    setSelected(id)
    requestAnimationFrame(() => titleRef.current?.focus())
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="overline" color="primary"><time dateTime={today}>{formatFullDate(today)}</time></Typography>
          <Typography variant="h1" component="h1">Hôm nay học gì?</Typography>
          <Typography color="text.secondary">Một chút tập trung hôm nay, thêm tự tin ngày thi.</Typography>
        </Box>
        {overview.data && (
          <Chip icon={<LocalFireDepartmentIcon />} color="primary" variant="outlined" aria-live="polite"
            label={streak > 0 ? `${streak} ngày học liên tiếp` : 'Bắt đầu chuỗi học hôm nay'} />
        )}
      </Stack>

      {goal && (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' }, alignItems: 'start' }}>
          <Stack spacing={2}>
            {overview.isError && <ErrorNotice error={overview.error} onRetry={() => void overview.refetch()} />}
            {overview.isPending && <LoadingState label="Đang tải nhiệm vụ…" />}
            {overview.data && tasks.length === 0 && (
              <Card sx={{ p: 2.5 }}>
                <Typography variant="h2">Hôm nay bạn được nghỉ</Typography>
                <Typography color="text.secondary">
                  {overview.data.nextStudyDate
                    ? <>Ngày học tiếp theo: <time dateTime={overview.data.nextStudyDate}>{formatFullDate(overview.data.nextStudyDate)}</time>.</>
                    : 'Chưa có nhiệm vụ sắp tới. Bạn có thể cập nhật mục tiêu để tạo lịch mới.'}
                </Typography>
              </Card>
            )}
            {tasks.length > 0 && (
              <>
                <Box>
                  <Typography role="status" id="overview-progress-label">{done}/{tasks.length} nhiệm vụ đã hoàn thành</Typography>
                  <LinearProgress aria-labelledby="overview-progress-label" variant="determinate" value={(done / tasks.length) * 100} sx={{ height: 8, borderRadius: 4, mt: 0.5 }} />
                </Box>
                {tasks.map((task) => (
                  <Card key={task.id} component="article" sx={{ p: 2.5, opacity: task.completed ? 0.75 : 1 }}>
                    <Typography variant="overline" color="text.secondary">{subjectName(task.subjectCode)} / {taskCategory(task)}</Typography>
                    <Typography variant="h2">{subjectName(task.subjectCode)} · {task.topic} · {task.minutes} phút</Typography>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">{task.minutes} phút</Typography>
                      {task.completed
                        ? <Chip size="small" color="success" icon={<CheckCircleIcon />} label="Đã hoàn thành" />
                        : <Button size="small" variant="outlined" aria-label={`Học ngay: ${task.topic}`} aria-controls="quick-study"
                            disabled={complete.isPending} onClick={() => pick(task.id)}>Học ngay</Button>}
                    </Stack>
                  </Card>
                ))}
              </>
            )}
          </Stack>
          <Stack component="aside" spacing={2} aria-label="Mục tiêu và nội dung học">
            <GoalSummary goal={goal} />
            {activeTask && (
              <QuickStudy
                task={activeTask} titleRef={titleRef} saving={complete.isPending}
                error={complete.isError && complete.variables === activeTask.id ? complete.error.message : undefined}
                onComplete={() => complete.mutate(activeTask.id, { onSuccess: () => { setSelected(activeTask.id); requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true })) } })}
              />
            )}
          </Stack>
        </Box>
      )}

      <Card sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', bgcolor: 'divider' }}>
        <Box>
          <Typography variant="h2">{goal ? 'Cần một lộ trình mới?' : 'Bạn chưa có lộ trình học'}</Typography>
          <Typography color="text.secondary">
            {goal ? 'Cập nhật mục tiêu để điều chỉnh nhịp học của bạn.' : 'Chọn môn, điểm mục tiêu và thời gian học để MyStudy lập lịch cho bạn.'}
          </Typography>
        </Box>
        <Button component={RouterLink} to={paths.goal} variant="contained">Thiết lập mục tiêu</Button>
      </Card>
    </Stack>
  )
}

import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors } from '@/app/theme/theme'
import { formatFullDate, getVietnamDate } from '@/lib/date/vietnam-date'
import { formatNumber, formatScore } from '@/lib/format'
import { TopicNoteView } from '@/features/ai/components/TopicNoteView'
import { ErrorNotice } from '@/shared/components/ErrorNotice'
import { LoadingState } from '@/shared/components/LoadingState'
import { Kicker } from '@/shared/components/PageHeader'
import { useCurrentTime } from '@/shared/hooks/useCurrentTime'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useCompleteTask, useOverview, useStudyGoal, useUncompleteTask } from '../hooks/useStudy'
import { purposes, requiredSubjects, subjectName } from '../model/catalog'
import type { Goal, Task } from '../model/types'

const shortNames: Record<string, string> = { literature: 'Văn', english: 'Anh', civics: 'GDKT & PL' }

function taskCategory(task: Task): string {
  if (task.subjectCode === 'literature' && /^(Viết|Luyện đề)/.test(task.topic)) return 'Luyện viết'
  if (task.subjectCode === 'english' && /^(Đọc|Sắp xếp)/.test(task.topic)) return 'Đọc hiểu'
  return 'Củng cố kiến thức'
}

/** Nội dung buổi học; khi mở hộp thoại thì kèm ghi chú kiến thức cốt lõi của chuyên đề (lấy từ CSDL). */
function TopicContent({ task, full = false }: { task: Task; full?: boolean }) {
  return (
    <Box sx={{ my: 2.5 }}>
      <Typography color="text.secondary" sx={{ mb: full ? 2 : 0 }}>
        {task.content}
      </Typography>
      {full && task.topicId && <TopicNoteView topicId={task.topicId} />}
    </Box>
  )
}

function GoalSummary({ goal }: { goal: Goal }) {
  return (
    <Card component="section" aria-labelledby="overview-goal-title" sx={{ p: 3.5 }}>
      <Typography id="overview-goal-title" variant="h2" sx={{ fontWeight: 500 }}>
        Đích đến của bạn
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
        {purposes.find((p) => p.code === goal.purpose)?.label} · Còn {goal.months} tháng
      </Typography>
      <Box component="dl" sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', m: 0, mb: 2.5 }}>
        {[...requiredSubjects, ...goal.electiveCodes].map((code) => (
          <Box key={code}>
            <Typography component="dt" variant="caption" color="text.secondary">
              {shortNames[code] ?? subjectName(code)}
            </Typography>
            <Typography
              component="dd"
              sx={{ m: 0, fontWeight: 500, color: 'primary.main', fontSize: '1.7rem', lineHeight: 1.3 }}
            >
              {formatScore(goal.scores[code] ?? 0)}
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary">
        {formatNumber((goal.dailyMinutes * goal.days.length) / 60)} giờ/tuần · {goal.days.length} ngày học
      </Typography>
    </Card>
  )
}

function QuickStudy({
  task,
  onComplete,
  onUncomplete,
  saving,
  error,
  titleRef,
}: {
  task: Task
  onComplete: () => void
  onUncomplete?: () => void
  saving: boolean
  error?: string
  titleRef: React.RefObject<HTMLHeadingElement | null>
}) {
  return (
    <Card component="section" id="quick-study" aria-labelledby="quick-study-title" sx={{ p: 3.5 }}>
      <Kicker>Học nhanh / {task.minutes} phút</Kicker>
      <Typography
        id="quick-study-title"
        variant="h2"
        ref={titleRef}
        tabIndex={-1}
        sx={{ outline: 'none', mt: 2, fontWeight: 500 }}
      >
        {task.topic}
      </Typography>
      <TopicContent task={task} />
      {task.completed ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Typography role="status" sx={{ color: colors.successText, fontWeight: 600 }}>
            ✓ Đã hoàn thành
          </Typography>
          {onUncomplete && (
            <Button
              size="small"
              variant="text"
              color="inherit"
              disabled={saving}
              onClick={onUncomplete}
              sx={{ textDecoration: 'underline', color: 'text.secondary' }}
            >
              Hủy đánh dấu
            </Button>
          )}
        </Stack>
      ) : (
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={saving}
          onClick={onComplete}
          sx={{ py: 1.5 }}
        >
          {saving ? 'Đang lưu…' : 'Đánh dấu đã học'}
        </Button>
      )}
      {error && (
        <Typography role="alert" color="error" variant="body2" sx={{ mt: 1.5 }}>
          {error}
        </Typography>
      )}
    </Card>
  )
}

function NoPlan() {
  return (
    <Card sx={{ bgcolor: colors.lavender, borderColor: colors.lavender, p: 4, maxWidth: 420 }}>
      <Typography variant="h2" sx={{ fontWeight: 600 }}>
        Hôm nay học gì?
      </Typography>
      <Typography sx={{ fontWeight: 600, mt: 3 }}>Bạn chưa có lộ trình</Typography>
      <Typography color="text.secondary" sx={{ mt: 1.5, mb: 3 }}>
        Chọn mục tiêu và thời gian rảnh để MyStudy tạo nhiệm vụ học mỗi ngày cho bạn.
      </Typography>
      <Button
        component={RouterLink}
        to={paths.goal}
        variant="contained"
        size="large"
        fullWidth
        sx={{ py: 1.5 }}
      >
        Thiết lập mục tiêu
      </Button>
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
  const uncomplete = useUncompleteTask()
  const [selected, setSelected] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)

  if (goalQuery.isPending) return <LoadingState label="Đang tải mục tiêu của bạn…" />
  if (goalQuery.isError)
    return <ErrorNotice error={goalQuery.error} onRetry={() => void goalQuery.refetch()} />

  const goal = goalQuery.data.goal
  const tasks = overview.data?.tasks ?? []
  const activeTask = tasks.find((t) => t.id === selected) ?? tasks.find((t) => !t.completed) ?? tasks[0]
  const done = tasks.filter((t) => t.completed).length
  const streak = Math.max(overview.data?.streakDays ?? 0, done > 0 ? 1 : 0)

  const pick = (id: string, openDialog = false) => {
    setSelected(id)
    if (openDialog) {
      setDialogOpen(true)
    } else {
      requestAnimationFrame(() => titleRef.current?.focus())
    }
  }

  return (
    <Stack spacing={4}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}
      >
        <Box>
          <Kicker sx={{ mb: 1.5 }}>
            <time dateTime={today}>{formatFullDate(today)}</time>
          </Kicker>
          <Typography variant="h1" component="h1">
            Hôm nay học gì?
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5 }}>
            Một chút tập trung hôm nay, thêm tự tin ngày thi.
          </Typography>
        </Box>
        {overview.data && (
          <Box
            aria-live="polite"
            sx={{
              bgcolor: colors.lavender,
              color: 'primary.main',
              fontWeight: 500,
              borderRadius: 3,
              px: 2.25,
              py: 1.5,
            }}
          >
            {streak > 0 ? `${streak} ngày học liên tiếp` : 'Bắt đầu chuỗi học hôm nay'}
          </Box>
        )}
      </Stack>

      {!goal && <NoPlan />}

      {goal && (
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: '1.7fr 1fr' },
            alignItems: 'start',
          }}
        >
          <Stack spacing={2.5}>
            {overview.isError && (
              <ErrorNotice error={overview.error} onRetry={() => void overview.refetch()} />
            )}
            {overview.isPending && <LoadingState label="Đang tải nhiệm vụ…" />}
            {overview.data && tasks.length === 0 && (
              <Card sx={{ p: 3.5 }}>
                <Typography variant="h2">Hôm nay bạn được nghỉ</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {overview.data.nextStudyDate ? (
                    <>
                      Ngày học tiếp theo:{' '}
                      <time dateTime={overview.data.nextStudyDate}>
                        {formatFullDate(overview.data.nextStudyDate)}
                      </time>
                      .
                    </>
                  ) : (
                    'Chưa có nhiệm vụ sắp tới. Bạn có thể cập nhật mục tiêu để tạo lịch mới.'
                  )}
                </Typography>
              </Card>
            )}
            {tasks.length > 0 && (
              <>
                <Box>
                  <Typography
                    role="status"
                    id="overview-progress-label"
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {done}/{tasks.length} nhiệm vụ đã hoàn thành
                  </Typography>
                  <LinearProgress
                    aria-labelledby="overview-progress-label"
                    variant="determinate"
                    value={(done / tasks.length) * 100}
                    sx={{ height: 6 }}
                  />
                </Box>
                {tasks.map((task) => (
                  <Card
                    key={task.id}
                    component="article"
                    sx={{
                      p: 3,
                      bgcolor: task.completed ? colors.successBg : '#fff',
                      borderColor: task.completed ? colors.successBg : colors.border,
                    }}
                  >
                    <Kicker>
                      {subjectName(task.subjectCode)} / {taskCategory(task)}
                    </Kicker>
                    <Typography variant="h2" sx={{ mt: 1.5, fontWeight: 600 }}>
                      {subjectName(task.subjectCode)} · {task.topic} · {task.minutes} phút
                    </Typography>
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 2.5 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {task.minutes} phút
                      </Typography>
                      {task.completed ? (
                        <Box sx={{ textAlign: 'right' }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Box
                              sx={{
                                bgcolor: colors.lavender,
                                color: colors.successText,
                                borderRadius: 2,
                                px: 1.75,
                                py: 0.75,
                                fontWeight: 500,
                                fontSize: 14,
                              }}
                            >
                              ✓ Đã hoàn thành
                            </Box>
                            <Button
                              size="small"
                              variant="text"
                              color="inherit"
                              disabled={uncomplete.isPending && uncomplete.variables === task.id}
                              onClick={() => uncomplete.mutate(task.id)}
                              sx={{ textDecoration: 'underline', color: 'text.secondary', fontSize: 13 }}
                            >
                              {uncomplete.isPending && uncomplete.variables === task.id ? 'Đang hủy…' : 'Hủy'}
                            </Button>
                          </Stack>
                          {uncomplete.isError && uncomplete.variables === task.id && (
                            <Typography role="alert" color="error" variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                              {uncomplete.error.message}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Button
                          size="small"
                          variant="soft"
                          aria-label={`Học ngay: ${task.topic}`}
                          aria-controls="quick-study"
                          disabled={complete.isPending}
                          onClick={() => pick(task.id, true)}
                        >
                          Học ngay
                        </Button>
                      )}
                    </Stack>
                  </Card>
                ))}
              </>
            )}
          </Stack>
          <Stack component="aside" spacing={2.5} aria-label="Mục tiêu và nội dung học">
            <GoalSummary goal={goal} />
            {activeTask && (
              <QuickStudy
                task={activeTask}
                titleRef={titleRef}
                saving={complete.isPending || uncomplete.isPending}
                error={
                  complete.isError && complete.variables === activeTask.id
                    ? complete.error.message
                    : uncomplete.isError && uncomplete.variables === activeTask.id
                      ? uncomplete.error.message
                      : undefined
                }
                onComplete={() =>
                  complete.mutate(activeTask.id, {
                    onSuccess: () => {
                      setSelected(activeTask.id)
                      requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }))
                    },
                  })
                }
                onUncomplete={() => uncomplete.mutate(activeTask.id)}
              />
            )}
          </Stack>
        </Box>
      )}

      {goal && (
        <Box
          sx={{
            bgcolor: colors.lavender,
            borderRadius: 4.5,
            p: 3.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography variant="h2" sx={{ fontWeight: 600 }}>
              Cần một lộ trình mới?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Cập nhật mục tiêu để điều chỉnh nhịp học của bạn.
            </Typography>
          </Box>
          <Button component={RouterLink} to={paths.goal} variant="contained" size="large">
            Thiết lập mục tiêu
          </Button>
        </Box>
      )}

      <Dialog
        open={dialogOpen && !!activeTask}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="dialog-study-title"
      >
        {activeTask && (
          <>
            <DialogTitle
              id="dialog-study-title"
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <Box>
                <Kicker>Học nhanh / {activeTask.minutes} phút</Kicker>
                <Typography variant="h2" sx={{ mt: 1, fontWeight: 600, fontSize: '1.4rem' }}>
                  {activeTask.topic}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {subjectName(activeTask.subjectCode)} · {taskCategory(activeTask)}
                </Typography>
              </Box>
              <IconButton aria-label="Đóng" onClick={() => setDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <TopicContent task={activeTask} full />
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              {activeTask.completed ? (
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ width: '100%', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography role="status" sx={{ color: colors.successText, fontWeight: 600 }}>
                    ✓ Đã hoàn thành
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    color="inherit"
                    disabled={uncomplete.isPending}
                    onClick={() => {
                      uncomplete.mutate(activeTask.id, {
                        onSuccess: () => setDialogOpen(false),
                      })
                    }}
                    sx={{ textDecoration: 'underline', color: 'text.secondary' }}
                  >
                    Hủy đánh dấu
                  </Button>
                </Stack>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={complete.isPending}
                  onClick={() => {
                    complete.mutate(activeTask.id, {
                      onSuccess: () => setDialogOpen(false),
                    })
                  }}
                  sx={{ py: 1.5 }}
                >
                  {complete.isPending ? 'Đang lưu…' : 'Đánh dấu đã học'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Stack>
  )
}

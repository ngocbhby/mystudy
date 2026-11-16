import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, Navigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors } from '@/app/theme/theme'
import { getVietnamDate } from '@/lib/date/vietnam-date'
import { formatNumber } from '@/lib/format'
import { ErrorNotice } from '@/shared/components/ErrorNotice'
import { LoadingState } from '@/shared/components/LoadingState'
import { Kicker } from '@/shared/components/PageHeader'
import { useCurrentTime } from '@/shared/hooks/useCurrentTime'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useCompleteTask, useSaveGoal, useStudyGoal, useUncompleteTask, useWeekTasks } from '../hooks/useStudy'
import { formatWeekRange, getPlanPeriod, getStudyWeek, type WeekDay } from '../model/calendar'
import { purposes, strategies, subjectName, weekdays } from '../model/catalog'
import type { Goal, Plan, Strategy, Task } from '../model/types'

const outlined = {
  bgcolor: '#fff',
  borderColor: colors.border,
  color: 'text.primary',
  fontWeight: 500,
} as const

function StrategyPicker({ goal, plan, onSaved }: { goal: Goal; plan: Plan; onSaved: () => void }) {
  const [strategy, setStrategy] = useState<Strategy>(plan.strategy)
  const save = useSaveGoal()
  const changed = strategy !== plan.strategy
  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (changed) save.mutate({ ...goal, strategy }, { onSuccess: onSaved })
      }}
    >
      <Box
        role="radiogroup"
        aria-label="Cách ôn tập"
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}
      >
        {strategies.map(({ code, label, detail }) => {
          const selected = strategy === code
          return (
            <Card
              key={code}
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              onClick={() => {
                if (!save.isPending) {
                  setStrategy(code)
                  save.reset()
                }
              }}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  setStrategy(code)
                }
              }}
              sx={{
                p: 3,
                cursor: 'pointer',
                bgcolor: selected ? colors.lavender : '#fff',
                borderColor: selected ? 'primary.main' : colors.border,
              }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                {selected ? (
                  <RadioButtonCheckedIcon color="primary" fontSize="small" />
                ) : (
                  <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                )}
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    color: selected ? 'primary.main' : 'text.primary',
                  }}
                >
                  {label}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
                {detail}
              </Typography>
            </Card>
          )
        })}
      </Box>
      {changed && (
        <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            Lịch sẽ được xếp lại theo cách ôn đã chọn. Các nhiệm vụ đã học được giữ lại.
          </Typography>
          <Button type="submit" variant="contained" size="small" disabled={save.isPending}>
            {save.isPending ? 'Đang tạo lại…' : 'Tạo lại lịch'}
          </Button>
        </Stack>
      )}
      {save.isError && (
        <Alert severity="error" role="alert" sx={{ mt: 2 }}>
          {save.error.message}
        </Alert>
      )}
    </Box>
  )
}

function TaskItem({ task, today }: { task: Task; today: string }) {
  const complete = useCompleteTask()
  const uncomplete = useUncompleteTask()
  const saving = complete.isPending || uncomplete.isPending
  const error = complete.error?.message ?? uncomplete.error?.message
  return (
    <Accordion
      disableGutters
      elevation={0}
      square={false}
      sx={{
        '&::before': { display: 'none' },
        borderRadius: '12px !important',
        bgcolor: task.completed ? colors.successBg : '#fff',
        border: 1,
        borderColor: task.completed ? colors.successBg : colors.border,
      }}
    >
      <AccordionSummary
        sx={{ px: 1.5, py: 0.25, '& .MuiAccordionSummary-content': { my: 1, display: 'block' } }}
      >
        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {subjectName(task.subjectCode)}
        </Typography>
        <Typography sx={{ fontWeight: 600, fontSize: 15, lineHeight: 1.35 }}>{task.topic}</Typography>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
          {task.minutes} phút
        </Typography>
        <Typography
          variant="caption"
          component="div"
          sx={{
            color: task.completed ? colors.successText : 'text.secondary',
            fontWeight: task.completed ? 600 : 400,
          }}
        >
          {task.completed ? '✓ Đã học' : 'Chưa học'}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.5, pt: 0 }}>
        <Typography variant="body2">{task.content}</Typography>
        {task.completed ? (
          <Button
            size="small"
            variant="text"
            color="inherit"
            sx={{ mt: 1.5, textDecoration: 'underline', color: 'text.secondary', display: 'block' }}
            disabled={saving}
            onClick={() => uncomplete.mutate(task.id)}
          >
            {uncomplete.isPending ? 'Đang hủy…' : 'Hủy đánh dấu đã học'}
          </Button>
        ) : (
          task.date <= today && (
            <Button
              size="small"
              variant="contained"
              sx={{ mt: 1.5 }}
              disabled={saving}
              onClick={() => complete.mutate(task.id)}
            >
              {complete.isPending ? 'Đang lưu…' : 'Đánh dấu đã học'}
            </Button>
          )
        )}
        {error && (
          <Alert severity="error" role="alert" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

function DayColumn({
  day,
  index,
  tasks,
  today,
  isStudyDay,
  withinPlan,
}: {
  day: WeekDay
  index: number
  tasks: Task[]
  today: string
  isStudyDay: boolean
  withinPlan: boolean
}) {
  const visible = tasks.slice(0, 2)
  const more = tasks.slice(2)
  return (
    <Box
      component="section"
      aria-current={day.isToday ? 'date' : undefined}
      aria-labelledby={`plan-day-${day.iso}`}
      sx={{
        bgcolor: day.isToday ? '#f3effd' : colors.surface,
        border: 1,
        borderColor: day.isToday ? 'primary.main' : 'transparent',
        borderRadius: 4,
        p: 1.5,
        minHeight: 200,
      }}
    >
      <Box id={`plan-day-${day.iso}`} sx={{ mb: 1.5 }}>
        <Typography
          variant="body2"
          component="h3"
          sx={{ color: day.isToday ? 'primary.main' : 'text.secondary', fontWeight: 500 }}
        >
          {weekdays[index]?.label
            .replace('Thứ Hai', 'Thứ hai')
            .replace('Thứ Ba', 'Thứ ba')
            .replace('Thứ Tư', 'Thứ tư')
            .replace('Thứ Năm', 'Thứ năm')
            .replace('Thứ Sáu', 'Thứ sáu')
            .replace('Thứ Bảy', 'Thứ bảy')
            .replace('Chủ nhật', 'Chủ nhật')}
          {day.isToday && <span style={{ position: 'absolute', left: -9999 }}>, hôm nay</span>}
        </Typography>
        <Typography
          component="time"
          dateTime={day.iso}
          sx={{
            display: 'block',
            fontSize: '1.8rem',
            fontWeight: 500,
            color: day.isToday ? 'primary.main' : 'text.primary',
            lineHeight: 1.3,
          }}
        >
          {day.day}
        </Typography>
      </Box>
      <Stack spacing={1}>
        {visible.map((task) => (
          <TaskItem key={task.id} task={task} today={today} />
        ))}
        {visible.length === 0 && (
          <Box sx={{ color: 'text.secondary', pt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {withinPlan && !isStudyDay ? 'Nghỉ & nạp năng lượng' : 'Không có nhiệm vụ'}
            </Typography>
            <Typography variant="caption" component="p" sx={{ mt: 1 }}>
              {withinPlan && !isStudyDay
                ? 'Bạn có thể ôn lại những phần còn vướng.'
                : !withinPlan
                  ? 'Ngày này nằm ngoài lộ trình hiện tại.'
                  : ''}
            </Typography>
          </Box>
        )}
        {more.length > 0 && (
          <Accordion
            disableGutters
            elevation={0}
            sx={{ '&::before': { display: 'none' }, bgcolor: 'transparent' }}
          >
            <AccordionSummary sx={{ px: 0.5, minHeight: 0, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                + {more.length === 1 ? subjectName(more[0]!.subjectCode) : `${more.length} nhiệm vụ`} ·{' '}
                {more.reduce((s, t) => s + t.minutes, 0)} phút
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Stack spacing={1}>
                {more.map((task) => (
                  <TaskItem key={task.id} task={task} today={today} />
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}
      </Stack>
    </Box>
  )
}

export default function PlanPage() {
  useDocumentTitle('Lộ trình')
  const now = useCurrentTime()
  const today = getVietnamDate(now)
  const [offset, setOffset] = useState(0)
  const [saved, setSaved] = useState(false)
  const goalQuery = useStudyGoal()
  const { days } = getStudyWeek(now, offset)
  const first = days[0]!.iso
  const last = days[6]!.iso
  const tasks = useWeekTasks(first, last)

  if (goalQuery.isPending) return <LoadingState label="Đang tải lộ trình…" />
  if (goalQuery.isError)
    return <ErrorNotice error={goalQuery.error} onRetry={() => void goalQuery.refetch()} />
  const { goal, plan } = goalQuery.data
  if (!goal || !plan) return <Navigate to={paths.goal} replace />

  const { week, total, endsBefore } = getPlanPeriod(plan.startsOn, goal.months, first)
  const weekLabel =
    week < 1 ? 'Trước khi bắt đầu' : week > total ? 'Sau khi kết thúc' : `Tuần ${week} / ${total}`
  const byDate = Object.groupBy(tasks.data ?? [], (t) => t.date)

  return (
    <Stack spacing={3.5}>
      <Box>
        <Kicker sx={{ mb: 1.5 }}>Lộ trình của riêng bạn</Kicker>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
        >
          <Typography variant="h1" component="h1">
            Đi từng bước, đến đúng đích.
          </Typography>
          <Button component={RouterLink} to={paths.goal} variant="outlined" sx={outlined}>
            Chỉnh mục tiêu
          </Button>
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {weekLabel} · {purposes.find((p) => p.code === goal.purpose)?.label} · Quỹ giờ:{' '}
          {formatNumber((goal.dailyMinutes * goal.days.length) / 60)} giờ/tuần
        </Typography>
      </Box>

      <StrategyPicker
        key={plan.id}
        goal={goal}
        plan={plan}
        onSaved={() => {
          setOffset(0)
          setSaved(true)
        }}
      />
      {saved && (
        <Alert severity="success" role="status" onClose={() => setSaved(false)}>
          Đã cập nhật cách ôn và lịch học.
        </Alert>
      )}

      <Card component="section" aria-labelledby="plan-week-title" sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 3 }}
        >
          <Typography id="plan-week-title" variant="h2" aria-live="polite" sx={{ fontWeight: 600 }}>
            {formatWeekRange(days)}
          </Typography>
          <ButtonGroup
            variant="outlined"
            aria-label="Chuyển tuần"
            sx={{ gap: 1, '& .MuiButton-root': { borderRadius: '10px !important', ...outlined } }}
          >
            <Button onClick={() => setOffset((v) => v - 1)}>← Tuần trước</Button>
            <Button onClick={() => setOffset(0)}>Tuần này</Button>
            <Button onClick={() => setOffset((v) => v + 1)}>Tuần sau →</Button>
          </ButtonGroup>
        </Stack>
        {tasks.isError && <ErrorNotice error={tasks.error} onRetry={() => void tasks.refetch()} />}
        {tasks.isPending && <LoadingState label="Đang tải lịch học…" />}
        {tasks.data && (
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
                lg: 'repeat(7, 1fr)',
              },
            }}
          >
            {days.map((day, index) => (
              <DayColumn
                key={day.iso}
                day={day}
                index={index}
                tasks={byDate[day.iso] ?? []}
                today={today}
                isStudyDay={goal.days.includes(index + 1)}
                withinPlan={day.iso >= plan.startsOn && day.iso < endsBefore}
              />
            ))}
          </Box>
        )}
      </Card>

      <Box
        sx={{
          bgcolor: colors.lavender,
          borderRadius: 4,
          px: 3,
          py: 2.25,
          display: 'flex',
          gap: 2,
          alignItems: 'baseline',
          flexWrap: 'wrap',
        }}
      >
        <Kicker sx={{ fontWeight: 600 }}>Nhịp học bền vững</Kicker>
        <Typography variant="body2">
          Sau mỗi 25 phút tập trung, nghỉ 5 phút. Hoàn thành từng việc nhỏ cũng là tiến bộ.
        </Typography>
      </Box>
    </Stack>
  )
}

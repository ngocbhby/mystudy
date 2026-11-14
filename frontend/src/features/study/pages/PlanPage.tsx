import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, ButtonGroup, Card, Radio, RadioGroup,
  FormControlLabel, Stack, Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, Navigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { getVietnamDate } from '@/lib/date/vietnam-date'
import { formatNumber } from '@/lib/format'
import { ErrorNotice } from '@/shared/components/ErrorNotice'
import { LoadingState } from '@/shared/components/LoadingState'
import { useCurrentTime } from '@/shared/hooks/useCurrentTime'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { purposes, strategies, subjectName, weekdays } from '../model/catalog'
import { getPlanPeriod, getStudyWeek, formatWeekRange, type WeekDay } from '../model/calendar'
import { useCompleteTask, useSaveGoal, useStudyGoal, useWeekTasks } from '../hooks/useStudy'
import type { Goal, Plan, Strategy, Task } from '../model/types'

function StrategyPicker({ goal, plan, onSaved }: { goal: Goal; plan: Plan; onSaved: () => void }) {
  const [strategy, setStrategy] = useState<Strategy>(plan.strategy)
  const save = useSaveGoal()
  const changed = strategy !== plan.strategy
  return (
    <Card component="form" sx={{ p: 2.5 }} onSubmit={(e) => { e.preventDefault(); if (changed) save.mutate({ ...goal, strategy }, { onSuccess: onSaved }) }}>
      <RadioGroup row aria-label="Cách ôn tập" value={strategy} onChange={(e) => { setStrategy(e.target.value as Strategy); save.reset() }}>
        {strategies.map(({ code, label, detail }) => (
          <FormControlLabel key={code} value={code} disabled={save.isPending} sx={{ alignItems: 'flex-start', mr: 4, maxWidth: 360 }}
            control={<Radio />} label={<Box><Typography sx={{ fontWeight: 600 }}>{label}</Typography><Typography variant="body2" color="text.secondary">{detail}</Typography></Box>} />
        ))}
      </RadioGroup>
      {changed && (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 1.5 }}>
          <Typography variant="body2" color="text.secondary">Lịch sẽ được xếp lại theo cách ôn đã chọn. Các nhiệm vụ đã học được giữ lại.</Typography>
          <Button type="submit" variant="contained" size="small" disabled={save.isPending}>{save.isPending ? 'Đang tạo lại…' : 'Tạo lại lịch'}</Button>
        </Stack>
      )}
      {save.isError && <Alert severity="error" role="alert" sx={{ mt: 1.5 }}>{save.error.message}</Alert>}
    </Card>
  )
}

function TaskItem({ task, today }: { task: Task; today: string }) {
  const complete = useCompleteTask()
  return (
    <Accordion disableGutters variant="outlined" sx={{ '&::before': { display: 'none' }, bgcolor: task.completed ? 'action.hover' : 'background.paper' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack spacing={0.25}>
          <Typography variant="caption" color="text.secondary">{subjectName(task.subjectCode)}</Typography>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{task.topic}</Typography>
          <Typography variant="caption" color="text.secondary">
            {task.minutes} phút · {task.completed ? '✓ Đã học' : 'Chưa học'}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2">{task.content}</Typography>
        {!task.completed && task.date <= today && (
          <Button size="small" variant="contained" sx={{ mt: 1.5 }} disabled={complete.isPending} onClick={() => complete.mutate(task.id)}>
            {complete.isPending ? 'Đang lưu…' : 'Đánh dấu đã học'}
          </Button>
        )}
        {complete.isError && <Alert severity="error" role="alert" sx={{ mt: 1 }}>{complete.error.message}</Alert>}
      </AccordionDetails>
    </Accordion>
  )
}

function DayColumn({ day, index, tasks, today, isStudyDay, withinPlan }: {
  day: WeekDay; index: number; tasks: Task[]; today: string; isStudyDay: boolean; withinPlan: boolean
}) {
  const visible = tasks.slice(0, 2)
  const more = tasks.slice(2)
  return (
    <Card component="section" aria-current={day.isToday ? 'date' : undefined} aria-labelledby={`plan-day-${day.iso}`}
      sx={{ p: 1.5, borderColor: day.isToday ? 'primary.main' : 'divider', borderWidth: day.isToday ? 2 : 1 }}>
      <Stack direction="row" id={`plan-day-${day.iso}`} sx={{ justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h3" sx={{ fontSize: 14 }}>{weekdays[index]?.label}{day.isToday && <span style={{ position: 'absolute', left: -9999 }}>, hôm nay</span>}</Typography>
        <Typography component="time" dateTime={day.iso} sx={{ fontWeight: 700 }}>{day.day}</Typography>
      </Stack>
      <Stack spacing={1}>
        {visible.map((task) => <TaskItem key={task.id} task={task} today={today} />)}
        {visible.length === 0 && (
          <Box sx={{ color: 'text.secondary' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{withinPlan && !isStudyDay ? 'Nghỉ & nạp năng lượng' : 'Không có nhiệm vụ'}</Typography>
            <Typography variant="caption">
              {withinPlan && !isStudyDay ? 'Bạn có thể ôn lại những phần còn vướng.' : !withinPlan ? 'Ngày này nằm ngoài lộ trình hiện tại.' : ''}
            </Typography>
          </Box>
        )}
        {more.length > 0 && (
          <Accordion disableGutters variant="outlined" sx={{ '&::before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2">{more.length === 1 ? subjectName(more[0]!.subjectCode) : `${more.length} nhiệm vụ`} · {more.reduce((s, t) => s + t.minutes, 0)} phút</Typography>
            </AccordionSummary>
            <AccordionDetails><Stack spacing={1}>{more.map((task) => <TaskItem key={task.id} task={task} today={today} />)}</Stack></AccordionDetails>
          </Accordion>
        )}
      </Stack>
    </Card>
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
  if (goalQuery.isError) return <ErrorNotice error={goalQuery.error} onRetry={() => void goalQuery.refetch()} />
  const { goal, plan } = goalQuery.data
  if (!goal || !plan) return <Navigate to={paths.goal} replace />

  const { week, total, endsBefore } = getPlanPeriod(plan.startsOn, goal.months, first)
  const weekLabel = week < 1 ? 'Trước khi bắt đầu' : week > total ? 'Sau khi kết thúc' : `Tuần ${week} / ${total}`
  const byDate = Object.groupBy(tasks.data ?? [], (t) => t.date)

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary" sx={{ fontWeight: 600 }}>Lộ trình của riêng bạn</Typography>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h1" component="h1">Đi từng bước, đến đúng đích.</Typography>
          <Button component={RouterLink} to={paths.goal} variant="outlined">Chỉnh mục tiêu</Button>
        </Stack>
        <Typography color="text.secondary">
          {weekLabel} · {purposes.find((p) => p.code === goal.purpose)?.label} · Quỹ giờ: {formatNumber((goal.dailyMinutes * goal.days.length) / 60)} giờ/tuần
        </Typography>
      </Box>

      <StrategyPicker key={plan.id} goal={goal} plan={plan} onSaved={() => { setOffset(0); setSaved(true) }} />
      {saved && <Alert severity="success" role="status" onClose={() => setSaved(false)}>Đã cập nhật cách ôn và lịch học.</Alert>}

      <Card component="section" aria-labelledby="plan-week-title" sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          <Typography id="plan-week-title" variant="h2" aria-live="polite">{formatWeekRange(days)}</Typography>
          <ButtonGroup variant="outlined" aria-label="Chuyển tuần" size="small">
            <Button startIcon={<ChevronLeftIcon />} onClick={() => setOffset((v) => v - 1)}>Tuần trước</Button>
            <Button onClick={() => setOffset(0)}>Tuần này</Button>
            <Button endIcon={<ChevronRightIcon />} onClick={() => setOffset((v) => v + 1)}>Tuần sau</Button>
          </ButtonGroup>
        </Stack>
        {tasks.isError && <ErrorNotice error={tasks.error} onRetry={() => void tasks.refetch()} />}
        {tasks.isPending && <LoadingState label="Đang tải lịch học…" />}
        {tasks.data && (
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
            {days.map((day, index) => (
              <DayColumn key={day.iso} day={day} index={index} tasks={byDate[day.iso] ?? []} today={today}
                isStudyDay={goal.days.includes(index + 1)} withinPlan={day.iso >= plan.startsOn && day.iso < endsBefore} />
            ))}
          </Box>
        )}
      </Card>

      <Alert icon={<CheckCircleIcon />} severity="info" variant="outlined">
        <strong>Nhịp học bền vững.</strong> Sau mỗi 25 phút tập trung, nghỉ 5 phút. Hoàn thành từng việc nhỏ cũng là tiến bộ.
      </Alert>
    </Stack>
  )
}

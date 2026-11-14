import CheckIcon from '@mui/icons-material/Check'
import { Box, Card, Stack, Typography } from '@mui/material'
import { useCurrentTime } from '@/shared/hooks/useCurrentTime'
import { getStudyWeek } from '../model/calendar'

/** Tuần học minh họa ở trang đăng nhập; ngày hiện tại được tô theo múi giờ Việt Nam. */
export function StudyWeekPreview() {
  const { days, range } = getStudyWeek(useCurrentTime())
  return (
    <Card component="section" aria-labelledby="study-week-title" sx={{ p: 2.5, maxWidth: 520 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
        <Typography id="study-week-title" variant="h3" component="h3">Tuần học của bạn</Typography>
        <Typography variant="caption" color="text.secondary">{range}</Typography>
      </Stack>
      <Box component="ul" role="list" aria-label="Lịch học minh họa" sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.75, p: 0, m: 0, listStyle: 'none' }}>
        {days.map(({ label, day, iso, isToday }) => (
          <Box
            component="li" key={iso} aria-current={isToday ? 'date' : undefined}
            sx={{ textAlign: 'center', py: 1, borderRadius: 2, bgcolor: isToday ? 'primary.main' : 'action.hover', color: isToday ? 'primary.contrastText' : 'text.primary' }}
          >
            <Typography variant="caption" sx={{ display: 'block' }}>{label}</Typography>
            <Typography component="strong" sx={{ fontWeight: 700 }}><time dateTime={iso}>{day}</time></Typography>
          </Box>
        ))}
      </Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 2 }}>
        <CheckIcon color="primary" aria-hidden />
        <Box>
          <Typography sx={{ fontWeight: 600 }}>Toán · Ôn đạo hàm</Typography>
          <Typography variant="body2" color="text.secondary">25 phút mỗi ngày, vững vàng hơn mỗi tuần.</Typography>
        </Box>
      </Stack>
    </Card>
  )
}

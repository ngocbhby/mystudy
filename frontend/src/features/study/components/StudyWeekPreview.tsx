import CheckIcon from '@mui/icons-material/Check'
import { Box, Stack, Typography } from '@mui/material'
import { colors } from '@/app/theme/theme'
import { useCurrentTime } from '@/shared/hooks/useCurrentTime'
import { getStudyWeek } from '../model/calendar'

/** Tuần học minh họa ở trang đăng nhập; ngày hiện tại được tô theo múi giờ Việt Nam. */
export function StudyWeekPreview() {
  const { days, range } = getStudyWeek(useCurrentTime())
  return (
    <Box
      component="section"
      aria-labelledby="study-week-title"
      sx={{ bgcolor: '#fff', borderRadius: 6, p: 3.5, width: '100%', maxWidth: 600 }}
    >
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, alignItems: 'baseline' }}>
        <Typography
          id="study-week-title"
          variant="h3"
          component="h3"
          sx={{ fontWeight: 500, fontSize: '1.15rem' }}
        >
          Tuần học của bạn
        </Typography>
        <Typography variant="overline" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
          {range}
        </Typography>
      </Stack>
      <Box
        component="ul"
        role="list"
        aria-label="Lịch học minh họa"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1.25,
          p: 0,
          m: 0,
          listStyle: 'none',
        }}
      >
        {days.map(({ label, day, iso, isToday }) => (
          <Box
            component="li"
            key={iso}
            aria-current={isToday ? 'date' : undefined}
            sx={{
              textAlign: 'center',
              py: 1.5,
              borderRadius: 2.5,
              bgcolor: isToday ? 'primary.main' : colors.tile,
              color: isToday ? '#fff' : 'text.primary',
            }}
          >
            <Typography
              variant="caption"
              component="span"
              sx={{ display: 'block', color: 'inherit', opacity: isToday ? 0.9 : 0.7 }}
            >
              {label}
            </Typography>
            <Typography component="strong" sx={{ fontWeight: 600, fontSize: '1.4rem' }}>
              <time dateTime={iso}>{day}</time>
            </Typography>
          </Box>
        ))}
      </Box>
      <Stack
        direction="row"
        spacing={2}
        sx={{ mt: 2.5, bgcolor: colors.successBg, borderRadius: 3, p: 2, alignItems: 'center' }}
      >
        <CheckIcon sx={{ color: colors.successText }} aria-hidden />
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 15 }}>Toán · Ôn đạo hàm</Typography>
          <Typography variant="body2" color="text.secondary">
            25 phút mỗi ngày, vững vàng hơn mỗi tuần.
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}

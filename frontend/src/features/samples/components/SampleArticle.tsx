import { Box, Card, Typography } from '@mui/material'
import { colors } from '@/app/theme/theme'
import { subjectName } from '@/features/study/model/catalog'
import { Kicker } from '@/shared/components/PageHeader'
import { parseSolution } from '../model/solution'
import type { Sample } from '../model/types'

const label = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: 'text.secondary',
  letterSpacing: '0.04em',
} as const

/** Bài mẫu đầy đủ: đề bài, lời giải (các bước hoặc bài viết) và ghi chú cách làm. */
export function SampleArticle({ sample }: { sample: Sample }) {
  const layout = parseSolution(sample.modelSolution)
  const steps = layout.kind === 'steps'
  return (
    <Card
      component="article"
      id={`sample-${sample.id}`}
      tabIndex={-1}
      aria-labelledby={`sample-title-${sample.id}`}
      sx={{ p: 3.5, scrollMarginTop: 24, outline: 'none' }}
    >
      <Kicker>
        {subjectName(sample.subjectCode)} / {sample.topic}
      </Kicker>
      <Typography
        id={`sample-title-${sample.id}`}
        variant="h2"
        sx={{ mt: 1.5, fontWeight: 600, fontSize: '1.6rem' }}
      >
        {sample.title}
      </Typography>

      <Typography sx={{ ...label, mt: 3 }}>Đề bài</Typography>
      <Typography sx={{ fontWeight: 500, mt: 1 }}>{sample.prompt}</Typography>

      <Typography sx={{ ...label, mt: 3 }}>{steps ? 'Lời giải' : 'Bài viết tham khảo'}</Typography>
      {layout.kind === 'steps' ? (
        <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, mt: 1.5, display: 'grid', gap: 2 }}>
          {layout.steps.map((step, index) => (
            <Box component="li" key={index} sx={{ display: 'flex', gap: 2 }}>
              <Typography aria-hidden sx={{ color: 'primary.main', fontWeight: 600 }}>
                {String(index + 1).padStart(2, '0')}
              </Typography>
              <Typography>{step}</Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ mt: 1.5, display: 'grid', gap: 2.5 }}>
          {layout.paragraphs.map((paragraph, index) => (
            <Typography key={index}>{paragraph}</Typography>
          ))}
        </Box>
      )}

      <Box
        sx={{
          mt: 3,
          borderRadius: 3,
          p: 2,
          bgcolor: steps ? colors.warningBg : colors.lavender,
          color: steps ? colors.warningText : colors.ink,
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: steps ? colors.warningText : 'primary.main',
            mb: 0.75,
          }}
        >
          {steps ? 'Ghi chú cách làm' : 'Cách triển khai'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'inherit' }}>
          {sample.solutionNote}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2 }}>
        Nguồn: {sample.source} · Bài minh họa
      </Typography>
    </Card>
  )
}

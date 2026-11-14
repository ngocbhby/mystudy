import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Box, Button, Card, MenuItem, Select, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { colors } from '@/app/theme/theme'
import { subjectName } from '@/features/study/model/catalog'
import { ErrorNotice } from '@/shared/components/ErrorNotice'
import { Kicker, PageHeader } from '@/shared/components/PageHeader'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { SampleArticle } from '../components/SampleArticle'
import { useSamples } from '../hooks/useSamples'

const filterSx = {
  minWidth: 150,
  borderRadius: 2.5,
  fontWeight: 500,
  '& fieldset': { borderColor: colors.border },
} as const

export default function SamplesPage() {
  useDocumentTitle('Kho bài mẫu')
  const [filters, setFilters] = useState({ subject: '', topic: '' })
  const unfiltered = useSamples({ subject: '', topic: '' })
  const list = useSamples(filters)
  const options = unfiltered.data
  const topics = options?.topics.filter((t) => !filters.subject || t.subjectCode === filters.subject) ?? []
  const samples = list.data?.samples ?? []

  const open = (id: string) => {
    const target = document.getElementById(`sample-${id}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    target?.focus({ preventScroll: true })
  }

  return (
    <Stack spacing={3.5}>
      <PageHeader
        eyebrow="HIỂU CÁCH LÀM, KHÔNG HỌC THUỘC"
        title="Kho bài mẫu"
        description="Từ một lời giải rõ ràng đến cách tư duy bạn có thể áp dụng."
      />

      <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Select
          displayEmpty
          size="small"
          value={filters.subject}
          inputProps={{ 'aria-label': 'Môn' }}
          IconComponent={KeyboardArrowDownIcon}
          sx={filterSx}
          renderValue={(v) => `Môn: ${v ? subjectName(v) : 'Tất cả'}`}
          onChange={(e) => setFilters({ subject: e.target.value, topic: '' })}
        >
          <MenuItem value="">Tất cả</MenuItem>
          {options?.subjects.map((code) => (
            <MenuItem key={code} value={code}>
              {subjectName(code)}
            </MenuItem>
          ))}
        </Select>
        <Select
          displayEmpty
          size="small"
          value={filters.topic}
          inputProps={{ 'aria-label': 'Chuyên đề' }}
          IconComponent={KeyboardArrowDownIcon}
          sx={filterSx}
          renderValue={(v) => `Chuyên đề: ${topics.find((t) => t.id === v)?.name ?? 'Tất cả'}`}
          onChange={(e) => setFilters((f) => ({ ...f, topic: e.target.value }))}
        >
          <MenuItem value="">Tất cả</MenuItem>
          {topics.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.name}
            </MenuItem>
          ))}
        </Select>
        <Typography role="status" color="text.secondary">
          {list.data ? `${samples.length} bài mẫu` : list.isError ? '' : 'Đang tải bài mẫu…'}
        </Typography>
      </Stack>

      {list.isError && <ErrorNotice error={list.error} onRetry={() => void list.refetch()} />}

      {list.data && samples.length === 0 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h2">Không có bài mẫu phù hợp</Typography>
          <Typography color="text.secondary" sx={{ my: 1.5 }}>
            Thử chọn môn hoặc chuyên đề khác.
          </Typography>
          <Button variant="outlined" onClick={() => setFilters({ subject: '', topic: '' })}>
            Xóa bộ lọc
          </Button>
        </Card>
      )}

      {samples.length > 0 && (
        <>
          <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
            {samples.map((s) => (
              <Card
                key={s.id}
                component="article"
                sx={{ p: 3.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <Kicker>{subjectName(s.subjectCode)}</Kicker>
                <Typography variant="h2" sx={{ mt: 1.5, fontWeight: 600, fontSize: '1.45rem' }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  {s.topic} · {s.exerciseType}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, mb: 2.5 }}>
                  Nguồn: {s.source}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => open(s.id)}
                  aria-label={`Xem bài mẫu: ${s.title}`}
                  sx={{
                    mt: 'auto',
                    bgcolor: '#fff',
                    borderColor: colors.border,
                    color: 'text.primary',
                    fontWeight: 500,
                  }}
                >
                  Xem bài mẫu
                </Button>
              </Card>
            ))}
          </Box>

          <Stack direction="row" spacing={2} sx={{ alignItems: 'baseline', flexWrap: 'wrap', pt: 1 }}>
            <Typography variant="h2" component="h2" sx={{ fontSize: '1.6rem', fontWeight: 600 }}>
              Đọc lời giải, hiểu phương pháp
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {samples.length} bài minh họa
            </Typography>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              alignItems: 'start',
            }}
          >
            {samples.map((s) => (
              <SampleArticle key={s.id} sample={s} />
            ))}
          </Box>
        </>
      )}
    </Stack>
  )
}

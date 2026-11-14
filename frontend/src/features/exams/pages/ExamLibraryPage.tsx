import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Box, Button, Card, MenuItem, Select, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { colors } from '@/app/theme/theme'
import { subjectName } from '@/features/study/model/catalog'
import { ErrorNotice } from '@/shared/components/ErrorNotice'
import { PageHeader } from '@/shared/components/PageHeader'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { ExamCard } from '../components/ExamCard'
import { useExamList } from '../hooks/useExams'

const filterSx = {
  minWidth: 140,
  borderRadius: 2.5,
  fontWeight: 500,
  '& fieldset': { borderColor: colors.border },
} as const

const tips = [
  ['Làm như thi thật', 'Chọn không gian yên tĩnh và tuân thủ thời gian.'],
  ['Đối chiếu đáp án', 'Xem lại cả câu sai lẫn câu bạn chưa chắc chắn.'],
  ['Quay lại lộ trình', 'Dành buổi học tiếp theo cho phần còn yếu.'],
] as const

export default function ExamLibraryPage() {
  useDocumentTitle('Kho đề thi')
  const [filters, setFilters] = useState({ subject: '', year: '' })
  const unfiltered = useExamList({ subject: '', year: '' })
  const list = useExamList(filters)
  const options = list.data ?? unfiltered.data
  const online = list.data?.exams.filter((e) => e.questionCount > 0) ?? []
  const papers = list.data?.exams.filter((e) => e.questionCount === 0) ?? []
  const subjects = [...(options?.subjects ?? [])].sort((a, b) =>
    subjectName(a).localeCompare(subjectName(b), 'vi'),
  )

  return (
    <Stack spacing={3}>
      <PageHeader
        eyebrow="LUYỆN TẬP CÓ CHỌN LỌC"
        title="Kho đề thi"
        description="Làm quen cấu trúc, rèn nhịp làm bài và nhìn rõ phần cần cải thiện."
      />
      <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Select
          displayEmpty
          size="small"
          value={filters.subject}
          inputProps={{ 'aria-label': 'Môn' }}
          IconComponent={KeyboardArrowDownIcon}
          sx={filterSx}
          renderValue={(v) => `Môn: ${v ? subjectName(v) : 'Tất cả'}`}
          onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}
        >
          <MenuItem value="">Tất cả</MenuItem>
          {subjects.map((code) => (
            <MenuItem key={code} value={code}>
              {subjectName(code)}
            </MenuItem>
          ))}
        </Select>
        <Select
          displayEmpty
          size="small"
          value={filters.year}
          inputProps={{ 'aria-label': 'Năm' }}
          IconComponent={KeyboardArrowDownIcon}
          sx={filterSx}
          renderValue={(v) => `Năm: ${v || 'Tất cả'}`}
          onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
        >
          <MenuItem value="">Tất cả</MenuItem>
          {options?.years.map((year) => (
            <MenuItem key={year} value={String(year)}>
              {year}
            </MenuItem>
          ))}
        </Select>
        <Typography role="status" color="text.secondary">
          {list.data ? `${list.data.exams.length} đề thi` : list.isError ? '' : 'Đang tải đề thi…'}
        </Typography>
      </Stack>

      {list.isError && <ErrorNotice error={list.error} onRetry={() => void list.refetch()} />}
      {online.map((exam) => (
        <ExamCard key={exam.id} exam={exam} />
      ))}
      {papers.length > 0 && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
          {papers.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </Box>
      )}
      {list.data?.exams.length === 0 && (
        <Card sx={{ p: 2.5 }}>
          <Typography variant="h2">Không có đề phù hợp</Typography>
          <Typography color="text.secondary" sx={{ mb: 1.5 }}>
            Thử chọn môn hoặc năm khác.
          </Typography>
          <Button variant="outlined" onClick={() => setFilters({ subject: '', year: '' })}>
            Xóa bộ lọc
          </Button>
        </Card>
      )}

      <Card component="section" aria-labelledby="exam-tips-title" sx={{ p: 3 }}>
        <Typography id="exam-tips-title" variant="h2" sx={{ mb: 2 }}>
          Một đề thi, ba bước tiến bộ
        </Typography>
        <Box
          component="ol"
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            p: 0,
            m: 0,
            listStyle: 'none',
          }}
        >
          {tips.map(([title, detail], index) => (
            <li key={title}>
              <Typography
                color="primary"
                aria-hidden
                sx={{ fontWeight: 500, fontSize: '1.8rem', lineHeight: 1.3 }}
              >
                0{index + 1}
              </Typography>
              <Typography variant="h3">{title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {detail}
              </Typography>
            </li>
          ))}
        </Box>
      </Card>
      <Typography variant="caption" color="text.secondary">
        Tài liệu tham khảo dùng để ôn tập. Đề luyện MyStudy không phải đề thi chính thức.
      </Typography>
    </Stack>
  )
}

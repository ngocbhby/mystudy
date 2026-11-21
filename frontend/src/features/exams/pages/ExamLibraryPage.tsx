import ClearIcon from '@mui/icons-material/Clear'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Button,
  Card,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
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
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<'all' | 'online' | 'pdf'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  const unfiltered = useExamList({ subject: '', year: '' })
  const list = useExamList(filters)
  const options = list.data ?? unfiltered.data
  const subjects = [...(options?.subjects ?? [])].sort((a, b) =>
    subjectName(a).localeCompare(subjectName(b), 'vi'),
  )

  const handleSubjectChange = (newSubject: string) => {
    setFilters((f) => ({ ...f, subject: newSubject }))
    setPage(1)
  }

  const handleYearChange = (newYear: string) => {
    setFilters((f) => ({ ...f, year: newYear }))
    setPage(1)
  }

  const handleKindChange = (newKind: 'all' | 'online' | 'pdf') => {
    setKind(newKind)
    setPage(1)
  }

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilters({ subject: '', year: '' })
    setSearch('')
    setKind('all')
    setPage(1)
  }

  const searchTrimmed = search.trim().toLowerCase()
  const matchingExams = (list.data?.exams ?? []).filter((exam) => {
    if (kind === 'online' && exam.questionCount === 0) return false
    if (kind === 'pdf' && exam.questionCount > 0) return false
    if (searchTrimmed) {
      const matchTitle = exam.title.toLowerCase().includes(searchTrimmed)
      const matchSource = (exam.source ?? '').toLowerCase().includes(searchTrimmed)
      const matchSubject = subjectName(exam.subjectCode).toLowerCase().includes(searchTrimmed)
      if (!matchTitle && !matchSource && !matchSubject) return false
    }
    return true
  })

  const totalExams = matchingExams.length
  const totalPages = Math.max(1, Math.ceil(totalExams / pageSize))
  const safePage = Math.min(page, totalPages)

  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalExams)
  const pageExams = matchingExams.slice(startIndex, endIndex)

  const onlineOnPage = pageExams.filter((e) => e.questionCount > 0)
  const papersOnPage = pageExams.filter((e) => e.questionCount === 0)

  const scrollToTop = () => {
    const el = document.getElementById('exam-library-list')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 120, behavior: 'smooth' })
    }
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        eyebrow="LUYỆN TẬP CÓ CHỌN LỌC"
        title="Kho đề thi"
        description="Làm quen cấu trúc, rèn nhịp làm bài và nhìn rõ phần cần cải thiện."
      />

      {/* Thanh tìm kiếm và bộ lọc */}
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Tìm theo tên đề, trường, sở..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => handleSearchChange('')}
                      aria-label="Xóa từ khóa tìm kiếm"
                      edge="end"
                    >
                      <ClearIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              minWidth: { xs: '100%', sm: 260 },
              flex: { xs: '1 1 100%', sm: '1 1 260px', md: '1 1 auto' },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                '& fieldset': { borderColor: colors.border },
              },
            }}
          />

          <Select
            displayEmpty
            size="small"
            value={filters.subject}
            inputProps={{ 'aria-label': 'Môn' }}
            IconComponent={KeyboardArrowDownIcon}
            sx={filterSx}
            renderValue={(v) => `Môn: ${v ? subjectName(v) : 'Tất cả'}`}
            onChange={(e) => handleSubjectChange(e.target.value)}
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
            onChange={(e) => handleYearChange(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {options?.years.map((year) => (
              <MenuItem key={year} value={String(year)}>
                {year}
              </MenuItem>
            ))}
          </Select>

          <Select
            displayEmpty
            size="small"
            value={kind}
            inputProps={{ 'aria-label': 'Hình thức đề' }}
            IconComponent={KeyboardArrowDownIcon}
            sx={filterSx}
            renderValue={(v) =>
              v === 'online'
                ? 'Hình thức: Trắc nghiệm online'
                : v === 'pdf'
                  ? 'Hình thức: Đề PDF'
                  : 'Hình thức: Tất cả'
            }
            onChange={(e) => handleKindChange(e.target.value as 'all' | 'online' | 'pdf')}
          >
            <MenuItem value="all">Tất cả hình thức</MenuItem>
            <MenuItem value="online">Trắc nghiệm online</MenuItem>
            <MenuItem value="pdf">Đề PDF tải về</MenuItem>
          </Select>

          <Select
            size="small"
            value={pageSize}
            inputProps={{ 'aria-label': 'Số đề mỗi trang' }}
            IconComponent={KeyboardArrowDownIcon}
            sx={{ ...filterSx, minWidth: 125 }}
            renderValue={(v) => `${v} đề / trang`}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
          >
            <MenuItem value={6}>6 đề / trang</MenuItem>
            <MenuItem value={9}>9 đề / trang</MenuItem>
            <MenuItem value={12}>12 đề / trang</MenuItem>
            <MenuItem value={18}>18 đề / trang</MenuItem>
          </Select>
        </Stack>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            px: 0.5,
          }}
        >
          <Typography role="status" color="text.secondary" variant="body2">
            {list.isLoading
              ? 'Đang tải đề thi…'
              : totalExams > 0
                ? `Hiển thị ${startIndex + 1} - ${endIndex} trên tổng số ${totalExams} đề thi (Trang ${safePage}/${totalPages})`
                : '0 đề thi phù hợp'}
          </Typography>
          {(filters.subject || filters.year || kind !== 'all' || search) && (
            <Button
              size="small"
              variant="text"
              onClick={handleResetFilters}
              sx={{ textTransform: 'none', fontWeight: 600, p: 0 }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </Box>
      </Stack>

      {list.isError && <ErrorNotice error={list.error} onRetry={() => void list.refetch()} />}

      {/* Danh sách đề thi trang hiện tại */}
      <Box id="exam-library-list" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {onlineOnPage.map((exam) => (
          <ExamCard key={exam.id} exam={exam} />
        ))}
        {papersOnPage.length > 0 && (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
            {papersOnPage.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </Box>
        )}
      </Box>

      {/* Khi không có đề thi nào phù hợp */}
      {totalExams === 0 && !list.isLoading && (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h2" sx={{ fontSize: '1.25rem', mb: 1 }}>
            Không tìm thấy đề thi phù hợp
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Hãy thử thay đổi từ khóa tìm kiếm, môn học hoặc năm thi khác.
          </Typography>
          <Button variant="outlined" onClick={handleResetFilters}>
            Xóa bộ lọc & Đặt lại
          </Button>
        </Card>
      )}

      {/* Điều khiển phân trang */}
      {totalPages > 1 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            pt: 2,
            pb: 1,
          }}
        >
          <Pagination
            count={totalPages}
            page={safePage}
            onChange={(_, newPage) => {
              setPage(newPage)
              scrollToTop()
            }}
            color="primary"
            shape="rounded"
            size="large"
            showFirstButton
            showLastButton
          />
          <Typography variant="caption" color="text.secondary">
            Trang {safePage} trên {totalPages} · Tổng cộng {totalExams} đề thi
          </Typography>
        </Box>
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

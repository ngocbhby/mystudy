import ClearIcon from '@mui/icons-material/Clear'
import CloseIcon from '@mui/icons-material/Close'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import { Kicker, PageHeader } from '@/shared/components/PageHeader'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useSamples } from '../hooks/useSamples'
import { parseSolution } from '../model/solution'
import type { Sample } from '../model/types'

const filterSx = {
  minWidth: 150,
  borderRadius: 2.5,
  fontWeight: 500,
  '& fieldset': { borderColor: colors.border },
} as const

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: 'text.secondary',
  letterSpacing: '0.04em',
} as const

export default function SamplesPage() {
  useDocumentTitle('Kho bài mẫu')
  const [filters, setFilters] = useState({ subject: '', topic: '' })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null)

  const unfiltered = useSamples({ subject: '', topic: '' })
  const list = useSamples(filters)
  const options = unfiltered.data
  const topics = options?.topics.filter((t) => !filters.subject || t.subjectCode === filters.subject) ?? []
  const allSamples = list.data?.samples ?? []

  const handleSubjectChange = (newSubject: string) => {
    setFilters({ subject: newSubject, topic: '' })
    setPage(1)
  }

  const handleTopicChange = (newTopic: string) => {
    setFilters((f) => ({ ...f, topic: newTopic }))
    setPage(1)
  }

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilters({ subject: '', topic: '' })
    setSearch('')
    setPage(1)
  }

  const searchTrimmed = search.trim().toLowerCase()
  const matchingSamples = allSamples.filter((sample) => {
    if (searchTrimmed) {
      const matchTitle = sample.title.toLowerCase().includes(searchTrimmed)
      const matchTopic = (sample.topic ?? '').toLowerCase().includes(searchTrimmed)
      const matchType = (sample.exerciseType ?? '').toLowerCase().includes(searchTrimmed)
      const matchSubject = subjectName(sample.subjectCode).toLowerCase().includes(searchTrimmed)
      const matchPrompt = (sample.prompt ?? '').toLowerCase().includes(searchTrimmed)
      if (!matchTitle && !matchTopic && !matchType && !matchSubject && !matchPrompt) return false
    }
    return true
  })

  const totalSamples = matchingSamples.length
  const totalPages = Math.max(1, Math.ceil(totalSamples / pageSize))
  const safePage = Math.min(page, totalPages)

  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalSamples)
  const pageSamples = matchingSamples.slice(startIndex, endIndex)

  const scrollToTop = () => {
    const el = document.getElementById('samples-list-top')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 120, behavior: 'smooth' })
    }
  }

  const selectedLayout = selectedSample ? parseSolution(selectedSample.modelSolution) : null
  const selectedIsSteps = selectedLayout?.kind === 'steps'

  return (
    <Stack spacing={3.5}>
      <PageHeader
        eyebrow="HIỂU CÁCH LÀM, KHÔNG HỌC THUỘC"
        title="Kho bài mẫu"
        description="Từ bài tập thực tế và lời giải chi tiết đến cách tư duy phương pháp bạn có thể áp dụng."
      />

      {/* Thanh tìm kiếm và bộ lọc */}
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Tìm theo tên bài, dạng bài, chuyên đề..."
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
            <MenuItem value="">Tất cả môn học</MenuItem>
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
            onChange={(e) => handleTopicChange(e.target.value)}
          >
            <MenuItem value="">Tất cả chuyên đề</MenuItem>
            {topics.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={pageSize}
            inputProps={{ 'aria-label': 'Số bài mỗi trang' }}
            IconComponent={KeyboardArrowDownIcon}
            sx={{ ...filterSx, minWidth: 125 }}
            renderValue={(v) => `${v} bài / trang`}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
          >
            <MenuItem value={6}>6 bài / trang</MenuItem>
            <MenuItem value={9}>9 bài / trang</MenuItem>
            <MenuItem value={12}>12 bài / trang</MenuItem>
            <MenuItem value={18}>18 bài / trang</MenuItem>
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
              ? 'Đang tải bài mẫu…'
              : totalSamples > 0
                ? `Hiển thị ${startIndex + 1} - ${endIndex} trên tổng số ${totalSamples} bài mẫu (Trang ${safePage}/${totalPages})`
                : '0 bài mẫu phù hợp'}
          </Typography>
          {(filters.subject || filters.topic || search) && (
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

      {/* Danh sách thẻ bài mẫu (chỉ hiển thị tóm tắt, không hiện lời giải) */}
      <Box id="samples-list-top" sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
        {pageSamples.map((s) => (
          <Card
            key={s.id}
            component="article"
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              borderColor: colors.border,
              transition: 'box-shadow 0.2s, transform 0.2s',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Kicker>{subjectName(s.subjectCode)}</Kicker>
              <Typography
                variant="caption"
                sx={{
                  bgcolor: colors.lavender,
                  color: 'primary.main',
                  px: 1.25,
                  py: 0.25,
                  borderRadius: 1.5,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {s.exerciseType}
              </Typography>
            </Box>

            <Typography variant="h2" sx={{ mt: 1, fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.35 }}>
              {s.title}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
              Chuyên đề: {s.topic}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1.5,
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
              }}
            >
              {s.prompt}
            </Typography>

            <Box sx={{ mt: 'auto', pt: 1.5, borderTop: `1px solid ${colors.border}`, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '55%' }}>
                Nguồn: {s.source}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => setSelectedSample(s)}
                aria-label={`Xem bài mẫu: ${s.title}`}
                sx={{ fontWeight: 600, borderRadius: 2 }}
              >
                Xem bài mẫu
              </Button>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Trạng thái không tìm thấy */}
      {totalSamples === 0 && !list.isLoading && (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h2" sx={{ fontSize: '1.25rem', mb: 1 }}>
            Không tìm thấy bài mẫu phù hợp
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Hãy thử đổi từ khóa tìm kiếm hoặc chọn môn học, chuyên đề khác.
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
            borderTop: `1px solid ${colors.border}`,
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
            Trang {safePage} trên {totalPages} · Tổng cộng {totalSamples} bài mẫu
          </Typography>
        </Box>
      )}

      {/* DIALOG CHI TIẾT ĐÚNG 1 BÀI MẪU ĐƯỢC CHỌN */}
      <Dialog
        open={!!selectedSample}
        onClose={() => setSelectedSample(null)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        aria-labelledby="sample-dialog-title"
      >
        {selectedSample && selectedLayout && (
          <>
            <DialogTitle id="sample-dialog-title" sx={{ pr: 6, pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Kicker>{subjectName(selectedSample.subjectCode)}</Kicker>
                <Typography variant="caption" color="text.secondary">
                  · {selectedSample.topic} · {selectedSample.exerciseType}
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.3 }}>
                {selectedSample.title}
              </Typography>
              <IconButton
                aria-label="Đóng"
                onClick={() => setSelectedSample(null)}
                sx={{ position: 'absolute', right: 12, top: 12, color: 'text.secondary' }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ py: 3 }}>
              {/* Phần đề bài */}
              <Typography sx={labelStyle}>Đề bài thực tế</Typography>
              <Box
                sx={{
                  mt: 1,
                  p: 2.5,
                  bgcolor: '#f8fafc',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 2.5,
                  fontWeight: 500,
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedSample.prompt}
              </Box>

              {/* Phần lời giải chi tiết */}
              <Typography sx={{ ...labelStyle, mt: 3 }}>
                {selectedIsSteps ? 'Lời giải chi tiết từng bước' : 'Bài viết / Phân tích tham khảo'}
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                {selectedLayout.kind === 'steps' ? (
                  <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1.5 }}>
                    {selectedLayout.steps.map((step, index) => (
                      <Box
                        component="li"
                        key={index}
                        sx={{
                          display: 'flex',
                          gap: 1.75,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: index % 2 === 0 ? '#fafafa' : '#fff',
                        }}
                      >
                        <Typography
                          aria-hidden
                          sx={{
                            color: 'primary.main',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            minWidth: 26,
                          }}
                        >
                          {String(index + 1).padStart(2, '0')}.
                        </Typography>
                        <Typography sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{step}</Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    {selectedLayout.paragraphs.map((paragraph, index) => (
                      <Typography key={index} sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {paragraph}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>

              {/* Phần ghi chú phương pháp */}
              {selectedSample.solutionNote && (
                <Box
                  sx={{
                    mt: 3.5,
                    borderRadius: 2.5,
                    p: 2.5,
                    bgcolor: selectedIsSteps ? '#fffbeb' : colors.lavender,
                    border: `1px solid ${selectedIsSteps ? '#fde68a' : '#ddd6fe'}`,
                    color: selectedIsSteps ? '#92400e' : colors.ink,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: selectedIsSteps ? '#b45309' : 'primary.main',
                      mb: 0.75,
                      letterSpacing: '0.04em',
                    }}
                  >
                    Phương pháp tư duy & Lưu ý quan trọng
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'inherit', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {selectedSample.solutionNote}
                  </Typography>
                </Box>
              )}

              <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2.5 }}>
                Nguồn: {selectedSample.source} · Bài mẫu chuẩn hóa MyStudy
              </Typography>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button variant="outlined" onClick={() => setSelectedSample(null)}>
                Đóng bài mẫu
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Stack>
  )
}

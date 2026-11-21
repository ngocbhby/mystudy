import AddIcon from '@mui/icons-material/Add'
import ClearIcon from '@mui/icons-material/Clear'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
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
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors } from '@/app/theme/theme'
import { subjectName } from '@/features/study/model/catalog'
import { useSamples } from '@/features/samples/hooks/useSamples'
import type { Sample } from '@/features/samples/model/types'
import { PageHeader } from '@/shared/components/PageHeader'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useCreateSample, useDeleteSample, useUpdateSample } from '../hooks/useAdmin'

const subjectsCatalog: Record<string, string> = {
  math: 'Toán',
  literature: 'Ngữ văn',
  physics: 'Vật lí',
  chemistry: 'Hóa học',
  biology: 'Sinh học',
  history: 'Lịch sử',
  geography: 'Địa lí',
  civics: 'Giáo dục KT & PL',
  english: 'Tiếng Anh',
  informatics: 'Tin học',
  technology: 'Công nghệ',
}

interface SampleFormData {
  subjectCode: string
  topicId: string
  topicName: string
  isNewTopic: boolean
  title: string
  exerciseType: string
  prompt: string
  modelSolution: string
  solutionNote: string
  sourceName: string
}

const initialForm: SampleFormData = {
  subjectCode: 'math',
  topicId: '',
  topicName: '',
  isNewTopic: false,
  title: '',
  exerciseType: 'Lời giải từng bước',
  prompt: '',
  modelSolution: '',
  solutionNote: '',
  sourceName: 'MyStudy biên soạn',
}

export default function AdminSampleListPage() {
  useDocumentTitle('Quản trị bài mẫu')
  const navigate = useNavigate()

  const samplesQuery = useSamples({ subject: '', topic: '' })
  const createSample = useCreateSample()
  const updateSample = useUpdateSample()
  const deleteSample = useDeleteSample()

  const [selectedSubject, setSelectedSubject] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 8

  // Dialog state
  const [openModal, setOpenModal] = useState(false)
  const [editingSample, setEditingSample] = useState<Sample | null>(null)
  const [formData, setFormData] = useState<SampleFormData>(initialForm)
  const [formError, setFormError] = useState<string | null>(null)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Sample | null>(null)

  const allSamples = samplesQuery.data?.samples ?? []
  const availableTopics = samplesQuery.data?.topics ?? []

  const searchTrimmed = search.trim().toLowerCase()
  const filteredSamples = allSamples.filter((sample) => {
    if (selectedSubject && sample.subjectCode !== selectedSubject) return false
    if (searchTrimmed) {
      const matchTitle = sample.title.toLowerCase().includes(searchTrimmed)
      const matchTopic = (sample.topic ?? '').toLowerCase().includes(searchTrimmed)
      const matchType = (sample.exerciseType ?? '').toLowerCase().includes(searchTrimmed)
      const matchSubject = subjectName(sample.subjectCode).toLowerCase().includes(searchTrimmed)
      if (!matchTitle && !matchTopic && !matchType && !matchSubject) return false
    }
    return true
  })

  const totalCount = filteredSamples.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const pageItems = filteredSamples.slice(startIndex, startIndex + pageSize)

  const distinctSubjects = new Set(allSamples.map((s) => s.subjectCode)).size
  const distinctTopics = new Set(allSamples.map((s) => s.topicId)).size

  const handleOpenCreate = () => {
    setEditingSample(null)
    setFormData(initialForm)
    setFormError(null)
    setOpenModal(true)
  }

  const handleOpenEdit = (sample: Sample) => {
    setEditingSample(sample)
    setFormData({
      subjectCode: sample.subjectCode,
      topicId: sample.topicId,
      topicName: sample.topic,
      isNewTopic: false,
      title: sample.title,
      exerciseType: sample.exerciseType,
      prompt: sample.prompt,
      modelSolution: sample.modelSolution,
      solutionNote: sample.solutionNote || '',
      sourceName: sample.source || '',
    })
    setFormError(null)
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    setOpenModal(false)
    setEditingSample(null)
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.title.trim()) {
      setFormError('Vui lòng nhập tiêu đề bài mẫu.')
      return
    }
    if (!formData.prompt.trim()) {
      setFormError('Vui lòng nhập đề bài.')
      return
    }
    if (!formData.modelSolution.trim()) {
      setFormError('Vui lòng nhập lời giải chi tiết.')
      return
    }
    if (formData.isNewTopic && !formData.topicName.trim()) {
      setFormError('Vui lòng nhập tên chuyên đề mới.')
      return
    }

    try {
      const payload = {
        subjectCode: formData.subjectCode,
        topicId: formData.isNewTopic ? undefined : formData.topicId || undefined,
        topicName: formData.isNewTopic ? formData.topicName.trim() : undefined,
        title: formData.title.trim(),
        exerciseType: formData.exerciseType.trim(),
        prompt: formData.prompt.trim(),
        modelSolution: formData.modelSolution.trim(),
        solutionNote: formData.solutionNote.trim() || undefined,
        sourceName: formData.sourceName.trim() || 'MyStudy biên soạn',
      }

      if (editingSample) {
        await updateSample.mutateAsync({ id: editingSample.id, payload })
      } else {
        await createSample.mutateAsync(payload)
      }
      handleCloseModal()
      void samplesQuery.refetch()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu bài mẫu.'
      setFormError(msg)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteSample.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
      void samplesQuery.refetch()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi xóa bài mẫu.')
    }
  }

  const currentSubjectTopics = availableTopics.filter((t) => t.subjectCode === formData.subjectCode)

  return (
    <Stack spacing={3}>
      <PageHeader
        eyebrow="KHU VỰC QUẢN TRỊ"
        title="Quản trị nội dung"
        description="Quản lý và cập nhật kho đề thi và kho bài mẫu thực tế trên hệ thống MyStudy."
      />

      {/* Tabs chuyển đổi giữa Quản trị Đề thi và Quản trị Bài mẫu */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value="/quan-tri/bai-mau"
          onChange={(_, val: string) => navigate(val)}
          sx={{ '& .MuiTab-root': { fontWeight: 600, fontSize: '1rem', textTransform: 'none' } }}
        >
          <Tab label="Quản trị Đề thi" value={paths.adminExams} component={RouterLink} to={paths.adminExams} />
          <Tab label="Quản trị Bài mẫu" value={paths.adminSamples} component={RouterLink} to={paths.adminSamples} />
        </Tabs>
      </Box>

      {/* Thống kê nhanh */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <Card sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Tổng số bài mẫu
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
            {allSamples.length}
          </Typography>
        </Card>
        <Card sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Số môn học có bài mẫu
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'primary.main' }}>
            {distinctSubjects}
          </Typography>
        </Card>
        <Card sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Số chuyên đề đã có
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#f59e0b' }}>
            {distinctTopics}
          </Typography>
        </Card>
      </Box>

      {/* Thanh công cụ tìm kiếm và nút Thêm mới */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          <TextField
            size="small"
            placeholder="Tìm theo tên bài, chuyên đề..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <ClearIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              minWidth: { xs: '100%', sm: 260 },
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
            }}
          />

          <Select
            displayEmpty
            size="small"
            value={selectedSubject}
            sx={{ minWidth: 160, borderRadius: 2 }}
            onChange={(e) => {
              setSelectedSubject(e.target.value)
              setPage(1)
            }}
          >
            <MenuItem value="">Tất cả môn học</MenuItem>
            {Object.entries(subjectsCatalog).map(([code, name]) => (
              <MenuItem key={code} value={code}>
                {name}
              </MenuItem>
            ))}
          </Select>

          {(selectedSubject || search) && (
            <Button
              size="small"
              onClick={() => {
                setSelectedSubject('')
                setSearch('')
                setPage(1)
              }}
              sx={{ textTransform: 'none' }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </Stack>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ py: 1, px: 2.5, fontWeight: 600, borderRadius: 2 }}
        >
          Thêm bài mẫu mới
        </Button>
      </Box>

      {/* Danh sách bài mẫu */}
      {samplesQuery.isLoading ? (
        <Typography color="text.secondary">Đang tải danh sách bài mẫu…</Typography>
      ) : filteredSamples.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h3" sx={{ fontSize: '1.2rem', mb: 1 }}>
            Không tìm thấy bài mẫu nào
          </Typography>
          <Typography color="text.secondary">
            Hãy thử tìm từ khóa khác hoặc bấm nút "Thêm bài mẫu mới" ở góc phải.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {pageItems.map((sample) => (
            <Card
              key={sample.id}
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 2,
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.75 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      bgcolor: colors.lavender,
                      color: 'primary.main',
                      px: 1.25,
                      py: 0.25,
                      borderRadius: 1.5,
                      fontWeight: 700,
                    }}
                  >
                    {subjectName(sample.subjectCode)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {sample.topic} · {sample.exerciseType}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Nguồn: {sample.source}
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '1.2rem', mb: 0.5 }}>
                  {sample.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {sample.prompt}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-end', md: 'center' } }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenEdit(sample)}
                  sx={{ borderRadius: 2 }}
                >
                  Sửa
                </Button>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setDeleteTarget(sample)}
                  aria-label="Xóa bài mẫu"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Card>
          ))}

          {/* Phân trang */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', pt: 2, gap: 2 }}>
              <Pagination
                count={totalPages}
                page={safePage}
                onChange={(_, p) => setPage(p)}
                color="primary"
                shape="rounded"
              />
              <Typography variant="caption" color="text.secondary">
                Trang {safePage}/{totalPages} ({totalCount} bài mẫu)
              </Typography>
            </Box>
          )}
        </Stack>
      )}

      {/* DIALOG THÊM / SỬA BÀI MẪU */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ pr: 6 }}>
            {editingSample ? 'Chỉnh sửa bài mẫu' : 'Thêm bài mẫu thực tế mới'}
            <IconButton
              aria-label="Đóng"
              onClick={handleCloseModal}
              sx={{ position: 'absolute', right: 12, top: 12, color: 'text.secondary' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <Divider />

          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 2.5 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>
                  Môn học *
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={formData.subjectCode}
                  onChange={(e) => {
                    const code = e.target.value
                    setFormData((f) => ({
                      ...f,
                      subjectCode: code,
                      topicId: '',
                      topicName: '',
                      isNewTopic: false,
                    }))
                  }}
                >
                  {Object.entries(subjectsCatalog).map(([code, name]) => (
                    <MenuItem key={code} value={code}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Chuyên đề *
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setFormData((f) => ({ ...f, isNewTopic: !f.isNewTopic }))}
                    sx={{ p: 0, textTransform: 'none', fontSize: 12 }}
                  >
                    {formData.isNewTopic ? 'Chọn chuyên đề có sẵn' : '+ Thêm chuyên đề mới'}
                  </Button>
                </Box>

                {formData.isNewTopic ? (
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Nhập tên chuyên đề mới..."
                    value={formData.topicName}
                    onChange={(e) => setFormData((f) => ({ ...f, topicName: e.target.value }))}
                  />
                ) : (
                  <Select
                    fullWidth
                    size="small"
                    displayEmpty
                    value={formData.topicId}
                    onChange={(e) => setFormData((f) => ({ ...f, topicId: e.target.value }))}
                  >
                    <MenuItem value="">-- Chọn chuyên đề --</MenuItem>
                    {currentSubjectTopics.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
              <TextField
                label="Tiêu đề bài mẫu *"
                size="small"
                placeholder="VD: Bài toán tối ưu hóa chi phí sản xuất thùng chứa"
                value={formData.title}
                onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
              />
              <TextField
                label="Dạng bài *"
                size="small"
                placeholder="VD: Lời giải từng bước, Đoạn văn 200 chữ..."
                value={formData.exerciseType}
                onChange={(e) => setFormData((f) => ({ ...f, exerciseType: e.target.value }))}
              />
            </Box>

            <TextField
              label="Đề bài thực tế *"
              multiline
              rows={3}
              placeholder="Nhập nội dung đề bài cụ thể, số liệu và yêu cầu..."
              value={formData.prompt}
              onChange={(e) => setFormData((f) => ({ ...f, prompt: e.target.value }))}
            />

            <TextField
              label="Lời giải mẫu chi tiết *"
              multiline
              rows={6}
              placeholder="Nhập các bước giải chi tiết (mỗi bước xuống dòng) hoặc bài viết mẫu hoàn chỉnh..."
              value={formData.modelSolution}
              onChange={(e) => setFormData((f) => ({ ...f, modelSolution: e.target.value }))}
              helperText="Nếu giải theo các bước, hãy xuống dòng cho từng bước. Hệ thống sẽ tự động đánh số 01, 02, 03..."
            />

            <TextField
              label="Ghi chú cách làm / Phương pháp tư duy"
              multiline
              rows={2}
              placeholder="Tóm tắt các bước tư duy, công thức trọng tâm hoặc các bẫy cần tránh..."
              value={formData.solutionNote}
              onChange={(e) => setFormData((f) => ({ ...f, solutionNote: e.target.value }))}
            />

            <TextField
              label="Nguồn bài tập *"
              size="small"
              placeholder="VD: MyStudy biên soạn, Đề thi THPT Quốc gia 2024..."
              value={formData.sourceName}
              onChange={(e) => setFormData((f) => ({ ...f, sourceName: e.target.value }))}
            />
          </DialogContent>

          <Divider />
          <DialogActions sx={{ px: 3, py: 1.5 }}>
            <Button variant="outlined" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createSample.isPending || updateSample.isPending}
            >
              {createSample.isPending || updateSample.isPending
                ? 'Đang lưu…'
                : editingSample
                  ? 'Lưu thay đổi'
                  : 'Tạo bài mẫu'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG XÁC NHẬN XÓA */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Xóa bài mẫu</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa bài mẫu <b>"{deleteTarget?.title}"</b> không? Thao tác này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteSample.isPending}
          >
            {deleteSample.isPending ? 'Đang xóa…' : 'Xác nhận xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

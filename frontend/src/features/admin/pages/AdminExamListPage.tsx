import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import QuizIcon from '@mui/icons-material/Quiz'
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors } from '@/app/theme/theme'
import { subjectName, subjects } from '@/features/study/model/catalog'
import { ErrorNotice } from '@/shared/components/ErrorNotice'
import { LoadingState } from '@/shared/components/LoadingState'
import { PageHeader } from '@/shared/components/PageHeader'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useAdminExams, useDeleteExam, useUpdateExam } from '../hooks/useAdmin'
import type { AdminExamSummary } from '../types'

export default function AdminExamListPage() {
  useDocumentTitle('Quản trị đề thi · MyStudy')
  const { data: exams, isLoading, isError, error, refetch } = useAdminExams()
  const deleteMutation = useDeleteExam()
  const updateMutation = useUpdateExam()

  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedKind, setSelectedKind] = useState('')
  const [examToDelete, setExamToDelete] = useState<{ id: string; title: string } | null>(null)

  // State chỉnh sửa đề thi
  const [examToEdit, setExamToEdit] = useState<AdminExamSummary | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editYear, setEditYear] = useState<number>(new Date().getFullYear())
  const [editDuration, setEditDuration] = useState<number>(90)
  const [editSource, setEditSource] = useState('')
  const [editPaperUrl, setEditPaperUrl] = useState('')
  const [editAnswerUrl, setEditAnswerUrl] = useState('')
  const [editError, setEditError] = useState('')

  if (isLoading) return <LoadingState label="Đang tải danh sách đề thi…" />
  if (isError) return <ErrorNotice error={error} onRetry={() => void refetch()} />

  const allExams = exams ?? []
  const filteredExams = allExams.filter((e) => {
    if (selectedSubject && e.subjectCode !== selectedSubject) return false
    if (selectedKind === 'online' && e.questionCount === 0) return false
    if (selectedKind === 'pdf' && e.questionCount > 0) return false
    return true
  })

  const onlineCount = allExams.filter((e) => e.questionCount > 0).length
  const pdfCount = allExams.filter((e) => e.questionCount === 0).length

  const handleDeleteConfirm = () => {
    if (!examToDelete) return
    deleteMutation.mutate(examToDelete.id, {
      onSettled: () => setExamToDelete(null),
    })
  }

  const handleOpenEdit = (exam: AdminExamSummary) => {
    setExamToEdit(exam)
    setEditTitle(exam.title)
    setEditSubject(exam.subjectCode)
    setEditYear(exam.year ?? new Date().getFullYear())
    setEditDuration(exam.durationMinutes)
    setEditSource(exam.source ?? '')
    setEditPaperUrl(exam.paperUrl ?? '')
    setEditAnswerUrl(exam.answerUrl ?? '')
    setEditError('')
  }

  const handleUpdateSubmit = () => {
    if (!examToEdit) return
    if (!editTitle.trim()) {
      setEditError('Tiêu đề đề thi không được để trống.')
      return
    }
    if (editDuration <= 0) {
      setEditError('Thời gian làm bài phải lớn hơn 0.')
      return
    }

    setEditError('')
    updateMutation.mutate(
      {
        id: examToEdit.id,
        payload: {
          title: editTitle.trim(),
          subjectCode: editSubject,
          examYear: editYear,
          durationMinutes: editDuration,
          sourceName: editSource.trim(),
          paperUrl: editPaperUrl.trim() || undefined,
          answerGuideUrl: editAnswerUrl.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setExamToEdit(null)
        },
        onError: (err) => {
          setEditError(err instanceof Error ? err.message : 'Không thể lưu thay đổi. Vui lòng thử lại.')
        },
      }
    )
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        eyebrow="QUẢN TRỊ NỘI DUNG"
        title="Quản trị kho đề thi"
        description="Đăng bài thi trắc nghiệm trực tuyến hoặc đề thi kèm đáp án (PDF) vào hệ thống."
        actions={
          <Button
            component={RouterLink}
            to={paths.adminNewExam}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ fontWeight: 600, px: 2.5, py: 1 }}
          >
            Đăng đề thi mới
          </Button>
        }
      />

      {/* Thống kê nhanh */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        <Card sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Tổng số đề thi
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
            {allExams.length}
          </Typography>
        </Card>
        <Card sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Đề trắc nghiệm online
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: colors.purple }}>
            {onlineCount}
          </Typography>
        </Card>
        <Card sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Đề tài liệu / PDF
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#f59e0b' }}>
            {pdfCount}
          </Typography>
        </Card>
      </Box>

      {/* Bộ lọc */}
      <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Select
          displayEmpty
          size="small"
          value={selectedSubject}
          sx={{ minWidth: 160, borderRadius: 2 }}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <MenuItem value="">Tất cả môn học</MenuItem>
          {Object.entries(subjects).map(([code, name]) => (
            <MenuItem key={code} value={code}>
              {name}
            </MenuItem>
          ))}
        </Select>

        <Select
          displayEmpty
          size="small"
          value={selectedKind}
          sx={{ minWidth: 160, borderRadius: 2 }}
          onChange={(e) => setSelectedKind(e.target.value)}
        >
          <MenuItem value="">Tất cả hình thức</MenuItem>
          <MenuItem value="online">Trắc nghiệm online</MenuItem>
          <MenuItem value="pdf">Đề PDF tải về</MenuItem>
        </Select>

        {(selectedSubject || selectedKind) && (
          <Button
            size="small"
            color="inherit"
            onClick={() => {
              setSelectedSubject('')
              setSelectedKind('')
            }}
          >
            Xóa bộ lọc
          </Button>
        )}
      </Stack>

      {/* Danh sách đề thi */}
      {filteredExams.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Chưa có đề thi nào phù hợp
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Hãy thử đổi bộ lọc hoặc thêm đề thi mới.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {filteredExams.map((exam) => {
            const isOnline = exam.questionCount > 0
            const previewLink = isOnline
              ? `/thi-thu/${exam.id}`
              : exam.paperUrl?.startsWith('/api/documents/')
                ? exam.paperUrl
                : null

            return (
              <Card
                key={exam.id}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                  transition: 'border-color 0.15s ease',
                  '&:hover': { borderColor: 'divider' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 260, flex: 1 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: isOnline ? 'rgba(109, 77, 214, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: isOnline ? colors.purple : '#f59e0b',
                      flexShrink: 0,
                    }}
                  >
                    {isOnline ? <QuizIcon /> : <PictureAsPdfIcon />}
                  </Box>

                  <Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={subjectName(exam.subjectCode)}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.75rem', height: 22 }}
                      />
                      <Chip
                        label={isOnline ? `${exam.questionCount} câu hỏi` : 'Đề PDF'}
                        size="small"
                        color={isOnline ? 'primary' : 'default'}
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', height: 22 }}
                      />
                      {exam.year && (
                        <Typography variant="caption" color="text.secondary">
                          Năm {exam.year}
                        </Typography>
                      )}
                    </Stack>
                    <Typography sx={{ fontWeight: 600, fontSize: '1.02rem' }}>{exam.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {exam.source} • {exam.durationMinutes} phút
                    </Typography>
                  </Box>
                </Box>

                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  {previewLink && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      endIcon={<OpenInNewIcon sx={{ fontSize: '1rem !important' }} />}
                      href={previewLink}
                      target={isOnline ? '_self' : '_blank'}
                      rel="noopener noreferrer"
                      sx={{ borderRadius: 2 }}
                    >
                      Xem đề
                    </Button>
                  )}

                  <IconButton
                    size="small"
                    color="primary"
                    title="Chỉnh sửa đề thi"
                    onClick={() => handleOpenEdit(exam)}
                    sx={{
                      borderRadius: 2,
                      p: 1,
                      border: '1px solid',
                      borderColor: 'rgba(109, 77, 214, 0.25)',
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                    color="error"
                    title="Xóa đề thi"
                    disabled={deleteMutation.isPending}
                    onClick={() => setExamToDelete({ id: exam.id, title: exam.title })}
                    sx={{
                      borderRadius: 2,
                      p: 1,
                      border: '1px solid',
                      borderColor: 'rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Card>
            )
          })}
        </Stack>
      )}

      {/* Dialog chỉnh sửa đề thi */}
      <Dialog
        open={Boolean(examToEdit)}
        onClose={() => setExamToEdit(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Chỉnh sửa thông tin đề thi</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {editError && (
              <Typography color="error" variant="body2" sx={{ fontWeight: 500 }}>
                {editError}
              </Typography>
            )}

            <TextField
              label="Tên / Tiêu đề đề thi"
              fullWidth
              size="small"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Ví dụ: Đề thi thử THPT Quốc gia 2026 môn Toán"
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Select
                size="small"
                fullWidth
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
              >
                {Object.entries(subjects).map(([code, name]) => (
                  <MenuItem key={code} value={code}>
                    {name}
                  </MenuItem>
                ))}
              </Select>

              <TextField
                label="Năm thi"
                type="number"
                size="small"
                fullWidth
                value={editYear}
                onChange={(e) => setEditYear(Number(e.target.value))}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Thời gian làm bài (phút)"
                type="number"
                size="small"
                fullWidth
                required
                value={editDuration}
                onChange={(e) => setEditDuration(Number(e.target.value))}
              />

              <TextField
                label="Đơn vị / Nguồn ra đề"
                size="small"
                fullWidth
                value={editSource}
                onChange={(e) => setEditSource(e.target.value)}
                placeholder="Ví dụ: Sở GD&ĐT Hà Nội, MyStudy"
              />
            </Stack>

            {examToEdit && examToEdit.questionCount === 0 && (
              <>
                <TextField
                  label="Đường dẫn file đề thi (PDF)"
                  size="small"
                  fullWidth
                  value={editPaperUrl}
                  onChange={(e) => setEditPaperUrl(e.target.value)}
                />
                <TextField
                  label="Đường dẫn file đáp án"
                  size="small"
                  fullWidth
                  value={editAnswerUrl}
                  onChange={(e) => setEditAnswerUrl(e.target.value)}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setExamToEdit(null)} color="inherit" disabled={updateMutation.isPending}>
            Hủy
          </Button>
          <Button
            onClick={handleUpdateSubmit}
            variant="contained"
            disabled={updateMutation.isPending}
            sx={{ fontWeight: 600 }}
          >
            {updateMutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog
        open={Boolean(examToDelete)}
        onClose={() => setExamToDelete(null)}
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Xác nhận xóa đề thi?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa đề thi <strong>&quot;{examToDelete?.title}&quot;</strong>? Hành động này sẽ xóa
            toàn bộ câu hỏi, đáp án và kết quả làm bài liên quan và không thể khôi phục.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setExamToDelete(null)} color="inherit" disabled={deleteMutation.isPending}>
            Hủy
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            sx={{ fontWeight: 600 }}
          >
            {deleteMutation.isPending ? 'Đang xóa…' : 'Xác nhận xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

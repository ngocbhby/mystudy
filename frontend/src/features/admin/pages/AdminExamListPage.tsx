import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import QuizIcon from '@mui/icons-material/Quiz'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
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
import { useAdminExams, useDeleteExam } from '../hooks/useAdmin'

export default function AdminExamListPage() {
  useDocumentTitle('Quản trị đề thi · MyStudy')
  const { data: exams, isLoading, isError, error, refetch } = useAdminExams()
  const deleteMutation = useDeleteExam()

  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedKind, setSelectedKind] = useState('')
  const [examToDelete, setExamToDelete] = useState<{ id: string; title: string } | null>(null)

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
          <MenuItem value="">Tất cả loại đề</MenuItem>
          <MenuItem value="online">Trắc nghiệm online</MenuItem>
          <MenuItem value="pdf">Đề thi PDF</MenuItem>
        </Select>

        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          Hiển thị <strong>{filteredExams.length}</strong> đề thi
        </Typography>
      </Stack>

      {/* Danh sách đề thi */}
      {filteredExams.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">Chưa có đề thi nào phù hợp với bộ lọc.</Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {filteredExams.map((exam) => {
            const isOnline = exam.questionCount > 0
            const previewLink = isOnline ? paths.examPaper(exam.id) : exam.paperUrl

            return (
              <Card
                key={exam.id}
                sx={{
                  p: 2.5,
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

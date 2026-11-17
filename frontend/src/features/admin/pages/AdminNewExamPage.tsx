import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors } from '@/app/theme/theme'
import { subjects } from '@/features/study/model/catalog'
import { PageHeader } from '@/shared/components/PageHeader'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useCreateExam, useUploadPdf } from '../hooks/useAdmin'
import type { CreateExamPayload, CreateQuestionPayload } from '../types'

interface FormQuestion {
  prompt: string
  options: [string, string, string, string]
  correctOptionNumber: number
  explanation: string
}

const emptyQuestion = (): FormQuestion => ({
  prompt: '',
  options: ['', '', '', ''],
  correctOptionNumber: 1,
  explanation: '',
})

export default function AdminNewExamPage() {
  useDocumentTitle('Đăng đề thi mới · MyStudy')
  const navigate = useNavigate()
  const createMutation = useCreateExam()
  const uploadMutation = useUploadPdf()

  const [kind, setKind] = useState<'mystudy_practice' | 'past_paper'>('mystudy_practice')
  const [subjectCode, setSubjectCode] = useState('math')
  const [title, setTitle] = useState('')
  const [examYear, setExamYear] = useState(2026)
  const [durationMinutes, setDurationMinutes] = useState(50)
  const [sourceName, setSourceName] = useState('MyStudy biên soạn')

  // Cho đề PDF
  const [pdfSourceType, setPdfSourceType] = useState<'upload' | 'url'>('upload')
  const [paperUrl, setPaperUrl] = useState('')
  const [answerGuideUrl, setAnswerGuideUrl] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')

  // Cho đề trắc nghiệm trực tuyến
  const [questions, setQuestions] = useState<FormQuestion[]>([emptyQuestion()])
  const [formError, setFormError] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setFormError('Vui lòng chọn file có định dạng .pdf')
      return
    }
    setFormError(null)
    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        setPaperUrl(data.url)
        setAnswerGuideUrl(data.url)
        setUploadedFileName(file.name)
      },
      onError: (err) => {
        setFormError(err instanceof Error ? err.message : 'Tải file PDF thất bại')
      },
    })
  }

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()])
  }

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const updateQuestionPrompt = (index: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, prompt: val } : q))
    )
  }

  const updateQuestionOption = (qIndex: number, optIndex: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        const newOpts = [...q.options] as [string, string, string, string]
        newOpts[optIndex] = val
        return { ...q, options: newOpts }
      })
    )
  }

  const updateCorrectOption = (qIndex: number, optNumber: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, correctOptionNumber: optNumber } : q))
    )
  }

  const updateQuestionExplanation = (index: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, explanation: val } : q))
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!title.trim()) {
      setFormError('Vui lòng nhập tiêu đề đề thi.')
      return
    }

    if (durationMinutes <= 0) {
      setFormError('Thời gian làm bài phải lớn hơn 0 phút.')
      return
    }

    let payload: CreateExamPayload

    if (kind === 'past_paper') {
      if (!paperUrl.trim()) {
        setFormError('Vui lòng tải lên file PDF đề thi hoặc nhập liên kết file PDF.')
        return
      }
      payload = {
        subjectCode,
        title: title.trim(),
        kind: 'past_paper',
        examYear,
        durationMinutes,
        sourceName: sourceName.trim() || 'Bộ GD&ĐT',
        paperUrl: paperUrl.trim(),
        answerGuideUrl: answerGuideUrl.trim() || paperUrl.trim(),
      }
    } else {
      if (questions.length === 0) {
        setFormError('Vui lòng thêm ít nhất 1 câu hỏi cho đề thi trực tuyến.')
        return
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        if (!q || !q.prompt.trim()) {
          setFormError(`Câu hỏi số ${i + 1} chưa có nội dung câu hỏi.`)
          return
        }
        for (let j = 0; j < 4; j++) {
          if (!q.options[j]?.trim()) {
            setFormError(`Câu hỏi số ${i + 1} chưa điền đủ đáp án ${String.fromCharCode(65 + j)}.`)
            return
          }
        }
      }

      const formattedQuestions: CreateQuestionPayload[] = questions.map((q) => ({
        prompt: q.prompt.trim(),
        options: q.options.map((o) => o.trim()),
        correctOptionNumber: q.correctOptionNumber,
        explanation: q.explanation.trim() || undefined,
      }))

      payload = {
        subjectCode,
        title: title.trim(),
        kind: 'mystudy_practice',
        examYear,
        durationMinutes,
        sourceName: sourceName.trim() || 'MyStudy biên soạn',
        questions: formattedQuestions,
      }
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        void navigate(paths.adminExams)
      },
      onError: (err) => {
        setFormError(err instanceof Error ? err.message : 'Không thể tạo đề thi, vui lòng thử lại.')
      },
    })
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Button
          component={RouterLink}
          to={paths.adminExams}
          startIcon={<ArrowBackIcon />}
          color="inherit"
          sx={{ mb: 1, textTransform: 'none' }}
        >
          Quay lại danh sách đề thi
        </Button>
        <PageHeader
          eyebrow="TẠO MỚI"
          title="Đăng đề thi vào kho đề"
          description="Chọn loại đề thi trắc nghiệm tương tác trực tuyến hoặc đề kèm đáp án tải về."
        />
      </Box>

      {formError && (
        <Alert severity="error" onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Card 1: Chọn hình thức đề thi */}
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              1. Hình thức đề thi
            </Typography>

            <Tabs
              value={kind}
              onChange={(_, val) => {
                setKind(val)
                if (val === 'past_paper' && sourceName === 'MyStudy biên soạn') {
                  setSourceName('Bộ GD&ĐT')
                  setDurationMinutes(90)
                } else if (val === 'mystudy_practice' && sourceName === 'Bộ GD&ĐT') {
                  setSourceName('MyStudy biên soạn')
                  setDurationMinutes(50)
                }
              }}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                value="mystudy_practice"
                label="Đề trắc nghiệm trực tuyến (Có chấm điểm & đồng hồ bấm giờ)"
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' }}
              />
              <Tab
                value="past_paper"
                label="Đề thi tải về / File PDF (Xem file và đối chiếu đáp án)"
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' }}
              />
            </Tabs>
          </Card>

          {/* Card 2: Thông tin chung */}
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
              2. Thông tin chung về đề thi
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
              <TextField
                required
                fullWidth
                label="Tiêu đề đề thi"
                placeholder="VD: Đề khảo sát chất lượng lần 1 môn Toán"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <FormControl fullWidth required>
                <InputLabel id="subject-label">Môn thi</InputLabel>
                <Select
                  labelId="subject-label"
                  label="Môn thi"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                >
                  {Object.entries(subjects).map(([code, name]) => (
                    <MenuItem key={code} value={code}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="Năm thi"
                value={examYear}
                onChange={(e) => setExamYear(Number(e.target.value))}
              />

              <TextField
                required
                fullWidth
                type="number"
                label="Thời gian làm bài (phút)"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />

              <TextField
                fullWidth
                label="Đơn vị phát hành / Nguồn đề"
                placeholder="VD: Bộ GD&ĐT, Trường THPT Chuyên..."
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                sx={{ gridColumn: { md: 'span 2' } }}
              />
            </Box>
          </Card>

          {/* Card 3A: Cấu hình Đề PDF */}
          {kind === 'past_paper' && (
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                3. Tải lên hoặc liên kết file PDF
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button
                  variant={pdfSourceType === 'upload' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setPdfSourceType('upload')}
                  sx={{ textTransform: 'none' }}
                >
                  Tải file PDF từ máy tính
                </Button>
                <Button
                  variant={pdfSourceType === 'url' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setPdfSourceType('url')}
                  sx={{ textTransform: 'none' }}
                >
                  Nhập link file PDF trực tiếp
                </Button>
              </Stack>

              {pdfSourceType === 'upload' ? (
                <Box sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 3, p: 3, textAlign: 'center' }}>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    id="pdf-upload-input"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="pdf-upload-input">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      disabled={uploadMutation.isPending}
                      sx={{ fontWeight: 600, py: 1.25, px: 3, borderRadius: 2.5 }}
                    >
                      {uploadMutation.isPending ? 'Đang tải lên server…' : 'Chọn file PDF đề thi từ máy tính'}
                    </Button>
                  </label>

                  {uploadedFileName && (
                    <Box
                      sx={{
                        mt: 2,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        color: colors.successText,
                        bgcolor: colors.successBg,
                        px: 2,
                        py: 0.75,
                        borderRadius: 2,
                      }}
                    >
                      <CheckIcon fontSize="small" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Đã tải lên: {uploadedFileName} ({paperUrl})
                      </Typography>
                    </Box>
                  )}
                  <FormHelperText sx={{ textAlign: 'center', mt: 1 }}>
                    Hỗ trợ file PDF kích thước tối đa 20MB.
                  </FormHelperText>
                </Box>
              ) : (
                <TextField
                  fullWidth
                  label="Đường dẫn file đề thi (PDF URL)"
                  placeholder="VD: /tai-lieu/toan-tham-khao-2025.pdf hoặc https://..."
                  value={paperUrl}
                  onChange={(e) => setPaperUrl(e.target.value)}
                  helperText="Có thể nhập link nội bộ (/tai-lieu/...) hoặc link ngoài (Google Drive, Cloudflare...)"
                />
              )}

              <TextField
                fullWidth
                label="Đường dẫn lời giải / trang đáp án (Tùy chọn)"
                placeholder="VD: /tai-lieu/toan-2026.pdf#page=5"
                value={answerGuideUrl}
                onChange={(e) => setAnswerGuideUrl(e.target.value)}
                helperText="Nếu để trống, hệ thống sẽ mở trực tiếp trang đầu của file đề."
                sx={{ mt: 2.5 }}
              />
            </Card>
          )}

          {/* Card 3B: Cấu hình Đề trắc nghiệm online */}
          {kind === 'mystudy_practice' && (
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  3. Danh sách câu hỏi ({questions.length} câu)
                </Typography>
                <Button
                  type="button"
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addQuestion}
                  sx={{ fontWeight: 600 }}
                >
                  Thêm câu hỏi
                </Button>
              </Box>

              <Stack spacing={3}>
                {questions.map((q, qIndex) => (
                  <Card
                    key={qIndex}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      borderColor: 'divider',
                      position: 'relative',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 700, color: colors.purple }}>
                        Câu số {qIndex + 1}
                      </Typography>

                      {questions.length > 1 && (
                        <Button
                          type="button"
                          color="error"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => removeQuestion(qIndex)}
                          sx={{ textTransform: 'none', fontSize: '0.82rem' }}
                        >
                          Xóa câu
                        </Button>
                      )}
                    </Box>

                    <TextField
                      required
                      fullWidth
                      multiline
                      rows={2}
                      label="Nội dung câu hỏi"
                      placeholder="VD: Cho hàm số y = f(x) có bảng biến thiên như sau..."
                      value={q.prompt}
                      onChange={(e) => updateQuestionPrompt(qIndex, e.target.value)}
                      sx={{ mb: 2 }}
                    />

                    <FormControl component="fieldset" fullWidth>
                      <FormLabel sx={{ fontSize: '0.88rem', fontWeight: 600, mb: 1 }}>
                        4 phương án lựa chọn (Chọn nút tròn để chỉ định đáp án đúng):
                      </FormLabel>
                      <RadioGroup
                        value={q.correctOptionNumber}
                        onChange={(e) => updateCorrectOption(qIndex, Number(e.target.value))}
                      >
                        <Stack spacing={1.5}>
                          {(['A', 'B', 'C', 'D'] as const).map((letter, optIdx) => (
                            <Box
                              key={letter}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                p: 1,
                                borderRadius: 2,
                                bgcolor:
                                  q.correctOptionNumber === optIdx + 1
                                    ? 'rgba(109, 77, 214, 0.08)'
                                    : 'transparent',
                                border: '1px solid',
                                borderColor:
                                  q.correctOptionNumber === optIdx + 1 ? colors.purple : 'divider',
                              }}
                            >
                              <FormControlLabel
                                value={optIdx + 1}
                                control={<Radio size="small" />}
                                label={<Typography sx={{ fontWeight: 700 }}>{letter}.</Typography>}
                                sx={{ mr: 0, minWidth: 60 }}
                              />
                              <TextField
                                required
                                fullWidth
                                size="small"
                                placeholder={`Nhập nội dung đáp án ${letter}...`}
                                value={q.options[optIdx]}
                                onChange={(e) => updateQuestionOption(qIndex, optIdx, e.target.value)}
                              />
                            </Box>
                          ))}
                        </Stack>
                      </RadioGroup>
                    </FormControl>

                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Cách giải / Lời giải chi tiết (tùy chọn)"
                      placeholder="VD: Áp dụng công thức đạo hàm hàm lũy thừa: (xⁿ)′ = n·xⁿ⁻¹..."
                      value={q.explanation}
                      onChange={(e) => updateQuestionExplanation(qIndex, e.target.value)}
                      sx={{ mt: 2 }}
                    />
                  </Card>
                ))}
              </Stack>

              <Button
                type="button"
                variant="outlined"
                fullWidth
                startIcon={<AddIcon />}
                onClick={addQuestion}
                sx={{ mt: 2.5, py: 1.25, borderRadius: 2.5, fontWeight: 600, borderStyle: 'dashed' }}
              >
                + Thêm câu hỏi tiếp theo
              </Button>
            </Card>
          )}

          {/* Action buttons */}
          <Divider sx={{ my: 1 }} />

          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end', pb: 4 }}>
            <Button
              component={RouterLink}
              to={paths.adminExams}
              color="inherit"
              disabled={createMutation.isPending}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={createMutation.isPending}
              sx={{ fontWeight: 700, px: 4, py: 1.25, borderRadius: 2.5 }}
            >
              {createMutation.isPending ? 'Đang công bố đề thi…' : 'Công bố đề thi lên hệ thống'}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Stack>
  )
}

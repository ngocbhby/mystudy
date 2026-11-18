import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { Box, Button, Card, Chip, LinearProgress, Stack, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors } from '@/app/theme/theme'
import { studyKeys } from '@/features/study/api/keys'
import { subjectName } from '@/features/study/model/catalog'
import { ApiError } from '@/lib/http/api-error'
import { ErrorNotice } from '@/shared/components/ErrorNotice'
import { LoadingState } from '@/shared/components/LoadingState'
import { MathText } from '@/shared/components/MathText'
import { PageHeader } from '@/shared/components/PageHeader'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { aiApi, aiKeys } from '../api/ai-api'
import { AiBadge } from '../components/AiBadge'
import { accuracy, MIN_QUESTIONS_FOR_VERDICT, type TopicMastery } from '../model/types'

function verdict(m: TopicMastery): { label: string; color: string } {
  if (m.total < MIN_QUESTIONS_FOR_VERDICT) return { label: 'Chưa đủ dữ liệu', color: colors.muted }
  const a = accuracy(m)
  if (a < 0.5) return { label: 'Cần ưu tiên', color: colors.danger }
  if (a < 0.7) return { label: 'Cần củng cố', color: colors.warningText }
  return { label: 'Vững', color: colors.successText }
}

function MasteryRow({ m }: { m: TopicMastery }) {
  const v = verdict(m)
  const percent = Math.round(accuracy(m) * 100)
  return (
    <Box component="li" sx={{ listStyle: 'none', py: 1.25 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 600 }}>
          {m.topicName}{' '}
          <Typography component="span" variant="body2" color="text.secondary">
            · {subjectName(m.subjectCode)}
          </Typography>
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Đúng {m.correct}/{m.total} câu ({percent}%)
          </Typography>
          <Chip size="small" label={v.label} sx={{ fontWeight: 600, color: '#fff', bgcolor: v.color }} />
        </Stack>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percent}
        aria-label={`Tỉ lệ đúng chuyên đề ${m.topicName}: ${percent}%`}
        sx={{ mt: 0.75, height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: v.color } }}
      />
    </Box>
  )
}

/** Trang phân tích: số liệu tỉ lệ đúng theo chuyên đề (do hệ thống tính) + nhận xét và nhiệm vụ do AI viết. */
export default function AnalysisPage() {
  useDocumentTitle('Phân tích học tập')
  const queryClient = useQueryClient()
  const analysis = useQuery({ queryKey: aiKeys.weakness(), queryFn: aiApi.weakness })
  const report = useMutation({
    mutationFn: aiApi.generateWeaknessReport,
    onSuccess: (data) => {
      queryClient.setQueryData(aiKeys.weakness(), data)
      void queryClient.invalidateQueries({ queryKey: aiKeys.status() })
    },
  })
  const rebuild = useMutation({
    mutationFn: aiApi.rebuildPlan,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: studyKeys.all }),
  })

  if (analysis.isPending) return <LoadingState label="Đang phân tích kết quả thi…" />
  if (analysis.isError) return <ErrorNotice error={analysis.error} onRetry={() => void analysis.refetch()} />

  const data = analysis.data
  const weakCount = data.topics.filter((m) => m.total >= MIN_QUESTIONS_FOR_VERDICT && accuracy(m) < 0.7).length

  return (
    <Stack spacing={3}>
      <PageHeader
        eyebrow="HỌC THÔNG MINH HƠN"
        title="Phân tích học tập"
        description={`Dựa trên ${data.attempts} lượt thi thử trong 60 ngày gần nhất.`}
      />

      {data.topics.length === 0 ? (
        <Card sx={{ p: 3.5 }}>
          <Typography sx={{ fontWeight: 600 }}>Chưa có dữ liệu để phân tích</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 2.5 }}>
            Hãy làm ít nhất một đề thi thử. Hệ thống sẽ tính tỉ lệ đúng theo từng chuyên đề và AI sẽ gợi ý cần ôn gì.
          </Typography>
          <Button component={RouterLink} to={paths.practice} variant="contained">
            Làm đề thi thử
          </Button>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' }, alignItems: 'start' }}>
          <Card component="section" aria-labelledby="mastery-title" sx={{ p: 3.5 }}>
            <Typography id="mastery-title" variant="h2" sx={{ fontWeight: 600 }}>
              Tỉ lệ đúng theo chuyên đề
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Số liệu do hệ thống tính từ bài làm của bạn. Câu bỏ trống tính là chưa đúng.
            </Typography>
            <Box component="ul" sx={{ p: 0, mt: 2, mb: 0 }}>
              {data.topics.map((m) => (
                <MasteryRow key={m.topicId} m={m} />
              ))}
            </Box>
            <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, bgcolor: 'rgba(109, 77, 214, 0.05)' }}>
              <Typography sx={{ fontWeight: 600 }}>Lộ trình thích ứng</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
                {weakCount > 0
                  ? `Có ${weakCount} chuyên đề cần củng cố. Cập nhật lộ trình để các chuyên đề này được xếp ôn thường xuyên hơn (giữ nguyên các buổi đã học).`
                  : 'Chưa có chuyên đề nào yếu rõ rệt. Bạn vẫn có thể cập nhật lộ trình sau mỗi lần thi.'}
              </Typography>
              <Button variant="contained" disabled={rebuild.isPending} onClick={() => rebuild.mutate()}>
                {rebuild.isPending ? 'Đang cập nhật…' : 'Cập nhật lộ trình theo kết quả'}
              </Button>
              {rebuild.isSuccess && (
                <Typography role="status" sx={{ mt: 1, color: colors.successText, fontWeight: 600 }}>
                  ✓ Đã cập nhật lộ trình.{' '}
                  <RouterLink to={paths.plan}>Xem lộ trình</RouterLink>
                </Typography>
              )}
              {rebuild.isError && (
                <Typography role="alert" color="error" variant="body2" sx={{ mt: 1 }}>
                  {rebuild.error instanceof ApiError ? rebuild.error.message : 'Chưa cập nhật được lộ trình.'}{' '}
                  {rebuild.error instanceof ApiError && rebuild.error.code === 'BAD_REQUEST' && (
                    <RouterLink to={paths.goal}>Thiết lập mục tiêu</RouterLink>
                  )}
                </Typography>
              )}
            </Box>
          </Card>

          <Card component="section" aria-labelledby="ai-report-title" sx={{ p: 3.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography id="ai-report-title" variant="h2" sx={{ fontWeight: 600 }}>
                Nhận xét của AI
              </Typography>
              {data.report && <AiBadge />}
            </Stack>
            {!data.aiEnabled && (
              <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                Tính năng AI chưa được bật trên máy chủ. Bảng số liệu bên cạnh vẫn dùng được bình thường.
              </Typography>
            )}
            {data.report ? (
              <Box sx={{ mt: 1.5 }}>
                <MathText text={data.report.summary} />
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {data.report.priorities.map((p, i) => (
                    <Box key={i} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: colors.border }}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {i + 1}. {p.topicName}
                      </Typography>
                      <MathText text={p.diagnosis} sx={{ fontSize: '0.92rem', color: 'text.secondary' }} />
                      <Box component="ul" sx={{ pl: 2.5, my: 0.5 }}>
                        {p.nextTasks.map((task, j) => (
                          <Box component="li" key={j} sx={{ fontSize: '0.92rem' }}>
                            <MathText text={task} inline />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Stack>
                <Typography sx={{ mt: 2, fontStyle: 'italic' }}>{data.report.encouragement}</Typography>
                {data.reportStale && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Bạn đã làm thêm bài thi sau lần nhận xét này.
                  </Typography>
                )}
              </Box>
            ) : (
              data.aiEnabled && (
                <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                  AI sẽ đọc bảng số liệu và các câu bạn làm sai để chỉ ra nguyên nhân và gợi ý nhiệm vụ cụ thể.
                </Typography>
              )
            )}
            {data.aiEnabled && (!data.report || data.reportStale) && (
              <Button
                sx={{ mt: 2 }}
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                disabled={report.isPending}
                onClick={() => report.mutate()}
              >
                {report.isPending ? 'AI đang phân tích…' : data.report ? 'Cập nhật nhận xét' : 'Nhờ AI nhận xét'}
              </Button>
            )}
            {report.isError && (
              <Typography role="alert" color="error" variant="body2" sx={{ mt: 1 }}>
                {report.error instanceof ApiError ? report.error.message : 'Chưa tạo được nhận xét. Vui lòng thử lại.'}
              </Typography>
            )}
          </Card>
        </Box>
      )}
    </Stack>
  )
}

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSession } from '@/features/auth/hooks/useSession'
import { ApiError } from '@/lib/http/api-error'
import { MathText } from '@/shared/components/MathText'
import { aiApi, aiKeys } from '../api/ai-api'
import { AiBadge } from './AiBadge'

/** Nút "Vì sao mình sai?" dưới mỗi câu làm sai: gia sư AI giải thích lựa chọn sai và cách giải đúng. */
export function AiExplainBox({
  examId,
  attemptId,
  questionNumber,
}: {
  examId: string
  attemptId: string
  questionNumber: number
}) {
  const session = useSession()
  const signedIn = Boolean(session.data?.user)
  const queryClient = useQueryClient()
  const status = useQuery({ queryKey: aiKeys.status(), queryFn: aiApi.status, enabled: signedIn, staleTime: 30_000 })
  const [reported, setReported] = useState(false)
  const request = { examId, attemptId, questionNumber }
  const explain = useMutation({
    mutationFn: () => aiApi.explain(request),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: aiKeys.status() }),
  })
  const report = useMutation({ mutationFn: () => aiApi.reportExplanation(request), onSuccess: () => setReported(true) })

  if (!signedIn) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
        Đăng nhập để hỏi gia sư AI vì sao câu này sai.
      </Typography>
    )
  }
  if (status.data && !status.data.enabled) return null

  const result = explain.data
  return (
    <Box sx={{ mt: 1.5 }}>
      {!result && (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoAwesomeIcon />}
            disabled={explain.isPending}
            onClick={() => explain.mutate()}
          >
            {explain.isPending ? 'Gia sư AI đang suy nghĩ…' : 'Vì sao mình sai?'}
          </Button>
          {status.data && (
            <Typography variant="caption" color="text.secondary">
              Còn {status.data.remainingToday}/{status.data.dailyLimit} lượt hỏi AI hôm nay
            </Typography>
          )}
        </Stack>
      )}
      {explain.isError && (
        <Typography role="alert" color="error" variant="body2" sx={{ mt: 1 }}>
          {explain.error instanceof ApiError ? explain.error.message : 'Chưa hỏi được gia sư AI. Vui lòng thử lại.'}
        </Typography>
      )}
      {result && (
        <Box
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: '1px dashed',
            borderColor: 'primary.main',
            bgcolor: 'rgba(109, 77, 214, 0.03)',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>Gia sư AI</Typography>
            <AiBadge />
          </Stack>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Có thể bạn đã nhầm:
          </Typography>
          <MathText text={result.explanation.misconception} sx={{ fontSize: '0.92rem' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, mt: 1.25, mb: 0.5 }}>
            Cách giải đúng:
          </Typography>
          <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
            {result.explanation.steps.map((step, i) => (
              <Box component="li" key={i} sx={{ fontSize: '0.92rem' }}>
                <MathText text={step} inline />
              </Box>
            ))}
          </Box>
          <Typography variant="body2" sx={{ mt: 1.25 }}>
            <strong>Mẹo:</strong> <MathText text={result.explanation.tip} inline />
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Nên ôn lại: {result.explanation.reviewTopic}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              AI có thể nhầm. Hãy đối chiếu với lời giải ở trên.
            </Typography>
            <Button
              size="small"
              color="inherit"
              disabled={reported || report.isPending}
              onClick={() => report.mutate()}
            >
              {reported ? 'Đã báo lỗi' : 'Báo giải thích sai'}
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  )
}

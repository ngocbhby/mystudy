import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/useSession'
import { ApiError } from '@/lib/http/api-error'
import { MathText } from '@/shared/components/MathText'
import { aiApi, aiKeys } from '../api/ai-api'
import { AiBadge } from './AiBadge'

/**
 * Ghi chú kiến thức cốt lõi của chuyên đề (lưu trong CSDL thay vì viết cứng ở giao diện). Chuyên đề chưa có ghi chú
 * thì học sinh đã đăng nhập có thể nhờ AI soạn; ghi chú được lưu chung cho mọi người học.
 */
export function TopicNoteView({ topicId }: { topicId: string }) {
  const queryClient = useQueryClient()
  const session = useSession()
  const signedIn = Boolean(session.data?.user)
  const note = useQuery({ queryKey: aiKeys.topicNote(topicId), queryFn: () => aiApi.topicNote(topicId) })
  const status = useQuery({ queryKey: aiKeys.status(), queryFn: aiApi.status, enabled: signedIn, staleTime: 30_000 })
  const generate = useMutation({
    mutationFn: () => aiApi.generateTopicNote(topicId),
    onSuccess: (data) => {
      queryClient.setQueryData(aiKeys.topicNote(topicId), data)
      void queryClient.invalidateQueries({ queryKey: aiKeys.status() })
    },
  })

  if (note.isPending) {
    return (
      <Stack spacing={1} aria-label="Đang tải ghi chú">
        <Skeleton width="60%" />
        <Skeleton />
        <Skeleton width="80%" />
      </Stack>
    )
  }
  if (note.isError) {
    return <Typography color="text.secondary">Chưa tải được ghi chú kiến thức.</Typography>
  }
  if (note.data.contentMd) {
    return (
      <Box>
        {note.data.aiGenerated && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
            <AiBadge label="Ghi chú do AI soạn" />
            <Typography variant="caption" color="text.secondary">
              Đối chiếu với sách giáo khoa khi thấy điểm chưa rõ.
            </Typography>
          </Stack>
        )}
        <MathText text={note.data.contentMd} />
      </Box>
    )
  }

  const aiReady = signedIn && status.data?.enabled
  return (
    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(109, 77, 214, 0.04)' }}>
      <Typography sx={{ mb: aiReady ? 1.5 : 0 }} color="text.secondary">
        Chuyên đề này chưa có ghi chú kiến thức.
        {!signedIn && ' Đăng nhập để nhờ AI soạn ghi chú.'}
      </Typography>
      {aiReady && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<AutoAwesomeIcon />}
          disabled={generate.isPending}
          onClick={() => generate.mutate()}
        >
          {generate.isPending ? 'AI đang soạn ghi chú…' : 'Nhờ AI soạn ghi chú'}
        </Button>
      )}
      {generate.isError && (
        <Typography role="alert" color="error" variant="body2" sx={{ mt: 1 }}>
          {generate.error instanceof ApiError ? generate.error.message : 'Chưa soạn được ghi chú. Vui lòng thử lại.'}
        </Typography>
      )}
    </Box>
  )
}

import { Alert, Button, Stack } from '@mui/material'
import { ApiError } from '@/lib/http/api-error'

interface Props {
  error: unknown
  onRetry?: () => void
}

/** Hiển thị lỗi API thống nhất kèm nút thử lại. */
export function ErrorNotice({ error, onRetry }: Props) {
  const message = error instanceof ApiError ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.'
  return (
    <Stack spacing={1.5} role="alert" sx={{ alignItems: 'flex-start' }}>
      <Alert severity="error" sx={{ width: '100%' }}>
        {message}
      </Alert>
      {onRetry && (
        <Button variant="outlined" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </Stack>
  )
}

import { CircularProgress, Stack, Typography } from '@mui/material'

export function LoadingState({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <Stack direction="row" spacing={1.5} role="status" sx={{ alignItems: 'center', py: 3 }}>
      <CircularProgress size={20} />
      <Typography color="text.secondary">{label}</Typography>
    </Stack>
  )
}

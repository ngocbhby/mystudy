import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { colors } from '@/app/theme/theme'

const tones = {
  warning: { bg: colors.warningBg, fg: colors.warningText },
  success: { bg: colors.successBg, fg: colors.successText },
  info: { bg: colors.lavender, fg: colors.ink },
} as const

/** Khung ghi chú nền màu (vàng cảnh báo, xanh thành công, lavender thông tin). */
export function Notice({
  tone,
  title,
  children,
}: {
  tone: keyof typeof tones
  title?: string
  children: ReactNode
}) {
  const { bg, fg } = tones[tone]
  return (
    <Box sx={{ bgcolor: bg, color: fg, borderRadius: 3, p: 2 }}>
      {title && <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{title}</Typography>}
      <Typography variant="body2" component="div" sx={{ color: 'inherit' }}>
        {children}
      </Typography>
    </Box>
  )
}

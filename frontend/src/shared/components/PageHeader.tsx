import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface Props {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        mb: 3.5,
      }}
    >
      <Box>
        {eyebrow && <Kicker sx={{ mb: 1.5 }}>{eyebrow}</Kicker>}
        <Typography variant="h1" component="h1">
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" sx={{ mt: 1.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions}
    </Box>
  )
}

/** Nhãn nhỏ viết hoa màu tím phía trên tiêu đề. */
export function Kicker({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Typography
      variant="overline"
      component="p"
      color="primary"
      sx={{ textTransform: 'uppercase', m: 0, ...sx }}
    >
      {children}
    </Typography>
  )
}

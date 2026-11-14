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
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', mb: 3 }}>
      <Box>
        {eyebrow && (
          <Typography variant="overline" color="primary" sx={{ fontWeight: 600, letterSpacing: '0.08em' }}>
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h1" component="h1">{title}</Typography>
        {description && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>}
      </Box>
      {actions}
    </Box>
  )
}

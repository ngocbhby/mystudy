import { Box, InputBase, Typography, type InputBaseProps } from '@mui/material'
import type { Ref } from 'react'
import { colors } from '@/app/theme/theme'

interface Props extends Omit<InputBaseProps, 'error'> {
  label: string
  unit?: string
  error?: string
  inputRef?: Ref<HTMLInputElement>
}

/** Ô nhập kiểu thiết kế: khung bo góc, nhãn nhỏ ở trên, giá trị lớn và đơn vị ở dưới. */
export function FieldBox({ label, unit, error, inputRef, id, ...input }: Props) {
  const fieldId = id ?? `field-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <Box>
      <Box
        sx={{
          border: 1,
          borderColor: error ? 'error.main' : colors.border,
          borderRadius: 3.5,
          bgcolor: '#fff',
          px: 2,
          py: 1.25,
          '&:focus-within': { borderColor: 'primary.main', boxShadow: `0 0 0 2px ${colors.lavender}` },
        }}
      >
        <Typography
          component="label"
          htmlFor={fieldId}
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block' }}
        >
          {label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
          <InputBase
            id={fieldId}
            inputRef={inputRef}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            sx={{ fontWeight: 600, fontSize: '1.1rem', flex: 1 }}
            {...input}
          />
          {unit && (
            <Typography component="span" color="text.secondary" sx={{ fontWeight: 600 }}>
              {unit}
            </Typography>
          )}
        </Box>
      </Box>
      {error && (
        <Typography
          id={`${fieldId}-error`}
          variant="caption"
          color="error"
          sx={{ mt: 0.5, display: 'block' }}
        >
          {error}
        </Typography>
      )}
    </Box>
  )
}

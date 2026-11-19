import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { Chip } from '@mui/material'

/** Nhãn bắt buộc cho mọi nội dung do AI tạo, để học sinh biết cần đối chiếu khi thấy bất thường. */
export function AiBadge({ label = 'Do AI tạo' }: { label?: string }) {
  return (
    <Chip
      size="small"
      icon={<AutoAwesomeIcon sx={{ fontSize: '1rem' }} />}
      label={label}
      sx={{ fontWeight: 600, bgcolor: 'rgba(109, 77, 214, 0.1)', color: 'primary.main' }}
    />
  )
}

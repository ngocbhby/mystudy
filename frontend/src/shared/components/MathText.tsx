import { Box, type SxProps, type Theme } from '@mui/material'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'

/**
 * Hiển thị văn bản Markdown có công thức LaTeX ($...$ và $$...$$). Không cho phép HTML thô (mặc định của
 * react-markdown), nên nội dung do AI hoặc người dùng tạo không thể chèn script.
 */
export function MathText({ text, sx, inline = false }: { text: string; sx?: SxProps<Theme>; inline?: boolean }) {
  return (
    <Box
      component={inline ? 'span' : 'div'}
      sx={{
        '& p': { my: inline ? 0 : 0.75, display: inline ? 'inline' : undefined },
        '& h2': { fontSize: '1.05rem', fontWeight: 700, mt: 2, mb: 0.75 },
        '& h3': { fontSize: '1rem', fontWeight: 700, mt: 1.5, mb: 0.5 },
        '& ul, & ol': { pl: 2.5, my: 0.75 },
        '& li': { my: 0.25 },
        '& .katex-display': { overflowX: 'auto', overflowY: 'hidden', py: 0.5 },
        lineHeight: 1.7,
        ...sx,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={inline ? { p: ({ children }) => <>{children}</> } : undefined}
      >
        {text}
      </ReactMarkdown>
    </Box>
  )
}

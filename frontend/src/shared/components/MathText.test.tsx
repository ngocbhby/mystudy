import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MathText } from './MathText'

describe('MathText', () => {
  it('renders LaTeX formulas with KaTeX', () => {
    const { container } = render(<MathText text={"Đạo hàm: $y' = 3x^2$"} />)
    expect(container.querySelector('.katex')).not.toBeNull()
    expect(container.textContent).toContain('Đạo hàm')
  })

  it('does not render raw HTML from AI or user content', () => {
    const { container } = render(<MathText text={'<img src=x onerror="alert(1)"> **đậm**'} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('strong')?.textContent).toBe('đậm')
  })
})

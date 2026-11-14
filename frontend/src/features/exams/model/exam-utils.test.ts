import { describe, expect, it } from 'vitest'
import { optionLabel, safeDocumentUrl, scoreOf } from './exam-utils'

describe('exam utils', () => {
  it('labels options A, B, C…', () => {
    expect([1, 2, 4].map(optionLabel)).toEqual(['A', 'B', 'D'])
  })

  it('only allows https and same-origin document links', () => {
    const origin = 'https://mystudy.example'
    expect(safeDocumentUrl('/tai-lieu/x.pdf#page=5', origin)).toBe(
      'https://mystudy.example/tai-lieu/x.pdf#page=5',
    )
    expect(safeDocumentUrl('https://cdn.example/x.pdf', origin)).toBe('https://cdn.example/x.pdf')
    expect(safeDocumentUrl('javascript:alert(1)', origin)).toBeUndefined()
    expect(safeDocumentUrl('http://evil.example/x.pdf', origin)).toBeUndefined()
    expect(safeDocumentUrl(undefined, origin)).toBeUndefined()
  })

  it('scores out of 10', () => {
    expect(scoreOf(7, 10)).toBe(7)
    expect(scoreOf(0, 0)).toBe(0)
  })
})

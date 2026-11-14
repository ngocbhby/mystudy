import { describe, expect, it } from 'vitest'
import { parseSolution } from './solution'

describe('parseSolution', () => {
  it('turns single-spaced lines into numbered steps', () => {
    expect(parseSolution('Bước một.\nBước hai.\n')).toEqual({
      kind: 'steps',
      steps: ['Bước một.', 'Bước hai.'],
    })
  })

  it('treats blank-line separated text as essay paragraphs', () => {
    expect(parseSolution('Đoạn một.\n\nĐoạn hai.')).toEqual({
      kind: 'essay',
      paragraphs: ['Đoạn một.', 'Đoạn hai.'],
    })
  })
})

export type SolutionLayout = { kind: 'steps'; steps: string[] } | { kind: 'essay'; paragraphs: string[] }

/** Lời giải nhiều đoạn (cách nhau dòng trống) là bài viết tham khảo; ngược lại là các bước đánh số. */
export function parseSolution(modelSolution: string): SolutionLayout {
  const text = modelSolution.trim()
  if (/\n\s*\n/.test(text)) {
    return {
      kind: 'essay',
      paragraphs: text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
    }
  }
  return {
    kind: 'steps',
    steps: text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
  }
}

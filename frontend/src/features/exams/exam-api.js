import { useEffect, useState } from 'react'

export function useExamData(path) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (path === null) return
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch('/api/exams' + path, { signal: controller.signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Không thể tải đề thi.')
        if (!controller.signal.aborted) setResult({ path, attempt, data })
      } catch (error) {
        if (!controller.signal.aborted) setResult({ path, attempt, error: error.message })
      }
    }
    void load()
    return () => controller.abort()
  }, [path, attempt])

  return {
    ...(result?.path === path && result.attempt === attempt ? result : {}),
    retry: () => setAttempt((value) => value + 1),
  }
}

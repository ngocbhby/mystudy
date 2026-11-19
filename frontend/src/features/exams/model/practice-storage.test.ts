import { beforeEach, describe, expect, it } from 'vitest'
import { clearPracticeStorage, latestKey, ownerOf, practiceKey } from './practice-storage'

describe('practice storage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('keeps each account and guests apart', () => {
    expect(latestKey(ownerOf('user-a'), 'exam-1')).not.toBe(latestKey(ownerOf('user-b'), 'exam-1'))
    expect(latestKey(ownerOf(null), 'exam-1')).toBe('mystudy_latest_attempt_guest_exam-1')
    expect(practiceKey(ownerOf('user-a'), 'exam-1')).not.toBe(latestKey(ownerOf('user-a'), 'exam-1'))
  })

  it('clears saved attempts, including the old unscoped keys, and nothing else', () => {
    localStorage.setItem(latestKey('user-a', 'exam-1'), '{}')
    localStorage.setItem('mystudy_latest_attempt_exam-1', '{}') // khóa cũ trước bản sửa
    sessionStorage.setItem(practiceKey('guest', 'exam-1'), '{}')
    localStorage.setItem('other-app-setting', 'keep')

    clearPracticeStorage()

    expect(localStorage.length).toBe(1)
    expect(localStorage.getItem('other-app-setting')).toBe('keep')
    expect(sessionStorage.length).toBe(0)
  })
})

import type { SampleFilters } from '../model/types'

export const sampleKeys = {
  all: ['samples'] as const,
  list: (filters: SampleFilters) => [...sampleKeys.all, 'list', filters] as const,
}

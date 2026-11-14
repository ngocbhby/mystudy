import { api } from '@/lib/http/client'
import type { SampleFilters, SampleList } from '../model/types'

export const sampleApi = {
  list: ({ subject, topic }: SampleFilters) =>
    api.get<SampleList>('/api/samples', {
      params: { subject: subject || undefined, topic: topic || undefined },
    }),
}

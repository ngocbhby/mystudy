import { useQuery } from '@tanstack/react-query'
import { staleTimes } from '@/lib/query/query-client'
import { sampleApi } from '../api/sample-api'
import { sampleKeys } from '../api/keys'
import type { SampleFilters } from '../model/types'

/** Bài mẫu là nội dung tĩnh: cache dài, giữ dữ liệu cũ khi đổi bộ lọc. */
export function useSamples(filters: SampleFilters) {
  return useQuery({
    queryKey: sampleKeys.list(filters),
    queryFn: () => sampleApi.list(filters),
    staleTime: staleTimes.static,
    placeholderData: (previous) => previous,
  })
}

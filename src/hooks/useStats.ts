import useSWR from 'swr';
import type { DashboardStats, ApiResponse } from '@/types/api';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useStats(refreshInterval = 0) {
  const { data, error, isLoading } = useSWR<ApiResponse<DashboardStats>>(
    '/api/stats',
    fetcher,
    { refreshInterval }
  );

  return {
    stats: data?.data || null,
    isLoading,
    isError: !!error || (data && !data.success),
  };
}

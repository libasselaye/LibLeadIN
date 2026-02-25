import useSWR from 'swr';
import type { Lead } from '@/types/lead';
import type { ApiResponse } from '@/types/api';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLeads(refreshInterval = 0) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Lead[]>>(
    '/api/leads',
    fetcher,
    { refreshInterval }
  );

  return {
    leads: data?.data || [],
    isLoading,
    isError: !!error || (data && !data.success),
    error: error?.message || data?.error,
    mutate,
  };
}

'use client';

import { useState } from 'react';
import type { SearchFormData } from '@/types/search';

export function useSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (data: SearchFormData) => {
    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Search failed');
        return false;
      }
      return true;
    } catch (err) {
      setError(`Network error: ${err}`);
      return false;
    } finally {
      setIsSearching(false);
    }
  };

  return { search, isSearching, error };
}

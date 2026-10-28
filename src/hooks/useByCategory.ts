import { useQuery } from '@tanstack/react-query';
import { getMealsByCategory } from '../api';

export const useByCategory = (category?: string) => {
  return useQuery({
    queryKey: ['meals', 'category', category],
    queryFn: ({ signal }) => getMealsByCategory(category ?? '', signal),
    enabled: Boolean(category),
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  });
};

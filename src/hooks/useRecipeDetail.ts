import { useQuery } from '@tanstack/react-query';
import { getMealById } from '../api';

export const useRecipeDetail = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['meals', 'detail', id],
    queryFn: ({ signal }) => getMealById(id, signal),
    enabled: enabled && Boolean(id),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  });
};

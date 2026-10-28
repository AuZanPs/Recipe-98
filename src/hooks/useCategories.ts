import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => getCategories(signal),
    staleTime: 60 * 60_000,
    gcTime: 2 * 60 * 60_000,
    retry: 1,
  });
};

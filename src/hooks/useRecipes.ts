import { useQuery } from '@tanstack/react-query';
import { searchMeals } from '../api';

export const useRecipes = (query: string) => {
  return useQuery({
    queryKey: ['recipes', query],
    queryFn: ({ signal }) => searchMeals(query, signal),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    retry: 1,
  });
};

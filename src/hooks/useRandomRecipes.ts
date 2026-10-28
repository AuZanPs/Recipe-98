import { useQuery } from '@tanstack/react-query';
import { getRandomMeals } from '../api';

export const useRandomRecipes = (count = 6) => {
  return useQuery({
    queryKey: ['meals', 'random', count],
    queryFn: ({ signal }) => getRandomMeals(count, signal),
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchMeals } from '../api/mealdb';
import { useRecipes } from '../hooks/useRecipes';

vi.mock('../api/mealdb', () => ({
  searchMeals: vi.fn(async () => [
    {
      idMeal: '1',
      strMeal: 'Meal A',
      strMealThumb: 'thumb',
      strCategory: 'Cat',
      strArea: 'Area',
      strInstructions: 'Do it.',
    },
  ]),
}));

const searchMealsMock = vi.mocked(searchMeals);

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useRecipes', () => {
  beforeEach(() => {
    searchMealsMock.mockClear();
  });

  it('fetches with the query term and exposes the result', async () => {
    const { result } = renderHook(() => useRecipes('pasta'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0]?.strMeal).toBe('Meal A');
    expect(searchMealsMock).toHaveBeenCalledWith('pasta', expect.anything());
  });

  it('does not fetch fewer than two characters', () => {
    const { result } = renderHook(() => useRecipes('p'), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(searchMealsMock).not.toHaveBeenCalled();
  });
});

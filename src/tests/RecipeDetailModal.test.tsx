import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RecipeDetailModal } from '../components/RecipeDetailModal/RecipeDetailModal';
import type { MealPartial } from '../types/recipe';

const fullMeal: MealPartial = {
  idMeal: '1',
  strMeal: 'Test Meal',
  strMealThumb: 'http://example.com/img.jpg',
  strCategory: 'Cat',
  strArea: 'Area',
  strInstructions: 'Line 1\nLine 2',
  strIngredient1: 'Sugar',
  strMeasure1: '1 tsp',
  strIngredient2: 'Flour',
  strMeasure2: '2 cups',
};

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const renderModal = (onClose: () => void) =>
  render(<RecipeDetailModal meal={fullMeal} onClose={onClose} />, { wrapper });

describe('RecipeDetailModal', () => {
  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal(onClose);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('renders ingredient rows and instructions', () => {
    renderModal(vi.fn());

    expect(screen.getByText('Sugar')).toBeInTheDocument();
    expect(screen.getByText('Flour')).toBeInTheDocument();
    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('Line 2')).toBeInTheDocument();
  });

  it('persists a saved recipe', async () => {
    const user = userEvent.setup();
    renderModal(vi.fn());
    window.localStorage.clear();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('button', { name: 'Saved' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const stored: unknown = JSON.parse(
      window.localStorage.getItem('recipe98:favorites:v1') ?? '[]',
    );
    expect(Array.isArray(stored)).toBe(true);
    expect(stored).toEqual([
      expect.objectContaining({ idMeal: '1', strMeal: 'Test Meal' }),
    ]);
  });
});

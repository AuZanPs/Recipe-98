import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MealPartial } from '../types/recipe';

const STORAGE_KEY = 'recipe98:favorites:v1';

const meal = (id: string): MealPartial => ({
  idMeal: id,
  strMeal: `Meal ${id}`,
  strMealThumb: `thumb-${id}`,
  strCategory: 'Cat',
  strArea: 'Area',
});

// The hook keeps a module-level cache, so load a fresh copy for every test.
const loadHook = async () => (await import('../hooks/useFavorites')).useFavorites;

describe('useFavorites', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetModules();
  });

  it('starts empty', async () => {
    const useFavorites = await loadHook();
    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toEqual([]);
    expect(result.current.isFavorite('1')).toBe(false);
  });

  it('adds, persists and removes a favourite', async () => {
    const useFavorites = await loadHook();
    const { result } = renderHook(() => useFavorites());

    act(() => result.current.toggle(meal('1')));
    expect(result.current.isFavorite('1')).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(1);

    act(() => result.current.toggle(meal('1')));
    expect(result.current.isFavorite('1')).toBe(false);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual([]);
  });

  it('puts the newest favourite first and caps the list at 60', async () => {
    const useFavorites = await loadHook();
    const { result } = renderHook(() => useFavorites());

    act(() => {
      for (let i = 0; i < 65; i += 1) result.current.toggle(meal(String(i)));
    });

    expect(result.current.favorites).toHaveLength(60);
    expect(result.current.favorites[0]?.idMeal).toBe('64');
  });

  it('restores saved favourites from localStorage', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([meal('5')]));
    const useFavorites = await loadHook();
    const { result } = renderHook(() => useFavorites());

    expect(result.current.isFavorite('5')).toBe(true);
  });

  it('ignores corrupt saved data', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    const useFavorites = await loadHook();
    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it('follows changes made in another tab', async () => {
    const useFavorites = await loadHook();
    const { result } = renderHook(() => useFavorites());

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: JSON.stringify([meal('9')]),
        }),
      );
    });

    expect(result.current.isFavorite('9')).toBe(true);
  });
});

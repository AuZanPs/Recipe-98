import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import type { MealPartial } from '../types/recipe';

const STORAGE_KEY = 'recipe98:favorites:v1';
const STORE_EVENT = 'recipe98:favorites';
const MAX_FAVORITES = 60;

const savedMealSchema = z.object({
  idMeal: z.string(),
  strMeal: z.string(),
  strMealThumb: z.string(),
  strCategory: z.string().optional(),
  strArea: z.string().optional(),
});

const savedMealsSchema = z.array(savedMealSchema);

let cache: MealPartial[] | null = null;

function parseSaved(raw: string | null): MealPartial[] {
  if (!raw) return [];
  try {
    const parsed = savedMealsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn('Saved recipes had an unexpected shape.', parsed.error);
      return [];
    }
    return parsed.data.slice(0, MAX_FAVORITES);
  } catch (error) {
    console.warn('Saved recipes could not be read.', error);
    return [];
  }
}

function getSnapshot(): MealPartial[] {
  if (cache) return cache;
  try {
    cache = parseSaved(window.localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    console.warn('Local storage is unavailable; saved recipes will not persist.', error);
    cache = [];
  }
  return cache;
}

function subscribe(onStoreChange: () => void): () => void {
  const handleChange = () => onStoreChange();
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = parseSaved(event.newValue);
    onStoreChange();
  };

  window.addEventListener(STORE_EVENT, handleChange);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(STORE_EVENT, handleChange);
    window.removeEventListener('storage', handleStorage);
  };
}

function toggle(meal: MealPartial): void {
  const current = getSnapshot();
  const saved = current.some((item) => item.idMeal === meal.idMeal);
  const next = saved
    ? current.filter((item) => item.idMeal !== meal.idMeal)
    : [{
        idMeal: meal.idMeal,
        strMeal: meal.strMeal,
        strMealThumb: meal.strMealThumb,
        strCategory: meal.strCategory ?? undefined,
        strArea: meal.strArea ?? undefined,
      }, ...current].slice(0, MAX_FAVORITES);

  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Saved recipes could not be persisted.', error);
  }
  window.dispatchEvent(new Event(STORE_EVENT));
}

export const useFavorites = () => {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    favorites,
    toggle,
    isFavorite: (id: string) => favorites.some((meal) => meal.idMeal === id),
  };
};

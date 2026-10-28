// TheMealDB API client.
// Requests are capped at two concurrent connections and every response is
// validated before it reaches the UI.

import { z } from 'zod';
import type { Category, MealPartial } from '../types/recipe';

const API_KEY = import.meta.env.VITE_MEALDB_API_KEY?.trim() || '1';
const API_BASE = (
  import.meta.env.VITE_MEALDB_BASE_URL?.trim() ||
  `https://www.themealdb.com/api/json/v1/${API_KEY}`
).replace(/\/+$/, '');

const mealSchema = z
  .object({
    idMeal: z.string(),
    strMeal: z.string(),
    strMealThumb: z.string().nullish().transform((value) => value ?? ''),
    strCategory: z.string().nullish(),
    strArea: z.string().nullish(),
    strInstructions: z.string().nullish(),
    strTags: z.string().nullish(),
    strYoutube: z.string().nullish(),
    strSource: z.string().nullish(),
  })
  .catchall(z.string().nullish());

const mealsResponseSchema = z.object({
  meals: z.array(mealSchema).nullish(),
});

const categorySchema = z.object({
  idCategory: z.string(),
  strCategory: z.string(),
  strCategoryThumb: z.string(),
  strCategoryDescription: z
    .string()
    .nullish()
    .transform((value) => value ?? ''),
});

const categoriesResponseSchema = z.object({
  categories: z.array(categorySchema).nullish(),
});

const MAX_CONCURRENT = 2;

let activeRequests = 0;
const waiters: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests += 1;
    return;
  }
  // releaseSlot hands its slot straight to the next waiter.
  const { promise, resolve } = Promise.withResolvers<void>();
  waiters.push(resolve);
  await promise;
}

function releaseSlot(): void {
  const next = waiters.shift();
  if (next) next();
  else activeRequests -= 1;
}

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  await acquireSlot();
  try {
    return await task();
  } finally {
    releaseSlot();
  }
}

export class ApiError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(`${API_BASE}${path}`, { signal });
  if (!response.ok) {
    throw new ApiError(
      response.status === 429
        ? 'The recipe service is busy. Please try again in a moment.'
        : `Recipe request failed (HTTP ${response.status}).`,
      response.status,
    );
  }
  return response.json();
}

function parseMeals(payload: unknown): MealPartial[] {
  const parsed = mealsResponseSchema.safeParse(payload);
  if (!parsed.success) {
    console.warn('Unexpected TheMealDB meals payload.', parsed.error);
    return [];
  }
  return parsed.data.meals ?? [];
}

function parseCategories(payload: unknown): Category[] {
  const parsed = categoriesResponseSchema.safeParse(payload);
  if (!parsed.success) {
    console.warn('Unexpected TheMealDB categories payload.', parsed.error);
    return [];
  }
  return parsed.data.categories ?? [];
}

export async function searchMeals(
  query: string,
  signal?: AbortSignal,
): Promise<MealPartial[]> {
  const payload = await withSlot(() =>
    request(`/search.php?s=${encodeURIComponent(query)}`, signal),
  );
  return parseMeals(payload);
}

export async function getMealById(
  id: string,
  signal?: AbortSignal,
): Promise<MealPartial | null> {
  const payload = await withSlot(() =>
    request(`/lookup.php?i=${encodeURIComponent(id)}`, signal),
  );
  return parseMeals(payload)[0] ?? null;
}

export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  const payload = await withSlot(() => request('/categories.php', signal));
  return parseCategories(payload);
}

export async function getMealsByCategory(
  category: string,
  signal?: AbortSignal,
): Promise<MealPartial[]> {
  const payload = await withSlot(() =>
    request(`/filter.php?c=${encodeURIComponent(category)}`, signal),
  );
  return parseMeals(payload);
}

export async function getRandomMeal(
  signal?: AbortSignal,
): Promise<MealPartial | null> {
  const payload = await withSlot(() => request('/random.php', signal));
  return parseMeals(payload)[0] ?? null;
}

export async function getRandomMeals(
  count: number,
  signal?: AbortSignal,
): Promise<MealPartial[]> {
  const results = await Promise.allSettled(
    Array.from({ length: count }, () => getRandomMeal(signal)),
  );

  if (signal?.aborted) {
    throw new DOMException('Request aborted.', 'AbortError');
  }

  const meals = new Map<string, MealPartial>();
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      meals.set(result.value.idMeal, result.value);
    }
  }

  if (meals.size === 0) {
    const failure = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    throw failure?.reason instanceof Error
      ? failure.reason
      : new ApiError('Could not load random recipes.');
  }

  return [...meals.values()];
}

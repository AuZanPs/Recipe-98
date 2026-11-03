// TheMealDB API client.
// Requests are capped at two concurrent connections, time out after
// REQUEST_TIMEOUT_MS, retry once on transient failures, and every response is
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

export const REQUEST_TIMEOUT_MS = 10_000;
export const RETRY_DELAY_MS = 800;
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

function abortError(): DOMException {
  return new DOMException('Request aborted.', 'AbortError');
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(abortError());
    };
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function fetchOnce(path: string, signal?: AbortSignal): Promise<unknown> {
  // A hung request must not hold one of the concurrency slots forever.
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { signal: combined });
  } catch (error) {
    if (timeout.aborted && !signal?.aborted) {
      throw new ApiError('The recipe service took too long to respond.');
    }
    throw error;
  }

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

async function request(path: string, signal?: AbortSignal): Promise<unknown> {
  try {
    return await withSlot(() => fetchOnce(path, signal));
  } catch (error) {
    // One retry for transient failures. The wait happens outside the slot so
    // other requests are not blocked while backing off.
    if (
      error instanceof ApiError &&
      error.status !== undefined &&
      RETRYABLE_STATUSES.has(error.status)
    ) {
      await delay(RETRY_DELAY_MS, signal);
      return withSlot(() => fetchOnce(path, signal));
    }
    throw error;
  }
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
  const payload = await request(`/search.php?s=${encodeURIComponent(query)}`, signal);
  return parseMeals(payload);
}

export async function getMealById(
  id: string,
  signal?: AbortSignal,
): Promise<MealPartial | null> {
  const payload = await request(`/lookup.php?i=${encodeURIComponent(id)}`, signal);
  return parseMeals(payload)[0] ?? null;
}

export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  const payload = await request('/categories.php', signal);
  return parseCategories(payload);
}

export async function getMealsByCategory(
  category: string,
  signal?: AbortSignal,
): Promise<MealPartial[]> {
  const payload = await request(`/filter.php?c=${encodeURIComponent(category)}`, signal);
  return parseMeals(payload);
}

export async function getRandomMeal(
  signal?: AbortSignal,
): Promise<MealPartial | null> {
  const payload = await request('/random.php', signal);
  return parseMeals(payload)[0] ?? null;
}

/**
 * Collects up to `count` distinct random meals. random.php can repeat itself,
 * so missing slots are topped up in extra rounds (at most MAX_ROUNDS).
 */
const MAX_ROUNDS = 3;

export async function getRandomMeals(
  count: number,
  signal?: AbortSignal,
): Promise<MealPartial[]> {
  const meals = new Map<string, MealPartial>();
  let lastFailure: unknown;

  for (let round = 0; round < MAX_ROUNDS && meals.size < count; round += 1) {
    const missing = count - meals.size;
    const results = await Promise.allSettled(
      Array.from({ length: missing }, () => getRandomMeal(signal)),
    );

    if (signal?.aborted) throw abortError();

    let failures = 0;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value) meals.set(result.value.idMeal, result.value);
      } else {
        failures += 1;
        lastFailure = result.reason;
      }
    }
    // Everything failed: more rounds will not help.
    if (failures === results.length) break;
  }

  if (meals.size === 0) {
    throw lastFailure instanceof Error
      ? lastFailure
      : new ApiError('Could not load random recipes.');
  }

  return [...meals.values()];
}

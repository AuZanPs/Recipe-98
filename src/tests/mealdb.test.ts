import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  RETRY_DELAY_MS,
  getCategories,
  getMealById,
  getRandomMeals,
  searchMeals,
} from '../api/mealdb';

const fetchMock = vi.fn<typeof fetch>();

const json = (body: unknown, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

const meal = (id: string) => ({ idMeal: id, strMeal: `Meal ${id}`, strMealThumb: null });

describe('mealdb client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('validates meals and normalises a missing thumbnail', async () => {
    fetchMock.mockImplementation(() => json({ meals: [meal('1')] }));

    const meals = await searchMeals('pasta & more');

    expect(meals).toHaveLength(1);
    expect(meals[0]?.strMealThumb).toBe('');
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/search.php?s=pasta%20%26%20more');
  });

  it('returns an empty list when TheMealDB reports no meals', async () => {
    fetchMock.mockImplementation(() => json({ meals: null }));
    expect(await searchMeals('zzzz')).toEqual([]);
    fetchMock.mockImplementation(() => json({ meals: null }));
    expect(await getMealById('0')).toBeNull();
  });

  it('returns an empty list for a malformed payload', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    fetchMock.mockImplementation(() => json({ categories: 'nope' }));

    expect(await getCategories()).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it('throws an ApiError without retrying on a non-transient failure', async () => {
    fetchMock.mockImplementation(() => json({}, 404));

    await expect(searchMeals('pasta')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries once after a 429 and then succeeds', async () => {
    vi.useFakeTimers();
    fetchMock
      .mockImplementationOnce(() => json({}, 429))
      .mockImplementationOnce(() => json({ meals: [meal('7')] }));

    const pending = searchMeals('pasta');
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);

    expect((await pending)[0]?.idMeal).toBe('7');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up with a friendly message when the retry is also rate limited', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(() => json({}, 429));

    const pending = searchMeals('pasta');
    const assertion = expect(pending).rejects.toThrow(/busy/);
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stops waiting to retry when the caller aborts', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(() => json({}, 503));
    const controller = new AbortController();

    const pending = searchMeals('pasta', controller.signal);
    const assertion = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(10);
    controller.abort();
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never runs more than two requests at once', async () => {
    let active = 0;
    let peak = 0;
    fetchMock.mockImplementation(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return new Response(JSON.stringify({ meals: [meal('1')] }));
    });

    await Promise.all(Array.from({ length: 6 }, (_, i) => searchMeals(`q${i}`)));

    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(peak).toBe(2);
  });

  describe('getRandomMeals', () => {
    it('tops up when random.php returns duplicates', async () => {
      const sequence = ['1', '1', '1', '2', '3'];
      fetchMock.mockImplementation(() =>
        json({ meals: [meal(sequence.shift() ?? '9')] }),
      );

      const meals = await getRandomMeals(3);

      expect(meals.map((m) => m.idMeal).sort()).toEqual(['1', '2', '3']);
    });

    it('returns what it has after the final round', async () => {
      fetchMock.mockImplementation(() => json({ meals: [meal('1')] }));

      const meals = await getRandomMeals(3);

      expect(meals).toHaveLength(1);
      // Initial 3 requests, then 2 top-ups of 2 each.
      expect(fetchMock).toHaveBeenCalledTimes(3 + 2 + 2);
    });

    it('throws when every request fails', async () => {
      fetchMock.mockImplementation(() => json({}, 500));

      await expect(getRandomMeals(2)).rejects.toBeInstanceOf(ApiError);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});

import type { SyntheticEvent } from 'react';
import { getAssetUrl } from '../routing';

/**
 * TheMealDB serves `/preview` (~11 kB) and `/medium` (~45 kB) variants next to
 * the full image (~110 kB). Cards only need the preview, the detail view the
 * medium one.
 */
export const mealImageUrl = (
  thumb: string,
  size: 'preview' | 'medium' | 'full' = 'full',
): string => (size === 'full' || !thumb ? thumb : `${thumb}/${size}`);

/** Swaps a failed recipe image for the local pixel placeholder, once. */
export const handleRecipeImageError = (event: SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget;
  if (image.dataset.fallback === 'true') return;
  image.dataset.fallback = 'true';
  image.src = getAssetUrl('recipe-placeholder.svg');
};

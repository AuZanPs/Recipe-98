import type { SyntheticEvent } from 'react';
import { getAssetUrl } from '../routing';

/** Swaps a failed recipe image for the local pixel placeholder, once. */
export const handleRecipeImageError = (event: SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget;
  if (image.dataset.fallback === 'true') return;
  image.dataset.fallback = 'true';
  image.src = getAssetUrl('recipe-placeholder.svg');
};

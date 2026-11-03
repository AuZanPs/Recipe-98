import { memo } from 'react';
import { mealImageUrl, handleRecipeImageError } from '../../utils/recipeImage';
import type { MealPartial } from '../../types/recipe';

interface Props {
  meal: MealPartial;
  onSelect: (meal: MealPartial) => void;
}

export const RecipeCard = memo(({ meal, onSelect }: Props) => {
  const category = meal.strCategory?.trim() || 'Uncategorized';
  const area = meal.strArea?.trim() || 'Global';

  return (
    <article className="window meal-card">
      <button
        type="button"
        className="meal-card-hitarea"
        aria-label={`View ${meal.strMeal} recipe`}
        onClick={() => onSelect(meal)}
      />
      <div className="title-bar">
        <div className="title-bar-text" title={meal.strMeal} dir="auto">
          {meal.strMeal}
        </div>
      </div>
      <div className="window-body meal-card-body">
        <img
          src={mealImageUrl(meal.strMealThumb, 'preview')}
          alt=""
          className="meal-thumb"
          width={88}
          height={88}
          loading="lazy"
          decoding="async"
          onError={handleRecipeImageError}
        />
        <div className="meal-text">
          <p className="meal-meta-line" dir="auto">{category} | {area}</p>
          <p className="meal-hint">Open for ingredients and instructions</p>
        </div>
      </div>
    </article>
  );
});

RecipeCard.displayName = 'RecipeCard';

import { memo } from 'react';
import type { MealPartial } from '../../types/recipe';
import { RecipeCard } from '../RecipeCard/RecipeCard';

interface Props {
  meals: MealPartial[];
  onSelect: (meal: MealPartial) => void;
}

export const RecipeGrid = memo(({ meals, onSelect }: Props) => (
  <div className="meals-grid">
    {meals.map((meal) => (
      <RecipeCard key={meal.idMeal} meal={meal} onSelect={onSelect} />
    ))}
  </div>
));

RecipeGrid.displayName = 'RecipeGrid';

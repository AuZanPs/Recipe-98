// Core TheMealDB types, limited to the fields the app actually uses.
export interface MealPartial {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory?: string | null;
  strArea?: string | null;
  strInstructions?: string | null;
  strTags?: string | null;
  strYoutube?: string | null;
  strSource?: string | null;
  [key: string]: string | null | undefined;
}

export interface Category {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
}

export interface ProcessedMeal {
  id: string;
  name: string;
  category: string;
  area: string;
  instructions: string;
  thumbnail: string;
  tags: string[];
  youtube: string | null;
  source: string | null;
  ingredients: Array<{ name: string; measure: string }>;
}

export const processMeal = (meal: MealPartial): ProcessedMeal => {
  const ingredients: Array<{ name: string; measure: string }> = [];

  for (let index = 1; index <= 20; index += 1) {
    const name = meal[`strIngredient${index}`]?.trim();
    if (!name) continue;
    ingredients.push({
      name,
      measure: meal[`strMeasure${index}`]?.trim() || '',
    });
  }

  return {
    id: meal.idMeal,
    name: meal.strMeal,
    category: meal.strCategory?.trim() || '',
    area: meal.strArea?.trim() || '',
    instructions:
      meal.strInstructions?.trim() || 'No cooking instructions were provided.',
    thumbnail: meal.strMealThumb,
    tags: meal.strTags
      ? meal.strTags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [],
    youtube: meal.strYoutube || null,
    source: meal.strSource || null,
    ingredients,
  };
};

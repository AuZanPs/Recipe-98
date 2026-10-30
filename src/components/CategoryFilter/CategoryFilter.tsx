import type { Category } from '../../types/recipe';

interface Props {
  categories: Category[] | undefined;
  value?: string;
  onChange: (value: string | undefined) => void;
}

export const CategoryFilter = ({ categories, value, onChange }: Props) => (
  <div className="category-filter">
    <label htmlFor="category-select">Category</label>
    <select
      id="category-select"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value || undefined)}
    >
      <option value="">All categories</option>
      {categories?.map((category) => (
        <option key={category.idCategory} value={category.strCategory}>
          {category.strCategory}
        </option>
      ))}
    </select>
  </div>
);

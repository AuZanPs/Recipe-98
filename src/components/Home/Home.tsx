import { useCallback, useEffect, useRef, useState } from 'react';
import type { MealPartial } from '../../types/recipe';
import {
  useByCategory,
  useCategories,
  useDebouncedValue,
  useFavorites,
  useRandomRecipes,
  useRecipes,
} from '../../hooks';
import { AsciiStatus } from '../AsciiStatus/AsciiStatus';
import { Bookmark, Grid3x2, Home as HomeIcon, Shuffle } from 'pixelarticons/react';
import { SearchBar } from '../SearchBar/SearchBar';
import { CategoryFilter } from '../CategoryFilter/CategoryFilter';
import { RecipeDetailModal } from '../RecipeDetailModal/RecipeDetailModal';
import { RecipeGrid } from '../RecipeGrid/RecipeGrid';
import { Loading } from '../States/Loading';
import { ErrorDialog } from '../States/ErrorDialog';
import { EmptyState } from '../States/EmptyState';
import { handleRecipeImageError } from '../../utils/recipeImage';

type View = 'home' | 'search' | 'category' | 'random' | 'browse' | 'favorites';

export const Home = () => {
  const [view, setView] = useState<View>('home');
  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState<string | null>(null);
  const [category, setCategory] = useState<string>();
  const [selectedMeal, setSelectedMeal] = useState<MealPartial | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);
  const searchTerm = submittedSearch ?? debouncedSearch;

  const searchQuery = useRecipes(searchTerm);
  const categoriesQuery = useCategories();
  const categoryQuery = useByCategory(category);
  const randomQuery = useRandomRecipes(9);
  const { favorites } = useFavorites();
  const refetchRandom = randomQuery.refetch;

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [view, category, searchTerm]);

  const resetNavigation = useCallback(() => {
    setSearchInput('');
    setSubmittedSearch(null);
    setCategory(undefined);
    setSelectedMeal(null);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setSubmittedSearch(null);
    if (value.trim().length >= 2) {
      setView('search');
      setCategory(undefined);
    } else {
      setView((current) => (current === 'search' ? 'home' : current));
    }
  }, []);

  const handleSearchSubmit = useCallback((value: string) => {
    const term = value.trim();
    if (term.length < 2) return;
    setSubmittedSearch(term);
    setView('search');
    setCategory(undefined);
  }, []);

  const showCategory = useCallback((nextCategory: string) => {
    resetNavigation();
    setCategory(nextCategory);
    setView('category');
  }, [resetNavigation]);

  const showCategoryFromSelect = useCallback((nextCategory?: string) => {
    resetNavigation();
    if (nextCategory) {
      setCategory(nextCategory);
      setView('category');
    } else {
      setView('home');
    }
  }, [resetNavigation]);

  const showHome = useCallback(() => {
    resetNavigation();
    setView('home');
  }, [resetNavigation]);

  const showBrowse = useCallback(() => {
    resetNavigation();
    setView('browse');
  }, [resetNavigation]);

  const showFavorites = useCallback(() => {
    resetNavigation();
    setView('favorites');
  }, [resetNavigation]);

  const showRandom = useCallback(() => {
    resetNavigation();
    setView('random');
    void refetchRandom();
  }, [resetNavigation, refetchRandom]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (selectedMeal || document.querySelector('dialog[open]')) return;

      const target = event.target;
      if (target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]')) {
        return;
      }

      if (event.key === '/') {
        event.preventDefault();
        document.getElementById('recipe-search')?.focus();
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        showRandom();
      } else if (event.key === 'h' || event.key === 'H') {
        event.preventDefault();
        showHome();
      } else if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        showFavorites();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [selectedMeal, showFavorites, showHome, showRandom]);

  const openMeal = useCallback((meal: MealPartial) => setSelectedMeal(meal), []);
  const closeMeal = useCallback(() => setSelectedMeal(null), []);

  const statusMessage = (() => {
    if (view === 'search') {
      if (searchInput.trim() !== searchTerm || searchQuery.isLoading) {
        return 'Searching recipes.';
      }
      if (searchQuery.isError) return 'Search failed.';
      if (searchQuery.data) {
        const count = searchQuery.data.length;
        return `${count} ${count === 1 ? 'recipe' : 'recipes'} found.`;
      }
    }
    if (view === 'category') {
      if (categoryQuery.isLoading) return `Loading ${category ?? ''} recipes.`;
      if (categoryQuery.isError) return 'Category load failed.';
      if (categoryQuery.data) {
        const count = categoryQuery.data.length;
        return `${count} ${count === 1 ? 'recipe' : 'recipes'} in ${category ?? ''}.`;
      }
    }
    if (view === 'browse') {
      if (categoriesQuery.isLoading) return 'Loading categories.';
      if (categoriesQuery.isError) return 'Categories failed to load.';
      if (categoriesQuery.data) {
        const count = categoriesQuery.data.length;
        return `${count} ${count === 1 ? 'category' : 'categories'}.`;
      }
    }
    if (view === 'random' || view === 'home') {
      if (randomQuery.isFetching) return 'Loading random recipes.';
      if (randomQuery.isError) return 'Random recipes failed to load.';
      if (randomQuery.data) {
        const count = randomQuery.data.length;
        return `${count} ${count === 1 ? 'recipe' : 'recipes'} ready.`;
      }
    }
    if (view === 'favorites') {
      return favorites.length > 0
        ? `${favorites.length} saved ${favorites.length === 1 ? 'recipe' : 'recipes'}.`
        : 'No saved recipes yet.';
    }
    return '';
  })();

  const statusState = (() => {
    if (view === 'search') {
      if (searchQuery.isError) return 'error';
      if (searchInput.trim() !== searchTerm || searchQuery.isLoading) return 'loading';
      return searchQuery.data?.length ? 'success' : 'idle';
    }
    if (view === 'category') {
      if (categoryQuery.isError) return 'error';
      if (categoryQuery.isLoading) return 'loading';
      return categoryQuery.data?.length ? 'success' : 'idle';
    }
    if (view === 'browse') {
      if (categoriesQuery.isError) return 'error';
      if (categoriesQuery.isLoading) return 'loading';
      return categoriesQuery.data?.length ? 'success' : 'idle';
    }
    if (view === 'favorites') return 'idle';
    if (randomQuery.isError) return 'error';
    if (randomQuery.isLoading || randomQuery.isFetching) return 'loading';
    return randomQuery.data?.length ? 'success' : 'idle';
  })();

  const renderSearch = () => {
    if (searchInput.trim() !== searchTerm || searchQuery.isLoading) {
      return <Loading message={`Searching for "${searchInput.trim()}"…`} />;
    }
    if (searchQuery.isError) {
      return (
        <ErrorDialog
          message="The recipe search failed."
          onRetry={() => void searchQuery.refetch()}
        />
      );
    }
    if (!searchQuery.data || searchQuery.data.length === 0) {
      return (
        <EmptyState
          title="No Results"
          message={`No recipes found for "${searchTerm}".`}
        />
      );
    }
    return (
      <section>
        <header className="section-heading">
          <h2>Search Results</h2>
          <p>
            {searchQuery.data.length} {searchQuery.data.length === 1 ? 'recipe matches' : 'recipes match'} "{searchTerm}".
          </p>
        </header>
        <RecipeGrid meals={searchQuery.data} onSelect={openMeal} />
      </section>
    );
  };

  const renderCategory = () => {
    if (categoryQuery.isLoading) {
      return <Loading message={`Loading ${category ?? ''} recipes…`} />;
    }
    if (categoryQuery.isError) {
      return (
        <ErrorDialog
          message="This category could not be loaded."
          onRetry={() => void categoryQuery.refetch()}
        />
      );
    }
    if (!categoryQuery.data || categoryQuery.data.length === 0) {
      return (
        <EmptyState
          title="Empty Category"
          message="No recipes were found in this category."
        />
      );
    }
    return (
      <section>
        <header className="section-heading">
          <h2>{category} Recipes</h2>
          <p>
            {categoryQuery.data.length} {categoryQuery.data.length === 1 ? 'dish' : 'dishes'} in this category.
          </p>
        </header>
        <RecipeGrid meals={categoryQuery.data} onSelect={openMeal} />
      </section>
    );
  };

  const renderBrowse = () => {
    if (categoriesQuery.isLoading) return <Loading message="Loading categories…" />;
    if (categoriesQuery.isError) {
      return (
        <ErrorDialog
          message="Categories could not be loaded."
          onRetry={() => void categoriesQuery.refetch()}
        />
      );
    }

    return (
      <section>
        <header className="section-heading">
          <h2>Categories</h2>
          <p>Pick a category to browse its recipes.</p>
        </header>
        <div className="categories-grid">
          {categoriesQuery.data?.map((categoryItem) => (
            <article className="window category-card" key={categoryItem.idCategory}>
              <button
                type="button"
                className="category-card-hitarea"
                aria-label={`Browse ${categoryItem.strCategory} recipes`}
                onClick={() => showCategory(categoryItem.strCategory)}
              />
              <div className="title-bar">
                <div
                  className="title-bar-text"
                  title={categoryItem.strCategory}
                  dir="auto"
                >
                  {categoryItem.strCategory}
                </div>
              </div>
              <div className="window-body category-card-body">
                <img
                  src={categoryItem.strCategoryThumb}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={handleRecipeImageError}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderFavorites = () => {
    if (favorites.length === 0) {
      return (
        <EmptyState
          title="No Saved Recipes"
          message="Open any recipe and choose Save to keep it here."
          actionLabel="Browse Categories"
          onAction={showBrowse}
        />
      );
    }

    return (
      <section>
        <header className="section-heading">
          <h2>Saved Recipes</h2>
          <p>
            {favorites.length} saved {favorites.length === 1 ? 'recipe' : 'recipes'} in this browser.
          </p>
        </header>
        <RecipeGrid meals={favorites} onSelect={openMeal} />
      </section>
    );
  };

  const renderRandom = (heading: string, subtitle: string) => {
    if (randomQuery.isLoading || randomQuery.isFetching) {
      return <Loading message="Rolling fresh recipes…" />;
    }
    if (randomQuery.isError) {
      return (
        <ErrorDialog
          message="Random recipes could not be loaded."
          onRetry={() => void randomQuery.refetch()}
        />
      );
    }
    if (!randomQuery.data?.length) {
      return <EmptyState title="No Recipes" message="The recipe service returned nothing." />;
    }

    return (
      <section>
        <header className="section-heading">
          <h2>{heading}</h2>
          <p>{subtitle}</p>
        </header>
        <RecipeGrid meals={randomQuery.data} onSelect={openMeal} />
      </section>
    );
  };

  const content = (() => {
    if (view === 'search') return renderSearch();
    if (view === 'category') return renderCategory();
    if (view === 'browse') return renderBrowse();
    if (view === 'favorites') return renderFavorites();
    if (view === 'random') {
      return renderRandom(
        'Random Recipe Discovery',
        'Fresh surprise recipes, straight from TheMealDB. Press Random again for a new set.',
      );
    }
    return renderRandom(
      'Featured Recipes',
      'A random assortment to get you started. Open any card for the full recipe.',
    );
  })();

  return (
    <div className="app-content">
      <h1 className="sr-only">Recipe Discovery 98</h1>
      <div className="toolbar">
        <SearchBar
          value={searchInput}
          onChange={handleSearchChange}
          onSubmit={handleSearchSubmit}
        />
        <CategoryFilter
          categories={categoriesQuery.data}
          value={view === 'category' ? category : undefined}
          onChange={showCategoryFromSelect}
        />
        <div className="toolbar-buttons" role="group" aria-label="Recipe views">
          <button
            type="button"
            className={`with-icon${view === 'random' ? ' active' : ''}`}
            aria-pressed={view === 'random'}
            onClick={showRandom}
          >
            <Shuffle width={14} height={14} aria-hidden="true" />
            Random
          </button>
          <button
            type="button"
            className={`with-icon${view === 'browse' ? ' active' : ''}`}
            aria-pressed={view === 'browse'}
            onClick={showBrowse}
          >
            <Grid3x2 width={14} height={14} aria-hidden="true" />
            Categories
          </button>
          <button
            type="button"
            className={`with-icon${view === 'favorites' ? ' active' : ''}`}
            aria-pressed={view === 'favorites'}
            aria-label={`Favorites (${favorites.length} saved)`}
            onClick={showFavorites}
          >
            <Bookmark width={14} height={14} aria-hidden="true" />
            Favorites
            {favorites.length > 0 && (
              <span className="toolbar-count">{favorites.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`with-icon${view === 'home' ? ' active' : ''}`}
            aria-pressed={view === 'home'}
            title="Featured recipes"
            onClick={showHome}
          >
            <HomeIcon width={14} height={14} aria-hidden="true" />
            Home
          </button>
        </div>
      </div>

      <div
        className="content-area"
        ref={contentRef}
        aria-busy={view === 'search'
          ? searchInput.trim() !== searchTerm || searchQuery.isLoading
          : view === 'category'
            ? categoryQuery.isLoading
            : view === 'browse'
              ? categoriesQuery.isLoading
              : view === 'favorites'
                ? false
                : randomQuery.isLoading || randomQuery.isFetching}
      >
        {content}
      </div>

      <div className="status-bar">
        <div className="status-bar-field status-bar-status" role="status" aria-live="polite">
          <AsciiStatus state={statusState} label={statusMessage || 'Ready'} />
          <span>{statusMessage || 'Ready'}</span>
        </div>
        <div className="status-bar-field status-bar-meta">TheMealDB</div>
      </div>

      {selectedMeal && (
        <RecipeDetailModal meal={selectedMeal} onClose={closeMeal} />
      )}
    </div>
  );
};

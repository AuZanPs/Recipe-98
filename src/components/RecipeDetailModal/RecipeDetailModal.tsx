import { useEffect, useId, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFavorites } from '../../hooks/useFavorites';
import { useRecipeDetail } from '../../hooks/useRecipeDetail';
import { processMeal } from '../../types/recipe';
import type { MealPartial, ProcessedMeal } from '../../types/recipe';
import { Bookmark, ExternalLink, Play, Printer } from 'pixelarticons/react';
import { handleRecipeImageError } from '../../utils/recipeImage';
import { Loading } from '../States/Loading';

interface Props {
  meal: MealPartial;
  onClose: () => void;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const RecipeDetailModal = ({ meal, onClose }: Props) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const needsDetail = !meal.strInstructions;
  const detailQuery = useRecipeDetail(meal.idMeal, needsDetail);
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(meal.idMeal);

  const source = needsDetail ? detailQuery.data : meal;
  const processed = useMemo(() => (source ? processMeal(source) : null), [source]);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('recipe-print-open');
    const initialFocus = dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]');
    initialFocus?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('recipe-print-open');
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const detailError =
    detailQuery.error instanceof Error
      ? detailQuery.error.message
      : 'The full recipe could not be loaded.';

  return createPortal(
    <div
      className="recipe-detail-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="window recipe-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="title-bar">
          <div className="title-bar-text" id={titleId} title={meal.strMeal} dir="auto">
            {meal.strMeal}
          </div>
          <div className="title-bar-controls">
            <button
              type="button"
              aria-label="Close"
              data-autofocus
              onClick={onClose}
            />
          </div>
        </div>
        <div className="window-body recipe-content">
          {processed ? (
            <RecipeDetails
              meal={processed}
              saved={saved}
              onToggleSaved={() => toggle(meal)}
            />
          ) : detailQuery.isError ? (
            <div className="recipe-message">
              <p>{detailError}</p>
              <button type="button" onClick={() => void detailQuery.refetch()}>
                Try Again
              </button>
            </div>
          ) : detailQuery.isLoading ? (
            <Loading message="Loading recipe details..." />
          ) : (
            <p>Recipe not found.</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

const RecipeDetails = ({
  meal,
  saved,
  onToggleSaved,
}: {
  meal: ProcessedMeal;
  saved: boolean;
  onToggleSaved: () => void;
}) => {
  const paragraphs = meal.instructions
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const videoUrl = isWebUrl(meal.youtube) ? meal.youtube : null;
  const sourceUrl = isWebUrl(meal.source) ? meal.source : null;

  return (
    <>
      <h2 className="print-recipe-title">{meal.name}</h2>
      <div className="recipe-header">
        <img
          src={meal.thumbnail}
          alt={meal.name}
          className="recipe-image"
          onError={handleRecipeImageError}
        />
        <div className="recipe-meta">
          <div className="field-row">
            <span className="meta-label">Category:</span>
            <span>{meal.category || 'Uncategorized'}</span>
          </div>
          <div className="field-row">
            <span className="meta-label">Area:</span>
            <span>{meal.area || 'Global'}</span>
          </div>
          {meal.tags.length > 0 && (
            <div className="field-row">
              <span className="meta-label">Tags:</span>
              <span>{meal.tags.join(', ')}</span>
            </div>
          )}
          <div className="button-row">
            <button
              type="button"
              className={`with-icon${saved ? ' saved' : ''}`}
              aria-pressed={saved}
              onClick={onToggleSaved}
            >
              <Bookmark width={16} height={16} aria-hidden="true" />
              {saved ? 'Saved' : 'Save'}
            </button>
            <button type="button" className="with-icon" onClick={() => window.print()}>
              <Printer width={16} height={16} aria-hidden="true" />
              Print
            </button>
            {videoUrl && (
              <button
                type="button"
                className="with-icon"
                onClick={() => window.open(videoUrl, '_blank', 'noopener,noreferrer')}
              >
                <Play width={16} height={16} aria-hidden="true" />
                Video
              </button>
            )}
            {sourceUrl && (
              <button
                type="button"
                className="with-icon"
                onClick={() => window.open(sourceUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink width={16} height={16} aria-hidden="true" />
                Source
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="recipe-sections">
        <section>
          <h3>Ingredients</h3>
          <div className="sunken-panel ingredients-list">
            {meal.ingredients.length > 0 ? (
              <table className="ingredients-table">
                <thead>
                  <tr>
                    <th scope="col">Measure</th>
                    <th scope="col">Ingredient</th>
                  </tr>
                </thead>
                <tbody>
                  {meal.ingredients.map((ingredient, index) => (
                    <tr key={`${ingredient.name}-${index}`}>
                      <td dir="auto">{ingredient.measure || '—'}</td>
                      <td dir="auto">{ingredient.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No ingredients were provided.</p>
            )}
          </div>
        </section>

        <section>
          <h3>Instructions</h3>
          <div className="sunken-panel instructions-text" dir="auto">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>
      </div>
      <p className="print-footer">
        Recipe Discovery 98 · TheMealDB · {new Date().toLocaleDateString()}
      </p>
    </>
  );
};

function isWebUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

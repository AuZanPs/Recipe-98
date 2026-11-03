import { useEffect, useId, useRef } from 'react';
import type { MouseEvent } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const HelpDialog = ({ open, onOpen, onClose }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const contentId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) dialogRef.current?.close();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Help"
        title="Help"
        onClick={onOpen}
      />
      {createPortal(
        <dialog
          ref={dialogRef}
          className="help-dialog"
          aria-labelledby={titleId}
          aria-describedby={contentId}
          onClick={handleBackdropClick}
          onClose={onClose}
        >
          <div className="window">
            <div className="title-bar">
              <div className="title-bar-text" id={titleId}>Help &amp; Information</div>
              <div className="title-bar-controls">
                <form method="dialog">
                  <button type="submit" aria-label="Close" />
                </form>
              </div>
            </div>
            <div className="window-body help-content" id={contentId}>
              <p><strong>Recipe Discovery 98</strong></p>
              <p>A retro 98-styled recipe finder backed by TheMealDB.</p>
              <hr />
              <ul>
                <li>Search by recipe name (at least two characters).</li>
                <li>Browse or filter by category.</li>
                <li>Open any recipe card for ingredients and instructions.</li>
                <li>Save recipes to <strong>Favorites</strong> for later.</li>
                <li>Print a recipe from its detail window.</li>
                <li>Use <strong>Random</strong> to roll a fresh set of recipes.</li>
              </ul>
              <hr />
              <p><strong>Keyboard shortcuts:</strong></p>
              <ul>
                <li><kbd>/</kbd> Focus the search box</li>
                <li><kbd>R</kbd> Random recipes</li>
                <li><kbd>F</kbd> Saved recipes</li>
                <li><kbd>H</kbd> Featured recipes</li>
                <li><kbd>Esc</kbd> Close the open window</li>
              </ul>
              <hr />
              <p>
                Data and images come from{' '}
                <a href="https://www.themealdb.com/" target="_blank" rel="noreferrer">
                  TheMealDB
                </a>.
              </p>
              <p className="help-reference">
                Windows 98 reference:{' '}
                <a href="https://jdan.github.io/98.css/" target="_blank" rel="noreferrer">
                  98.css
                </a>{' '}
                ·{' '}
                <a href="https://guidebookgallery.org/screenshots/win98" target="_blank" rel="noreferrer">
                  interface gallery
                </a>
              </p>
              <p className="help-tip">Tip: try the Konami code.</p>
            </div>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  );
};

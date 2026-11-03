import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { MouseEvent } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const credits = [
  ['TheMealDB', 'Recipe data and imagery', 'Free API'],
  ['98.css', 'Windows 98 styling', 'MIT'],
  ['Asciify', 'ASCII desktop field and loading', 'MIT'],
  ['Pixelarticons', 'Pixel icons', 'MIT'],
  ['IBM Plex', 'Interface and credit typography', 'OFL-1.1'],
  ['React', 'Interface runtime', 'MIT'],
  ['TanStack Query', 'Recipe data cache', 'MIT'],
  ['Zod', 'API validation', 'MIT'],
  ['Vite', 'Build tooling', 'MIT'],
];

export const CreditsDialog = ({ open, onClose }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && open && !dialog.open) dialog.showModal();
  }, [open]);

  const closeFromBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      dialogRef.current?.close();
      onClose();
    }
  };

  // A closed dialog renders nothing, which also keeps the server markup and the
  // first client render identical: there is no document to portal into server-side.
  if (!open) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="credits-dialog"
      aria-labelledby="credits-title"
      onClick={closeFromBackdrop}
      onClose={onClose}
    >
      <div className="window">
        <div className="title-bar">
          <div className="title-bar-text" id="credits-title">Credits</div>
          <div className="title-bar-controls">
            <form method="dialog">
              <button type="submit" aria-label="Close" />
            </form>
          </div>
        </div>
        <div className="window-body credits-body">
          <p><strong>Recipe Discovery 98</strong></p>
          <p>A personal Windows 98 experiment.</p>
          <table className="settings-table credits-table">
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Role</th>
                <th scope="col">Licence</th>
              </tr>
            </thead>
            <tbody>
              {credits.map(([name, role, licence]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{role}</td>
                  <td>{licence}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="credits-note">
            Windows 98 is a Microsoft trademark. This is an independent tribute,
            not affiliated with Microsoft.
          </p>
          <p className="credits-reference">
            Reference:{' '}
            <a href="https://jdan.github.io/98.css/" target="_blank" rel="noreferrer">
              98.css documentation
            </a>{' '}
            ·{' '}
            <a href="https://guidebookgallery.org/screenshots/win98" target="_blank" rel="noreferrer">
              Windows 98 interface gallery
            </a>
          </p>
          <div className="button-row">
            <form method="dialog">
              <button type="submit">Close</button>
            </form>
          </div>
        </div>
      </div>
    </dialog>,
    document.body,
  );
};

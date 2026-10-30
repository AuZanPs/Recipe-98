import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MouseEvent } from 'react';
import { defaultSettings } from './settings';
import type { DesktopSettings } from './settings';

interface Props {
  open: boolean;
  settings: DesktopSettings;
  onChange: (settings: DesktopSettings) => void;
  onClose: () => void;
}

type Tab = 'appearance' | 'desktop' | 'about';

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'about', label: 'About' },
];

export const SettingsDialog = ({
  open,
  settings,
  onChange,
  onClose,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<Tab>('appearance');
  const [draft, setDraft] = useState<DesktopSettings>(settings);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setDraft(settings);
      setTab('appearance');
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, settings]);

  const update = (patch: Partial<DesktopSettings>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const close = () => dialogRef.current?.close();

  const apply = () => {
    onChange(draft);
  };

  const applyAndClose = () => {
    onChange(draft);
    close();
  };

  const closeFromBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) close();
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className="settings-dialog"
      aria-labelledby="settings-title"
      onClick={closeFromBackdrop}
      onClose={onClose}
    >
      <div className="window">
        <div className="title-bar">
          <div className="title-bar-text" id="settings-title">Display Properties</div>
          <div className="title-bar-controls">
            <button type="button" aria-label="Close" onClick={close} />
          </div>
        </div>
        <div className="window-body settings-body">
          <menu role="tablist" aria-label="Settings sections">
            {tabs.map((item) => (
              <li role="tab" aria-selected={tab === item.id} key={item.id}>
                <a
                  href="#settings"
                  onClick={(event) => {
                    event.preventDefault();
                    setTab(item.id);
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </menu>

          <div className="window settings-panel" role="tabpanel">
            <div className="window-body settings-panel-body">
              {tab === 'appearance' && (
                <>
                  <fieldset>
                    <legend>Theme</legend>
                    <div className="field-row">
                      <input
                        id="theme-standard"
                        type="radio"
                        name="desktop-theme"
                        checked={draft.theme === 'standard'}
                        onChange={() => update({ theme: 'standard' })}
                      />
                      <label htmlFor="theme-standard">Windows 98 Standard</label>
                    </div>
                    <div className="field-row">
                      <input
                        id="theme-plum"
                        type="radio"
                        name="desktop-theme"
                        checked={draft.theme === 'plum'}
                        onChange={() => update({ theme: 'plum' })}
                      />
                      <label htmlFor="theme-plum">Plum</label>
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend>Recipe text size</legend>
                    <div className="field-row settings-slider">
                      <label htmlFor="recipe-text-size">Size</label>
                      <input
                        id="recipe-text-size"
                        type="range"
                        min={11}
                        max={18}
                        step={1}
                        value={draft.textSize}
                        onChange={(event) => update({ textSize: Number(event.target.value) })}
                      />
                      <span className="settings-value" aria-live="polite">
                        {draft.textSize}px
                      </span>
                    </div>
                    <div
                      className="field-border settings-preview"
                      style={{ fontSize: `${draft.textSize}px` }}
                    >
                      Simmer until the sauce thickens.
                    </div>
                  </fieldset>
                </>
              )}

              {tab === 'desktop' && (
                <>
                  <fieldset>
                    <legend>Desktop items</legend>
                    <div className="field-row">
                      <input
                        id="show-special"
                        type="checkbox"
                        checked={draft.showSpecial}
                        onChange={(event) => update({ showSpecial: event.target.checked })}
                      />
                      <label htmlFor="show-special">Show Today&apos;s Special</label>
                    </div>
                    <div className="field-row">
                      <input
                        id="show-clock"
                        type="checkbox"
                        checked={draft.showClock}
                        onChange={(event) => update({ showClock: event.target.checked })}
                      />
                      <label htmlFor="show-clock">Show taskbar clock</label>
                    </div>
                    <div className="field-row">
                      <input
                        id="show-desktop-icon"
                        type="checkbox"
                        checked={draft.showDesktopIcon}
                        onChange={(event) => update({ showDesktopIcon: event.target.checked })}
                      />
                      <label htmlFor="show-desktop-icon">Show desktop icon</label>
                    </div>
                  </fieldset>

                  <div className="field-border settings-workarea">
                    <ul className="tree-view settings-tree">
                      <li>
                        Desktop
                        <ul>
                          <li>Recipe Finder</li>
                          <li>Today&apos;s Special {draft.showSpecial ? '' : '(hidden)'}</li>
                          <li>Taskbar {draft.showClock ? '' : '(clock hidden)'}</li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {tab === 'about' && (
                <>
                  <div className="field-border settings-workarea">
                    <ul className="tree-view settings-tree">
                      <li>
                        Recipe Discovery 98
                        <ul>
                          <li>
                            Interface
                            <ul>
                              <li>98.css</li>
                              <li>Asciify</li>
                              <li>Pixelarticons</li>
                              <li>IBM Plex</li>
                            </ul>
                          </li>
                          <li>
                            Data
                            <ul>
                              <li>TheMealDB</li>
                              <li>TanStack Query</li>
                              <li>Zod</li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <table className="settings-table">
                    <thead>
                      <tr>
                        <th scope="col">Package</th>
                        <th scope="col">Version</th>
                        <th scope="col">Licence</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>98.css</td><td>0.1.21</td><td>MIT</td></tr>
                      <tr><td>Asciify</td><td>4.32.8</td><td>MIT</td></tr>
                      <tr><td>React</td><td>19</td><td>MIT</td></tr>
                      <tr><td>TanStack Query</td><td>5</td><td>MIT</td></tr>
                      <tr><td>Zod</td><td>4</td><td>MIT</td></tr>
                      <tr><td>IBM Plex</td><td>Variable</td><td>OFL-1.1</td></tr>
                    </tbody>
                  </table>

                  <p className="settings-note">
                    Personal experiment. Not affiliated with Microsoft.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="settings-actions">
            <button type="button" onClick={() => setDraft(defaultSettings)}>
              Reset Defaults
            </button>
            <button type="button" onClick={close}>Cancel</button>
            <button type="button" onClick={apply}>Apply</button>
            <button type="button" className="default" onClick={applyAndClose}>OK</button>
          </div>
        </div>
      </div>
    </dialog>,
    document.body,
  );
};

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { background, swell } from 'asciify-engine/kit';
import { Close, Computer, Folder, InfoBox, Settings2 } from 'pixelarticons/react';
import { getRandomMeal } from '../api';
import { CreditsDialog } from '../components/CreditsDialog/CreditsDialog';
import { HelpDialog } from '../components/HelpDialog/HelpDialog';
import { SettingsDialog } from '../components/SettingsDialog/SettingsDialog';
import { defaultSettings } from '../components/SettingsDialog/settings';
import type { DesktopSettings } from '../components/SettingsDialog/settings';
import { WindowFrame } from '../components/WindowFrame/WindowFrame';
import { useDraggableWindow } from '../hooks/useDraggableWindow';
import { getAppUrl, getAssetUrl, getBaseUrl } from '../routing';
import type { MealPartial } from '../types/recipe';
import { handleRecipeImageError } from '../utils/recipeImage';
import { Home } from './Home';

type WindowState = 'open' | 'minimized' | 'closed';

interface Props {
  initialAppOpen: boolean;
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const konamiCode = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

export const Desktop = ({ initialAppOpen }: Props) => {
  const desktopRef = useRef<HTMLElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const startMenuRef = useRef<HTMLDivElement>(null);
  const taskbarButtonRef = useRef<HTMLButtonElement>(null);
  const desktopIconRef = useRef<HTMLButtonElement>(null);

  const [appOpen, setAppOpen] = useState(initialAppOpen);
  const [windowState, setWindowState] = useState<WindowState>('open');
  const [maximized, setMaximized] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [submenu, setSubmenu] = useState<'programs' | 'settings' | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [settings, setSettings] = useState<DesktopSettings>(defaultSettings);
  const plum = settings.theme === 'plum';
  const [now, setNow] = useState(() => new Date());
  const [special, setSpecial] = useState<MealPartial | null>(null);

  const {
    windowRef,
    style: windowStyle,
    dragging,
    resetPosition,
    titleBarProps,
  } = useDraggableWindow<HTMLElement>({
    enabled: windowState === 'open' && !maximized,
  });

  const {
    windowRef: specialRef,
    style: specialStyle,
    dragging: specialDragging,
    titleBarProps: specialTitleBarProps,
  } = useDraggableWindow<HTMLDivElement>({ keepVisible: 32 });

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--recipe-text-size',
      `${settings.textSize}px`,
    );
  }, [settings.textSize]);

  useEffect(() => {
    const host = desktopRef.current;
    if (!host) return;

    const field = background(host, {
      preset: swell,
      clear: windowRef.current ?? false,
      clearPadding: 28,
      clearSoftness: 64,
      cursor: true,
      opacity: 0.4,
      speed: 0.55,
      cellSize: 12,
      mark: 'glyph',
      charset: ' .:-=+*#',
      ink: '--ascii-ink-landing',
      lazy: false,
      globalLook: false,
      look: { font: '"IBM Plex Mono", monospace' },
    });

    return () => field.destroy();
  }, [windowRef]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    getRandomMeal(controller.signal)
      .then((meal) => {
        if (!controller.signal.aborted) setSpecial(meal);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.warn('Today’s Special could not be loaded.', error);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    let index = 0;
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === konamiCode[index]) {
        index += 1;
        if (index === konamiCode.length) {
          setSettings((current) => ({
            ...current,
            theme: current.theme === 'plum' ? 'standard' : 'plum',
          }));
          index = 0;
        }
      } else {
        index = key === konamiCode[0] ? 1 : 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!startOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (startMenuRef.current?.contains(target)) return;
      if (startButtonRef.current?.contains(target)) return;
      setStartOpen(false);
      setSubmenu(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (submenu) {
        setSubmenu(null);
        return;
      }
      setStartOpen(false);
      startButtonRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [startOpen, submenu]);

  useEffect(() => {
    if (!startOpen) return;
    startMenuRef.current
      ?.querySelector<HTMLButtonElement>('[data-submenu-button]')
      ?.focus();
  }, [startOpen]);

  const openApp = useCallback(() => {
    setAppOpen(true);
    setWindowState('open');
    setMaximized(false);
    setStartOpen(false);
    setSubmenu(null);
    resetPosition();
    window.history.replaceState(null, '', getAppUrl());
    window.requestAnimationFrame(() => windowRef.current?.focus());
  }, [resetPosition, windowRef]);

  const showWelcome = useCallback(() => {
    setAppOpen(false);
    setWindowState('open');
    setMaximized(false);
    setStartOpen(false);
    setSubmenu(null);
    resetPosition();
    window.history.replaceState(null, '', getBaseUrl());
    window.requestAnimationFrame(() => windowRef.current?.focus());
  }, [resetPosition, windowRef]);

  const restoreWindow = () => {
    setWindowState('open');
    setStartOpen(false);
    window.requestAnimationFrame(() => windowRef.current?.focus());
  };

  const minimizeWindow = () => {
    setWindowState('minimized');
    setStartOpen(false);
    window.requestAnimationFrame(() => taskbarButtonRef.current?.focus());
  };

  const closeWindow = () => {
    setWindowState('closed');
    setMaximized(false);
    setStartOpen(false);
    setSubmenu(null);
    setSettings((current) => ({ ...current, showSpecial: false }));
    window.requestAnimationFrame(() => desktopIconRef.current?.focus());
  };

  const toggleMaximize = () => {
    if (!appOpen) return;
    setMaximized((current) => !current);
    resetPosition();
    window.requestAnimationFrame(() => windowRef.current?.focus());
  };

  const openDesktopIcon = () => {
    if (!appOpen) {
      openApp();
      return;
    }
    restoreWindow();
  };

  const openHelpFromMenu = () => {
    setStartOpen(false);
    setSubmenu(null);
    if (windowState !== 'open') setWindowState('open');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        windowRef.current
          ?.querySelector<HTMLButtonElement>('button[aria-label="Help"]')
          ?.click();
      });
    });
  };

  const setTheme = (enabled: boolean) => {
    setSettings((current) => ({ ...current, theme: enabled ? 'plum' : 'standard' }));
    setStartOpen(false);
    setSubmenu(null);
  };

  const openSettings = () => {
    setStartOpen(false);
    setSubmenu(null);
    setSettingsOpen(true);
  };

  const openSubmenu = (name: 'programs' | 'settings') => {
    setSubmenu(name);
    window.requestAnimationFrame(() => {
      startMenuRef.current
        ?.querySelector<HTMLButtonElement>(`[data-submenu="${name}"] button`)
        ?.focus();
    });
  };

  const handleSubmenuKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
    name: 'programs' | 'settings',
  ) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      const buttons = [
        ...(event.currentTarget.querySelectorAll<HTMLButtonElement>('button') ?? []),
      ];
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      buttons[(current + offset + buttons.length) % buttons.length]?.focus();
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setSubmenu(null);
      startMenuRef.current
        ?.querySelector<HTMLButtonElement>(`[data-submenu-button="${name}"]`)
        ?.focus();
    }
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      setStartOpen(false);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

    const items = [
      ...(startMenuRef.current?.querySelectorAll<HTMLButtonElement>(
        '.start-menu-items > button, .start-menu-items > .start-menu-group > button',
      ) ?? []),
    ];
    if (items.length === 0) return;

    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    let next: number;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else if (event.key === 'ArrowDown') next = (current + 1) % items.length;
    else next = (current - 1 + items.length) % items.length;

    event.preventDefault();
    items[next]?.focus();
  };

  const windowClassName = [
    'main-shell',
    appOpen ? 'app-mode' : 'welcome-mode',
    maximized ? 'maximized' : '',
    dragging ? 'dragging' : '',
  ].filter(Boolean).join(' ');

  return (
    <main
      className={`app-shell${plum ? ' plum' : ''}`}
      ref={desktopRef}
    >
      {settings.showDesktopIcon && (
        <button
          ref={desktopIconRef}
          type="button"
          className="app-desktop-icon"
          onClick={openDesktopIcon}
          aria-label="Open Recipe Finder"
          title="Open Recipe Finder"
        >
          <img src={getAssetUrl('favicon.svg')} alt="" width={32} height={32} />
          <span>Recipe Finder</span>
        </button>
      )}

      <WindowFrame
        title="Recipe Discovery 98"
        className={windowClassName}
        style={windowStyle}
        windowRef={windowRef}
        titleBarProps={{
          ...titleBarProps,
          onDoubleClick: (event) => {
            if ((event.target as HTMLElement).closest('.title-bar-controls')) return;
            toggleMaximize();
          },
        }}
        icon={getAssetUrl('favicon.svg')}
        hidden={windowState !== 'open'}
        controls={(
          <>
            <HelpDialog />
            <button
              type="button"
              aria-label="Minimize"
              title="Minimize to taskbar"
              onClick={minimizeWindow}
            />
            {appOpen && (
              <button
                type="button"
                aria-label={maximized ? 'Restore' : 'Maximize'}
                title={maximized ? 'Restore window' : 'Maximize window'}
                onClick={toggleMaximize}
              />
            )}
            <button
              type="button"
              aria-label="Close"
              title="Close to desktop"
              onClick={closeWindow}
            />
          </>
        )}
      >
        {appOpen ? (
          <Home />
        ) : (
          <div className="welcome-content">
            <img
              className="welcome-logo"
              src={getAssetUrl('favicon.svg')}
              alt=""
              width={64}
              height={64}
            />
            <button type="button" className="welcome-launch" onClick={openApp}>
              Open Recipe Finder
            </button>
          </div>
        )}
      </WindowFrame>

      {special && settings.showSpecial && (
        <aside
          ref={specialRef}
          className={`window today-window${specialDragging ? ' dragging' : ''}`}
          style={specialStyle}
          hidden={appOpen && windowState === 'open'}
          aria-label="Today's Special recipe"
        >
          <div className="title-bar" {...specialTitleBarProps}>
            <div className="title-bar-text">Today&apos;s Special</div>
            <div className="title-bar-controls">
              <button
                type="button"
                aria-label="Close"
                title="Close Today's Special"
                onClick={() => setSettings((current) => ({ ...current, showSpecial: false }))}
              />
            </div>
          </div>
          <div className="window-body today-body">
            <img
              src={special.strMealThumb}
              alt=""
              loading="lazy"
              decoding="async"
              onError={handleRecipeImageError}
            />
            <p className="today-name" title={special.strMeal} dir="auto">
              {special.strMeal}
            </p>
            <p className="today-meta" dir="auto">
              {special.strCategory || 'Recipe'} · {special.strArea || 'Global'}
            </p>
          </div>
          <button
            type="button"
            className="today-hitarea"
            onClick={openApp}
            aria-label={`Open Recipe Finder with ${special.strMeal}`}
          />
        </aside>
      )}

      <footer className="taskbar">
        {startOpen && (
          <div
            ref={startMenuRef}
            className="window start-menu"
            role="menu"
            aria-label="Start menu"
            onKeyDown={handleMenuKeyDown}
          >
            <div className="start-menu-banner" aria-hidden="true">Windows 98</div>
            <div className="start-menu-items">
              <div className="start-menu-group">
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  className="with-icon"
                  data-submenu-button="programs"
                  aria-haspopup="menu"
                  aria-expanded={submenu === 'programs'}
                  onMouseEnter={() => setSubmenu('programs')}
                  onClick={() => openSubmenu('programs')}
                  onKeyDown={(event) => {
                    if (event.key !== 'ArrowRight') return;
                    event.preventDefault();
                    openSubmenu('programs');
                  }}
                >
                  <Folder width={16} height={16} aria-hidden="true" />
                  Programs
                  <span className="start-arrow" aria-hidden="true">▸</span>
                </button>
                {submenu === 'programs' && (
                  <div
                    className="window start-submenu"
                    role="menu"
                    aria-label="Programs"
                    data-submenu="programs"
                    onKeyDown={(event) => handleSubmenuKeyDown(event, 'programs')}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      className="with-icon"
                      onClick={openApp}
                    >
                      <Computer width={16} height={16} aria-hidden="true" />
                      Recipe Finder
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      className="with-icon"
                      onClick={showWelcome}
                    >
                      Welcome Window
                    </button>
                  </div>
                )}
              </div>

              <div className="start-menu-group">
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  className="with-icon"
                  data-submenu-button="settings"
                  aria-haspopup="menu"
                  aria-expanded={submenu === 'settings'}
                  onMouseEnter={() => setSubmenu('settings')}
                  onClick={() => openSubmenu('settings')}
                  onKeyDown={(event) => {
                    if (event.key !== 'ArrowRight') return;
                    event.preventDefault();
                    openSubmenu('settings');
                  }}
                >
                  <Settings2 width={16} height={16} aria-hidden="true" />
                  Settings
                  <span className="start-arrow" aria-hidden="true">▸</span>
                </button>
                {submenu === 'settings' && (
                  <div
                    className="window start-submenu"
                    role="menu"
                    aria-label="Settings"
                    data-submenu="settings"
                    onKeyDown={(event) => handleSubmenuKeyDown(event, 'settings')}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      className="with-icon"
                      onClick={openSettings}
                    >
                      <Settings2 width={16} height={16} aria-hidden="true" />
                      Display Properties...
                    </button>
                    <hr />
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={!plum}
                      tabIndex={-1}
                      onClick={() => setTheme(false)}
                    >
                      <span className="start-check" aria-hidden="true">
                        {plum ? '' : '✓'}
                      </span>
                      Standard
                    </button>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={plum}
                      tabIndex={-1}
                      onClick={() => setTheme(true)}
                    >
                      <span className="start-check" aria-hidden="true">
                        {plum ? '✓' : ''}
                      </span>
                      Plum
                    </button>
                  </div>
                )}
              </div>

              <hr />

              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                className="with-icon"
                onMouseEnter={() => setSubmenu(null)}
                onClick={openHelpFromMenu}
              >
                <InfoBox width={16} height={16} aria-hidden="true" />
                Help
              </button>
              {windowState !== 'closed' && (
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  className="with-icon"
                  onMouseEnter={() => setSubmenu(null)}
                  onClick={closeWindow}
                >
                  <Close width={16} height={16} aria-hidden="true" />
                  Close Window
                </button>
              )}
            </div>
          </div>
        )}

        <button
          ref={startButtonRef}
          type="button"
          className="start-button"
          aria-haspopup="menu"
          aria-expanded={startOpen}
          onClick={() => setStartOpen((current) => !current)}
        >
          <span className="start-logo" aria-hidden="true">
            <span /><span /><span /><span />
          </span>
          Start
        </button>

        {windowState !== 'closed' && (
          <button
            ref={taskbarButtonRef}
            type="button"
            className={`taskbar-window${windowState === 'open' ? ' active' : ''}`}
            aria-pressed={windowState === 'open'}
            title={windowState === 'open' ? 'Minimize Recipe Finder' : 'Restore Recipe Finder'}
            onClick={windowState === 'open' ? minimizeWindow : restoreWindow}
          >
            <img src={getAssetUrl('favicon.svg')} alt="" width={16} height={16} />
            Recipe Discovery 98
          </button>
        )}

        <span className="taskbar-spacer" />
        <button
          type="button"
          className="taskbar-credit"
          title="View project credits"
          onClick={() => setCreditsOpen(true)}
        >
          Credits
        </button>
        {settings.showClock && (
          <time
            className="taskbar-clock"
            dateTime={now.toISOString()}
            title={now.toLocaleDateString()}
          >
            {timeFormatter.format(now)}
          </time>
        )}
      </footer>

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
      />

      <CreditsDialog
        open={creditsOpen}
        onClose={() => setCreditsOpen(false)}
      />

      <p className="sr-only" role="status" aria-live="polite">
        {plum ? 'Plum theme on.' : 'Plum theme off.'}
      </p>
    </main>
  );
};

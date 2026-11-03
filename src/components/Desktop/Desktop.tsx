import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { BackgroundHandle } from 'asciify-engine/kit';
import { CreditsDialog } from '../CreditsDialog/CreditsDialog';
import { HelpDialog } from '../HelpDialog/HelpDialog';
import { LaunchDialog } from '../LaunchDialog/LaunchDialog';
import { SettingsDialog } from '../SettingsDialog/SettingsDialog';
import { defaultSettings, loadSettings, saveSettings } from '../SettingsDialog/settings';
import type { DesktopSettings } from '../SettingsDialog/settings';
import { StartMenu } from '../StartMenu/StartMenu';
import { WindowFrame } from '../WindowFrame/WindowFrame';
import { useDraggableWindow } from '../../hooks/useDraggableWindow';
import { useKonamiCode } from '../../hooks/useKonamiCode';
import { getAppUrl, getAssetUrl, getBaseUrl } from '../../routing';
import { prefersReducedMotion } from '../../utils/motion';

type WindowState = 'open' | 'minimized' | 'closed';

interface Props {
  initialAppOpen: boolean;
}

/** How long the Recipe Finder "starts up" before its window appears. */
const LAUNCH_DURATION_MS = 900;

// The welcome desktop ships no recipe code: the finder arrives as its own
// chunk, together with the ASCII engine only it uses.
const Home = lazy(() =>
  import('../Home/Home').then((module) => ({ default: module.Home })),
);

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

export const Desktop = ({ initialAppOpen }: Props) => {
  const desktopRef = useRef<HTMLElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const taskbarButtonRef = useRef<HTMLButtonElement>(null);
  const desktopIconRef = useRef<HTMLButtonElement>(null);

  const [windowState, setWindowState] = useState<WindowState>('open');
  const [maximized, setMaximized] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  // Defaults render first so the server and the first client render agree;
  // stored settings land in the effect below.
  const [settings, setSettings] = useState<DesktopSettings>(defaultSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const plum = settings.theme === 'plum';
  const [now, setNow] = useState(() => new Date());
  const [launching, setLaunching] = useState(initialAppOpen);
  const [shuttingDown, setShuttingDown] = useState(false);
  const [opening, setOpening] = useState(false);

  const {
    windowRef,
    style: windowStyle,
    dragging,
    resetPosition,
    titleBarProps,
  } = useDraggableWindow<HTMLElement>({
    enabled: windowState === 'open' && !maximized,
  });

  useKonamiCode(
    useCallback(() => {
      setSettings((current) => ({
        ...current,
        theme: current.theme === 'plum' ? 'standard' : 'plum',
      }));
    }, []),
  );

  useEffect(() => {
    setSettings(loadSettings());
    setSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    saveSettings(settings);
  }, [settings, settingsLoaded]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--recipe-text-size',
      `${settings.textSize}px`,
    );
  }, [settings.textSize]);

  // The theme is a root attribute so portaled dialogs are themed too.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    const desktopColour = getComputedStyle(root).getPropertyValue('--theme-desktop').trim();
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', desktopColour);
  }, [settings.theme]);

  useEffect(() => {
    const host = desktopRef.current;
    if (!host) return;

    // The ASCII field is decorative and heavy, so it is fetched after paint.
    // If it fails to start, the desktop keeps working without it.
    let field: BackgroundHandle | null = null;
    let cancelled = false;

    void import('asciify-engine/kit')
      .then(({ background, swell }) => {
        if (cancelled) return;
        field = background(host, {
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
      })
      .catch((error: unknown) => {
        console.warn('The ASCII desktop background could not start.', error);
      });

    return () => {
      cancelled = true;
      field?.destroy();
    };
    // Restarted on theme change so the field picks up the new desktop colour.
  }, [windowRef, settings.theme]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // The startup dialog belongs to the /app route: arriving there is the launch.
  useEffect(() => {
    if (!initialAppOpen) return;
    const timer = window.setTimeout(
      () => setLaunching(false),
      prefersReducedMotion() ? 0 : LAUNCH_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [initialAppOpen]);

  const dismissStartMenu = useCallback(() => setStartOpen(false), []);

  const focusDesktop = () => {
    const target = settings.showDesktopIcon
      ? desktopIconRef.current
      : startButtonRef.current;
    target?.focus();
  };

  const navigate = (url: string) => {
    window.location.assign(url);
  };

  const restoreWindow = () => {
    setWindowState('open');
    setStartOpen(false);
    setOpening(true);
    window.requestAnimationFrame(() => windowRef.current?.focus());
  };

  const minimizeWindow = () => {
    setWindowState('minimized');
    setStartOpen(false);
    window.requestAnimationFrame(() => taskbarButtonRef.current?.focus());
  };

  const closeWindow = () => {
    setStartOpen(false);
    if (initialAppOpen) {
      navigate(getBaseUrl());
      return;
    }
    setWindowState('closed');
    setMaximized(false);
    window.requestAnimationFrame(focusDesktop);
  };

  const toggleMaximize = () => {
    setMaximized((current) => !current);
    resetPosition();
    window.requestAnimationFrame(() => windowRef.current?.focus());
  };

  const openDesktopIcon = () => {
    if (windowState !== 'open') {
      restoreWindow();
      return;
    }
    windowRef.current?.focus();
  };

  const openHelpFromMenu = () => {
    setStartOpen(false);
    if (windowState !== 'open') setWindowState('open');
    setHelpOpen(true);
  };

  const setTheme = (enabled: boolean) => {
    setSettings((current) => ({ ...current, theme: enabled ? 'plum' : 'standard' }));
    setStartOpen(false);
  };

  const openSettings = () => {
    setStartOpen(false);
    setSettingsOpen(true);
  };

  const shutDown = () => {
    setStartOpen(false);
    setShuttingDown(true);
  };

  const windowClassName = [
    'main-shell',
    initialAppOpen ? 'app-mode' : 'welcome-mode',
    maximized ? 'maximized' : '',
    dragging ? 'dragging' : '',
    opening ? 'opening' : '',
  ].filter(Boolean).join(' ');

  if (shuttingDown) {
    return (
      <main className="app-shell shutting-down" id="main">
        <p className="shutdown-message">It&rsquo;s now safe to turn off your computer.</p>
        <button
          type="button"
          className="shutdown-restart"
          onClick={() => window.location.reload()}
        >
          Restart
        </button>
      </main>
    );
  }

  return (
    <main
      className={`app-shell${launching ? ' launching' : ''}`}
      id="main"
      ref={desktopRef}
      aria-busy={launching}
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
        hidden={windowState !== 'open' || launching}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) setOpening(false);
        }}
        controls={(
          <>
            <HelpDialog
              open={helpOpen}
              onOpen={() => setHelpOpen(true)}
              onClose={() => setHelpOpen(false)}
            />
            <button
              type="button"
              aria-label="Minimize"
              title="Minimize to taskbar"
              onClick={minimizeWindow}
            />
            {initialAppOpen && (
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
              title={initialAppOpen ? 'Close to desktop' : 'Close window'}
              onClick={closeWindow}
            />
          </>
        )}
      >
        {initialAppOpen ? (
          <Suspense fallback={<p className="starting-hint">Starting Recipe Finder…</p>}>
            <Home />
          </Suspense>
        ) : (
          <div className="welcome-content">
            <img
              className="welcome-logo"
              src={getAssetUrl('favicon.svg')}
              alt=""
              width={64}
              height={64}
            />
            <a className="win-button welcome-launch" href={getAppUrl()}>
              Open Recipe Finder
            </a>
            <p className="welcome-hint">
              Press <kbd>/</kbd> to search, <kbd>R</kbd> for a random recipe.
            </p>
          </div>
        )}
      </WindowFrame>

      {launching && (
        <LaunchDialog
          title="Recipe Finder"
          message="Starting Recipe Finder…"
          icon={getAssetUrl('favicon.svg')}
          durationMs={LAUNCH_DURATION_MS}
        />
      )}

      <footer className="taskbar">
        {startOpen && (
          <StartMenu
            startButtonRef={startButtonRef}
            plum={plum}
            canCloseWindow={windowState !== 'closed'}
            onDismiss={dismissStartMenu}
            onOpenApp={() => {
              setStartOpen(false);
              if (initialAppOpen) restoreWindow();
              else navigate(getAppUrl());
            }}
            onOpenSettings={openSettings}
            onSetTheme={setTheme}
            onOpenHelp={openHelpFromMenu}
            onCloseWindow={closeWindow}
            onShutDown={shutDown}
          />
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

        {initialAppOpen && (
          <button
            ref={taskbarButtonRef}
            type="button"
            className={`taskbar-window${windowState === 'open' ? ' active' : ''}`}
            aria-pressed={windowState === 'open'}
            aria-label="Recipe Discovery 98"
            title={windowState === 'open' ? 'Minimize Recipe Finder' : 'Restore Recipe Finder'}
            onClick={windowState === 'open' ? minimizeWindow : restoreWindow}
          >
            <img src={getAssetUrl('favicon.svg')} alt="" width={16} height={16} />
            <span className="taskbar-window-label">Recipe Discovery 98</span>
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
            suppressHydrationWarning
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

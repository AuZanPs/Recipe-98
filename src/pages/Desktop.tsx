import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { background, swell } from 'asciify-engine/kit';
import type { BackgroundHandle } from 'asciify-engine/kit';
import { CreditsDialog } from '../components/CreditsDialog/CreditsDialog';
import { HelpDialog } from '../components/HelpDialog/HelpDialog';
import { LaunchDialog } from '../components/LaunchDialog/LaunchDialog';
import { SettingsDialog } from '../components/SettingsDialog/SettingsDialog';
import { loadSettings, saveSettings } from '../components/SettingsDialog/settings';
import type { DesktopSettings } from '../components/SettingsDialog/settings';
import { StartMenu } from '../components/StartMenu/StartMenu';
import { WindowFrame } from '../components/WindowFrame/WindowFrame';
import { useDraggableWindow } from '../hooks/useDraggableWindow';
import { useKonamiCode } from '../hooks/useKonamiCode';
import { getAppUrl, getAssetUrl } from '../routing';
import { prefersReducedMotion } from '../utils/motion';
import { Home } from './Home';

type WindowState = 'open' | 'minimized' | 'closed';

interface Props {
  initialAppOpen: boolean;
}

/** How long the Recipe Finder "starts up" before its window appears. */
const LAUNCH_DURATION_MS = 900;

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

export const Desktop = ({ initialAppOpen }: Props) => {
  const desktopRef = useRef<HTMLElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const taskbarButtonRef = useRef<HTMLButtonElement>(null);
  const desktopIconRef = useRef<HTMLButtonElement>(null);

  const [appOpen, setAppOpen] = useState(initialAppOpen);
  const [windowState, setWindowState] = useState<WindowState>('open');
  const [maximized, setMaximized] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settings, setSettings] = useState<DesktopSettings>(loadSettings);
  const plum = settings.theme === 'plum';
  const [now, setNow] = useState(() => new Date());
  const [launching, setLaunching] = useState(false);
  const [opening, setOpening] = useState(false);
  const launchTimerRef = useRef<number | undefined>(undefined);

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
    document.documentElement.style.setProperty(
      '--recipe-text-size',
      `${settings.textSize}px`,
    );
  }, [settings.textSize]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

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

    // The ASCII field is decorative: if it fails to start, the desktop should
    // keep working without it.
    let field: BackgroundHandle | null = null;
    try {
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
    } catch (error) {
      console.warn('The ASCII desktop background could not start.', error);
    }

    return () => field?.destroy();
    // Restarted on theme change so the field picks up the new desktop colour.
  }, [windowRef, settings.theme]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const dismissStartMenu = useCallback(() => setStartOpen(false), []);

  useEffect(() => () => window.clearTimeout(launchTimerRef.current), []);

  const focusDesktop = () => {
    const target = settings.showDesktopIcon
      ? desktopIconRef.current
      : startButtonRef.current;
    target?.focus();
  };

  const showApp = useCallback(() => {
    setAppOpen(true);
    setWindowState('open');
    setMaximized(false);
    setStartOpen(false);
    setOpening(true);
    resetPosition();
    window.history.replaceState(null, '', getAppUrl());
    window.requestAnimationFrame(() => windowRef.current?.focus());
  }, [resetPosition, windowRef]);

  // The welcome window is a launcher: starting the program closes it, then the
  // program's own window opens after a short startup animation. Re-opening an
  // already-running program just brings it back to the front.
  const openApp = useCallback(() => {
    if (launching) {
      setStartOpen(false);
      return;
    }

    if (appOpen && windowState !== 'closed') {
      showApp();
      return;
    }

    setStartOpen(false);
    setWindowState('closed');

    if (prefersReducedMotion()) {
      showApp();
      return;
    }

    setLaunching(true);
    launchTimerRef.current = window.setTimeout(() => {
      setLaunching(false);
      showApp();
    }, LAUNCH_DURATION_MS);
  }, [appOpen, launching, showApp, windowState]);

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
    setWindowState('closed');
    setMaximized(false);
    setStartOpen(false);
    window.requestAnimationFrame(focusDesktop);
  };

  const toggleMaximize = () => {
    if (!appOpen) return;
    setMaximized((current) => !current);
    resetPosition();
    window.requestAnimationFrame(() => windowRef.current?.focus());
  };

  const openDesktopIcon = () => {
    if (appOpen && windowState !== 'closed') {
      restoreWindow();
      return;
    }
    openApp();
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

  const windowClassName = [
    'main-shell',
    appOpen ? 'app-mode' : 'welcome-mode',
    maximized ? 'maximized' : '',
    dragging ? 'dragging' : '',
    opening ? 'opening' : '',
  ].filter(Boolean).join(' ');

  return (
    <main
      className={`app-shell${launching ? ' launching' : ''}`}
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
        hidden={windowState !== 'open'}
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

      {launching && (
        <LaunchDialog
          title="Recipe Finder"
          message="Starting Recipe Finder..."
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
            onOpenApp={openApp}
            onOpenSettings={openSettings}
            onSetTheme={setTheme}
            onOpenHelp={openHelpFromMenu}
            onCloseWindow={closeWindow}
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

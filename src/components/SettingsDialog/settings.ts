import { z } from 'zod';

export type ThemeName = 'standard' | 'plum';

export interface DesktopSettings {
  theme: ThemeName;
  textSize: number;
  showClock: boolean;
  showDesktopIcon: boolean;
}

export const defaultSettings: DesktopSettings = {
  theme: 'standard',
  textSize: 12,
  showClock: true,
  showDesktopIcon: true,
};

export const SETTINGS_STORAGE_KEY = 'recipe98:settings:v1';

// Keep in sync with the slider in SettingsDialog.
const MIN_TEXT_SIZE = 11;
const MAX_TEXT_SIZE = 18;

const storedSettingsSchema = z.object({
  theme: z.enum(['standard', 'plum']),
  textSize: z.number().int().min(MIN_TEXT_SIZE).max(MAX_TEXT_SIZE),
  showClock: z.boolean(),
  showDesktopIcon: z.boolean(),
});

export function parseStoredSettings(raw: string | null): DesktopSettings {
  if (!raw) return defaultSettings;
  try {
    const parsed = storedSettingsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return defaultSettings;
    return { ...defaultSettings, ...parsed.data };
  } catch {
    return defaultSettings;
  }
}

export function loadSettings(): DesktopSettings {
  try {
    return parseStoredSettings(window.localStorage.getItem(SETTINGS_STORAGE_KEY));
  } catch (error) {
    console.warn('Local storage is unavailable; settings will not persist.', error);
    return defaultSettings;
  }
}

export function saveSettings(settings: DesktopSettings): void {
  const { theme, textSize, showClock, showDesktopIcon } = settings;
  try {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ theme, textSize, showClock, showDesktopIcon }),
    );
  } catch (error) {
    console.warn('Settings could not be persisted.', error);
  }
}

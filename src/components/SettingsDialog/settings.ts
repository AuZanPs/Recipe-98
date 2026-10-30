export type ThemeName = 'standard' | 'plum';

export interface DesktopSettings {
  theme: ThemeName;
  textSize: number;
  showSpecial: boolean;
  showClock: boolean;
  showDesktopIcon: boolean;
}

export const defaultSettings: DesktopSettings = {
  theme: 'standard',
  textSize: 12,
  showSpecial: true,
  showClock: true,
  showDesktopIcon: true,
};

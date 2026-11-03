import { beforeEach, describe, expect, it } from 'vitest';
import {
  defaultSettings,
  loadSettings,
  parseStoredSettings,
  saveSettings,
} from '../components/SettingsDialog/settings';

describe('desktop settings persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('falls back to defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(defaultSettings);
  });

  it('round-trips saved settings', () => {
    saveSettings({ ...defaultSettings, theme: 'plum', textSize: 16, showClock: false });

    expect(loadSettings()).toMatchObject({
      theme: 'plum',
      textSize: 16,
      showClock: false,
      showDesktopIcon: true,
    });
  });

  it.each([
    ['invalid JSON', '{nope'],
    ['an unknown theme', JSON.stringify({ ...defaultSettings, theme: 'neon' })],
    ['an out-of-range text size', JSON.stringify({ ...defaultSettings, textSize: 99 })],
    ['a missing field', JSON.stringify({ theme: 'plum' })],
  ])('falls back to defaults for %s', (_label, raw) => {
    expect(parseStoredSettings(raw)).toEqual(defaultSettings);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDefaultScrapbookConfig,
  loadScrapbookConfig,
  saveScrapbookConfig,
  resetScrapbookConfig,
  loadSavedViewMode,
  saveViewMode,
  SCRAPBOOK_THEMES,
  SCRAPBOOK_THEMES_LIST,
} from './constants/scrapbookThemes';
import type { ViewMode, ScrapbookThemeId } from './types/scrapbook';

describe('Scrapbook Theme & Configuration System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides all 6 preset themes with valid properties', () => {
    const themeIds: ScrapbookThemeId[] = [
      'blue-memories',
      'vintage-journal',
      'soft-pastel',
      'floral-diary',
      'dark-academia',
      'minimal-cream',
    ];

    expect(SCRAPBOOK_THEMES_LIST.length).toBe(6);

    for (const id of themeIds) {
      const theme = SCRAPBOOK_THEMES[id];
      expect(theme).toBeDefined();
      expect(theme.name).toBeTruthy();
      expect(theme.config.background.pattern).toBeTruthy();
      expect(theme.config.typography.headingFont).toBeTruthy();

      const config = getDefaultScrapbookConfig(id);
      expect(config.themeId).toBe(id);
      expect(config.elements.length).toBeGreaterThan(0);
    }
  });

  it('blue-memories preset contains signature reference image elements', () => {
    const config = getDefaultScrapbookConfig('blue-memories');
    expect(config.themeId).toBe('blue-memories');
    expect(config.background.pattern).toBe('dot-grid');
    expect(config.typography.headingFont).toBe('caveat');

    const types = config.elements.map(e => e.type);
    expect(types).toContain('polaroid');
    expect(types).toContain('playlist');
    expect(types).toContain('scrap-card');
    expect(types).toContain('sticker');
    expect(types).toContain('washi-tape');
  });


  it('persists and loads per-entry scrapbook configuration', () => {
    const entryId = 42;
    const initialConfig = getDefaultScrapbookConfig('vintage-journal');
    initialConfig.typography.headingSize = 'lg';
    initialConfig.background.pattern = 'lined';

    saveScrapbookConfig(initialConfig, entryId);

    const loaded = loadScrapbookConfig(entryId);
    expect(loaded.themeId).toBe('vintage-journal');
    expect(loaded.typography.headingSize).toBe('lg');
    expect(loaded.background.pattern).toBe('lined');
  });

  it('resets scrapbook layout without losing theme configuration', () => {
    const entryId = 99;
    const customConfig = getDefaultScrapbookConfig('soft-pastel');
    customConfig.elements = []; // clear elements
    saveScrapbookConfig(customConfig, entryId);

    const resetConfig = resetScrapbookConfig(entryId, 'soft-pastel');
    expect(resetConfig.elements.length).toBeGreaterThan(0);
    expect(resetConfig.themeId).toBe('soft-pastel');

    const loaded = loadScrapbookConfig(entryId);
    expect(loaded.elements.length).toBeGreaterThan(0);
  });

  it('persists and retrieves user selected ViewMode', () => {
    // Default should be classic
    expect(loadSavedViewMode()).toBe('classic');

    const modes: ViewMode[] = ['scrapbook', 'minimal', 'classic'];
    for (const mode of modes) {
      saveViewMode(mode);
      expect(loadSavedViewMode()).toBe(mode);
    }
  });

  it('stores only layout presentation metadata, never unencrypted diary content', () => {
    const entryId = 101;
    const config = getDefaultScrapbookConfig('blue-memories');
    saveScrapbookConfig(config, entryId);

    const rawStored = localStorage.getItem(`kwaderno-scrapbook-entry-${entryId}`);
    expect(rawStored).toBeTruthy();
    const parsed = JSON.parse(rawStored!);

    // Ensure layout structure has only styling / geometry metadata
    expect(parsed).toHaveProperty('themeId');
    expect(parsed).toHaveProperty('elements');
    expect(parsed).not.toHaveProperty('cipherText');
    expect(parsed).not.toHaveProperty('encryptedBody');
    expect(parsed).not.toHaveProperty('rawJournalContent');

    for (const el of parsed.elements) {
      expect(typeof el.x).toBe('number');
      expect(typeof el.y).toBe('number');
      expect(typeof el.zIndex).toBe('number');
    }
  });
});

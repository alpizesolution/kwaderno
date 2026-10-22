import type {
  ScrapbookConfig,
  ScrapbookThemeId,
  ScrapbookElement,
} from '../types/scrapbook';

export interface ThemePreset {
  id: ScrapbookThemeId;
  name: string;
  tagline: string;
  accentColor: string;
  previewBg: string;
  config: ScrapbookConfig;
}

export const BLUE_MEMORIES_ELEMENTS: ScrapbookElement[] = [
  {
    id: 'el-date',
    type: 'date-badge',
    x: 72,
    y: 4,
    rotate: -2,
    zIndex: 4,
    data: {
      tapeStyle: 'plaid-blue',
    },
  },
  {
    id: 'el-cloud-tl',
    type: 'sticker',
    x: 6,
    y: 3,
    rotate: -4,
    zIndex: 2,
    data: {
      stickerType: 'cloud',
      quoteText: 'collect beautiful moments',
    },
  },
  {
    id: 'el-polaroid-main',
    type: 'polaroid',
    x: 32,
    y: 22,
    rotate: -1.5,
    zIndex: 5,
    data: {
      photoIndex: 0,
      caption: 'Flashback 💙',
      tapeStyle: 'plaid-blue',
    },
  },
  {
    id: 'el-butterfly-main',
    type: 'sticker',
    x: 62,
    y: 22,
    rotate: 14,
    zIndex: 8,
    data: {
      stickerType: 'blue-butterfly',
    },
  },
  {
    id: 'el-card-about',
    type: 'scrap-card',
    x: 5,
    y: 21,
    rotate: -2.5,
    zIndex: 3,
    data: {
      cardVariant: 'about-today',
      cardTitle: 'About today 💙',
      cardItems: ['good food', 'good music', 'good friends', 'good vibes'],
    },
  },
  {
    id: 'el-card-goodthings',
    type: 'scrap-card',
    x: 70,
    y: 31,
    rotate: 2,
    zIndex: 3,
    data: {
      cardVariant: 'good-things',
      cardTitle: 'Good things',
      cardItems: ['You', 'Me', 'Laughter', 'Memories'],
    },
  },
  {
    id: 'el-card-quote',
    type: 'scrap-card',
    x: 5,
    y: 43,
    rotate: 1.5,
    zIndex: 3,
    data: {
      cardVariant: 'quote',
      quoteText: 'Sometimes you will never know the value of a moment until it becomes a memory.',
      tapeStyle: 'plaid-blue',
    },
  },
  {
    id: 'el-daisy-flower',
    type: 'sticker',
    x: 23,
    y: 61,
    rotate: 10,
    zIndex: 6,
    data: {
      stickerType: 'daisy',
    },
  },
  {
    id: 'el-round-badge',
    type: 'scrap-card',
    x: 77,
    y: 58,
    rotate: -3,
    zIndex: 3,
    data: {
      cardVariant: 'custom',
      quoteText: 'Take it one day at a time.',
    },
  },
  {
    id: 'el-card-notetoself',
    type: 'scrap-card',
    x: 68,
    y: 72,
    rotate: 2.5,
    zIndex: 3,
    data: {
      cardVariant: 'note-to-self',
      cardTitle: 'Note to self 💙',
      quoteText: "Don't forget to love yourself a little more each day.",
    },
  },
  {
    id: 'el-mood-stamp',
    type: 'mood-stamp',
    x: 7,
    y: 68,
    rotate: -3,
    zIndex: 3,
    data: {},
  },
  {
    id: 'el-playlist-card',
    type: 'playlist',
    x: 36,
    y: 72,
    rotate: -1,
    zIndex: 4,
    data: {
      songTitle: 'Here with me',
      artist: 'd4vd',
    },
  },
  {
    id: 'el-earbuds',
    type: 'sticker',
    x: 23,
    y: 79,
    rotate: -12,
    zIndex: 5,
    data: {
      stickerType: 'earbuds',
    },
  },
  {
    id: 'el-crescent-moon',
    type: 'sticker',
    x: 6,
    y: 86,
    rotate: -8,
    zIndex: 3,
    data: {
      stickerType: 'crescent-moon',
    },
  },
  {
    id: 'el-sparkles-btm',
    type: 'sticker',
    x: 74,
    y: 67,
    rotate: 0,
    zIndex: 2,
    data: {
      stickerType: 'sparkle',
    },
  },
  {
    id: 'el-washi-strip',
    type: 'washi-tape',
    x: 65,
    y: 93,
    rotate: -4,
    zIndex: 4,
    data: {
      tapeStyle: 'plaid-blue',
    },
  },
];



export const SCRAPBOOK_THEMES: Record<ScrapbookThemeId, ThemePreset> = {
  'blue-memories': {
    id: 'blue-memories',
    name: 'Blue Memories',
    tagline: 'Handmade denim blue aesthetic, plaid tape & clouds',
    accentColor: '#3672A6',
    previewBg: '#F3F7FA',
    config: {
      version: 1,
      themeId: 'blue-memories',
      background: {
        pattern: 'dot-grid',
        color: '#F4F7FB',
      },
      typography: {
        headingFont: 'caveat',
        bodyFont: 'outfit',
        headingSize: 'lg',
        headingColor: '#255A8A',
        textColor: '#1F3448',
      },
      elements: BLUE_MEMORIES_ELEMENTS,
    },
  },
  'vintage-journal': {
    id: 'vintage-journal',
    name: 'Vintage Journal',
    tagline: 'Warm kraft paper, sepia botanicals & aged tape',
    accentColor: '#8C5835',
    previewBg: '#F5EBE1',
    config: {
      version: 1,
      themeId: 'vintage-journal',
      background: {
        pattern: 'vintage-kraft',
        color: '#F7EFE6',
      },
      typography: {
        headingFont: 'caveat',
        bodyFont: 'patrick-hand',
        headingSize: 'lg',
        headingColor: '#6B4021',
        textColor: '#3A271B',
      },
      elements: [
        {
          id: 'v-date',
          type: 'date-badge',
          x: 72,
          y: 4,
          rotate: 1.5,
          zIndex: 4,
          data: { tapeStyle: 'kraft-brown' },
        },
        {
          id: 'v-polaroid',
          type: 'polaroid',
          x: 30,
          y: 20,
          rotate: -2,
          zIndex: 5,
          data: { photoIndex: 0, caption: 'Isang sandali...', tapeStyle: 'kraft-brown' },
        },
        {
          id: 'v-about',
          type: 'scrap-card',
          x: 6,
          y: 22,
          rotate: -2,
          zIndex: 3,
          data: {
            cardVariant: 'about-today',
            cardTitle: 'Pahina ng Buhay',
            cardItems: ['Mainit na kape', 'Tahimik na umaga', 'Mga aral', 'Pasasalamat'],
          },
        },
        {
          id: 'v-goodthings',
          type: 'scrap-card',
          x: 70,
          y: 30,
          rotate: 1.5,
          zIndex: 3,
          data: {
            cardVariant: 'good-things',
            cardTitle: 'Munting Biyaya',
            cardItems: ['Liwanag', 'Pahinga', 'Kwentuhan', 'Pag-asa'],
          },
        },
        {
          id: 'v-quote',
          type: 'scrap-card',
          x: 8,
          y: 50,
          rotate: 1,
          zIndex: 3,
          data: {
            cardVariant: 'quote',
            quoteText: 'Ang bawat lumipas na araw ay may sariling ganda.',
            tapeStyle: 'kraft-brown',
          },
        },
        {
          id: 'v-daisy',
          type: 'sticker',
          x: 78,
          y: 62,
          rotate: -6,
          zIndex: 5,
          data: { stickerType: 'daisy' },
        },
        {
          id: 'v-note',
          type: 'scrap-card',
          x: 58,
          y: 72,
          rotate: 2,
          zIndex: 3,
          data: {
            cardVariant: 'note-to-self',
            cardTitle: 'Paalala',
            quoteText: 'Mabagal man ang lakad, ang mahalaga ay sumusulong.',
          },
        },
      ],
    },
  },
  'soft-pastel': {
    id: 'soft-pastel',
    name: 'Soft Pastel',
    tagline: 'Blush pink, gentle lavender & sweet memories',
    accentColor: '#C26A8D',
    previewBg: '#FDF3F6',
    config: {
      version: 1,
      themeId: 'soft-pastel',
      background: {
        pattern: 'pastel-blush',
        color: '#FDF4F7',
      },
      typography: {
        headingFont: 'patrick-hand',
        bodyFont: 'outfit',
        headingSize: 'lg',
        headingColor: '#A84E72',
        textColor: '#402633',
      },
      elements: [
        {
          id: 'p-date',
          type: 'date-badge',
          x: 70,
          y: 4,
          rotate: -2,
          zIndex: 4,
          data: { tapeStyle: 'pastel-rose' },
        },
        {
          id: 'p-polaroid',
          type: 'polaroid',
          x: 32,
          y: 20,
          rotate: 1.5,
          zIndex: 5,
          data: { photoIndex: 0, caption: 'Sweet day ♡', tapeStyle: 'pastel-rose' },
        },
        {
          id: 'p-butterfly',
          type: 'sticker',
          x: 64,
          y: 20,
          rotate: 15,
          zIndex: 7,
          data: { stickerType: 'blue-butterfly' },
        },
        {
          id: 'p-about',
          type: 'scrap-card',
          x: 6,
          y: 22,
          rotate: -2,
          zIndex: 3,
          data: {
            cardVariant: 'about-today',
            cardTitle: 'Ngayong Araw ♡',
            cardItems: ['Matamis na ngiti', 'Mabangong hangin', 'Mabuting puso', 'Payapang gabi'],
          },
        },
        {
          id: 'p-quote',
          type: 'scrap-card',
          x: 8,
          y: 52,
          rotate: 1,
          zIndex: 3,
          data: {
            cardVariant: 'quote',
            quoteText: 'Be gentle with yourself. You are doing the best you can.',
            tapeStyle: 'pastel-rose',
          },
        },
        {
          id: 'p-note',
          type: 'scrap-card',
          x: 66,
          y: 65,
          rotate: 2,
          zIndex: 3,
          data: {
            cardVariant: 'note-to-self',
            cardTitle: 'Munting Tandaan',
            quoteText: 'Huminga nang malalim. May bukas pa para magpatuloy.',
          },
        },
      ],
    },
  },
  'floral-diary': {
    id: 'floral-diary',
    name: 'Floral Diary',
    tagline: 'Pressed botanicals, daisies & gentle sage green',
    accentColor: '#366E4E',
    previewBg: '#F3F8F4',
    config: {
      version: 1,
      themeId: 'floral-diary',
      background: {
        pattern: 'lined',
        color: '#F4F9F5',
      },
      typography: {
        headingFont: 'caveat',
        bodyFont: 'outfit',
        headingSize: 'lg',
        headingColor: '#28583D',
        textColor: '#1E3627',
      },
      elements: [
        {
          id: 'f-date',
          type: 'date-badge',
          x: 72,
          y: 4,
          rotate: -1,
          zIndex: 4,
          data: { tapeStyle: 'dot-blue' },
        },
        {
          id: 'f-polaroid',
          type: 'polaroid',
          x: 30,
          y: 20,
          rotate: -2,
          zIndex: 5,
          data: { photoIndex: 0, caption: 'Halamanan ng Puso 🌿', tapeStyle: 'dot-blue' },
        },
        {
          id: 'f-daisy',
          type: 'sticker',
          x: 64,
          y: 20,
          rotate: 12,
          zIndex: 7,
          data: { stickerType: 'daisy' },
        },
        {
          id: 'f-about',
          type: 'scrap-card',
          x: 6,
          y: 22,
          rotate: -1.5,
          zIndex: 3,
          data: {
            cardVariant: 'about-today',
            cardTitle: 'Luntiang Sandali',
            cardItems: ['Sikat ng araw', 'Simoy ng dahon', 'Katahimikan', 'Kasiyahan'],
          },
        },
        {
          id: 'f-quote',
          type: 'scrap-card',
          x: 66,
          y: 50,
          rotate: 2,
          zIndex: 3,
          data: {
            cardVariant: 'quote',
            quoteText: 'Tulad ng halaman, may tamang panahon sa bawat pamumulaklak.',
          },
        },
      ],
    },
  },
  'dark-academia': {
    id: 'dark-academia',
    name: 'Dark Academia',
    tagline: 'Moody espresso paper, gold foil & candlelit script',
    accentColor: '#D1A354',
    previewBg: '#1C1917',
    config: {
      version: 1,
      themeId: 'dark-academia',
      background: {
        pattern: 'lined',
        color: '#1D1A17',
      },
      typography: {
        headingFont: 'playfair',
        bodyFont: 'outfit',
        headingSize: 'lg',
        headingColor: '#E2B86E',
        textColor: '#ECE3D4',
      },
      elements: [
        {
          id: 'd-date',
          type: 'date-badge',
          x: 70,
          y: 4,
          rotate: 1,
          zIndex: 4,
          data: { tapeStyle: 'stripe-navy' },
        },
        {
          id: 'd-polaroid',
          type: 'polaroid',
          x: 30,
          y: 20,
          rotate: -1,
          zIndex: 5,
          data: { photoIndex: 0, caption: 'Memento Vitae', tapeStyle: 'stripe-navy' },
        },
        {
          id: 'd-quote',
          type: 'scrap-card',
          x: 8,
          y: 24,
          rotate: -2,
          zIndex: 3,
          data: {
            cardVariant: 'quote',
            quoteText: 'We write to taste life twice, in the moment and in retrospect.',
          },
        },
        {
          id: 'd-note',
          type: 'scrap-card',
          x: 65,
          y: 55,
          rotate: 2,
          zIndex: 3,
          data: {
            cardVariant: 'note-to-self',
            cardTitle: 'Nocturne',
            quoteText: 'In the stillness of the night, truth speaks clearly.',
          },
        },
      ],
    },
  },
  'minimal-cream': {
    id: 'minimal-cream',
    name: 'Minimal Cream',
    tagline: 'Pure ivory paper, subtle grid & understated elegance',
    accentColor: '#5C6D60',
    previewBg: '#FAF7F2',
    config: {
      version: 1,
      themeId: 'minimal-cream',
      background: {
        pattern: 'dot-grid',
        color: '#FAF7F2',
      },
      typography: {
        headingFont: 'playfair',
        bodyFont: 'outfit',
        headingSize: 'md',
        headingColor: '#2B3830',
        textColor: '#36483E',
      },
      elements: [
        {
          id: 'm-date',
          type: 'date-badge',
          x: 75,
          y: 4,
          rotate: 0,
          zIndex: 4,
          data: { tapeStyle: 'kraft-brown' },
        },
        {
          id: 'm-polaroid',
          type: 'polaroid',
          x: 32,
          y: 22,
          rotate: 0,
          zIndex: 5,
          data: { photoIndex: 0, caption: 'Sandali', tapeStyle: 'kraft-brown' },
        },
      ],
    },
  },
};

export const SCRAPBOOK_THEMES_LIST: ThemePreset[] = Object.values(SCRAPBOOK_THEMES);

const GLOBAL_SCRAPBOOK_STORAGE_KEY = 'kwaderno-scrapbook-global';
const ENTRY_SCRAPBOOK_KEY_PREFIX = 'kwaderno-scrapbook-entry-';
const VIEW_MODE_STORAGE_KEY = 'kwaderno-view-mode';

export function getDefaultScrapbookConfig(themeId: ScrapbookThemeId = 'blue-memories'): ScrapbookConfig {
  const preset = SCRAPBOOK_THEMES[themeId] ?? SCRAPBOOK_THEMES['blue-memories'];
  return JSON.parse(JSON.stringify(preset.config)) as ScrapbookConfig;
}

export function loadScrapbookConfig(entryId?: number): ScrapbookConfig {
  if (typeof localStorage === 'undefined') return getDefaultScrapbookConfig();
  try {
    if (entryId !== undefined) {
      const pageStored = localStorage.getItem(`${ENTRY_SCRAPBOOK_KEY_PREFIX}${entryId}`);
      if (pageStored) {
        const parsed = JSON.parse(pageStored) as ScrapbookConfig;
        if (parsed?.version === 1 && parsed.elements) return parsed;
      }
    }
    const globalStored = localStorage.getItem(GLOBAL_SCRAPBOOK_STORAGE_KEY);
    if (globalStored) {
      const parsed = JSON.parse(globalStored) as ScrapbookConfig;
      if (parsed?.version === 1 && parsed.elements) return parsed;
    }
  } catch {
    // Return fallback preset
  }
  return getDefaultScrapbookConfig('blue-memories');
}

export function saveScrapbookConfig(config: ScrapbookConfig, entryId?: number): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const toSave: ScrapbookConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(toSave);
    if (entryId !== undefined) {
      localStorage.setItem(`${ENTRY_SCRAPBOOK_KEY_PREFIX}${entryId}`, json);
    }
    // Also update global default so newly created entries inherit custom aesthetic
    localStorage.setItem(GLOBAL_SCRAPBOOK_STORAGE_KEY, json);
  } catch (err) {
    console.error('Failed to save scrapbook config', err);
  }
}

export function resetScrapbookConfig(entryId?: number, themeId: ScrapbookThemeId = 'blue-memories'): ScrapbookConfig {
  const fresh = getDefaultScrapbookConfig(themeId);
  if (typeof localStorage !== 'undefined') {
    try {
      if (entryId !== undefined) {
        localStorage.setItem(`${ENTRY_SCRAPBOOK_KEY_PREFIX}${entryId}`, JSON.stringify(fresh));
      } else {
        localStorage.removeItem(GLOBAL_SCRAPBOOK_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }
  return fresh;
}


export function loadSavedViewMode(): 'classic' | 'scrapbook' | 'minimal' {
  if (typeof localStorage === 'undefined') return 'classic';
  try {
    const mode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (mode === 'classic' || mode === 'scrapbook' || mode === 'minimal') {
      return mode;
    }
  } catch {
    // fallback
  }
  return 'classic';
}

export function saveViewMode(mode: 'classic' | 'scrapbook' | 'minimal'): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}


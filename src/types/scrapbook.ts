export type ViewMode = 'classic' | 'scrapbook' | 'minimal';

export type ScrapbookThemeId =
  | 'blue-memories'
  | 'vintage-journal'
  | 'soft-pastel'
  | 'floral-diary'
  | 'dark-academia'
  | 'minimal-cream';

export type BackgroundPattern =
  | 'dot-grid'
  | 'lined'
  | 'graph-grid'
  | 'blue-wash'
  | 'vintage-kraft'
  | 'plain'
  | 'pastel-blush';

export type HeadingFont = 'caveat' | 'patrick-hand' | 'playfair' | 'outfit';
export type BodyFont = 'outfit' | 'patrick-hand' | 'playfair';
export type HeadingSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ScrapbookBackground {
  pattern: BackgroundPattern;
  color: string;
}

export interface ScrapbookTypography {
  headingFont: HeadingFont;
  bodyFont: BodyFont;
  headingSize: HeadingSize;
  headingColor: string;
  textColor: string;
}

export type StickerType =
  | 'blue-butterfly'
  | 'cloud'
  | 'daisy'
  | 'sparkle'
  | 'blue-heart'
  | 'crescent-moon'
  | 'earbuds'
  | 'paperclip'
  | 'music-note'
  | 'star';

export type WashiTapeStyle =
  | 'plaid-blue'
  | 'stripe-navy'
  | 'dot-blue'
  | 'kraft-brown'
  | 'pastel-rose';

export type ScrapCardVariant =
  | 'about-today'
  | 'good-things'
  | 'note-to-self'
  | 'quote'
  | 'custom';

export type ScrapbookElementType =
  | 'polaroid'
  | 'scrap-card'
  | 'playlist'
  | 'sticker'
  | 'washi-tape'
  | 'date-badge'
  | 'mood-stamp';

export interface ScrapbookElement {
  id: string;
  type: ScrapbookElementType;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width?: number; // percentage or px
  rotate?: number; // degrees
  zIndex?: number;
  data: {
    photoIndex?: number;
    caption?: string;
    tapeStyle?: WashiTapeStyle;
    stickerType?: StickerType;
    cardVariant?: ScrapCardVariant;
    cardTitle?: string;
    cardItems?: string[];
    quoteText?: string;
    songTitle?: string;
    artist?: string;
    customNote?: string;
  };
}

export interface ScrapbookConfig {
  version: 1;
  themeId: ScrapbookThemeId;
  background: ScrapbookBackground;
  typography: ScrapbookTypography;
  elements: ScrapbookElement[];
  customTitle?: string;
  updatedAt?: string;
}

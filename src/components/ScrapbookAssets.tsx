import type { StickerType, WashiTapeStyle } from '../types/scrapbook';

export function WashiTape({
  style = 'plaid-blue',
  className = '',
  width = 72,
  height = 24,
}: {
  style?: WashiTapeStyle;
  className?: string;
  width?: number | string;
  height?: number | string;
}) {
  return (
    <div
      className={`washi-tape-strip washi-${style} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function DoodleSticker({
  type,
  size = 48,
  className = '',
}: {
  type: StickerType;
  size?: number;
  className?: string;
}) {
  switch (type) {
    case 'blue-butterfly':
      return (
        <svg
          width={size}
          height={size * 0.85}
          viewBox="0 0 100 85"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`doodle-sticker sticker-butterfly ${className}`}
        >
          {/* Left Forewing */}
          <path
            d="M50 42 C40 22, 12 10, 4 28 C-3 44, 20 62, 48 48 Z"
            fill="url(#blue-wing-grad)"
            stroke="#1D3E63"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Left Hindwing */}
          <path
            d="M48 48 C30 55, 12 65, 24 78 C36 86, 48 70, 50 54 Z"
            fill="url(#blue-wing-light)"
            stroke="#1D3E63"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Right Forewing */}
          <path
            d="M50 42 C60 22, 88 10, 96 28 C103 44, 80 62, 52 48 Z"
            fill="url(#blue-wing-grad)"
            stroke="#1D3E63"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Right Hindwing */}
          <path
            d="M52 48 C70 55, 88 65, 76 78 C64 86, 52 70, 50 54 Z"
            fill="url(#blue-wing-light)"
            stroke="#1D3E63"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Wing Vein Details */}
          <path
            d="M14 26 C28 32, 44 42, 48 44 M86 26 C72 32, 56 42, 52 44 M26 72 C35 66, 46 54, 48 50 M74 72 C65 66, 54 54, 52 50"
            stroke="#214E7B"
            strokeWidth="1.5"
            strokeDasharray="2 1"
          />
          {/* Body & Antennae */}
          <ellipse cx="50" cy="46" rx="3.5" ry="16" fill="#152B44" />
          <path
            d="M49 32 Q42 16 36 12 M51 32 Q58 16 64 12"
            stroke="#152B44"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="36" cy="12" r="2" fill="#152B44" />
          <circle cx="64" cy="12" r="2" fill="#152B44" />
          <defs>
            <linearGradient id="blue-wing-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4A8BC4" />
              <stop offset="60%" stopColor="#71AEE2" />
              <stop offset="100%" stopColor="#B6D8F4" />
            </linearGradient>
            <linearGradient id="blue-wing-light" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6BA6DB" />
              <stop offset="100%" stopColor="#D4E7F7" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'cloud':
      return (
        <svg
          width={size}
          height={size * 0.65}
          viewBox="0 0 100 65"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`doodle-sticker sticker-cloud ${className}`}
        >
          <path
            d="M20 50 C10 50 4 42 6 34 C8 24 18 22 24 24 C28 14 40 8 52 14 C62 6 78 10 82 22 C92 24 96 34 92 42 C88 50 80 50 75 50 Z"
            fill="#EAF3FA"
            stroke="#2A5C8A"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M26 44 C20 44 16 40 18 36 M34 26 C42 22 52 26 56 32 M66 22 C74 22 78 28 80 34"
            stroke="#3D77AB"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'daisy':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`doodle-sticker sticker-daisy ${className}`}
        >
          {/* Petals */}
          <g fill="#FFFFFF" stroke="#255A8A" strokeWidth="2" strokeLinejoin="round">
            <ellipse cx="40" cy="18" rx="8" ry="14" />
            <ellipse cx="40" cy="62" rx="8" ry="14" />
            <ellipse cx="18" cy="40" rx="14" ry="8" />
            <ellipse cx="62" cy="40" rx="14" ry="8" />
            <ellipse cx="24" cy="24" rx="8" ry="14" transform="rotate(-45 24 24)" />
            <ellipse cx="56" cy="56" rx="8" ry="14" transform="rotate(-45 56 56)" />
            <ellipse cx="56" cy="24" rx="8" ry="14" transform="rotate(45 56 24)" />
            <ellipse cx="24" cy="56" rx="8" ry="14" transform="rotate(45 24 56)" />
          </g>
          {/* Flower Center */}
          <circle cx="40" cy="40" r="12" fill="#F4CA38" stroke="#D19C14" strokeWidth="2.5" />
          <circle cx="37" cy="37" r="2.5" fill="#FFE585" />
        </svg>
      );

    case 'sparkle':
    case 'star':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`doodle-sticker sticker-sparkle ${className}`}
        >
          <path
            d="M25 2 C25 15, 35 25, 48 25 C35 25, 25 35, 25 48 C25 35, 15 25, 2 25 C15 25, 25 15, 25 2 Z"
            fill="#69A5D6"
            stroke="#1B4770"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="40" cy="10" r="2" fill="#205586" />
          <circle cx="10" cy="40" r="1.5" fill="#205586" />
        </svg>
      );

    case 'crescent-moon':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 60 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`doodle-sticker sticker-moon ${className}`}
        >
          <path
            d="M42 6 C24 10, 10 26, 14 44 C18 56, 32 60, 46 54 C32 50, 26 34, 34 20 C38 14, 44 8, 42 6 Z"
            fill="#D5E7F7"
            stroke="#214E7B"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="36" r="2.5" fill="#A8CAEA" />
          <circle cx="28" cy="48" r="2" fill="#A8CAEA" />
          <circle cx="20" cy="26" r="1.5" fill="#A8CAEA" />
        </svg>
      );

    case 'blue-heart':
      return (
        <svg
          width={size}
          height={size * 0.9}
          viewBox="0 0 60 54"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`doodle-sticker sticker-heart ${className}`}
        >
          <path
            d="M30 48 C16 36, 4 24, 4 14 C4 6, 12 2, 20 4 C25 6, 28 10, 30 14 C32 10, 35 6, 40 4 C48 2, 56 6, 56 14 C56 24, 44 36, 30 48 Z"
            fill="#4F92C7"
            stroke="#1D4A73"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'earbuds':
      return (
        <svg
          width={size}
          height={size * 1.1}
          viewBox="0 0 55 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`doodle-sticker sticker-earbuds ${className}`}
        >
          {/* Left Earbud */}
          <path
            d="M18 10 C24 10, 26 18, 22 24 C18 28, 14 36, 14 46"
            stroke="#214E7B"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <ellipse cx="16" cy="16" rx="9" ry="8" fill="#FFFFFF" stroke="#214E7B" strokeWidth="2.5" />
          <circle cx="16" cy="16" r="3" fill="#69A5D6" />

          {/* Right Earbud */}
          <path
            d="M36 10 C30 10, 28 18, 32 24 C36 28, 40 36, 40 46"
            stroke="#214E7B"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <ellipse cx="38" cy="16" rx="9" ry="8" fill="#FFFFFF" stroke="#214E7B" strokeWidth="2.5" />
          <circle cx="38" cy="16" r="3" fill="#69A5D6" />
        </svg>
      );

    case 'paperclip':
      return (
        <svg
          width={size * 0.6}
          height={size * 1.2}
          viewBox="0 0 30 65"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`doodle-sticker sticker-paperclip ${className}`}
        >
          <path
            d="M10 20 L10 50 C10 58, 24 58, 24 50 L24 12 C24 4, 4 4, 4 12 L4 54 C4 66, 30 66, 30 54 L30 20"
            stroke="#2A5C8A"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'music-note':
      return (
        <svg
          width={size * 0.8}
          height={size}
          viewBox="0 0 50 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`doodle-sticker sticker-music ${className}`}
        >
          <ellipse cx="14" cy="46" rx="8" ry="6" fill="#205586" transform="rotate(-20 14 46)" />
          <ellipse cx="38" cy="38" rx="8" ry="6" fill="#205586" transform="rotate(-20 38 38)" />
          <path d="M20 44 L20 16 L44 8 L44 36" stroke="#205586" strokeWidth="3" strokeLinecap="round" />
          <path d="M20 16 L44 8" stroke="#205586" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    default:
      return null;
  }
}

import React from 'react';

export interface MoodFaceProps {
  mood?: string;
  size?: number;
  isEmpty?: boolean;
  className?: string;
}

export const MoodFace: React.FC<MoodFaceProps> = ({
  mood,
  size = 32,
  isEmpty = false,
  className = '',
}) => {
  if (isEmpty || !mood) {
    return (
      <div
        className={`mood-face-empty ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  // Visual features matching the doodle style from user screenshot:
  // Circular colored face, 1.5px dark outline, distinct expressions.
  let bg = '#FFE485'; // Yellow
  let eyes: React.ReactNode = (
    <>
      <circle cx="9.5" cy="11.5" r="1.3" fill="#1f2320" />
      <circle cx="16.5" cy="11.5" r="1.3" fill="#1f2320" />
    </>
  );
  let mouth: React.ReactNode = (
    <path d="M8.5 14 Q13 19.5 17.5 14 Z" fill="#1f2320" />
  );

  switch (mood) {
    case 'Masaya': // Happy with laughing open mouth (Yellow)
      bg = '#FFE485';
      eyes = (
        <>
          <path d="M7.5 12 Q9.5 9 11.5 12" stroke="#1f2320" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d="M14.5 12 Q16.5 9 18.5 12" stroke="#1f2320" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </>
      );
      mouth = <path d="M8 14 Q13 21 18 14 Z" fill="#1f2320" />;
      break;

    case 'Malungkot': // Sad with downturned mouth (Soft Blue)
      bg = '#ADC9FA';
      eyes = (
        <>
          <circle cx="9.5" cy="11.5" r="1.4" fill="#1f2320" />
          <circle cx="16.5" cy="11.5" r="1.4" fill="#1f2320" />
        </>
      );
      mouth = (
        <path d="M9.5 18 Q13 13.5 16.5 18" stroke="#1f2320" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      );
      break;

    case 'Payapa': // Peaceful / Neutral straight line mouth (Soft Mint Green)
      bg = '#BEE6C9';
      eyes = (
        <>
          <circle cx="9.5" cy="11.5" r="1.4" fill="#1f2320" />
          <circle cx="16.5" cy="11.5" r="1.4" fill="#1f2320" />
        </>
      );
      mouth = (
        <line x1="9" y1="16" x2="17" y2="16" stroke="#1f2320" strokeWidth="1.7" strokeLinecap="round" />
      );
      break;

    case 'Umaasa': // Hopeful / Sweet smile (Peach/Coral)
    case 'Nagpapasalamat': // Grateful (Warm Peach)
      bg = '#FFC5AB';
      eyes = (
        <>
          <circle cx="9.5" cy="11.5" r="1.4" fill="#1f2320" />
          <circle cx="16.5" cy="11.5" r="1.4" fill="#1f2320" />
        </>
      );
      mouth = (
        <path d="M9 15 Q13 19 17 15" stroke="#1f2320" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      );
      break;

    case 'Balisa': // Anxious (Soft Lavender)
      bg = '#DDD0F8';
      eyes = (
        <>
          <circle cx="9.5" cy="11" r="1.5" fill="#1f2320" />
          <circle cx="16.5" cy="11" r="1.5" fill="#1f2320" />
        </>
      );
      mouth = (
        <path d="M9 17 Q11 15 13 17 Q15 19 17 17" stroke="#1f2320" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      );
      break;

    case 'Pagod': // Tired / Sleepy (Muted Sage)
      bg = '#D4DFC9';
      eyes = (
        <>
          <line x1="8" y1="11.5" x2="11.5" y2="11.5" stroke="#1f2320" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="14.5" y1="11.5" x2="18" y2="11.5" stroke="#1f2320" strokeWidth="1.6" strokeLinecap="round" />
        </>
      );
      mouth = <ellipse cx="13" cy="16.5" rx="2" ry="1.5" fill="#1f2320" />;
      break;

    case 'Galit': // Angry (Soft Coral Red)
      bg = '#FCA5A5';
      eyes = (
        <>
          <path d="M8 10 L11.5 12" stroke="#1f2320" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M18 10 L14.5 12" stroke="#1f2320" strokeWidth="1.6" strokeLinecap="round" />
        </>
      );
      mouth = (
        <path d="M9.5 17 Q13 14.5 16.5 17" stroke="#1f2320" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      );
      break;

    default: // Gentle smile (Warm Yellow)
      bg = '#FFE485';
      eyes = (
        <>
          <circle cx="9.5" cy="11.5" r="1.4" fill="#1f2320" />
          <circle cx="16.5" cy="11.5" r="1.4" fill="#1f2320" />
        </>
      );
      mouth = (
        <path d="M9 15 Q13 19 17 15" stroke="#1f2320" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      );
      break;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      className={`mood-face-svg ${className}`}
      role="img"
      aria-label={mood}
    >
      <circle cx="13" cy="13" r="11.5" fill={bg} stroke="#1f2320" strokeWidth="1.5" />
      {eyes}
      {mouth}
    </svg>
  );
};

export default MoodFace;

import { useState } from 'react';
import { WashiTape, DoodleSticker } from './ScrapbookAssets';
import type { WashiTapeStyle, ScrapCardVariant } from '../types/scrapbook';

export function PolaroidCard({
  imageSrc,
  caption = 'Flashback 💙',
  tapeStyle = 'plaid-blue',
  onClickImage,
  className = '',
}: {
  imageSrc?: string;
  caption?: string;
  tapeStyle?: WashiTapeStyle;
  onClickImage?: () => void;
  className?: string;
}) {
  return (
    <div className={`polaroid-frame ${className}`}>
      {/* Corner washi tape strips */}
      <div className="polaroid-tape-tl">
        <WashiTape style={tapeStyle} width={64} height={22} />
      </div>
      <div className="polaroid-tape-br">
        <WashiTape style={tapeStyle} width={64} height={22} />
      </div>

      <div
        className="polaroid-photo-box"
        onClick={onClickImage}
        role={onClickImage ? 'button' : undefined}
        tabIndex={onClickImage ? 0 : undefined}
        title={onClickImage ? 'Pindutin para palakihin ang larawan' : undefined}
      >
        {imageSrc ? (
          <img src={imageSrc} alt={caption || 'Larawan sa Kwaderno'} />
        ) : (
          <div className="polaroid-placeholder">
            <span>📷</span>
            <small>Walang larawan</small>
          </div>
        )}
      </div>

      <div className="polaroid-caption">
        <span>{caption || 'Flashback 💙'}</span>
      </div>
    </div>
  );
}

export function PlaylistCard({
  songTitle = 'Here with me',
  artist = 'd4vd',
  className = '',
}: {
  songTitle?: string;
  artist?: string;
  className?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(38);

  return (
    <div className={`scrap-playlist-card ${className}`}>
      <div className="playlist-header">
        <span className="playlist-title-tag">Playlist 💙</span>
        <span className="playlist-heart">💙</span>
      </div>

      <div className="playlist-song-info">
        <strong>{songTitle}</strong>
        <span>- {artist}</span>
      </div>

      <div
        className="playlist-scrubber"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
          setProgress(percent);
        }}
        title="I-drag o pindutin ang progress bar"
      >
        <div className="scrubber-track">
          <div className="scrubber-fill" style={{ width: `${progress}%` }} />
          <div className="scrubber-thumb" style={{ left: `${progress}%` }} />
        </div>
      </div>

      <div className="playlist-controls">
        <button
          type="button"
          className="playlist-ctrl-btn"
          aria-label="Previous"
          onClick={() => setProgress((p) => Math.max(0, p - 15))}
        >
          ⏮
        </button>
        <button
          type="button"
          className="playlist-play-btn"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={() => setIsPlaying((p) => !p)}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          type="button"
          className="playlist-ctrl-btn"
          aria-label="Next"
          onClick={() => setProgress((p) => Math.min(100, p + 15))}
        >
          ⏭
        </button>
      </div>
    </div>
  );
}

export function TornScrapCard({
  variant = 'about-today',
  title,
  items,
  quoteText,
  tapeStyle,
  className = '',
}: {
  variant?: ScrapCardVariant;
  title?: string;
  items?: string[];
  quoteText?: string;
  tapeStyle?: WashiTapeStyle;
  className?: string;
}) {
  if (variant === 'about-today') {
    return (
      <div className={`scrap-card card-about-today ${className}`}>
        <div className="card-paperclip-anchor">
          <DoodleSticker type="paperclip" size={28} />
        </div>
        <h4 className="scrap-handwritten-title">{title || 'About today 💙'}</h4>
        <ul className="scrap-bullet-list">
          {(items || ['good food', 'good music', 'good friends', 'good vibes']).map((item, idx) => (
            <li key={idx}>
              <span className="bullet-dot">•</span> {item}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (variant === 'good-things') {
    return (
      <div className={`scrap-card card-good-things ${className}`}>
        <div className="good-things-header">
          <h4 className="good-things-title">{title || 'Good things'}</h4>
        </div>
        <ul className="scrap-dashed-list">
          {(items || ['You', 'Me', 'Laughter', 'Memories']).map((item, idx) => (
            <li key={idx}>
              <span className="bullet-dash">•</span> {item}
            </li>
          ))}
        </ul>
        <div className="good-things-corner-flower">
          <DoodleSticker type="daisy" size={26} />
        </div>
      </div>
    );
  }

  if (variant === 'note-to-self') {
    return (
      <div className={`scrap-card card-note-to-self ${className}`}>
        <h4 className="note-to-self-title">{title || 'Note to self 💙'}</h4>
        <p className="note-to-self-text">
          {quoteText || "Don't forget to love yourself a little more each day."}
        </p>
      </div>
    );
  }

  if (variant === 'quote') {
    return (
      <div className={`scrap-card card-quote-box ${className}`}>
        {tapeStyle && (
          <div className="quote-tape-top">
            <WashiTape style={tapeStyle} width={55} height={18} />
          </div>
        )}
        <p className="quote-body-text">
          "{quoteText || 'Sometimes you will never know the value of a moment until it becomes a memory.'}"
        </p>
        {tapeStyle && (
          <div className="quote-tape-bottom">
            <WashiTape style={tapeStyle} width={55} height={18} />
          </div>
        )}
      </div>
    );
  }

  // Custom round badge or note
  return (
    <div className={`scrap-round-badge ${className}`}>
      <span>{quoteText || 'Take it one day at a time.'}</span>
    </div>
  );
}

export function DateBadgeCard({
  date = new Date(),
  tapeStyle = 'plaid-blue',
  className = '',
}: {
  date?: Date | string;
  tapeStyle?: WashiTapeStyle;
  className?: string;
}) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);

  return (
    <div className={`scrap-date-badge ${className}`}>
      <div className="date-tape-pin">
        <WashiTape style={tapeStyle} width={52} height={18} />
      </div>
      <div className="date-badge-content">
        <span className="date-badge-label">date</span>
        <strong className="date-badge-numbers">
          {day} / {month} / {year}
        </strong>
        <span className="date-badge-heart">♥</span>
      </div>
    </div>
  );
}

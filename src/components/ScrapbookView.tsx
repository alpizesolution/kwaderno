import { useRef, useState } from 'react';
import type { DiaryEntry } from '../db';
import type { ScrapbookConfig, ScrapbookElement } from '../types/scrapbook';
import { PolaroidCard, PlaylistCard, TornScrapCard, DateBadgeCard } from './ScrapCards';
import { DoodleSticker, WashiTape } from './ScrapbookAssets';
import { MoodFace } from '../MoodFace';

interface ScrapbookViewProps {
  entry: DiaryEntry;
  config: ScrapbookConfig;
  isEditingLayout?: boolean;
  onUpdateConfig?: (updated: ScrapbookConfig) => void;
  onOpenLightbox?: (src: string) => void;
  onOpenPersonalize?: () => void;
}

export function ScrapbookView({
  entry,
  config,
  isEditingLayout = false,
  onUpdateConfig,
  onOpenLightbox,
  onOpenPersonalize,
}: ScrapbookViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });

  const images = entry.images ?? [];
  const primaryImage = images.length > 0 ? images[0] : undefined;

  const fontClass = `font-heading-${config.typography.headingFont}`;
  const sizeClass = `heading-size-${config.typography.headingSize}`;

  // Drag handlers for mouse and touch
  const handlePointerDown = (e: React.PointerEvent, elementId: string) => {
    if (!isEditingLayout || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const el = config.elements.find((item) => item.id === elementId);
    if (!el) return;

    // Calculate current element px position
    const currentPxX = (el.x / 100) * rect.width;
    const currentPxY = (el.y / 100) * rect.height;

    dragOffsetRef.current = {
      offsetX: clientX - (rect.left + currentPxX),
      offsetY: clientY - (rect.top + currentPxY),
    };

    setDraggingId(elementId);
    setSelectedElementId(elementId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current || !onUpdateConfig) return;
    const rect = containerRef.current.getBoundingClientRect();

    const clientX = e.clientX;
    const clientY = e.clientY;

    const newPxX = clientX - rect.left - dragOffsetRef.current.offsetX;
    const newPxY = clientY - rect.top - dragOffsetRef.current.offsetY;

    const percentX = Math.max(0, Math.min(92, (newPxX / rect.width) * 100));
    const percentY = Math.max(0, Math.min(92, (newPxY / rect.height) * 100));

    onUpdateConfig({
      ...config,
      elements: config.elements.map((item) =>
        item.id === draggingId
          ? { ...item, x: Math.round(percentX * 10) / 10, y: Math.round(percentY * 10) / 10 }
          : item
      ),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setDraggingId(null);
    }
  };

  // Render individual scrapbook element
  const renderScrapbookElement = (el: ScrapbookElement) => {
    const isSelected = selectedElementId === el.id && isEditingLayout;

    let content: React.ReactNode = null;

    if (el.type === 'polaroid') {
      const pIdx = el.data.photoIndex ?? 0;
      const photoSrc = images[pIdx] || primaryImage;
      content = (
        <PolaroidCard
          imageSrc={photoSrc}
          caption={el.data.caption || (images.length ? 'Flashback 💙' : 'Tahimik na araw')}
          tapeStyle={el.data.tapeStyle || 'plaid-blue'}
          onClickImage={() => photoSrc && onOpenLightbox?.(photoSrc)}
        />
      );
    } else if (el.type === 'playlist') {
      content = (
        <PlaylistCard
          songTitle={el.data.songTitle || 'Here with me'}
          artist={el.data.artist || 'd4vd'}
        />
      );
    } else if (el.type === 'date-badge') {
      content = (
        <DateBadgeCard
          date={entry.createdAt || new Date()}
          tapeStyle={el.data.tapeStyle || 'plaid-blue'}
        />
      );
    } else if (el.type === 'scrap-card') {
      content = (
        <TornScrapCard
          variant={el.data.cardVariant || 'about-today'}
          title={el.data.cardTitle}
          items={el.data.cardItems}
          quoteText={el.data.quoteText}
          tapeStyle={el.data.tapeStyle}
        />
      );
    } else if (el.type === 'sticker') {
      content = (
        <div className="sticker-wrap">
          {el.data.quoteText && (
            <span className="sticker-speech-pill">{el.data.quoteText}</span>
          )}
          <DoodleSticker type={el.data.stickerType || 'blue-butterfly'} size={52} />
        </div>
      );
    } else if (el.type === 'washi-tape') {
      content = <WashiTape style={el.data.tapeStyle || 'plaid-blue'} width={80} height={26} />;
    } else if (el.type === 'mood-stamp') {
      content = (
        <div className="scrap-mood-stamp">
          <span className="mood-stamp-label">Mood</span>
          <div className="mood-stamp-face">
            <MoodFace mood={entry.mood} size={28} isEmpty={!entry.mood} />
          </div>
        </div>
      );
    }

    return (
      <div
        key={el.id}
        className={`scrapbook-placed-item type-${el.type} ${isSelected ? 'is-selected' : ''} ${
          isEditingLayout ? 'is-draggable' : ''
        }`}
        style={{
          left: `${el.x}%`,
          top: `${el.y}%`,
          transform: `rotate(${el.rotate ?? 0}deg)`,
          zIndex: el.zIndex ?? 1,
        }}
        onPointerDown={(e) => handlePointerDown(e, el.id)}
      >
        {content}
        {isSelected && (
          <div className="item-selection-outline" aria-hidden="true">
            <span className="selection-handle-dot tl" />
            <span className="selection-handle-dot tr" />
            <span className="selection-handle-dot bl" />
            <span className="selection-handle-dot br" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="scrapbook-view-wrapper">
      {/* Top Banner Toolbar */}
      <div className="scrapbook-toolbar">
        <div className="toolbar-left">
          <span className="scrapbook-badge">📖 Scrapbook Mode</span>
          <span className="toolbar-theme-name">Tema: {config.themeId}</span>
        </div>
        <div className="toolbar-actions">
          {onOpenPersonalize && (
            <button
              type="button"
              className="personalize-trigger-btn"
              onClick={onOpenPersonalize}
              title="I-personalize ang hitsura, stickers, at papel"
            >
              ✨ I-personalize
            </button>
          )}
        </div>
      </div>

      {/* Main Journal Canvas (Inspired by Reference Image) */}
      <div
        ref={containerRef}
        className={`scrapbook-canvas pattern-${config.background.pattern} ${fontClass} ${sizeClass}`}
        style={{ backgroundColor: config.background.color }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Decorative Top Banner */}
        <div className="scrapbook-page-header">
          <div className="header-torn-corner" aria-hidden="true">
            <span>collect beautiful moments</span>
          </div>

          <div className="header-title-block">
            <h1
              className="scrapbook-heading"
              style={{ color: config.typography.headingColor }}
            >
              <span className="heading-brush-accent">
                {entry.title ? entry.title.split(' ')[0] : 'Golden'}
              </span>{' '}
              <span className="heading-cursive-part">
                {entry.title && entry.title.includes(' ')
                  ? entry.title.substring(entry.title.indexOf(' ') + 1)
                  : 'memories'}
              </span>
            </h1>

            <div className="header-washi-pill">
              <span>a moment worth keeping.</span>
            </div>
          </div>
        </div>

        {/* Written Journal Body Note (Torn paper note with real entry body text) */}
        <div className="scrapbook-entry-body-card">
          <div className="body-card-tape">
            <WashiTape style="plaid-blue" width={68} height={20} />
          </div>
          <div className="body-card-content">
            <div className="body-card-date-meta">
              <span className="meta-time">
                {new Date(entry.createdAt).toLocaleTimeString('fil-PH', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
              {entry.mood && <span className="meta-mood">Pakiramdam: {entry.mood}</span>}
            </div>
            <div className="body-card-text">
              {entry.body.split('\n\n').map((paragraph, pIdx) => (
                <p key={pIdx}>{paragraph}</p>
              ))}
            </div>
            {entry.tags && entry.tags.length > 0 && (
              <div className="body-card-tags">
                {entry.tags.map((tag) => (
                  <span key={tag} className="scrap-tag-chip">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Render all custom-placed Scrapbook Elements */}
        {config.elements.map(renderScrapbookElement)}

        {/* Ambient ink splatters & doodle accents */}
        <div className="scrapbook-ambient-ink" aria-hidden="true">
          <span className="ink-dot dot-1" />
          <span className="ink-dot dot-2" />
          <span className="ink-dot dot-3" />
          <span className="ink-dot dot-4" />
        </div>
      </div>
    </div>
  );
}

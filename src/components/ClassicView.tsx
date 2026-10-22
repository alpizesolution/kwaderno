import type { DiaryEntry } from '../db';
import { MoodFace } from '../MoodFace';

interface ClassicViewProps {
  entry: DiaryEntry;
  onOpenLightbox?: (src: string) => void;
  onEdit?: () => void;
}

export function ClassicView({ entry, onOpenLightbox, onEdit }: ClassicViewProps) {
  const images = entry.images ?? [];

  return (
    <article className="classic-view-container">
      <div className="classic-view-paper">
        <div className="paper-kicker">
          {new Date(entry.createdAt).toLocaleDateString('fil-PH', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}{' '}
          <span>·</span>{' '}
          {new Date(entry.createdAt).toLocaleTimeString('fil-PH', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </div>

        <div className="classic-title-row">
          <h1 className="classic-title">{entry.title || 'Walang pamagat'}</h1>
          {entry.favorite && <span className="favorite-mark" aria-label="Paborito">♥</span>}
        </div>

        <div className="classic-meta-bar">
          {entry.mood && (
            <span className="entry-mood">
              <MoodFace mood={entry.mood} size={18} /> {entry.mood}
            </span>
          )}
          {entry.tags && entry.tags.length > 0 && (
            <div className="entry-tags">
              {entry.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Lined notebook ruled body */}
        <div className="classic-ruled-body">
          {entry.body.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {/* Attachment Images */}
        {images.length > 0 && (
          <div className="classic-attachments-wrap">
            <span className="attachment-heading-label">Mga Kalakip na Larawan</span>
            <div className="classic-photo-grid">
              {images.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="classic-photo-card"
                  onClick={() => onOpenLightbox?.(src)}
                >
                  <img src={src} alt={`Larawan ${idx + 1}`} loading="lazy" />
                  <span className="classic-photo-zoom-hint">🔍</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {onEdit && (
          <div className="classic-actions-bar">
            <button type="button" className="text-button" onClick={onEdit}>
              ✎ I-edit ang Pahinang Ito
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

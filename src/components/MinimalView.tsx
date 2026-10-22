import type { DiaryEntry } from '../db';
import { MoodFace } from '../MoodFace';

interface MinimalViewProps {
  entry: DiaryEntry;
  onOpenLightbox?: (src: string) => void;
}

export function MinimalView({ entry, onOpenLightbox }: MinimalViewProps) {
  const images = entry.images ?? [];

  return (
    <article className="minimal-view-container">
      <header className="minimal-header">
        <time className="minimal-date">
          {new Date(entry.createdAt).toLocaleDateString('fil-PH', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </time>

        <h1 className="minimal-title">{entry.title || 'Walang pamagat'}</h1>

        <div className="minimal-meta-row">
          {entry.mood && (
            <span className="minimal-mood-badge">
              <MoodFace mood={entry.mood} size={18} /> {entry.mood}
            </span>
          )}
          {entry.favorite && <span className="minimal-favorite" title="Paborito">♥ Paborito</span>}
          {entry.tags && entry.tags.length > 0 && (
            <span className="minimal-tags">
              {entry.tags.map((tag) => `#${tag}`).join(' ')}
            </span>
          )}
        </div>
      </header>

      <div className="minimal-divider" aria-hidden="true" />

      {/* Main text with comfortable generous line-height */}
      <div className="minimal-body">
        {entry.body.split('\n\n').map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>

      {/* Clean photo strip without heavy frames */}
      {images.length > 0 && (
        <section className="minimal-gallery" aria-label="Mga kalakip na larawan">
          <div className="minimal-gallery-grid">
            {images.map((src, idx) => (
              <button
                key={idx}
                type="button"
                className="minimal-photo-btn"
                onClick={() => onOpenLightbox?.(src)}
                aria-label={`Palakihin ang larawan ${idx + 1}`}
              >
                <img src={src} alt={`Larawan ${idx + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

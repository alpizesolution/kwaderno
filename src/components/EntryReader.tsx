import { useState, useEffect } from 'react';
import type { DiaryEntry } from '../db';
import type { ViewMode, ScrapbookConfig } from '../types/scrapbook';
import {
  loadScrapbookConfig,
  saveScrapbookConfig,
  resetScrapbookConfig,
} from '../constants/scrapbookThemes';
import { ClassicView } from './ClassicView';
import { ScrapbookView } from './ScrapbookView';
import { MinimalView } from './MinimalView';
import { PersonalizeEditor } from './PersonalizeEditor';

interface EntryReaderProps {
  entry: DiaryEntry;
  initialViewMode: ViewMode;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenLightbox: (src: string) => void;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function EntryReader({
  entry,
  initialViewMode,
  onBack,
  onEdit,
  onDelete,
  onOpenLightbox,
  onViewModeChange,
}: EntryReaderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [scrapbookConfig, setScrapbookConfig] = useState<ScrapbookConfig>(() =>
    loadScrapbookConfig(entry.id)
  );
  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);

  // Sync when entry changes
  useEffect(() => {
    setScrapbookConfig(loadScrapbookConfig(entry.id));
  }, [entry.id]);

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  const handleUpdateConfig = (updated: ScrapbookConfig) => {
    setScrapbookConfig(updated);
    saveScrapbookConfig(updated, entry.id);
  };

  const handleResetConfig = () => {
    const reset = resetScrapbookConfig(entry.id, scrapbookConfig.themeId);
    setScrapbookConfig(reset);
    saveScrapbookConfig(reset, entry.id);
  };

  return (
    <div className="entry-reader-page">
      {/* Top sticky navigation and view-switcher bar */}
      <div className="reader-top-bar">
        <button type="button" className="reader-back-btn" onClick={onBack}>
          ← Mga Pahina
        </button>

        {/* View Switcher: Classic, Scrapbook, Minimal */}
        <div className="view-switcher-pill" role="group" aria-label="Pumili ng Pananaw">
          <button
            type="button"
            className={`view-switcher-btn ${viewMode === 'classic' ? 'active' : ''}`}
            onClick={() => handleModeChange('classic')}
            aria-pressed={viewMode === 'classic'}
            title="Klasikong disenyo ng kwaderno"
          >
            📄 Klasiko
          </button>
          <button
            type="button"
            className={`view-switcher-btn ${viewMode === 'scrapbook' ? 'active' : ''}`}
            onClick={() => handleModeChange('scrapbook')}
            aria-pressed={viewMode === 'scrapbook'}
            title="Handcrafted scrapbook na may washi tape at stickers"
          >
            📖 Scrapbook
          </button>
          <button
            type="button"
            className={`view-switcher-btn ${viewMode === 'minimal' ? 'active' : ''}`}
            onClick={() => handleModeChange('minimal')}
            aria-pressed={viewMode === 'minimal'}
            title="Payapa at walang abalang pagbabasa"
          >
            🌿 Minimal
          </button>
        </div>

        <div className="reader-actions-group">
          {viewMode === 'scrapbook' && (
            <>
              <button
                type="button"
                className={`reader-action-btn ${isEditingLayout ? 'active-highlight' : ''}`}
                onClick={() => setIsEditingLayout((prev) => !prev)}
                title={isEditingLayout ? 'I-lock ang layout' : 'I-drag at ayusin ang stickers'}
              >
                {isEditingLayout ? '🔒 I-lock' : '✋ Ayusin'}
              </button>
              <button
                type="button"
                className="reader-action-btn highlight"
                onClick={() => setIsPersonalizeOpen(true)}
              >
                ✨ Personalize
              </button>
            </>
          )}
          <button type="button" className="reader-action-btn" onClick={onEdit} title="I-edit ang nilalaman">
            ✎ I-edit
          </button>
          <button
            type="button"
            className="reader-action-btn delete-btn"
            onClick={onDelete}
            title="Punitin ang pahinang ito"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Render Active View */}
      <main className="reader-content-wrap">
        {viewMode === 'classic' && (
          <ClassicView
            entry={entry}
            onOpenLightbox={onOpenLightbox}
            onEdit={onEdit}
          />
        )}

        {viewMode === 'scrapbook' && (
          <ScrapbookView
            entry={entry}
            config={scrapbookConfig}
            isEditingLayout={isEditingLayout}
            onUpdateConfig={handleUpdateConfig}
            onOpenLightbox={onOpenLightbox}
            onOpenPersonalize={() => setIsPersonalizeOpen(true)}
          />
        )}

        {viewMode === 'minimal' && (
          <MinimalView
            entry={entry}
            onOpenLightbox={onOpenLightbox}
          />
        )}
      </main>

      {/* Personalize Editor Panel (in Scrapbook mode) */}
      <PersonalizeEditor
        config={scrapbookConfig}
        isOpen={isPersonalizeOpen}
        onClose={() => setIsPersonalizeOpen(false)}
        onUpdateConfig={handleUpdateConfig}
        onReset={handleResetConfig}
        photoCount={(entry.images ?? []).length}
      />
    </div>
  );
}

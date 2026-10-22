import { useState } from 'react';
import type {
  ScrapbookConfig,
  ScrapbookThemeId,
  BackgroundPattern,
  HeadingFont,
  HeadingSize,
  StickerType,
  ScrapCardVariant,
} from '../types/scrapbook';
import { SCRAPBOOK_THEMES, getDefaultScrapbookConfig } from '../constants/scrapbookThemes';
import { DoodleSticker } from './ScrapbookAssets';

interface PersonalizeEditorProps {
  config: ScrapbookConfig;
  isOpen: boolean;
  onClose: () => void;
  onUpdateConfig: (updated: ScrapbookConfig) => void;
  onReset: () => void;
  photoCount?: number;
}

export function PersonalizeEditor({
  config,
  isOpen,
  onClose,
  onUpdateConfig,
  onReset,
  photoCount = 0,
}: PersonalizeEditorProps) {
  const [activeTab, setActiveTab] = useState<'themes' | 'paper' | 'type' | 'stickers' | 'arrange'>('themes');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectTheme = (themeId: ScrapbookThemeId) => {
    const preset = getDefaultScrapbookConfig(themeId);
    onUpdateConfig({
      ...preset,
      customTitle: config.customTitle,
    });
  };

  const handlePatternChange = (pattern: BackgroundPattern) => {
    onUpdateConfig({
      ...config,
      background: {
        ...config.background,
        pattern,
      },
    });
  };

  const handleColorChange = (color: string) => {
    onUpdateConfig({
      ...config,
      background: {
        ...config.background,
        color,
      },
    });
  };

  const handleHeadingFontChange = (headingFont: HeadingFont) => {
    onUpdateConfig({
      ...config,
      typography: {
        ...config.typography,
        headingFont,
      },
    });
  };

  const handleHeadingSizeChange = (headingSize: HeadingSize) => {
    onUpdateConfig({
      ...config,
      typography: {
        ...config.typography,
        headingSize,
      },
    });
  };

  const handleHeadingColorChange = (headingColor: string) => {
    onUpdateConfig({
      ...config,
      typography: {
        ...config.typography,
        headingColor,
      },
    });
  };

  const handleAddSticker = (stickerType: StickerType) => {
    const newId = `sticker-${Date.now()}`;
    const newElement = {
      id: newId,
      type: 'sticker' as const,
      x: 35 + Math.random() * 20,
      y: 40 + Math.random() * 20,
      rotate: Math.round((Math.random() - 0.5) * 16),
      zIndex: 6,
      data: { stickerType },
    };
    onUpdateConfig({
      ...config,
      elements: [...config.elements, newElement],
    });
    setSelectedElementId(newId);
    setActiveTab('arrange');
  };

  const handleAddScrapCard = (cardVariant: ScrapCardVariant) => {
    const newId = `card-${Date.now()}`;
    let cardData = {};
    if (cardVariant === 'about-today') {
      cardData = { cardVariant, cardTitle: 'About today 💙', cardItems: ['good food', 'good music', 'good vibes'] };
    } else if (cardVariant === 'good-things') {
      cardData = { cardVariant, cardTitle: 'Good things', cardItems: ['You', 'Me', 'Laughter'] };
    } else if (cardVariant === 'note-to-self') {
      cardData = { cardVariant, cardTitle: 'Note to self', quoteText: 'Be gentle with yourself today.' };
    } else {
      cardData = { cardVariant, quoteText: 'Every moment is a fresh beginning.' };
    }

    const newElement = {
      id: newId,
      type: 'scrap-card' as const,
      x: 10 + Math.random() * 20,
      y: 35 + Math.random() * 20,
      rotate: Math.round((Math.random() - 0.5) * 6),
      zIndex: 4,
      data: cardData,
    };
    onUpdateConfig({
      ...config,
      elements: [...config.elements, newElement],
    });
    setSelectedElementId(newId);
    setActiveTab('arrange');
  };

  const handleAddPlaylistCard = () => {
    const newId = `playlist-${Date.now()}`;
    const newElement = {
      id: newId,
      type: 'playlist' as const,
      x: 30,
      y: 70,
      rotate: -1,
      zIndex: 5,
      data: { songTitle: 'Here with me', artist: 'd4vd' },
    };
    onUpdateConfig({
      ...config,
      elements: [...config.elements, newElement],
    });
    setSelectedElementId(newId);
    setActiveTab('arrange');
  };

  const handleAddPolaroid = (photoIndex: number) => {
    const newId = `polaroid-${Date.now()}`;
    const newElement = {
      id: newId,
      type: 'polaroid' as const,
      x: 30 + Math.random() * 10,
      y: 25 + Math.random() * 10,
      rotate: Math.round((Math.random() - 0.5) * 4),
      zIndex: 5,
      data: { photoIndex, caption: 'Flashback 💙', tapeStyle: 'plaid-blue' as const },
    };
    onUpdateConfig({
      ...config,
      elements: [...config.elements, newElement],
    });
    setSelectedElementId(newId);
    setActiveTab('arrange');
  };

  const handleRemoveElement = (id: string) => {
    onUpdateConfig({
      ...config,
      elements: config.elements.filter((el) => el.id !== id),
    });
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleRotateElement = (id: string, rotate: number) => {
    onUpdateConfig({
      ...config,
      elements: config.elements.map((el) => (el.id === id ? { ...el, rotate } : el)),
    });
  };

  const handleMoveZIndex = (id: string, direction: 'front' | 'back') => {
    const el = config.elements.find((e) => e.id === id);
    if (!el) return;
    const currentZ = el.zIndex ?? 1;
    const newZ = direction === 'front' ? currentZ + 1 : Math.max(1, currentZ - 1);
    onUpdateConfig({
      ...config,
      elements: config.elements.map((e) => (e.id === id ? { ...e, zIndex: newZ } : e)),
    });
  };

  const patterns: { id: BackgroundPattern; label: string }[] = [
    { id: 'dot-grid', label: 'Bullet Dot Grid' },
    { id: 'lined', label: 'Notebook Lined' },
    { id: 'graph-grid', label: 'Graph Grid' },
    { id: 'blue-wash', label: 'Blue Watercolor' },
    { id: 'vintage-kraft', label: 'Vintage Kraft' },
    { id: 'pastel-blush', label: 'Soft Blush' },
    { id: 'plain', label: 'Malinis na Papel' },
  ];

  const colors = [
    { value: '#F4F7FB', label: 'Soft Sky Blue' },
    { value: '#FAF7F2', label: 'Warm Cream' },
    { value: '#FDF4F7', label: 'Blush Pastel' },
    { value: '#F7EFE6', label: 'Vintage Kraft' },
    { value: '#F4F9F5', label: 'Sage Botanical' },
    { value: '#1D1A17', label: 'Dark Academia' },
  ];

  const headingColors = [
    { value: '#255A8A', label: 'Denim Blue' },
    { value: '#1D3E63', label: 'Midnight Blue' },
    { value: '#6B4021', label: 'Warm Sepia' },
    { value: '#A84E72', label: 'Berry Rose' },
    { value: '#28583D', label: 'Deep Sage' },
    { value: '#E2B86E', label: 'Antique Gold' },
    { value: '#1F2E24', label: 'Classic Ink' },
  ];

  const selectedElement = config.elements.find((el) => el.id === selectedElementId);

  return (
    <div className="personalize-backdrop" role="dialog" aria-modal="true" aria-label="I-personalize ang Pahina">
      <div className="personalize-panel">
        <div className="personalize-header">
          <div className="personalize-title">
            <span className="eyebrow">SCRAPBOOK PERSONALIZATION</span>
            <h2>I-personalize ang Iyong Pahina ✨</h2>
          </div>
          <button type="button" className="personalize-close-btn" onClick={onClose} aria-label="Isara">
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="personalize-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'themes'}
            className={`personalize-tab ${activeTab === 'themes' ? 'active' : ''}`}
            onClick={() => setActiveTab('themes')}
          >
            🎨 Mga Tema
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'paper'}
            className={`personalize-tab ${activeTab === 'paper' ? 'active' : ''}`}
            onClick={() => setActiveTab('paper')}
          >
            📜 Papel
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'type'}
            className={`personalize-tab ${activeTab === 'type' ? 'active' : ''}`}
            onClick={() => setActiveTab('type')}
          >
            ✒ Sulat
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'stickers'}
            className={`personalize-tab ${activeTab === 'stickers' ? 'active' : ''}`}
            onClick={() => setActiveTab('stickers')}
          >
            🦋 Doodles & Cards
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'arrange'}
            className={`personalize-tab ${activeTab === 'arrange' ? 'active' : ''}`}
            onClick={() => setActiveTab('arrange')}
          >
            📐 Ayusin ({config.elements.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="personalize-body">
          {/* 1. THEMES PRESETS */}
          {activeTab === 'themes' && (
            <div className="tab-pane">
              <p className="tab-intro">
                Pumili ng panimulang tema. Maaari mo pa ring baguhin ang bawat sticker, kulay, at posisyon pagkatapos.
              </p>
              <div className="theme-preset-grid">
                {Object.values(SCRAPBOOK_THEMES).map((theme) => {
                  const isSelected = config.themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      className={`theme-preset-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleSelectTheme(theme.id)}
                    >
                      <div
                        className="theme-preset-preview"
                        style={{ backgroundColor: theme.previewBg, borderLeft: `5px solid ${theme.accentColor}` }}
                      >
                        <span className="theme-sample-tag" style={{ color: theme.accentColor }}>
                          {theme.id === 'blue-memories' ? 'Golden memories' : theme.name}
                        </span>
                        <div className="theme-preview-dots">
                          <span style={{ background: theme.accentColor }} />
                          <span style={{ background: theme.accentColor, opacity: 0.5 }} />
                        </div>
                      </div>
                      <div className="theme-preset-info">
                        <strong>{theme.name} {isSelected && '✓'}</strong>
                        <small>{theme.tagline}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. PAPER & BACKGROUND */}
          {activeTab === 'paper' && (
            <div className="tab-pane">
              <div className="form-group">
                <label className="section-label">Istilo at Texture ng Papel</label>
                <div className="paper-patterns-grid">
                  {patterns.map((p) => {
                    const isSelected = config.background.pattern === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`pattern-btn pattern-${p.id} ${isSelected ? 'active' : ''}`}
                        onClick={() => handlePatternChange(p.id)}
                      >
                        <span className="pattern-preview-swatch" />
                        <small>{p.label}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 20 }}>
                <label className="section-label">Kulay ng Papel</label>
                <div className="color-swatches-row">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`color-swatch-btn ${config.background.color === c.value ? 'active' : ''}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => handleColorChange(c.value)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. TYPOGRAPHY */}
          {activeTab === 'type' && (
            <div className="tab-pane">
              <div className="form-group">
                <label className="section-label">Font ng Pamagat (Headings)</label>
                <div className="font-options-grid">
                  <button
                    type="button"
                    className={`font-btn ${config.typography.headingFont === 'caveat' ? 'active' : ''}`}
                    onClick={() => handleHeadingFontChange('caveat')}
                    style={{ fontFamily: "'Caveat', cursive", fontSize: 24 }}
                  >
                    Caveat (Brush Script)
                  </button>
                  <button
                    type="button"
                    className={`font-btn ${config.typography.headingFont === 'patrick-hand' ? 'active' : ''}`}
                    onClick={() => handleHeadingFontChange('patrick-hand')}
                    style={{ fontFamily: "'Patrick Hand', cursive", fontSize: 20 }}
                  >
                    Patrick Hand (Casual)
                  </button>
                  <button
                    type="button"
                    className={`font-btn ${config.typography.headingFont === 'playfair' ? 'active' : ''}`}
                    onClick={() => handleHeadingFontChange('playfair')}
                    style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}
                  >
                    Playfair Display (Serif)
                  </button>
                  <button
                    type="button"
                    className={`font-btn ${config.typography.headingFont === 'outfit' ? 'active' : ''}`}
                    onClick={() => handleHeadingFontChange('outfit')}
                    style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17 }}
                  >
                    Outfit (Modern Sans)
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 20 }}>
                <label className="section-label">Laki ng Pamagat</label>
                <div className="btn-group-row">
                  {(['sm', 'md', 'lg', 'xl'] as HeadingSize[]).map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`size-toggle-btn ${config.typography.headingSize === size ? 'active' : ''}`}
                      onClick={() => handleHeadingSizeChange(size)}
                    >
                      {size.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 20 }}>
                <label className="section-label">Kulay ng Tinta ng Pamagat</label>
                <div className="color-swatches-row">
                  {headingColors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`color-swatch-btn ${config.typography.headingColor === c.value ? 'active' : ''}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => handleHeadingColorChange(c.value)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. STICKERS, CARDS & PHOTOS */}
          {activeTab === 'stickers' && (
            <div className="tab-pane">
              <div className="form-group">
                <label className="section-label">Magdagdag ng Doodle Stickers</label>
                <p className="tab-intro" style={{ marginBottom: 12 }}>
                  Pindutin ang sticker para idagdag sa iyong pahina.
                </p>
                <div className="sticker-picker-grid">
                  {[
                    { type: 'blue-butterfly', label: 'Paru-paro 🦋' },
                    { type: 'cloud', label: 'Ulap ☁️' },
                    { type: 'daisy', label: 'Daisy 🌼' },
                    { type: 'sparkle', label: 'Bituin ✨' },
                    { type: 'blue-heart', label: 'Puso 💙' },
                    { type: 'crescent-moon', label: 'Buwan 🌙' },
                    { type: 'earbuds', label: 'Earbuds 🎧' },
                    { type: 'paperclip', label: 'Paperclip 📎' },
                    { type: 'music-note', label: 'Musika 🎵' },
                  ].map((s) => (
                    <button
                      key={s.type}
                      type="button"
                      className="sticker-picker-item"
                      onClick={() => handleAddSticker(s.type as StickerType)}
                      title={`Idagdag ang ${s.label}`}
                    >
                      <DoodleSticker type={s.type as StickerType} size={36} />
                      <small>{s.label}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 24 }}>
                <label className="section-label">Magdagdag ng Memory Cards</label>
                <div className="card-picker-grid">
                  <button
                    type="button"
                    className="card-picker-btn"
                    onClick={() => handleAddScrapCard('about-today')}
                  >
                    <strong>About today 💙</strong>
                    <small>Talaan ng mga simpleng ginawa</small>
                  </button>
                  <button
                    type="button"
                    className="card-picker-btn"
                    onClick={() => handleAddScrapCard('good-things')}
                  >
                    <strong>Good things</strong>
                    <small>Mga magagandang bagay ngayon</small>
                  </button>
                  <button
                    type="button"
                    className="card-picker-btn"
                    onClick={() => handleAddScrapCard('note-to-self')}
                  >
                    <strong>Note to self</strong>
                    <small>Munting paalala sa sarili</small>
                  </button>
                  <button
                    type="button"
                    className="card-picker-btn"
                    onClick={() => handleAddScrapCard('quote')}
                  >
                    <strong>Quote Box</strong>
                    <small>Kaisipan na may washi tape</small>
                  </button>
                  <button
                    type="button"
                    className="card-picker-btn"
                    onClick={handleAddPlaylistCard}
                  >
                    <strong>Music Playlist 🎵</strong>
                    <small>Kanta at tugtog ng araw</small>
                  </button>
                </div>
              </div>

              {photoCount > 0 && (
                <div className="form-group" style={{ marginTop: 24 }}>
                  <label className="section-label">Mga Polaroid Frame ({photoCount} larawan)</label>
                  <div className="polaroid-picker-row">
                    {Array.from({ length: photoCount }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="polaroid-add-btn"
                        onClick={() => handleAddPolaroid(idx)}
                      >
                        📷 Idagdag ang Larawan {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. ARRANGE & EDIT SELECTED */}
          {activeTab === 'arrange' && (
            <div className="tab-pane">
              <label className="section-label">Mga Elemento sa Pahina ({config.elements.length})</label>
              <p className="tab-intro" style={{ marginBottom: 12 }}>
                Piliin ang elemento para i-rotate, i-reorder, o alisin. Maaari mo ring direktang i-drag ang mga ito sa mismong pahina.
              </p>

              <div className="elements-list-scroll">
                {config.elements.map((el, i) => {
                  const isSelected = selectedElementId === el.id;
                  let label: string = el.type;
                  if (el.type === 'polaroid') label = `Polaroid Frame (${el.data.caption || 'Larawan'})`;
                  if (el.type === 'scrap-card') label = `Card: ${el.data.cardTitle || el.data.cardVariant || 'Note'}`;
                  if (el.type === 'sticker') label = `Doodle: ${el.data.stickerType || 'Sticker'}`;
                  if (el.type === 'playlist') label = 'Music Playlist Card';
                  if (el.type === 'date-badge') label = 'Date Stamp Card';
                  if (el.type === 'mood-stamp') label = 'Mood Stamp';

                  return (
                    <div key={el.id} className={`element-row-item ${isSelected ? 'active' : ''}`}>
                      <button
                        type="button"
                        className="element-row-select"
                        onClick={() => setSelectedElementId(el.id)}
                      >
                        <span className="element-row-num">#{i + 1}</span>
                        <strong>{label}</strong>
                      </button>
                      <button
                        type="button"
                        className="element-del-btn"
                        onClick={() => handleRemoveElement(el.id)}
                        title="Alisin"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              {selectedElement && (
                <div className="selected-element-controls">
                  <h4>Ayusin ang napiling #{selectedElement.id}</h4>
                  <div className="rotate-slider-wrap">
                    <label>Pagkiling (Rotation): {selectedElement.rotate ?? 0}°</label>
                    <input
                      type="range"
                      min="-25"
                      max="25"
                      value={selectedElement.rotate ?? 0}
                      onChange={(e) => handleRotateElement(selectedElement.id, Number(e.target.value))}
                    />
                  </div>
                  <div className="zindex-btn-row">
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => handleMoveZIndex(selectedElement.id, 'front')}
                    >
                      ▲ Dalhin sa Unahan
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => handleMoveZIndex(selectedElement.id, 'back')}
                    >
                      ▼ Dalhin sa Likod
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      style={{ color: '#E85555' }}
                      onClick={() => handleRemoveElement(selectedElement.id)}
                    >
                      🗑 Tanggalin
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="personalize-footer">
          <button
            type="button"
            className="text-button"
            onClick={() => {
              if (window.confirm('I-reset ang layout sa orihinal nitong tema?')) {
                onReset();
              }
            }}
          >
            ↻ I-reset sa Tema
          </button>
          <button type="button" className="primary-button" onClick={onClose}>
            ✓ Tapos Na / I-save
          </button>
        </div>
      </div>
    </div>
  );
}

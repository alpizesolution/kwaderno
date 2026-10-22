import { useCallback, useEffect, useState } from 'react';
import { createVault, deleteEntry, exportBackup, getVaultFormatVersion, hasVault, importBackup, listEntries, lockVault, saveEntry, unlockVault, type DiaryEntry } from './db';
import PwaStatus from './PwaStatus';
import MoodFace from './MoodFace';
import type { ViewMode } from './types/scrapbook';
import { loadSavedViewMode, saveViewMode } from './constants/scrapbookThemes';
import { EntryReader } from './components/EntryReader';
import { WashiTape } from './components/ScrapbookAssets';

type Page = 'today' | 'entries' | 'calendar' | 'settings';
type Mood = '' | 'Masaya' | 'Payapa' | 'Malungkot' | 'Balisa' | 'Pagod' | 'Galit' | 'Nagpapasalamat' | 'Umaasa';

const moodOptions: { value: Exclude<Mood, ''>; icon: string }[] = [
  { value: 'Masaya', icon: '😊' },
  { value: 'Payapa', icon: '😌' },
  { value: 'Malungkot', icon: '😢' },
  { value: 'Balisa', icon: '😰' },
  { value: 'Pagod', icon: '😴' },
  { value: 'Galit', icon: '😠' },
  { value: 'Nagpapasalamat', icon: '🙏' },
  { value: 'Umaasa', icon: '🌱' },
];

function moodIcon(value?: string): string {
  return moodOptions.find((option) => option.value === value)?.icon ?? '🙂';
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '☼' },
  { id: 'entries', label: 'Mga Pahina', icon: '▤' },
  { id: 'calendar', label: 'Kalendaryo', icon: '▦' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];


const weekdayLabels = ['Lun', 'Mar', 'Miy', 'Huw', 'Biy', 'Sab', 'Lin'];

const writingPrompts = [
  'Anong maliit na bagay ang nagpagaan ng araw mo?',
  'Ano ang gusto mong sabihin sa sarili mo ngayon?',
  'Ano ang isang bagay na gusto mong bitawan?',
  'Kailan mo naramdaman na proud ka sa sarili mo?',
  'Ano ang kailangan mo ngayon na hindi mo pa naibibigay sa sarili mo?',
  'Anong alaala ang gusto mong balikan at bakit?',
  'Ano ang isang bagay na ipinagpapasalamat mo ngayon?',
  'Kung walang takot sa paghuhusga, ano ang isusulat mo?',
  'Ano ang natutunan mo tungkol sa sarili mo nitong linggo?',
  'Anong maliit na hakbang ang puwede mong gawin para sa sarili mo?'
];

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildCalendarDays(month: Date): { date: Date; key: string; inMonth: boolean }[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return { date, key: localDateKey(date), inMonth: date.getMonth() === month.getMonth() };
  });
}

function buildCurrentWeekDays(referenceDate: Date = new Date()): { date: Date; key: string; isToday: boolean; isFuture: boolean }[] {
  const today = new Date();
  const todayKey = localDateKey(today);
  const current = new Date(referenceDate);
  const dayOffset = (current.getDay() + 6) % 7; // Monday is 0, Sunday is 6
  const monday = new Date(current);
  monday.setDate(current.getDate() - dayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = localDateKey(d);
    const isToday = key === todayKey;
    const isFuture = d.getTime() > today.getTime() && !isToday;
    return { date: d, key, isToday, isFuture };
  });
}

function getEntryDateKey(entry: DiaryEntry): string {
  return localDateKey(new Date(entry.createdAt));
}

function getCurrentStreak(entries: DiaryEntry[]): number {
  const days = new Set(entries.map(getEntryDateKey));
  const today = new Date();
  const todayKey = localDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  let cursor = days.has(todayKey) ? today : yesterday;
  if (!days.has(localDateKey(cursor))) return 0;
  let streak = 0;
  while (days.has(localDateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const dateLabel = new Intl.DateTimeFormat('fil-PH', {
  weekday: 'long', month: 'long', day: 'numeric',
}).format(new Date());

function App() {
  const [page, setPage] = useState<Page>('today');
  const [vaultExists, setVaultExists] = useState<boolean | null>(null);
  const [vaultFormatVersion, setVaultFormatVersion] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [optionalMode, setOptionalMode] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [mood, setMood] = useState<Mood>('');
  const [favorite, setFavorite] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | undefined>();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => localDateKey(new Date()));
  const [calendarView, setCalendarView] = useState<'matrix' | 'gallery'>('matrix');
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadSavedViewMode());
  const [readingEntry, setReadingEntry] = useState<DiaryEntry | null>(null);
  const [entriesBrowseMode, setEntriesBrowseMode] = useState<'list' | 'album'>('list');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('kwaderno-theme') || 'sage'; } catch { return 'sage'; }
  });
  const [fontSize, setFontSize] = useState(() => {
    try { return localStorage.getItem('kwaderno-font-size') || 'medium'; } catch { return 'medium'; }
  });
  const [dailyPromptEnabled, setDailyPromptEnabled] = useState(() => {
    try { return localStorage.getItem('kwaderno-daily-prompt') !== 'false'; } catch { return true; }
  });
  const [promptIndex, setPromptIndex] = useState(() => new Date().getDate() % writingPrompts.length);
  const isDark = theme.startsWith('dark');
  const toggleLightDark = () => {
    if (isDark) {
      const lightName = theme.replace('dark-', '');
      setTheme(lightName === 'dark' ? 'sage' : lightName);
    } else {
      setTheme(`dark-${theme}`);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('kwaderno-theme', theme);
      localStorage.setItem('kwaderno-font-size', fontSize);
      localStorage.setItem('kwaderno-daily-prompt', String(dailyPromptEnabled));
    } catch {
      // Preferences remain usable for this session if browser storage is unavailable.
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme.startsWith('dark') ? '#0f1512' : '#FAF7F2');
    }
  }, [theme, fontSize, dailyPromptEnabled]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([hasVault(), getVaultFormatVersion()]).then(([exists, version]) => {
      if (!cancelled) { setVaultExists(exists); setVaultFormatVersion(version); if (!exists) setOptionalMode(true); }
    }).catch(() => {
      if (!cancelled) setError('Hindi mabuksan ang local storage. Subukang gumamit ng updated browser at i-refresh.');
    }).finally(() => {
      if (!cancelled) setInitializing(false);
    });
    return () => { cancelled = true; };
  }, []);

  const refreshEntries = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await listEntries());
      setError('');
    } catch {
      setError('Hindi mabuksan ang mga pahina. Nananatiling naka-encrypt ang data; subukang i-unlock muli.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (unlocked || optionalMode) void refreshEntries();
  }, [unlocked, optionalMode, refreshEntries]);


  const monthEntries = entries.filter((entry) => {
    const date = new Date(entry.createdAt);
    return date.getFullYear() === calendarMonth.getFullYear() && date.getMonth() === calendarMonth.getMonth();
  });
  const currentMonthEntries = entries.filter((entry) => {
    const date = new Date(entry.createdAt);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const moodCounts = monthEntries.reduce<Record<string, number>>((counts, entry) => {
    if (entry.mood) counts[entry.mood] = (counts[entry.mood] ?? 0) + 1;
    return counts;
  }, {});
  const topMoods = Object.entries(moodCounts).sort((left, right) => right[1] - left[1]);
  const currentStreak = getCurrentStreak(entries);
  const currentWeekDays = buildCurrentWeekDays();

  const monthPhotos = monthEntries.flatMap((entry) =>
    (entry.images ?? []).map((src, index) => ({
      src,
      entryId: entry.id,
      date: new Date(entry.createdAt),
      title: entry.title,
      mood: entry.mood,
      index,
    }))
  );

  const selectedDayEntries = entries.filter((entry) => localDateKey(new Date(entry.createdAt)) === selectedCalendarDate);
  const selectedDayPhotos = selectedDayEntries.flatMap((entry) =>
    (entry.images ?? []).map((src, index) => ({
      src,
      entryId: entry.id,
      title: entry.title,
      mood: entry.mood,
      index,
    }))
  );

  const handleVaultSubmit = async () => {
    setError('');
    setNotice('');
    if (!vaultExists && !/^\d{6}$/.test(pin)) {
      setError('Gumamit ng eksaktong 6-digit PIN (numero lamang).');
      return;
    }
    if (!vaultExists && pin !== confirmPin) {
      setError('Hindi magkapareho ang PIN. Pakisuri at subukan ulit.');
      return;
    }
    setSaving(true);
    try {
      if (vaultExists) {
        await unlockVault(pin);
      } else {
        await createVault(pin);
        setNotice('Nagawa ang Kandadong Kwaderno. Ang mga dating pahina ay inililipat na sa encrypted storage.');
      }
      setPin('');
      setConfirmPin('');
      setUnlocked(true);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Hindi na-set up o na-unlock ang Kwaderno. Walang dapat hulaan—subukan ulit.');
    } finally {
      setSaving(false);
    }
  };

  const handleLock = () => {
    if (editing && (title.trim() || body.trim() || images.length > 0) && !window.confirm('May hindi pa nai-save na pagbabago. I-lock at itapon ang mga pagbabagong ito?')) return;
    lockVault();
    setUnlocked(false);
    setEntries([]);
    setTitle('');
    setBody('');
    setImages([]);
    setTagsInput('');
    setMood('');
    setFavorite(false);
    setViewingImage(null);
    setEditingId(undefined);
    setEditing(false);
    setReadingEntry(null);
    setPin('');
    setConfirmPin('');
    setError('');
    setNotice('Naka-lock na ang Kandadong Kwaderno.');
  };

  const openReader = (entry: DiaryEntry) => {
    setReadingEntry(entry);
    setEditing(false);
  };

  const openEditor = (entry?: DiaryEntry) => {
    setEditingId(entry?.id);
    setTitle(entry?.title ?? '');
    setBody(entry?.body ?? '');
    setImages(entry?.images ?? []);
    setTagsInput((entry?.tags ?? []).join(', '));
    setMood((entry?.mood ?? '') as Mood);
    setFavorite(entry?.favorite ?? false);
    setError('');
    setNotice('');
    setEditing(true);
    setReadingEntry(null);
  };

  const saveCurrentEntry = async () => {
    if ((!title.trim() && !body.trim() && images.length === 0) || saving) return;
    setSaving(true);
    setError('');
    try {
      const tags = [...new Set(tagsInput.split(',').map((tag) => tag.trim().replace(/^#/, '').slice(0, 30)).filter(Boolean))].slice(0, 10);
      const savedId = await saveEntry({ title, body, images, tags, mood, favorite }, editingId);
      const refreshed = await listEntries();
      setEntries(refreshed);
      setEditing(false);
      setNotice('Nai-save sa device na ito. Wala pang backup.');
      const savedEntry = refreshed.find((e) => e.id === savedId) || refreshed[0];
      if (savedEntry) setReadingEntry(savedEntry);
    } catch {
      setError('Hindi na-save ang pahina. Huwag munang isara ang tab; subukan ulit.');
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (id: number) => {
    if (!window.confirm('Punitin ang pahinang ito? Hindi na ito maibabalik.')) return;
    try {
      await deleteEntry(id);
      await refreshEntries();
      setNotice('Tinanggal ang pahina sa local storage.');
      if (editingId === id) setEditing(false);
      if (readingEntry?.id === id) setReadingEntry(null);
    } catch {
      setError('Hindi natanggal ang pahina. Subukan ulit.');
    }
  };

  const leaveEditor = (nextPage?: Page) => {
    if (editing) {
      const existing = entries.find((entry) => entry.id === editingId);
      const hasUnsavedChanges = existing
        ? title !== existing.title
          || body !== existing.body
          || JSON.stringify(images) !== JSON.stringify(existing.images ?? [])
          || tagsInput !== (existing.tags ?? []).join(', ')
          || mood !== (existing.mood ?? '')
          || favorite !== (existing.favorite ?? false)
        : Boolean(title.trim() || body.trim() || images.length || tagsInput.trim() || mood || favorite);
      if (hasUnsavedChanges && !window.confirm('May hindi pa nai-save na pagbabago. Umalis sa editor at itapon ang mga ito?')) return;
    }
    setEditing(false);
    setReadingEntry(null);
    if (nextPage) setPage(nextPage);
  };

  const renderEntry = (entry: DiaryEntry) => (
    <div className="entry-row" key={entry.id}>
      <button className="entry-preview" onClick={() => openReader(entry)}>
        <span className="entry-date">{new Date(entry.updatedAt).toLocaleDateString('fil-PH', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()} · {new Date(entry.updatedAt).toLocaleTimeString('fil-PH', { hour: 'numeric', minute: '2-digit' })}</span>
        <strong>{entry.title || 'Walang pamagat'} {entry.favorite && <span className="favorite-mark" aria-label="Paborito">♥</span>}</strong>
        {entry.mood && <span className="entry-mood" title={entry.mood} aria-label={`Pakiramdam: ${entry.mood}`}><MoodFace mood={entry.mood} size={16} /> {entry.mood}</span>}
        <p>{entry.body}</p>
        {!!entry.tags?.length && <div className="entry-tags">{entry.tags.map((tag) => <span key={`${entry.id}-${tag}`}>#{tag}</span>)}</div>}
        {entry.images?.length ? <div className="entry-image-strip">{entry.images.slice(0, 3).map((src, index) => <img key={`${entry.id}-image-${index}`} src={src} alt={`Larawan ${index + 1}`} loading="lazy" />)}{entry.images.length > 3 && <span>+{entry.images.length - 3}</span>}</div> : null}
        <span className="entry-arrow">↗</span>
      </button>
      <button className="text-button delete-entry" onClick={() => entry.id !== undefined && void removeEntry(entry.id)}>Punitin ang Pahina</button>
    </div>
  );

  if (initializing) {
    return <div className="vault-gate"><div className="vault-card"><span className="vault-mark">⌑</span><h1>Binubuksan ang <em>kwaderno…</em></h1><p>Inihahanda ang iyong local vault.</p></div></div>;
  }

  if (!unlocked && !optionalMode) {
    return (
      <main className="vault-gate">
        <section className="vault-card">
          <a className="brand vault-brand" href="#home"><span className="brand-mark"><span /></span><span><strong>Kwadernoko</strong><small>sarili mong pahina</small></span></a>
          <span className="vault-mark">⌑</span>
          <span className="eyebrow">KANDADONG KWADERNO</span>
          <h1>{vaultExists ? <>Bumalik sa iyong <em>pahina.</em></> : <>Isara ang mundo.<br />Buksan ang <em>sarili.</em></>}</h1>
          <p>{vaultExists ? vaultFormatVersion >= 2 ? 'Ilagay ang iyong 6-digit PIN para mabuksan ang mga pahina sa device na ito.' : 'Lumang lock format ang vault na ito. Ilagay ang dating access key upang mabuksan ang iyong mga pahina.' : 'Gumawa ng 6-digit PIN para i-encrypt ang iyong diary. Ililipat sa encrypted storage ang mga dati mong pahina.'}</p>
          <form onSubmit={(event) => { event.preventDefault(); void handleVaultSubmit(); }} className="vault-form">
            <label htmlFor="vault-pin">{vaultExists ? (vaultFormatVersion >= 2 ? 'Ilagay ang 6-digit PIN' : 'Dating access key') : 'Gumawa ng 6-digit PIN'}</label>
            <input id="vault-pin" className="pin-input" type="password" inputMode={vaultExists && vaultFormatVersion < 2 ? 'text' : 'numeric'} pattern={vaultExists && vaultFormatVersion < 2 ? undefined : '[0-9]{6}'} maxLength={vaultExists && vaultFormatVersion < 2 ? undefined : 6} autoComplete={vaultExists ? 'current-password' : 'new-password'} value={pin} onChange={(event) => setPin(vaultExists && vaultFormatVersion < 2 ? event.target.value : event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={vaultExists && vaultFormatVersion < 2 ? 'Dating access key' : '••••••'} aria-describedby="pin-help" minLength={vaultExists && vaultFormatVersion < 2 ? undefined : 6} required />
            <small id="pin-help" className="pin-help">{vaultExists && vaultFormatVersion < 2 ? 'Ginagamit ng lumang vault ang dating access key.' : '6 na numero lamang · walang letra o simbolo'}</small>
            {!vaultExists && <><label htmlFor="vault-confirm">Kumpirmahin ang PIN</label><input id="vault-confirm" className="pin-input" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="new-password" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" aria-describedby="pin-confirm-help" minLength={6} required /><small id="pin-confirm-help" className="pin-help">Ilagay muli ang parehong 6 na numero.</small></>}
            {error && <p className="vault-error" role="alert">{error}</p>}
            <button className="primary-button vault-submit" type="submit" disabled={saving}>{saving ? 'Sandali lang…' : vaultExists ? 'I-unlock ang Kwaderno' : 'Gumawa ng Kandado'} <span>↗</span></button>
          </form>
          {!vaultExists && <button className="text-button" type="button" onClick={() => { setOptionalMode(true); setNotice('Nagpatuloy ka nang walang kandado. Hindi naka-encrypt ang mga pahina sa mode na ito.'); }}>Magpatuloy nang walang lock</button>}
          <div className="vault-warning"><strong>Mahalagang paalala</strong><p>Hindi mare-reset ang nakalimutang PIN. Mag-save ng encrypted backup sa Settings at itago nang hiwalay ang backup password.</p><button type="button" className="security-details-toggle" aria-expanded={showSecurityDetails} onClick={() => setShowSecurityDetails((value) => !value)}>{showSecurityDetails ? 'Itago ang detalye' : 'Alamin pa'} <span aria-hidden="true">{showSecurityDetails ? '−' : '+'}</span></button>{showSecurityDetails && <p className="security-details">Kapag nawala ang PIN, hindi na mababasa ang encrypted entries. Mas madaling hulaan ang 6-digit PIN kaysa sa mas mahabang password. Panatilihing ligtas ang backup file at backup password sa magkahiwalay na lugar.</p>}</div>
          <p className="vault-footnote">Nananatili sa browser at device na ito. Walang cloud sync.</p>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell" data-theme={theme} data-font-size={fontSize}>
      <PwaStatus />
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); leaveEditor('today'); }}>
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span><strong>Kwadernoko</strong><small>sarili mong pahina</small></span>
        </a>
        <div className="side-label">ANG IYONG KWADERNO</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => <button key={item.id} className={`nav-item ${page === item.id && !editing ? 'active' : ''}`} onClick={() => leaveEditor(item.id)}>{<span className="nav-icon" aria-hidden="true">{item.icon}</span>}{item.label}</button>)}
        </nav>
        <div className="sidebar-note"><span className="tiny-lock">⌑</span><p>Walang judgment.<br />Walang tsismis.<br /><em>Kwento mo lang.</em></p></div>
        <div className="sidebar-foot"><span className="status-dot" /> {optionalMode ? "Unencrypted · device only" : "Encrypted · device only"}</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><span /></span><strong>Kwadernoko</strong></div>
          <span className="date-top">{dateLabel}</span>
          <div className="topbar-actions"><button type="button" className="theme-toggle-button" onClick={toggleLightDark} title={isDark ? "Lumipat sa Light theme (Klasikong Papel)" : "Lumipat sa Dark theme"} aria-label={isDark ? "Lumipat sa Light theme" : "Lumipat sa Dark theme"}>{isDark ? "☼" : "☾"}</button><button className="text-button lock-button" onClick={() => { if (optionalMode) { if (editing && (title.trim() || body.trim()) && !window.confirm("May hindi pa nai-save na pagbabago. Magpatuloy sa paggawa ng lock?")) return; setOptionalMode(false); setVaultExists(false); setEditing(false); setTitle(""); setBody(""); setImages([]); setEditingId(undefined); setPin(""); setConfirmPin(""); setError(""); } else { handleLock(); } }}>{optionalMode ? "⌑ Gumawa ng lock" : "⌑ I-lock"}</button><button className="avatar-button" aria-label="Open settings" onClick={() => leaveEditor('settings')}>♡</button></div>
        </header>

        {editing ? (
          <section className="editor-wrap">
            <button className="back-link" onClick={() => { leaveEditor(); setError(''); }}>← Bumalik sa pahina</button>
            <div className="editor-paper">
              <div className="paper-kicker">{editingId === undefined ? 'BAGONG PAHINA' : 'INE-EDIT NA PAHINA'} <span>·</span> {dateLabel.toUpperCase()}</div>
              <input className="title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bigyan ng pamagat (optional)" aria-label="Entry title" />
              <textarea className="body-input" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Blangko pa ang pahina. Ano'ng nasa isip mo?" aria-label="Diary entry" autoFocus />
              <div className="entry-metadata-editor">
                <label>Mga tag <span>· hanggang 10, paghiwalayin ng kuwit</span><input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} maxLength={400} placeholder="hal. pamilya, trabaho, sarili" /></label>
                <div className="mood-picker" role="group" aria-label="Pakiramdam ngayon"><span className="mood-picker-label">Pakiramdam ngayon</span><div className="mood-options"><button type="button" className={`mood-option mood-none ${mood === '' ? 'is-selected' : ''}`} aria-pressed={mood === ''} onClick={() => setMood('')}><MoodFace isEmpty size={24} /><small>Wala</small></button>{moodOptions.map((option) => <button key={option.value} type="button" className={`mood-option ${mood === option.value ? 'is-selected' : ''}`} aria-label={option.value} title={option.value} aria-pressed={mood === option.value} onClick={() => setMood(option.value)}><MoodFace mood={option.value} size={24} /><small>{option.value}</small></button>)}</div></div>
                <button type="button" className={`favorite-toggle ${favorite ? 'is-favorite' : ''}`} aria-pressed={favorite} onClick={() => setFavorite((value) => !value)}>{favorite ? '♥ Nasa mga paborito' : '♡ Idagdag sa mga paborito'}</button>
              </div>
              <div className="image-attachments"><div className="attachment-heading"><div><strong>Mga larawan</strong><small>Hanggang 5 larawan bawat pahina · naka-save kasama ng entry</small></div><label className="attach-button">＋ Mag-attach<input type="file" accept="image/*" multiple hidden onChange={(event) => { const files = Array.from(event.target.files ?? []); event.currentTarget.value = ''; void (async () => { const available = Math.max(0, 5 - images.length); if (!available) { setError('Hanggang 5 larawan lamang bawat pahina.'); return; } const selected = files.slice(0, available); if (files.length > available) setNotice('Hanggang 5 larawan lamang bawat pahina; idinagdag ang unang puwedeng larawan.'); for (const file of selected) { if (!file.type.startsWith('image/')) { setError('Larawan lamang ang puwedeng i-attach.'); continue; } if (file.size > 12 * 1024 * 1024) { setError('May larawang lampas 12 MB. Pumili ng mas maliit na file.'); continue; } try { const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error('Hindi mabasa ang larawan.')); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file); }); const optimized = await new Promise<string>((resolve, reject) => { const image = new Image(); image.onerror = () => reject(new Error('Hindi ma-open ang larawan.')); image.onload = () => { const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale)); const context = canvas.getContext('2d'); if (!context) { reject(new Error('Hindi ma-process ang larawan.')); return; } context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', 0.82)); }; image.src = dataUrl; }); setImages((current) => current.length < 5 ? [...current, optimized] : current); setError(''); } catch { setError('Hindi naidagdag ang isang larawan. Subukan ang ibang file.'); } } })(); }} /></label></div>{images.length ? <div className="attachment-grid">{images.map((src, index) => <div className="attachment-thumb" key={'attached-' + index}><button type="button" className="attachment-view" onClick={() => setViewingImage(src)} aria-label={'Tingnan ang larawan ' + (index + 1)}><img src={src} alt={'Kalakip na larawan ' + (index + 1)} /></button><button type="button" aria-label={'Alisin ang larawan ' + (index + 1)} onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}>×</button></div>)}</div> : <p className="attachment-empty">Wala pang kalakip na larawan.</p>}</div>
              <div className="editor-bottom"><span className="local-note">{optionalMode ? "Hindi naka-encrypt ang pahina" : "⌑ Encrypted sa device kapag na-save"}</span><button className="primary-button" onClick={() => void saveCurrentEntry()} disabled={saving || (!title.trim() && !body.trim() && images.length === 0)}>{saving ? 'Sine-save…' : 'I-save ang pahina'} <span>↗</span></button></div>
            </div>
            <p className="prototype-note">{optionalMode ? "Walang lock ang mode na ito, kaya hindi naka-encrypt ang mga entry. Maaari kang gumawa ng lock sa itaas anumang oras." : "Naka-encrypt sa IndexedDB ang text, tags, mood, favorites, at mga larawan ng entry. Nananatili sa local database ang timestamps. Gumawa ng encrypted backup at itabi nang hiwalay ang PIN at backup password."}</p>
          </section>
        ) : readingEntry ? (
          <EntryReader
            entry={readingEntry}
            initialViewMode={viewMode}
            onBack={() => setReadingEntry(null)}
            onEdit={() => {
              const toEdit = readingEntry;
              setReadingEntry(null);
              openEditor(toEdit);
            }}
            onDelete={() => {
              if (readingEntry.id !== undefined) {
                const id = readingEntry.id;
                setReadingEntry(null);
                void removeEntry(id);
              }
            }}
            onOpenLightbox={(src) => setViewingImage(src)}
            onViewModeChange={(mode) => {
              setViewMode(mode);
              saveViewMode(mode);
            }}
          />
        ) : (
          <section className="page-content">
            {page === 'today' && <>
              <div className="greeting"><span className="eyebrow">ISANG SANDALI PARA SA SARILI</span><h1>Kamusta ang <em>puso</em> mo today?</h1><p>Hindi kailangang maayos ang lahat ng salita.<br className="desktop-break" /> Magsimula ka lang kung saan ka naroroon.</p></div>
              <section className="week-mood-card" aria-label="Lingguhang kalendaryo ng pakiramdam">
                <div className="week-mood-header">
                  <div className="week-mood-title">
                    <h2>Today, {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</h2>
                    <span className="week-mood-subtitle">Pakiramdam sa linggong ito</span>
                  </div>
                  <button type="button" className="week-mood-gear-btn" onClick={() => leaveEditor('calendar')} title="Tingnan ang buong kalendaryo" aria-label="Tingnan ang buong kalendaryo">⚙</button>
                </div>
                <div className="week-mood-strip">
                  {currentWeekDays.map((day) => {
                    const dayEntries = entries.filter((e) => localDateKey(new Date(e.createdAt)) === day.key);
                    const dayMood = dayEntries.find((e) => e.mood)?.mood;
                    const dayImages = dayEntries.flatMap((e) => e.images ?? []);
                    const weekdayName = day.date.toLocaleDateString('en-US', { weekday: 'short' });
                    return (
                      <button
                        key={day.key}
                        type="button"
                        className={`week-day-col ${day.isToday ? 'is-today' : ''} ${day.isFuture ? 'is-future' : ''} ${dayEntries.length ? 'has-entry' : ''}`}
                        onClick={() => {
                          if (dayEntries.length > 0) {
                            openReader(dayEntries[0]);
                          } else if (!day.isFuture) {
                            openEditor();
                          }
                        }}
                        title={`${day.date.toLocaleDateString('fil-PH', { weekday: 'long', month: 'long', day: 'numeric' })}${dayMood ? `: ${dayMood}` : dayEntries.length ? ': May pahina' : ''}${dayImages.length ? ` · ${dayImages.length} larawan` : ''}`}
                      >
                        <span className="week-day-name">{weekdayName}</span>
                        <span className="week-day-num">{day.date.getDate()}</span>
                        <div className="week-day-face">
                          <MoodFace mood={dayMood} size={32} isEmpty={!dayMood} />
                          {dayImages.length > 0 && <span className="week-photo-pill" title={`${dayImages.length} larawan`}>📷</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="insights-panel" aria-label="Diary insights">
                <div className="insights-heading"><div><span className="eyebrow">MGA BAKAS NG IYONG KWENTO</span><h2>Maliit na paglingon sa sarili</h2></div><span className="insights-period">Ngayong buwan</span></div>
                <div className="insights-stats">
                  <div className="insight-stat"><span className="insight-icon">✎</span><strong>{entries.length}</strong><span>Kabuuang pahina</span></div>
                  <div className="insight-stat"><span className="insight-icon">☼</span><strong>{currentStreak}</strong><span>{currentStreak === 1 ? 'Araw na sunod-sunod' : 'Araw na sunod-sunod'}</span></div>
                  <div className="insight-stat"><span className="insight-icon">▦</span><strong>{currentMonthEntries.length}</strong><span>Pahina ngayong buwan</span></div>
                </div>
                <div className="mood-insights"><div className="mood-insights-title"><strong>Mga pakiramdam ngayong buwan</strong><span>{monthEntries.length} {monthEntries.length === 1 ? 'pahina' : 'pahina'}</span></div>
                  {topMoods.length ? <div className="mood-bars">{topMoods.slice(0, 4).map(([name, count]) => <div className="mood-bar-row" key={name}><span className="mood-bar-icon">{moodIcon(name)}</span><span className="mood-bar-name">{name}</span><span className="mood-bar-track"><span style={{ width: `${Math.max(8, (count / topMoods[0][1]) * 100)}%` }} /></span><strong>{count}</strong></div>)}</div> : <p className="insights-empty">Wala pang napiling mood ngayong buwan. Hindi kailangang lagyan ng label ang bawat pakiramdam.</p>}
                </div>
              </section>
              {dailyPromptEnabled && <section className="daily-prompt" aria-label="Pang-araw-araw na writing prompt"><div className="daily-prompt-copy"><span className="eyebrow">MUNTING GABAY SA PAGSULAT</span><p>{writingPrompts[promptIndex]}</p></div><div className="daily-prompt-actions"><button className="text-button" onClick={() => setPromptIndex((index) => (index + 1 + Math.floor(Math.random() * (writingPrompts.length - 1))) % writingPrompts.length)}>Ibang prompt ↻</button><button className="prompt-use-button" onClick={() => { openEditor(); setBody((current) => current.trim() ? current : writingPrompts[promptIndex] + '\n\n'); }}>Gamitin ang prompt ↗</button></div></section>}
              <div className="write-card"><div className="write-decoration" aria-hidden="true"><span className="sun-doodle">✳</span><span className="line-doodle">〰</span><span className="leaf-doodle">⌁</span></div><div className="write-card-content"><span className="eyebrow">ANG SUSUNOD MONG PAHINA</span><h2>May gusto ka bang<br />ilabas sa isip mo?</h2><p>Isulat mo lang. Walang kailangang patunayan.</p><button className="primary-button" onClick={() => openEditor()}>＋ Bagong Pahina</button></div><div className="paper-corner" aria-hidden="true" /></div>
              <div className="recent-section"><div className="section-heading"><div><span className="eyebrow">MGA SALITANG NAIWAN</span><h2>{entries.length ? 'Huling sinulat' : 'Wala pang naisusulat'}</h2></div><button className="text-button" onClick={() => setPage('entries')}>Tingnan lahat ↗</button></div>
                {loading ? <p className="empty-message">Binubuksan ang kwaderno…</p> : entries.length ? entries.slice(0, 3).map(renderEntry) : <div className="gentle-reminder"><span className="sparkle">✳</span><p>Hindi kailangang maging magandang araw para maging karapat-dapat ikwento.</p></div>}
              </div>
            </>}
            {page === 'entries' && (
              <div className="simple-page">
                <span className="eyebrow">MGA NAITAGONG SALITA</span>
                <div className="calendar-page-header">
                  <h1>Mga <em>Pahina</em></h1>
                  <div className="view-switcher-pill" role="group" aria-label="Tingnan ang listahan">
                    <button
                      type="button"
                      className={`view-switcher-btn ${entriesBrowseMode === 'list' ? 'active' : ''}`}
                      onClick={() => setEntriesBrowseMode('list')}
                      aria-pressed={entriesBrowseMode === 'list'}
                    >
                      📄 Listahan
                    </button>
                    <button
                      type="button"
                      className={`view-switcher-btn ${entriesBrowseMode === 'album' ? 'active' : ''}`}
                      onClick={() => setEntriesBrowseMode('album')}
                      aria-pressed={entriesBrowseMode === 'album'}
                    >
                      📖 Scrapbook Cards
                    </button>
                  </div>
                </div>

                <div className="entry-tools">
                  <label className="entry-search-label" htmlFor="entry-search">Hanapin sa iyong kwaderno</label>
                  <input id="entry-search" className="entry-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Maghanap ng salita o pamagat…" />
                  <div className="entry-tools-bottom">
                    <span>{searchQuery.trim() ? `Resulta: ${entries.filter((entry) => `${entry.title} ${entry.body} ${(entry.tags ?? []).join(' ')} ${entry.mood ?? ''}`.toLocaleLowerCase('fil-PH').includes(searchQuery.trim().toLocaleLowerCase('fil-PH')) && (!showFavorites || entry.favorite)).length}` : `${entries.length} ${entries.length === 1 ? 'pahina' : 'pahina'}`}</span>
                    <button type="button" className={`text-button favorites-filter ${showFavorites ? 'active' : ''}`} aria-pressed={showFavorites} onClick={() => setShowFavorites((value) => !value)}>{showFavorites ? '♥ Mga paborito' : '♡ Lahat'}</button>
                    <label htmlFor="entry-sort">Ayusin: <select id="entry-sort" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as 'newest' | 'oldest')}><option value="newest">Pinakabago</option><option value="oldest">Pinakaluma</option></select></label>
                  </div>
                </div>

                {loading ? (
                  <p className="empty-message">Binubuksan ang kwaderno…</p>
                ) : entries.length ? (() => {
                  const query = searchQuery.trim().toLocaleLowerCase('fil-PH');
                  const filtered = entries.filter((entry) => `${entry.title} ${entry.body} ${(entry.tags ?? []).join(' ')} ${entry.mood ?? ''}`.toLocaleLowerCase('fil-PH').includes(query) && (!showFavorites || entry.favorite)).sort((a, b) => {
                    const difference = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                    return sortOrder === 'newest' ? -difference : difference;
                  });

                  if (!filtered.length) {
                    return (
                      <div className="empty-paper search-empty">
                        <span>⌕</span>
                        <h2>Walang tugmang pahina.</h2>
                        <p>Subukan ang ibang salita o burahin ang hinahanap mo.</p>
                        <button className="text-button" onClick={() => setSearchQuery('')}>Burahin ang paghahanap</button>
                      </div>
                    );
                  }

                  if (entriesBrowseMode === 'album') {
                    return (
                      <div className="scrapbook-album-grid">
                        {filtered.map((entry) => {
                          const hasPhoto = entry.images && entry.images.length > 0;
                          return (
                            <div
                              key={`album-card-${entry.id}`}
                              className="album-card"
                              onClick={() => openReader(entry)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === 'Enter') openReader(entry); }}
                            >
                              <div className="album-card-tape">
                                <WashiTape style="plaid-blue" width={56} height={18} />
                              </div>
                              {hasPhoto ? (
                                <div className="album-card-photo">
                                  <img src={entry.images![0]} alt={entry.title || 'Larawan'} loading="lazy" />
                                </div>
                              ) : null}
                              <h3 className="album-card-title">{entry.title || 'Walang pamagat'}</h3>
                              <p className="album-card-body">{entry.body}</p>
                              <div className="album-card-meta">
                                <span>{new Date(entry.createdAt).toLocaleDateString('fil-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                {entry.mood && <span title={entry.mood}><MoodFace mood={entry.mood} size={16} /></span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  return <div className="entries-list">{filtered.map(renderEntry)}</div>;
                })() : (
                  <div className="empty-paper">
                    <span>✎</span>
                    <h2>Blangko pa ang pahina.</h2>
                    <p>Kapag handa ka na, nandito lang ang kwaderno mo.</p>
                    <button className="primary-button" onClick={() => openEditor()}>＋ Bagong Pahina</button>
                  </div>
                )}
              </div>
            )}
            {page === 'calendar' && (
              <div className="simple-page">
                <span className="eyebrow">MGA ARAW NA DUMAAN</span>
                <div className="calendar-page-header">
                  <h1>Mga sandali, <em>unti-unti.</em></h1>
                  <div className="calendar-view-toggle" role="group" aria-label="Paraan ng pagpapakita">
                    <button
                      type="button"
                      className={`calendar-view-btn ${calendarView === 'matrix' ? 'active' : ''}`}
                      onClick={() => setCalendarView('matrix')}
                      aria-pressed={calendarView === 'matrix'}
                    >
                      <span>▦</span> Buwan
                    </button>
                    <button
                      type="button"
                      className={`calendar-view-btn ${calendarView === 'gallery' ? 'active' : ''}`}
                      onClick={() => setCalendarView('gallery')}
                      aria-pressed={calendarView === 'gallery'}
                    >
                      <span>⊞</span> Mga Larawan {monthPhotos.length > 0 && `(${monthPhotos.length})`}
                    </button>
                  </div>
                </div>

                <div className="calendar-panel">
                  <div className="calendar-heading">
                    <button
                      className="calendar-nav"
                      aria-label="Nakaraang buwan"
                      onClick={() => {
                        const month = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
                        setCalendarMonth(month);
                        setSelectedCalendarDate(localDateKey(month));
                      }}
                    >
                      ←
                    </button>
                    <h2>{calendarMonth.toLocaleDateString('fil-PH', { month: 'long', year: 'numeric' })}</h2>
                    <button
                      className="calendar-nav"
                      aria-label="Susunod na buwan"
                      onClick={() => {
                        const month = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
                        setCalendarMonth(month);
                        setSelectedCalendarDate(localDateKey(month));
                      }}
                    >
                      →
                    </button>
                  </div>

                  {calendarView === 'matrix' ? (
                    <>
                      <div className="calendar-grid calendar-weekdays">
                        {weekdayLabels.map((day) => (
                          <span key={day}>{day}</span>
                        ))}
                      </div>
                      <div className="calendar-grid">
                        {buildCalendarDays(calendarMonth).map(({ date, key, inMonth }) => {
                          const dayEntries = entries.filter((entry) => localDateKey(new Date(entry.createdAt)) === key);
                          const hasEntry = dayEntries.length > 0;
                          const dayMood = dayEntries.find((e) => e.mood)?.mood;
                          const dayImages = dayEntries.flatMap((e) => e.images ?? []);
                          const hasPhoto = dayImages.length > 0;
                          return (
                            <button
                              key={key}
                              className={`calendar-day ${inMonth ? '' : 'outside-month'} ${hasEntry ? 'has-entry' : ''} ${hasPhoto ? 'has-photo' : ''} ${selectedCalendarDate === key ? 'selected' : ''}`}
                              onClick={() => setSelectedCalendarDate(key)}
                              aria-label={`${date.toLocaleDateString('fil-PH', { month: 'long', day: 'numeric', year: 'numeric' })}${hasEntry ? ', may entry' : ''}${hasPhoto ? `, ${dayImages.length} larawan` : ''}`}
                              aria-pressed={selectedCalendarDate === key}
                            >
                              {hasPhoto && (
                                <div className="cal-day-photo-tile">
                                  <img src={dayImages[0]} alt="" />
                                  <div className="cal-photo-scrim" />
                                </div>
                              )}
                              <span className="cal-day-num">{date.getDate()}</span>
                              {hasPhoto && dayImages.length > 1 && (
                                <span className="cal-photo-badge" title={`${dayImages.length} larawan`}>
                                  +{dayImages.length - 1}
                                </span>
                              )}
                              {dayMood ? (
                                <span className="calendar-mood-icon">
                                  <MoodFace mood={dayMood} size={15} />
                                </span>
                              ) : hasEntry && !hasPhoto ? (
                                <span className="calendar-dot" aria-hidden="true" />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                      <p className="calendar-legend">
                        <span className="calendar-dot" /> May naisulat sa araw na ito
                        <span style={{ marginLeft: 14 }}>📷 Tiled ang kalakip na larawan</span>
                      </p>
                    </>
                  ) : (
                    <div className="compiled-month-gallery-wrap">
                      {monthPhotos.length === 0 ? (
                        <div className="empty-paper calendar-empty">
                          <span>📷</span>
                          <h2>Walang kalakip na larawan sa buwang ito.</h2>
                          <p>Maaari kang mag-attach ng hanggang 5 larawan sa bawat isinusulat mong pahina.</p>
                          <button className="primary-button" onClick={() => openEditor()}>
                            ＋ Sumulat at mag-attach ng larawan
                          </button>
                        </div>
                      ) : (
                        <div className="compiled-month-gallery">
                          {monthPhotos.map((photo, pIdx) => (
                            <button
                              key={`month-photo-${photo.entryId}-${photo.index}-${pIdx}`}
                              type="button"
                              className="month-photo-card"
                              onClick={() => {
                                setSelectedCalendarDate(localDateKey(photo.date));
                                setViewingImage(photo.src);
                              }}
                              title={`${photo.title || 'Pahina'} · ${photo.date.toLocaleDateString('fil-PH', { month: 'short', day: 'numeric' })}`}
                            >
                              <img src={photo.src} alt={photo.title || 'Kalakip na larawan'} loading="lazy" />
                              <div className="month-photo-overlay">
                                <div className="month-photo-top">
                                  <span className="month-photo-date">
                                    {photo.date.toLocaleDateString('fil-PH', { month: 'short', day: 'numeric' })}
                                  </span>
                                  {photo.mood && <MoodFace mood={photo.mood} size={18} />}
                                </div>
                                <div className="month-photo-bottom">
                                  <span className="month-photo-title">{photo.title || 'Walang pamagat'}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <section className="calendar-insights" aria-label="Buod ng napiling buwan">
                  <div>
                    <span className="eyebrow">BUOD NG BUWAN</span>
                    <strong>{monthEntries.length} {monthEntries.length === 1 ? 'pahina' : 'pahina'}</strong>
                    <small>{new Set(monthEntries.map(getEntryDateKey)).size} araw na may naisulat {monthPhotos.length > 0 && `· ${monthPhotos.length} larawan`}</small>
                  </div>
                  <div className="calendar-mood-summary">
                    <strong>Mga mood</strong>
                    {topMoods.length ? (
                      <div className="calendar-mood-chips">
                        {topMoods.slice(0, 4).map(([name, count]) => (
                          <span key={name}>
                            {moodIcon(name)} {name} <b>{count}</b>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <small>Wala pang mood na naitala sa buwang ito.</small>
                    )}
                  </div>
                </section>

                <div className="calendar-day-entries">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">NAPILING ARAW</span>
                      <h2>
                        {new Date(`${selectedCalendarDate}T12:00:00`).toLocaleDateString('fil-PH', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </h2>
                    </div>
                    <button className="text-button" onClick={() => openEditor()}>＋ Bagong Pahina</button>
                  </div>

                  {selectedDayPhotos.length > 0 && (
                    <div className="day-photo-tiles-bar">
                      <div className="day-photo-tiles-title">
                        <span>Mga Larawan sa Araw na Ito</span>
                        <small>{selectedDayPhotos.length} {selectedDayPhotos.length === 1 ? 'larawan' : 'larawan'}</small>
                      </div>
                      <div className="day-photo-tiles-grid">
                        {selectedDayPhotos.map((photo, i) => (
                          <button
                            key={`day-photo-${photo.entryId}-${i}`}
                            type="button"
                            className="day-photo-tile-btn"
                            onClick={() => setViewingImage(photo.src)}
                            aria-label={`Tingnan ang larawan ${i + 1}`}
                          >
                            <img src={photo.src} alt={photo.title || 'Larawan'} />
                            <span className="day-photo-tile-zoom">🔍</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <p className="empty-message">Binubuksan ang kwaderno…</p>
                  ) : selectedDayEntries.length ? (
                    selectedDayEntries.map(renderEntry)
                  ) : (
                    <div className="empty-paper calendar-empty">
                      <span>☼</span>
                      <h2>Walang entry sa araw na ito.</h2>
                      <p>Bawat araw ay may puwang para sa bagong kwento.</p>
                      <button className="primary-button" onClick={() => openEditor()}>
                        ＋ Sumulat para sa araw na ito
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {page === 'settings' && <div className="simple-page"><span className="eyebrow">SARILI MONG ESPASYO</span><h1>Mga <em>setting</em></h1><div className="settings-list">
              <div className="setting-row personalization-setting">
                <span className="setting-symbol">📖</span>
                <div className="personalization-content">
                  <strong>Paboritong Pananaw (Default View Mode)</strong>
                  <p>Piliin kung paano ipapakita ang iyong mga talaarawan kapag binuksan: Klasiko, Handcrafted Scrapbook, o Minimal na pagbabasa.</p>
                  <label htmlFor="viewmode-select">Default View</label>
                  <select
                    id="viewmode-select"
                    value={viewMode}
                    onChange={(event) => {
                      const m = event.target.value as ViewMode;
                      setViewMode(m);
                      saveViewMode(m);
                    }}
                  >
                    <option value="classic">Klasiko · Malinis at tradisyonal na pahina</option>
                    <option value="scrapbook">Scrapbook · Handcrafted may Polaroid, washi tape, at stickers (Inirerekomenda)</option>
                    <option value="minimal">Minimal · Tahimik at distraction-free na pagbabasa</option>
                  </select>
                </div>
                <span className="setting-tag">{viewMode.toUpperCase()}</span>
              </div>
              <div className="setting-row"><span className="setting-symbol">⌑</span><div><strong>Kandadong Kwaderno</strong><p>{optionalMode ? "Hindi naka-encrypt ang entries habang walang lock. Gumawa ng lock kung gusto mong protektahan ang diary gamit ang PIN." : "AES-GCM encryption gamit ang key na derived mula sa PIN. I-lock ang app kapag aalis ka."}</p></div><span className="setting-tag">{optionalMode ? "Walang lock" : "Aktibo"}</span></div><div className="setting-row personalization-setting"><span className="setting-symbol">◐</span><div className="personalization-content"><strong>Itsura at kulay</strong><p>Pumili ng mood ng papel at accent color. Naka-save lang ang preference sa browser na ito.</p><label htmlFor="theme-select">Theme</label><select id="theme-select" value={theme} onChange={(event) => setTheme(event.target.value)}><optgroup label="Liwanag / Light (Klasikong Papel)"><option value="sage">Sage · Klasikong Papel (Warm Ivory)</option><option value="rose">Rose · Soft Blush (Light)</option><option value="ocean">Ocean · Cool Blue (Light)</option><option value="lavender">Lavender · Gentle Lilac (Light)</option></optgroup><optgroup label="Gabi / Dark Mode"><option value="dark-sage">Sage · Forest Night (Dark)</option><option value="dark-rose">Rose · Midnight Blush (Dark)</option><option value="dark-ocean">Ocean · Deep Sea (Dark)</option><option value="dark-lavender">Lavender · Twilight (Dark)</option></optgroup></select><label htmlFor="font-size-select">Laki ng text</label><select id="font-size-select" value={fontSize} onChange={(event) => setFontSize(event.target.value)}><option value="small">Maliit</option><option value="medium">Katamtaman</option><option value="large">Malaki</option></select></div><span className="setting-tag">Personal</span></div><div className="setting-row personalization-setting"><span className="setting-symbol">✎</span><div className="personalization-content"><strong>Pang-araw-araw na writing prompt</strong><p>Magpakita ng maikling tanong sa Today page kapag kailangan mo ng panimulang ideya.</p><label className="prompt-toggle"><input type="checkbox" checked={dailyPromptEnabled} onChange={(event) => setDailyPromptEnabled(event.target.checked)} /><span>Ipakita ang daily prompt</span></label></div><span className="setting-tag">{dailyPromptEnabled ? "Aktibo" : "Naka-off"}</span></div><div className="setting-row backup-setting"><span className="setting-symbol">⇧</span><div className="backup-content"><strong>Backup at restore</strong><p>Gumawa ng encrypted backup file na protektado ng hiwalay na password. Gamitin ang parehong password para ma-restore sa device na ito o ibang device.</p><label htmlFor="backup-password">Backup password (minimum 8 characters)</label><input id="backup-password" type="password" autoComplete="new-password" value={backupPassword} onChange={(event) => setBackupPassword(event.target.value)} placeholder="Gumawa ng backup password" /><div className="backup-actions"><button className="primary-button" disabled={backupBusy || backupPassword.length < 8} onClick={() => { void (async () => { setBackupBusy(true); setError(''); try { const text = await exportBackup(backupPassword); const blob = new Blob([text], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `kwaderno-backup-${new Date().toISOString().slice(0, 10)}.kwaderno.json`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice('Na-download ang encrypted backup. Itago ito at tandaan ang backup password.'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Hindi nagawa ang backup.'); } finally { setBackupBusy(false); } })(); }}>{backupBusy ? 'Sandali…' : '↓ I-download ang backup'}</button><label className="primary-button backup-import-label">↑ I-restore ang backup<input type="file" accept=".json,.kwaderno.json,application/json" hidden disabled={backupBusy || backupPassword.length < 8} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (!file) return; if (file.size > 100 * 1024 * 1024) { setError('Lampas 100 MB ang backup file.'); return; } if (!window.confirm('I-restore ang entries mula sa backup? Ang kaparehong entries ay lalaktawan; walang existing entry na papalitan.')) return; void (async () => { setBackupBusy(true); setError(''); try { const result = await importBackup(await file.text(), backupPassword); await refreshEntries(); setNotice(`Tapos ang restore: ${result.imported} bagong pahina, ${result.skipped} kaparehong pahina ang nilaktawan.`); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Hindi na-restore ang backup.'); } finally { setBackupBusy(false); } })(); }} /></label></div><small>Ang backup file ay encrypted. Hindi kasama ang iyong diary PIN; gumawa ng backup password na iba rito. Kung mawala ang backup password, hindi mabubuksan ang file.</small></div><span className="setting-tag">Available</span></div></div></div>}
          </section>
        )}
        {error && <div className="toast error-toast" role="alert">{error}</div>}
        {notice && !editing && <div className="toast" role="status">{notice}</div>}
        <footer className="mobile-footer"><span className="status-dot" /> Iyong kwaderno, iyong oras.</footer>
      </main>
      {viewingImage && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Pinalaking larawan" onClick={() => setViewingImage(null)}><button type="button" aria-label="Isara ang larawan" onClick={() => setViewingImage(null)}>×</button><img src={viewingImage} alt="Pinalaking kalakip na larawan" onClick={(event) => event.stopPropagation()} /></div>}
      <nav className="mobile-nav" aria-label="Mobile navigation">{navItems.map((item) => <button key={item.id} type="button" className={page === item.id && !editing ? 'active' : ''} aria-current={page === item.id && !editing ? 'page' : undefined} onClick={() => leaveEditor(item.id)}><span aria-hidden="true">{item.icon}</span><small>{item.label}</small></button>)}</nav>
    </div>
  );
}

export default App;

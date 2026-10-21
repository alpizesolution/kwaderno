import { useCallback, useEffect, useState } from 'react';
import { deleteEntry, listEntries, saveEntry, type DiaryEntry } from './db';

type Page = 'today' | 'entries' | 'calendar' | 'settings';

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '☼' },
  { id: 'entries', label: 'Mga Pahina', icon: '▤' },
  { id: 'calendar', label: 'Kalendaryo', icon: '▦' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

const dateLabel = new Intl.DateTimeFormat('fil-PH', {
  weekday: 'long', month: 'long', day: 'numeric',
}).format(new Date());

function App() {
  const [page, setPage] = useState<Page>('today');
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [editingId, setEditingId] = useState<number | undefined>();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshEntries = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await listEntries());
      setError('');
    } catch {
      setError('Hindi mabuksan ang local diary storage sa device na ito. Subukang i-refresh ang app.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refreshEntries(); }, [refreshEntries]);

  const openEditor = (entry?: DiaryEntry) => {
    setEditingId(entry?.id);
    setTitle(entry?.title ?? '');
    setBody(entry?.body ?? '');
    setError('');
    setNotice('');
    setEditing(true);
  };

  const saveCurrentEntry = async () => {
    if ((!title.trim() && !body.trim()) || saving) return;
    setSaving(true);
    setError('');
    try {
      await saveEntry({ title, body }, editingId);
      await refreshEntries();
      setEditing(false);
      setNotice('Nakatago sa device na ito. Hindi pa naka-encrypt o naka-backup.');
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
    } catch {
      setError('Hindi natanggal ang pahina. Subukan ulit.');
    }
  };

  const renderEntry = (entry: DiaryEntry) => (
    <div className="entry-row" key={entry.id}>
      <button className="entry-preview" onClick={() => openEditor(entry)}>
        <span className="entry-date">{new Date(entry.updatedAt).toLocaleDateString('fil-PH', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()} · {new Date(entry.updatedAt).toLocaleTimeString('fil-PH', { hour: 'numeric', minute: '2-digit' })}</span>
        <strong>{entry.title || 'Walang pamagat'}</strong>
        <p>{entry.body}</p>
        <span className="entry-arrow">↗</span>
      </button>
      <button className="text-button delete-entry" onClick={() => entry.id !== undefined && void removeEntry(entry.id)}>Punitin ang Pahina</button>
    </div>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); setPage('today'); setEditing(false); }}>
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span><strong>kwaderno</strong><small>sarili mong pahina</small></span>
        </a>
        <div className="side-label">ANG IYONG KWADERNO</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => <button key={item.id} className={`nav-item ${page === item.id && !editing ? 'active' : ''}`} onClick={() => { setPage(item.id); setEditing(false); }}><span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}</button>)}
        </nav>
        <div className="sidebar-note"><span className="tiny-lock">⌑</span><p>Walang judgment.<br />Walang tsismis.<br /><em>Kwento mo lang.</em></p></div>
        <div className="sidebar-foot"><span className="status-dot" /> Local diary · device only</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><span /></span><strong>kwaderno</strong></div>
          <span className="date-top">{dateLabel}</span>
          <button className="avatar-button" aria-label="Open settings" onClick={() => { setPage('settings'); setEditing(false); }}>♡</button>
        </header>

        {editing ? (
          <section className="editor-wrap">
            <button className="back-link" onClick={() => { setEditing(false); setError(''); }}>← Bumalik sa pahina</button>
            <div className="editor-paper">
              <div className="paper-kicker">{editingId === undefined ? 'BAGONG PAHINA' : 'INE-EDIT NA PAHINA'} <span>·</span> {dateLabel.toUpperCase()}</div>
              <input className="title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bigyan ng pamagat (optional)" aria-label="Entry title" />
              <textarea className="body-input" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Blangko pa ang pahina. Ano'ng nasa isip mo?" aria-label="Diary entry" autoFocus />
              <div className="editor-bottom"><span className="local-note">⌑ Naka-save sa device kapag pinindot ang save</span><button className="primary-button" onClick={() => void saveCurrentEntry()} disabled={saving || (!title.trim() && !body.trim())}>{saving ? 'Sine-save…' : 'I-save ang pahina'} <span>↗</span></button></div>
            </div>
            <p className="prototype-note">Nasa device na ito ang mga pahina, pero hindi pa naka-encrypt o naka-backup. Mawawala ang mga ito kung mabura ang browser data o masira/m mawala ang device.</p>
          </section>
        ) : (
          <section className="page-content">
            {page === 'today' && <>
              <div className="greeting"><span className="eyebrow">ISANG SANDALI PARA SA SARILI</span><h1>Kamusta ang <em>puso</em> mo today?</h1><p>Hindi kailangang maayos ang lahat ng salita.<br className="desktop-break" /> Magsimula ka lang kung saan ka naroroon.</p></div>
              <div className="write-card"><div className="write-decoration" aria-hidden="true"><span className="sun-doodle">✳</span><span className="line-doodle">〰</span><span className="leaf-doodle">⌁</span></div><div className="write-card-content"><span className="eyebrow">ANG SUSUNOD MONG PAHINA</span><h2>May gusto ka bang<br />ilabas sa isip mo?</h2><p>Isulat mo lang. Walang kailangang patunayan.</p><button className="primary-button" onClick={() => openEditor()}>＋ Bagong Pahina</button></div><div className="paper-corner" aria-hidden="true" /></div>
              <div className="recent-section"><div className="section-heading"><div><span className="eyebrow">MGA SALITANG NAIWAN</span><h2>{entries.length ? 'Huling sinulat' : 'Wala pang naisusulat'}</h2></div><button className="text-button" onClick={() => setPage('entries')}>Tingnan lahat ↗</button></div>
                {loading ? <p className="empty-message">Binubuksan ang kwaderno…</p> : entries.length ? entries.slice(0, 3).map(renderEntry) : <div className="gentle-reminder"><span className="sparkle">✳</span><p>Hindi kailangang maging magandang araw para maging karapat-dapat ikwento.</p></div>}
              </div>
            </>}
            {page === 'entries' && <div className="simple-page"><span className="eyebrow">MGA NAITAGONG SALITA</span><h1>Mga <em>Pahina</em></h1>{loading ? <p className="empty-message">Binubuksan ang kwaderno…</p> : entries.length ? <div className="entries-list">{entries.map(renderEntry)}</div> : <div className="empty-paper"><span>✎</span><h2>Blangko pa ang pahina.</h2><p>Kapag handa ka na, nandito lang ang kwaderno mo.</p><button className="primary-button" onClick={() => openEditor()}>＋ Bagong Pahina</button></div>}</div>}
            {page === 'calendar' && <div className="simple-page"><span className="eyebrow">MGA ARAW NA DUMAAN</span><h1>Mga sandali, <em>unti-unti.</em></h1><div className="empty-paper"><span>☼</span><h2>May sariling oras ang bawat kwento.</h2><p>Ang calendar view ay susunod na idadagdag. Naka-save na muna ang mga pahina sa device na ito.</p></div></div>}
            {page === 'settings' && <div className="simple-page"><span className="eyebrow">SARILI MONG ESPASYO</span><h1>Mga <em>setting</em></h1><div className="settings-list"><div className="setting-row"><span className="setting-symbol">⌑</span><div><strong>Privacy at seguridad</strong><p>Local storage ay hindi encryption. Ang Kandadong Kwaderno ay susunod na phase.</p></div><span className="setting-tag">Paparating</span></div><div className="setting-row"><span className="setting-symbol">◐</span><div><strong>Itsura</strong><p>Warm paper · soft green</p></div><span className="setting-tag">Default</span></div><div className="setting-row"><span className="setting-symbol">⇧</span><div><strong>Backup at restore</strong><p>Hindi pa available. Itago ang browser data para hindi mawala ang entries.</p></div><span className="setting-tag">Paparating</span></div></div></div>}
          </section>
        )}
        {error && <div className="toast error-toast" role="alert">{error}</div>}
        {notice && !editing && <div className="toast" role="status">{notice}</div>}
        <footer className="mobile-footer"><span className="status-dot" /> Iyong kwaderno, iyong oras.</footer>
      </main>
      <nav className="mobile-nav" aria-label="Mobile navigation">{navItems.map((item) => <button key={item.id} className={page === item.id && !editing ? 'active' : ''} onClick={() => { setPage(item.id); setEditing(false); }}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav>
    </div>
  );
}

export default App;

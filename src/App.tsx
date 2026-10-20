import { useState } from 'react';

type Page = 'today' | 'entries' | 'calendar' | 'settings';

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '☼' },
  { id: 'entries', label: 'Mga Pahina', icon: '▤' },
  { id: 'calendar', label: 'Kalendaryo', icon: '▦' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

function App() {
  const [page, setPage] = useState<Page>('today');
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [draft, setDraft] = useState<{ title: string; body: string } | null>(null);
  const [savedInSession, setSavedInSession] = useState(false);

  const openEditor = () => {
    setTitle(draft?.title ?? '');
    setBody(draft?.body ?? '');
    setEditing(true);
  };

  const saveDraft = () => {
    if (!title.trim() && !body.trim()) return;
    setDraft({ title: title.trim(), body: body.trim() });
    setSavedInSession(true);
    setEditing(false);
  };

  const dateLabel = new Intl.DateTimeFormat('fil-PH', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); setPage('today'); setEditing(false); }}>
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span><strong>kwaderno</strong><small>sarili mong pahina</small></span>
        </a>
        <div className="side-label">ANG IYONG KWADERNO</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button key={item.id} className={`nav-item ${page === item.id && !editing ? 'active' : ''}`} onClick={() => { setPage(item.id); setEditing(false); }}>
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note"><span className="tiny-lock">⌑</span><p>Walang judgment.<br />Walang tsismis.<br /><em>Kwento mo lang.</em></p></div>
        <div className="sidebar-foot"><span className="status-dot" /> Offline-first diary</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><span /></span><strong>kwaderno</strong></div>
          <span className="date-top">{dateLabel}</span>
          <button className="avatar-button" aria-label="Open settings" onClick={() => { setPage('settings'); setEditing(false); }}>♡</button>
        </header>

        {editing ? (
          <section className="editor-wrap">
            <button className="back-link" onClick={() => setEditing(false)}>← Bumalik sa pahina</button>
            <div className="editor-paper">
              <div className="paper-kicker">BAGONG PAHINA <span>·</span> {dateLabel.toUpperCase()}</div>
              <input className="title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bigyan ng pamagat (optional)" aria-label="Entry title" />
              <textarea className="body-input" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Blangko pa ang pahina. Ano'ng nasa isip mo?" aria-label="Diary entry" autoFocus />
              <div className="editor-bottom"><span className="local-note">⌑ Nananatili lang sa session na ito</span><button className="primary-button" onClick={saveDraft} disabled={!title.trim() && !body.trim()}>I-save ang pahina <span>↗</span></button></div>
            </div>
            <p className="prototype-note">Prototype pa ito: hindi pa permanenteng nai-save o naka-encrypt ang mga isinulat. Huwag maglagay ng sensitibong impormasyon sa ngayon.</p>
          </section>
        ) : (
          <section className="page-content">
            {page === 'today' && <>
              <div className="greeting"><span className="eyebrow">ISANG SANDALI PARA SA SARILI</span><h1>Kamusta ang <em>puso</em> mo today?</h1><p>Hindi kailangang maayos ang lahat ng salita.<br className="desktop-break" /> Magsimula ka lang kung saan ka naroroon.</p></div>
              <div className="write-card"><div className="write-decoration" aria-hidden="true"><span className="sun-doodle">✳</span><span className="line-doodle">〰</span><span className="leaf-doodle">⌁</span></div><div className="write-card-content"><span className="eyebrow">ANG SUSUNOD MONG PAHINA</span><h2>May gusto ka bang<br />ilabas sa isip mo?</h2><p>Isulat mo lang. Walang kailangang patunayan.</p><button className="primary-button" onClick={openEditor}>＋ Bagong Pahina</button></div><div className="paper-corner" aria-hidden="true" /></div>
              {draft ? <div className="recent-section"><div className="section-heading"><div><span className="eyebrow">KASALUKUYANG SESSION</span><h2>Huling sinulat</h2></div><button className="text-button" onClick={() => setPage('entries')}>Tingnan lahat ↗</button></div><button className="entry-preview" onClick={openEditor}><span className="entry-date">NGAYON · {new Date().toLocaleTimeString('fil-PH', { hour: 'numeric', minute: '2-digit' })}</span><strong>{draft.title || 'Walang pamagat'}</strong><p>{draft.body}</p><span className="entry-arrow">↗</span></button></div> : <div className="gentle-reminder"><span className="sparkle">✳</span><p>Hindi kailangang maging magandang araw para maging karapat-dapat ikwento.</p></div>}
            </>}
            {page === 'entries' && <div className="simple-page"><span className="eyebrow">MGA NAITAGONG SALITA</span><h1>Mga <em>Pahina</em></h1>{draft ? <button className="entry-preview" onClick={openEditor}><span className="entry-date">NGAYON · SESSION DRAFT</span><strong>{draft.title || 'Walang pamagat'}</strong><p>{draft.body}</p></button> : <div className="empty-paper"><span>✎</span><h2>Blangko pa ang pahina.</h2><p>Kapag handa ka na, nandito lang ang kwaderno mo.</p><button className="primary-button" onClick={openEditor}>＋ Bagong Pahina</button></div>}</div>}
            {page === 'calendar' && <div className="simple-page"><span className="eyebrow">MGA ARAW NA DUMAAN</span><h1>Mga sandali, <em>unti-unti.</em></h1><div className="empty-paper"><span>☼</span><h2>May sariling oras ang bawat kwento.</h2><p>Lalabas dito ang mga araw na may naisulat ka, kapag handa na ang ligtas na local storage.</p></div></div>}
            {page === 'settings' && <div className="simple-page"><span className="eyebrow">SARILI MONG ESPASYO</span><h1>Mga <em>setting</em></h1><div className="settings-list"><div className="setting-row"><span className="setting-symbol">⌑</span><div><strong>Privacy at seguridad</strong><p>Ang encryption at Kandadong Kwaderno ay hindi pa naipapatupad.</p></div><span className="setting-tag">Paparating</span></div><div className="setting-row"><span className="setting-symbol">◐</span><div><strong>Itsura</strong><p>Warm paper · soft green</p></div><span className="setting-tag">Default</span></div><div className="setting-row"><span className="setting-symbol">⇧</span><div><strong>Backup at restore</strong><p>Idadagdag pagkatapos ng ligtas na storage.</p></div><span className="setting-tag">Paparating</span></div></div><p className="prototype-note">Hindi pa handa para sa tunay na diary entries. Ang kasalukuyang draft ay nasa memorya lang ng tab at mawawala kapag nag-refresh o nagsara ito.</p></div>}
          </section>
        )}
        <footer className="mobile-footer"><span className="status-dot" /> Iyong kwaderno, iyong oras.</footer>
      </main>
      <nav className="mobile-nav" aria-label="Mobile navigation">{navItems.map((item) => <button key={item.id} className={page === item.id && !editing ? 'active' : ''} onClick={() => { setPage(item.id); setEditing(false); }}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav>
      {savedInSession && !editing && <div className="toast" role="status">Naidagdag sa kasalukuyang session. Hindi pa permanenteng naka-save.</div>}
    </div>
  );
}

export default App;

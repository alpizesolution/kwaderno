import { useCallback, useEffect, useState } from 'react';
import { createVault, deleteEntry, getVaultFormatVersion, hasVault, listEntries, lockVault, saveEntry, unlockVault, type DiaryEntry } from './db';
import PwaStatus from './PwaStatus';

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
  const [vaultExists, setVaultExists] = useState<boolean | null>(null);
  const [vaultFormatVersion, setVaultFormatVersion] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [optionalMode, setOptionalMode] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [editingId, setEditingId] = useState<number | undefined>();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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

  const handleVaultSubmit = async () => {
    setError('');
    setNotice('');
    if (!vaultExists && !/^\d{6}$/.test(passphrase)) {
      setError('Gumamit ng eksaktong 6-digit PIN (numero lamang).');
      return;
    }
    if (!vaultExists && passphrase !== confirmPassphrase) {
      setError('Hindi magkapareho ang passphrase. Pakisuri at subukan ulit.');
      return;
    }
    setSaving(true);
    try {
      if (vaultExists) {
        await unlockVault(passphrase);
      } else {
        await createVault(passphrase);
        setNotice('Nagawa ang Kandadong Kwaderno. Ang mga dating pahina ay inililipat na sa encrypted storage.');
      }
      setPassphrase('');
      setConfirmPassphrase('');
      setUnlocked(true);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Hindi na-set up o na-unlock ang Kwaderno. Walang dapat hulaan—subukan ulit.');
    } finally {
      setSaving(false);
    }
  };

  const handleLock = () => {
    if (editing && (title.trim() || body.trim()) && !window.confirm('May hindi pa nai-save na pagbabago. I-lock at itapon ang mga pagbabagong ito?')) return;
    lockVault();
    setUnlocked(false);
    setEntries([]);
    setTitle('');
    setBody('');
    setEditingId(undefined);
    setEditing(false);
    setPassphrase('');
    setConfirmPassphrase('');
    setError('');
    setNotice('Naka-lock na ang Kandadong Kwaderno.');
  };

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
      setNotice('Nai-save sa device na ito. Wala pang backup.');
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

  if (initializing) {
    return <div className="vault-gate"><div className="vault-card"><span className="vault-mark">⌑</span><h1>Binubuksan ang <em>kwaderno…</em></h1><p>Inihahanda ang iyong local vault.</p></div></div>;
  }

  if (!unlocked && !optionalMode) {
    return (
      <main className="vault-gate">
        <section className="vault-card">
          <a className="brand vault-brand" href="#home"><span className="brand-mark"><span /></span><span><strong>kwaderno</strong><small>sarili mong pahina</small></span></a>
          <span className="vault-mark">⌑</span>
          <span className="eyebrow">KANDADONG KWADERNO</span>
          <h1>{vaultExists ? <>Bumalik sa iyong <em>pahina.</em></> : <>Isara ang mundo.<br />Buksan ang <em>sarili.</em></>}</h1>
          <p>{vaultExists ? vaultFormatVersion >= 2 ? 'Ilagay ang iyong 6-digit PIN para ma-decrypt at mabasa ang mga pahina sa device na ito.' : 'Ilagay ang iyong passphrase para ma-decrypt at mabasa ang mga pahina sa device na ito.' : 'Gumawa ng 6-digit PIN para i-encrypt ang iyong diary. Ang mga dati mong pahina ay ililipat muna sa encrypted storage.'}</p>
          <form onSubmit={(event) => { event.preventDefault(); void handleVaultSubmit(); }} className="vault-form">
            <label htmlFor="vault-passphrase">{vaultExists ? (vaultFormatVersion >= 2 ? 'Ilagay ang 6-digit PIN' : 'Dating passphrase') : 'Gumawa ng 6-digit PIN'}</label>
            <input id="vault-passphrase" type="password" inputMode={vaultExists && vaultFormatVersion < 2 ? 'text' : 'numeric'} pattern={vaultExists && vaultFormatVersion < 2 ? undefined : '[0-9]{6}'} maxLength={vaultExists && vaultFormatVersion < 2 ? undefined : 6} autoComplete={vaultExists ? 'current-password' : 'new-password'} value={passphrase} onChange={(event) => setPassphrase(vaultExists && vaultFormatVersion < 2 ? event.target.value : event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={vaultExists && vaultFormatVersion < 2 ? 'Ilagay ang dating passphrase' : '6 na numero'} minLength={vaultExists && vaultFormatVersion < 2 ? undefined : 6} required />
            {!vaultExists && <><label htmlFor="vault-confirm">Ulitin ang 6-digit PIN</label><input id="vault-confirm" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="new-password" value={confirmPassphrase} onChange={(event) => setConfirmPassphrase(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="I-type ulit ang 6 na numero" minLength={6} required /></>}
            {error && <p className="vault-error" role="alert">{error}</p>}
            <button className="primary-button vault-submit" type="submit" disabled={saving}>{saving ? 'Sandali lang…' : vaultExists ? 'I-unlock ang Kwaderno' : 'Gumawa ng Kandado'} <span>↗</span></button>
          </form>
          {!vaultExists && <button className="text-button" type="button" onClick={() => { setOptionalMode(true); setNotice('Nagpatuloy ka nang walang kandado. Hindi naka-encrypt ang mga pahina sa mode na ito.'); }}>Magpatuloy nang walang lock</button>}
          <div className="vault-warning"><strong>Mahalagang paalala</strong><p>Hindi namin mase-reset ang nakalimutang PIN o passphrase. Kapag nawala ito, hindi na mababasa ang encrypted entries. Ang 6-digit PIN ay mas madaling hulaan kaysa mahabang passphrase. Walang backup o recovery key sa ngayon.</p></div>
          <p className="vault-footnote">Nananatili sa browser at device na ito. Walang cloud sync.</p>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <PwaStatus />
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); setPage('today'); setEditing(false); }}>
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span><strong>kwaderno</strong><small>sarili mong pahina</small></span>
        </a>
        <div className="side-label">ANG IYONG KWADERNO</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => <button key={item.id} className={`nav-item ${page === item.id && !editing ? 'active' : ''}`} onClick={() => { setPage(item.id); setEditing(false); }}>{<span className="nav-icon" aria-hidden="true">{item.icon}</span>}{item.label}</button>)}
        </nav>
        <div className="sidebar-note"><span className="tiny-lock">⌑</span><p>Walang judgment.<br />Walang tsismis.<br /><em>Kwento mo lang.</em></p></div>
        <div className="sidebar-foot"><span className="status-dot" /> {optionalMode ? "Unencrypted · device only" : "Encrypted · device only"}</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><span /></span><strong>kwaderno</strong></div>
          <span className="date-top">{dateLabel}</span>
          <div className="topbar-actions"><button className="text-button lock-button" onClick={() => { if (optionalMode) { if (editing && (title.trim() || body.trim()) && !window.confirm("May hindi pa nai-save na pagbabago. Magpatuloy sa paggawa ng lock?")) return; setOptionalMode(false); setVaultExists(false); setEditing(false); setTitle(""); setBody(""); setEditingId(undefined); setPassphrase(""); setConfirmPassphrase(""); setError(""); } else { handleLock(); } }}>{optionalMode ? "⌑ Gumawa ng lock" : "⌑ I-lock"}</button><button className="avatar-button" aria-label="Open settings" onClick={() => { setPage('settings'); setEditing(false); }}>♡</button></div>
        </header>

        {editing ? (
          <section className="editor-wrap">
            <button className="back-link" onClick={() => { setEditing(false); setError(''); }}>← Bumalik sa pahina</button>
            <div className="editor-paper">
              <div className="paper-kicker">{editingId === undefined ? 'BAGONG PAHINA' : 'INE-EDIT NA PAHINA'} <span>·</span> {dateLabel.toUpperCase()}</div>
              <input className="title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bigyan ng pamagat (optional)" aria-label="Entry title" />
              <textarea className="body-input" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Blangko pa ang pahina. Ano'ng nasa isip mo?" aria-label="Diary entry" autoFocus />
              <div className="editor-bottom"><span className="local-note">{optionalMode ? "Hindi naka-encrypt ang pahina" : "⌑ Encrypted sa device kapag na-save"}</span><button className="primary-button" onClick={() => void saveCurrentEntry()} disabled={saving || (!title.trim() && !body.trim())}>{saving ? 'Sine-save…' : 'I-save ang pahina'} <span>↗</span></button></div>
            </div>
            <p className="prototype-note">{optionalMode ? "Walang lock ang mode na ito, kaya hindi naka-encrypt ang mga entry. Maaari kang gumawa ng lock sa itaas anumang oras." : "Ang laman ng entry ay naka-encrypt sa IndexedDB. Hindi pa encrypted ang lahat ng metadata at wala pang backup. Huwag kalimutan ang PIN o passphrase."}</p>
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
            {page === 'entries' && <div className="simple-page"><span className="eyebrow">MGA NAITAGONG SALITA</span><h1>Mga <em>Pahina</em></h1><div className="entry-tools"><label className="entry-search-label" htmlFor="entry-search">Hanapin sa iyong kwaderno</label><input id="entry-search" className="entry-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Maghanap ng salita o pamagat…" /><div className="entry-tools-bottom"><span>{searchQuery.trim() ? `Resulta: ${entries.filter((entry) => `${entry.title} ${entry.body}`.toLocaleLowerCase('fil-PH').includes(searchQuery.trim().toLocaleLowerCase('fil-PH'))).length}` : `${entries.length} ${entries.length === 1 ? 'pahina' : 'pahina'}`}</span><label htmlFor="entry-sort">Ayusin: <select id="entry-sort" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as 'newest' | 'oldest')}><option value="newest">Pinakabago</option><option value="oldest">Pinakaluma</option></select></label></div></div>{loading ? <p className="empty-message">Binubuksan ang kwaderno…</p> : entries.length ? (() => { const query = searchQuery.trim().toLocaleLowerCase('fil-PH'); const filtered = entries.filter((entry) => `${entry.title} ${entry.body}`.toLocaleLowerCase('fil-PH').includes(query)).sort((a, b) => { const difference = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); return sortOrder === 'newest' ? -difference : difference; }); return filtered.length ? <div className="entries-list">{filtered.map(renderEntry)}</div> : <div className="empty-paper search-empty"><span>⌕</span><h2>Walang tugmang pahina.</h2><p>Subukan ang ibang salita o burahin ang hinahanap mo.</p><button className="text-button" onClick={() => setSearchQuery('')}>Burahin ang paghahanap</button></div>; })() : <div className="empty-paper"><span>✎</span><h2>Blangko pa ang pahina.</h2><p>Kapag handa ka na, nandito lang ang kwaderno mo.</p><button className="primary-button" onClick={() => openEditor()}>＋ Bagong Pahina</button></div>}</div>}
            {page === 'calendar' && <div className="simple-page"><span className="eyebrow">MGA ARAW NA DUMAAN</span><h1>Mga sandali, <em>unti-unti.</em></h1><div className="empty-paper"><span>☼</span><h2>May sariling oras ang bawat kwento.</h2><p>Ang calendar view ay susunod na idadagdag. Naka-encrypt ang mga pahina sa device na ito.</p></div></div>}
            {page === 'settings' && <div className="simple-page"><span className="eyebrow">SARILI MONG ESPASYO</span><h1>Mga <em>setting</em></h1><div className="settings-list"><div className="setting-row"><span className="setting-symbol">⌑</span><div><strong>Kandadong Kwaderno</strong><p>{optionalMode ? "Hindi naka-encrypt ang entries habang walang lock. Gumawa ng lock kung gusto mong protektahan ang diary gamit ang PIN." : "AES-GCM encryption gamit ang key na derived mula sa PIN o passphrase. I-lock ang app kapag aalis ka."}</p></div><span className="setting-tag">{optionalMode ? "Walang lock" : "Aktibo"}</span></div><div className="setting-row"><span className="setting-symbol">◐</span><div><strong>Itsura</strong><p>Warm paper · soft green</p></div><span className="setting-tag">Default</span></div><div className="setting-row"><span className="setting-symbol">⇧</span><div><strong>Backup at restore</strong><p>Hindi pa available. Kapag nawala ang browser data o device, maaaring mawala ang entries.</p></div><span className="setting-tag">Paparating</span></div></div></div>}
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

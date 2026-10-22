import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches;
}

function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function PwaStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [standalone, setStandalone] = useState(isStandalone);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const iosDevice = isIOSDevice();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    const updateDisplayMode = () => setStandalone(isStandalone());
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setStandalone(true);
      setInstallPrompt(null);
      setShowInstallHelp(false);
    };
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    const displayMode = window.matchMedia('(display-mode: standalone)');
    displayMode.addEventListener?.('change', updateDisplayMode);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      displayMode.removeEventListener?.('change', updateDisplayMode);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) {
      setShowInstallHelp(true);
      return;
    }
    setInstalling(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstallPrompt(null);
    } catch {
      setShowInstallHelp(true);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      {!online && (
        <div className="pwa-status pwa-offline" role="status">
          <span aria-hidden="true">●</span>
          <span><strong>Offline ka ngayon.</strong> Patuloy mong magagamit ang mga pahinang naka-save sa device na ito.</span>
        </div>
      )}
      {online && offlineReady && (
        <div className="pwa-status" role="status">
          <span>Handa na ang Kwadernoko para sa offline use.</span>
          <button onClick={() => setOfflineReady(false)} aria-label="Isara ang offline notification">×</button>
        </div>
      )}
      {needRefresh && (
        <div className="pwa-status pwa-update" role="status">
          <span>May bagong bersyon ng Kwadernoko.</span>
          <button onClick={() => void updateServiceWorker(true)}>I-update</button>
          <button onClick={() => setNeedRefresh(false)} aria-label="Mamaya na">×</button>
        </div>
      )}
      {!standalone && (installPrompt || iosDevice) && (
        <button className="pwa-install" onClick={() => void installApp()} disabled={installing}>
          {installing ? 'Ini-install…' : installPrompt ? 'I-install ang Kwadernoko' : 'Paano i-install?'}
        </button>
      )}
      {showInstallHelp && (
        <div className="pwa-help-backdrop" role="presentation" onClick={() => setShowInstallHelp(false)}>
          <section className="pwa-help-card" role="dialog" aria-modal="true" aria-labelledby="pwa-help-title" onClick={(event) => event.stopPropagation()}>
            <button className="pwa-help-close" type="button" onClick={() => setShowInstallHelp(false)} aria-label="Isara ang gabay">×</button>
            <span className="eyebrow">KWADERNOKO SA IYONG DEVICE</span>
            <h2 id="pwa-help-title">Idagdag sa Home Screen</h2>
            {iosDevice ? (
              <ol>
                <li>Buksan ang Kwadernoko sa <strong>Safari</strong>.</li>
                <li>I-tap ang <strong>Share</strong> na icon.</li>
                <li>Piliin ang <strong>Add to Home Screen</strong>, pagkatapos ay i-tap ang <strong>Add</strong>.</li>
              </ol>
            ) : (
              <p>Buksan ang menu ng browser at piliin ang <strong>Install app</strong> o <strong>Add to Home screen</strong>, kung available.</p>
            )}
            <p className="pwa-help-note">Hindi kailangang mag-install para magamit ang Kwadernoko. Kapag na-install, mas madali itong buksan mula sa Home Screen.</p>
            <button className="primary-button" type="button" onClick={() => setShowInstallHelp(false)}>Naiintindihan ko</button>
          </section>
        </div>
      )}
    </>
  );
}

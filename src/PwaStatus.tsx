import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function PwaStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    setInstalling(true);
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } finally {
      setInstallPrompt(null);
      setInstalling(false);
    }
  };

  return (
    <>
      {!online && (
        <div className="pwa-status pwa-offline" role="status">
          <span aria-hidden="true">●</span> Offline ka ngayon. Sa device na ito lang mase-save ang mga pahina.
        </div>
      )}
      {online && offlineReady && (
        <div className="pwa-status" role="status">
          Handa na ang Kwaderno para sa offline use.
          <button onClick={() => setOfflineReady(false)} aria-label="Isara ang offline notification">×</button>
        </div>
      )}
      {needRefresh && (
        <div className="pwa-status pwa-update" role="status">
          May bagong bersyon ng Kwaderno.
          <button onClick={() => void updateServiceWorker(true)}>I-update</button>
          <button onClick={() => setNeedRefresh(false)} aria-label="Mamaya na">×</button>
        </div>
      )}
      {installPrompt && (
        <button className="pwa-install" onClick={() => void installApp()} disabled={installing}>
          {installing ? 'Ini-install…' : 'I-install ang Kwaderno'}
        </button>
      )}
    </>
  );
}

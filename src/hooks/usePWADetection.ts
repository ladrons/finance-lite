import { useState, useEffect } from 'react';

export interface PWADetectionResult {
  isPWA: boolean;
  isStandalone: boolean;
  isInstallable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  canInstall: boolean;
  detectionMethod: 'standalone' | 'utm_source' | 'matchMedia' | 'userAgent' | 'none';
  isLoading: boolean;
}

// BeforeInstallPromptEvent tipini tanımlayalım
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function usePWADetection(): PWADetectionResult {
  const [isPWA, setIsPWA] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [detectionMethod, setDetectionMethod] = useState<PWADetectionResult['detectionMethod']>('none');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function detectPWA(): { isPWA: boolean; method: PWADetectionResult['detectionMethod'] } {
      // Yöntem 1: Display mode standalone kontrolü (En güvenilir)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsStandalone(true);
        return { isPWA: true, method: 'standalone' };
      }

      // Yöntem 2: Navigator standalone (iOS Safari)
      if ((window.navigator as any).standalone === true) {
        setIsStandalone(true);
        return { isPWA: true, method: 'standalone' };
      }

      // Yöntem 3: UTM source parameter (PWA yükleme sonrası)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('utm_source') === 'pwa-install') {
        return { isPWA: true, method: 'utm_source' };
      }

      // Yöntem 4: Match Media fallback
      if (window.matchMedia('(display-mode: minimal-ui)').matches || 
          window.matchMedia('(display-mode: fullscreen)').matches) {
        return { isPWA: true, method: 'matchMedia' };
      }

      // Yöntem 5: User Agent kontrolü (son çare) - Çok spesifik durumlar
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes('wv')) { // Sadece WebView
        return { isPWA: true, method: 'userAgent' };
      }
      
      // Chrome kontrolünü kaldırdık - çünkü normal Chrome tarayıcısını PWA olarak tespit ediyordu

      return { isPWA: false, method: 'none' };
    }

    const detection = detectPWA();
    setIsPWA(detection.isPWA);
    setDetectionMethod(detection.method);
    setIsLoading(false); // Detection tamamlandı

    // PWA yükleme prompt'unu yakala
    function handleBeforeInstallPrompt(e: BeforeInstallPromptEvent) {
      e.preventDefault(); // Otomatik prompt'u engelle
      setInstallPrompt(e);
      setIsInstallable(true);
    }

    // PWA yüklendiğinde prompt'u temizle
    function handleAppInstalled() {
      setInstallPrompt(null);
      setIsInstallable(false);
      // Yeniden tespit et
      const newDetection = detectPWA();
      setIsPWA(newDetection.isPWA);
      setDetectionMethod(newDetection.method);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Display mode değişikliklerini dinle
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    function handleDisplayModeChange(e: MediaQueryListEvent) {
      setIsStandalone(e.matches);
      if (e.matches) {
        setIsPWA(true);
        setDetectionMethod('standalone');
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      // Eski tarayıcılar için
      (mediaQuery as any).addListener(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else {
        (mediaQuery as any).removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  const canInstall = isInstallable && installPrompt !== null;

  return {
    isPWA,
    isStandalone,
    isInstallable,
    installPrompt,
    canInstall,
    detectionMethod,
    isLoading
  };
}
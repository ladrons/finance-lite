import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePWADetection } from '../hooks/usePWADetection';

interface PWAGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  showDebugInfo?: boolean;
}

export default function PWAGuard({ 
  children, 
  fallback, 
  redirectTo = '/',
  showDebugInfo = false 
}: PWAGuardProps) {
  const pwaDetection = usePWADetection();

  // Debug bilgilerini göster (development için)
  if (showDebugInfo) {
    console.log('PWA Detection Result:', pwaDetection);
  }

  // PWA olarak çalışıyorsa içeriği göster
  if (pwaDetection.isPWA) {
    return <>{children}</>;
  }

  // Fallback componenti varsa onu göster
  if (fallback) {
    return <>{fallback}</>;
  }

  // Yoksa belirtilen route'a yönlendir
  return <Navigate to={redirectTo} replace />;
}

// PWA Status indicator componenti (debug için)
export function PWAStatusIndicator() {
  const pwaDetection = usePWADetection();

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: pwaDetection.isPWA ? '#10b981' : '#f59e0b',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      zIndex: 9999,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      {pwaDetection.isPWA ? '✅ PWA' : '🌐 Browser'}
      <div style={{ fontSize: '10px', opacity: 0.8 }}>
        {pwaDetection.detectionMethod}
      </div>
    </div>
  );
}
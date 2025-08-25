import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import FinanceApp from '../pages/FinanceApp';
import PWAGuard from '../components/PWAGuard';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/app" 
          element={
            <PWAGuard 
              showDebugInfo={process.env.NODE_ENV === 'development'}
              fallback={
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  minHeight: '100vh',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <h2>⚠️ PWA Gerekli</h2>
                  <p>Bu sayfa sadece PWA olarak yüklendiğinde erişilebilir.</p>
                  <p>Ana sayfadan uygulamayı yükleyip tekrar deneyin.</p>
                  <button 
                    onClick={() => window.location.href = '/'}
                    style={{
                      background: 'var(--ok)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginTop: '20px'
                    }}
                  >
                    Ana Sayfaya Dön
                  </button>
                </div>
              }
            >
              <FinanceApp />
            </PWAGuard>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FinanceApp from '../pages/FinanceApp';

function LandingPage() {
  return (
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
      <h1>Finance Lite</h1>
      <p>Kişisel Finans Takip Uygulaması</p>
      <p style={{ marginTop: '20px', fontSize: '14px', color: 'var(--muted)' }}>
        Bu geçici Landing Page'dir. PWA yükleme özelliği Phase 2'de eklenecek.
      </p>
      <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '10px' }}>
        Test için: <a href="/app" style={{ color: 'var(--ok)' }}>/app</a> adresini ziyaret edin
      </p>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<FinanceApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
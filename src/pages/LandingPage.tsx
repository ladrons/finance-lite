import { usePWADetection } from '../hooks/usePWADetection';

export default function LandingPage() {
  const { isPWA, canInstall, installPrompt, detectionMethod } = usePWADetection();

  const handleInstallPWA = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choiceResult = await installPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA installation accepted');
        } else {
          console.log('PWA installation dismissed');
        }
      } catch (error) {
        console.error('PWA installation error:', error);
      }
    }
  };

  // Eğer zaten PWA olarak çalışıyorsa /app'e yönlendir
  if (isPWA) {
    window.location.href = '/app';
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
        <p>PWA tespit edildi, yönlendiriliyor...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'var(--bg)',
      color: 'var(--text)',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Debug Info - sadece development için */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          PWA: {isPWA ? '✅' : '❌'} | Install: {canInstall ? '✅' : '❌'} | Method: {detectionMethod}
        </div>
      )}

      {/* Hero Section */}
      <section style={{
        padding: '80px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            margin: '0 auto 24px'
          }}>
            💰
          </div>
          
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: '700', 
            margin: '0 0 24px 0',
            lineHeight: '1.2'
          }}>
            Finance Lite
          </h1>
          
          <p style={{ 
            fontSize: '1.25rem', 
            margin: '0 0 40px 0',
            opacity: 0.9,
            lineHeight: '1.6'
          }}>
            Aylık gelir ve giderlerinizi kolayca takip eden<br />
            <strong>Progressive Web App</strong> uygulaması
          </p>

          {/* Install Button */}
          {canInstall ? (
            <button 
              onClick={handleInstallPWA}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              📱 Uygulamayı Yükle
            </button>
          ) : (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '16px 24px',
              borderRadius: '12px',
              display: 'inline-block'
            }}>
              <p style={{ margin: '0', fontSize: '16px' }}>
                🌐 <strong>Chrome veya Edge</strong> tarayıcısından<br />
                PWA yükleme özelliğini kullanabilirsiniz
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 20px', background: 'var(--panel)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2.5rem', 
            marginBottom: '60px',
            color: 'var(--text)'
          }}>
            ✨ Özellikler
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '40px' 
          }}>
            {[
              {
                icon: '💰',
                title: 'Gelir & Gider Takibi',
                description: 'Sabit giderler, kredi kartı harcamaları ve değişken giderlerinizi kategorize edin'
              },
              {
                icon: '📁',
                title: 'Dosya Sistemi Entegrasyonu',
                description: 'File System Access API ile verilerinizi bilgisayarınızda istediğiniz klasöre kaydedin'
              },
              {
                icon: '📱',
                title: 'PWA Desteği',
                description: 'Offline çalışma, otomatik güncelleme ve native uygulama deneyimi'
              },
              {
                icon: '📊',
                title: 'Aylık Raporlama',
                description: 'Net bakiye hesaplama ve detaylı aylık finansal özet'
              },
              {
                icon: '🔒',
                title: 'Gizlilik',
                description: 'Verileriniz tamamen yerel olarak saklanır, hiçbir sunucuya gönderilmez'
              },
              {
                icon: '⌨️',
                title: 'Klavye Kısayolları',
                description: 'Hızlı erişim için Ctrl+S kaydet, Ctrl+H header gibi kısayollar'
              }
            ].map((feature, index) => (
              <div key={index} style={{
                background: 'var(--panel-2)',
                padding: '30px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                  {feature.icon}
                </div>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  marginBottom: '16px',
                  color: 'var(--text)'
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  color: 'var(--muted)', 
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Install Section */}
      <section style={{ padding: '80px 20px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '40px',
            color: 'var(--text)'
          }}>
            🚀 Nasıl Yüklenir?
          </h2>
          
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'left'
          }}>
            <ol style={{ 
              fontSize: '18px', 
              lineHeight: '1.8',
              color: 'var(--text)',
              paddingLeft: '20px'
            }}>
              <li style={{ marginBottom: '16px' }}>
                <strong>Chrome veya Edge</strong> tarayıcısı ile bu sayfayı açın
              </li>
              <li style={{ marginBottom: '16px' }}>
                Adres çubuğunda <strong>"Yükle"</strong> ikonu belirecek
              </li>
              <li style={{ marginBottom: '16px' }}>
                <strong>"Uygulamayı Yükle"</strong> butonuna tıklayın
              </li>
              <li style={{ marginBottom: '16px' }}>
                Uygulama masaüstünüze yüklenecek ve <strong>offline çalışacak</strong>
              </li>
            </ol>

            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '24px'
            }}>
              <p style={{ 
                margin: 0, 
                color: '#10b981', 
                fontWeight: '600' 
              }}>
                💡 PWA yüklendikten sonra bu uygulama otomatik olarak finans uygulamasına yönlendirecek!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 20px',
        textAlign: 'center',
        background: 'var(--panel-2)',
        borderTop: '1px solid var(--border)'
      }}>
        <p style={{ 
          color: 'var(--muted)', 
          margin: 0,
          fontSize: '14px'
        }}>
          Finance Lite - Kişisel Finans Takip PWA
        </p>
      </footer>
    </div>
  );
}
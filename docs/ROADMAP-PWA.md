# Finance Lite – PWA + File System Access Roadmap

Bu belge, mevcut web uygulamasını PWA (offline + installable) haline getirip Windows/Chromium üzerinde yerel klasöre okuma/yazma (File System Access API) yeteneği eklemek için adımları içerir.

## 0) Kapsam ve Hedefler
- Kullanıcı uygulamayı masaüstü gibi “Yükle”yip offline kullanabilsin.
- Veriler seçilen klasöre otomatik `YYYY-MM.json` şeklinde yazılsın/okunsun.
- Fallback: Klasör seçilmemişse mevcut `localStorage` akışı çalışmaya devam etsin.

Başlangıç platform odağı: Windows + Chromium tarayıcıları (Chrome/Edge). Diğer tarayıcılarda FSA desteklenmiyorsa otomatik fallback uygulanır.

## 1) PWA Etkinleştirme (offline + installable)
- Paket: `vite-plugin-pwa` (devDependency)
- Dosyalar:
  - `vite.config.ts` → `VitePWA` plugin ekle, manifest tanımla, workbox önbellekleme stratejisi.
  - `public/icons/` → en az `icon-192.png`, `icon-512.png` (maskable varyant tercih edilir).
  - `src/main.tsx` → service worker kaydı (`virtual:pwa-register`).

Örnek (yükleme sonrası):
```bash
npm i -D vite-plugin-pwa
```

Kabul Kriterleri:
- Chrome/Edge “Yükle (Install)” önerisini verir.
- Online ilk açılıştan sonra offline durumunda da uygulama açılır (asset’ler cache’lenmiş).

## 2) File System Access (FSA) ile Klasöre Yaz/Oku
- UI: Header’a “Klasör Bağla” butonu ekle (`showDirectoryPicker()`).
- İzin: `await dirHandle.requestPermission({ mode: "readwrite" })` kontrolü.
- Kaydetme: `saveChanges()` içinde eğer `dirHandle` mevcutsa `<YYYY-MM>.json` dosyasına yaz, yoksa `localStorage`’a yaz.
- Yükleme: Ay değiştiğinde seçili klasörde dosya var mı bak; varsa onu yükle; yoksa `localStorage`/build-time veriye fallback.
- Persist (opsiyonel, bir sonraki aşama): `dirHandle`’ı IndexedDB’de sakla (Chrome destekler), açılışta geri yükle.

Kabul Kriterleri:
- “Klasör Bağla” ile seçilen klasöre `2025-08.json` yazılır/okunur.
- İzin reddinde uygulama çalışmaya devam eder (localStorage fallback).

## 3) Klavye Kısayolları ve Arama
- Kısayollar:
  - Ctrl+S → `saveChanges()`
  - Ctrl+E → `exportCurrentMonth()`
  - Ctrl+F → arama kutusuna fokus
- Arama/Filtre:
  - Header’a küçük bir arama inputu.
  - `List`’e gönderilen dizi `title.includes(query)` ile filtrelenir.

Kabul Kriterleri:
- Kısayollar tüm listelerde çalışır.
- Arama girdisine göre liste anında filtrelenir.

## 4) PWA Cilaları
- Manifest zenginleştirme: `lang`, `description`, `screenshots`, `categories`.
- Güncelleme akışı: `virtual:pwa-register` ile “Yeni sürüm hazır — Yenile” bildirimi.
- Lighthouse denetimi: PWA skorunun “Installable” olarak yeşil olması.

## 5) (Opsiyonel) Klasör İznini Kalıcılaştırma
- `idb-keyval` gibi ufak bir yardımcıyla `dirHandle`’ı IndexedDB’ye yaz.
- Açılışta IDB’den geri getir; gerekli ise izin iste.

Kabul Kriterleri:
- Uygulama yeniden açıldığında klasör izni tekrar sorulmadan kayıt/okuma yapılabilir (tarayıcı izin politikalarına tabi).

## 6) QA ve Dokümantasyon
- Test Senaryoları:
  - İlk yükleme (online), sonrasında offline erişim.
  - Klasör bağlama, izin reddi/kabulü, dosya yazma/okuma.
  - Ay değiştirme, dosya bulunamadığında fallback.
  - Kısayollar ve arama.
- Dokümantasyon:
  - `README.md` içine kısa kullanım notu ve `docs/` bağlantısı.
  - Klasör bağlama adımlarının ekran görüntüsü (isteğe bağlı).

## Dosya Bazlı Değişiklik Listesi
- `package.json`: devDependencies → `vite-plugin-pwa`
- `vite.config.ts`: `VitePWA({ registerType: "autoUpdate", manifest: { ... }, workbox: { ... } })`
- `public/icons/`: `icon-192.png`, `icon-512.png` (+ `maskable` ikonlar önerilir)
- `src/main.tsx`: `registerSW({ immediate: true })`
- `src/App.tsx`:
  - “Klasör Bağla” butonu + `dirHandle` state
  - FSA entegrasyonu: kaydetme/yükleme
  - Kısayol dinleyicileri + arama inputu

## Zamanlama (Tahmini)
- PWA temel kurulum: 30–45 dk
- FSA (session bazlı): 45–60 dk
- Kısayol + arama: 30 dk
- Cilalar + test: 30–60 dk
Toplam: ~2.5–3.5 saat

## Riskler ve Notlar
- FSA desteği Safari/Firefox’ta kısıtlıdır. Hedef Windows/Chromium olduğu için sorun teşkil etmez; fallback mevcuttur.
- IndexedDB ile handle saklama tarayıcı izin politikalarına bağlıdır; her zaman sorunsuz olmayabilir.

## “Bitti” Tanımı (DoD)
- Uygulama PWA olarak yüklenebilir ve offline açılır.
- “Klasör Bağla” ile seçilen klasöre ay dosyaları yazılır/okunur.
- Kısayollar ve arama çalışır.
- README güncellidir, Lighthouse PWA skoru yüksek, temel QA senaryoları geçmiştir.

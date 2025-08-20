# Finance Lite - Aylık Finans Takip Uygulaması

![Finance Lite Screenshot](https://via.placeholder.com/800x400?text=Finance+Lite+Screenshot)

Finance Lite, aylık gelir ve giderlerinizi kolayca takip etmenizi sağlayan basit bir web uygulamasıdır. React ve TypeScript ile geliştirilmiş olup, Vite ile hızlı bir geliştirme deneyimi sunar.

> **Önemli Not:** Bu uygulama kişisel kullanım için geliştirilmiştir. Diğer kişiler de isterlerse kullanabilir, ancak herhangi bir geliştirme veya destek süreci desteklenmemektedir.

## Özellikler

- 💰 Gelir takibi
- 💸 Sabit gider takibi
- 💳 Kredi kartı harcamaları takibi
- 📦 Değişken gider takibi
- 📊 Aylık özet ve net bakiye hesaplama
- 📅 Ay bazlı veri yönetimi
- 📤 Verileri JSON formatında dışa aktarma

## Kurulum

### Gereksinimler

- Node.js (v16 veya üzeri)
- npm veya yarn

### Adımlar

1. Repoyu klonlayın:

```bash
git clone https://github.com/kullaniciadi/finance-lite.git
cd finance-lite
```

2. Bağımlılıkları yükleyin:

```bash
npm install
# veya
yarn install
```

3. Geliştirme sunucusunu başlatın:

```bash
npm run dev
# veya
yarn dev
```

4. Tarayıcınızda [http://localhost:5173](http://localhost:5173) adresini açın.

## Veri Yapısı

Uygulama, verileri tarayıcının localStorage'ında saklar. Ayrıca, `src/data/` klasöründe örnek veri dosyaları bulunabilir. Bu dosyalar aşağıdaki formatta olmalıdır:

**Önemli:** Tarayıcı güvenlik kısıtlamaları nedeniyle, "Kaydet" butonuna bastığınızda veriler sadece tarayıcının localStorage'ına kaydedilir, `src/data` klasörüne otomatik olarak JSON dosyası oluşturulmaz. Eğer verileri JSON dosyası olarak kaydetmek istiyorsanız, "Bu Ayı Dışa Aktar" butonunu kullanarak indirdiğiniz JSON dosyasını manuel olarak `src/data` klasörüne koyabilirsiniz.

```json
{
  "month": "YYYY-MM",
  "entries": [
    {
      "id": "unique-id",
      "type": "income|fixed|card|variable",
      "title": "Açıklama",
      "amount": 1000,
      "date": "YYYY-MM-DD",
      "createdAt": 1754000000000
    }
  ]
}
```

## Dağıtım

Uygulamayı derlemek için:

```bash
npm run build
# veya
yarn build
```

Derlenen dosyalar `dist/` klasöründe oluşturulacaktır. Bu dosyaları herhangi bir statik web sunucusunda barındırabilirsiniz.

## Teknolojiler

- [React](https://reactjs.org/) - UI kütüphanesi
- [TypeScript](https://www.typescriptlang.org/) - Tip güvenliği
- [Vite](https://vitejs.dev/) - Geliştirme ortamı ve derleme aracı
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) - Veri saklama

## Lisans

MIT

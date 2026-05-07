# Selçuk Peköz Yayın Arşivi

Selçuk Peköz'ün YouTube canlı yayınlarını takip eden resmi olmayan fan projesi.
Stack: Next.js 16 (App Router) + Tailwind v4 + TypeScript.

## Geliştirme

```bash
npm install
npm run dev
```

http://localhost:3000 adresini aç.

İlk açılışta `data/streams.json` yoksa **mock veri** gösterilir (sabit "şimdi" =
7 Mayıs 2026, sahte yayınlar). Gerçek veri için aşağıdaki sync adımlarını izle.

## Gerçek YouTube verisine geçiş

### 1. API key

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) →
**APIs & Services** → **Credentials** → **Create credentials** → **API key**.

Sonra **YouTube Data API v3**'ü etkinleştir:
**Library** → "YouTube Data API v3" → **Enable**.

### 2. .env.local

`.env.example`'ı kopyala:

```bash
cp .env.example .env.local
```

`YOUTUBE_API_KEY=...` satırına az önceki anahtarı yapıştır.

### 3. Sync

```bash
npm run sync
```

Bu script:
1. `@SelçukPeköz` handle'ını channel ID'ye çözer (ilk çalıştırmada),
   `data/channel.json`'a cache'ler.
2. `search.list` ile upcoming/live/completed yayın id'lerini çeker (3 çağrı).
3. `videos.list` ile her id'i zenginleştirir (başlık, açıklama, thumbnail, süre,
   izlenme, gerçek başlangıç/bitiş zamanları).
4. Bölüm numaralarını eskiden yeniye atar.
5. `data/streams.json`'a yazar.

Kota: ~300 unit/sync. Günlük limit 10.000 — saatte bir senkron rahat sığar.

### 4. Tarayıcı

Sayfaları yenile. Mock yerine gerçek yayınlar görünür.

## Proje yapısı

```
app/
  page.tsx              Anasayfa (hero + countdown + grid)
  takvim/page.tsx       Aylık takvim (mobile = ajanda)
  arsiv/                Arşiv (server data + client filter)
  y/[videoId]/page.tsx  Yayın detayı
components/             Thumb, MCard, Countdown, Nav, Footer, Icon
lib/
  types.ts              Stream tipi
  fmt.ts                Tarih/sayı formatlayıcılar (TR)
  calendar.ts           buildMonthGrid
  mock-data.ts          Sahte veri (data/streams.json yoksa fallback)
  streams.ts            Veri katmanı — mock veya JSON
  youtube.ts            YouTube Data API client
scripts/sync.ts         npm run sync
data/                   streams.json + channel.json (sync sonrası)
```

## Bilinen v0/v1 sınırları

- "Takvime ekle", "iCal aboneliği", "Paylaş", "Kopyala" butonları görsel —
  henüz işlevsiz.
- Calendar'da "Hafta" / "Ajanda" sekmeleri client-side seçilemez.
- Arşivde "Yıl/Sıralama" desktop chip'leri görsel.
- Sync manuel — cron yok (v2'de Vercel Cron / Cloudflare Workers Cron).

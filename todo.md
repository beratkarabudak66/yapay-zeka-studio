# Yapay Zeka Stüdyo — TODO

## Veritabanı & Backend
- [x] uploads tablosu: dosya yüklemelerini kaydet (userId, fileName, fileKey, fileType, toolType)
- [x] outputs tablosu: üretilen çıktıları kaydet (uploadId, outputKey, outputUrl, toolType, metadata)
- [x] Drizzle şeması güncelle ve migrasyon uygula
- [x] server/routers/tools.ts — sunum iyileştirme + görsel üretimi
- [x] server/routers/tools.ts — logo üretimi (AI image generation)
- [x] server/routers/tools.ts — ses transkripsiyon + analiz
- [x] server/routers/tools.ts — video analiz + altyazı önerisi
- [x] server/routers/tools.ts — kod üretimi, açıklama, hata düzeltme
- [x] Dosya upload endpoint'i (base64 → S3)

## Ana Sayfa
- [x] Global CSS teması: beyaz bg, soft mavi/gri aksan, Inter font
- [x] Navbar: logo + araç linkleri + giriş butonu
- [x] Hero bölümü: başlık, alt başlık, CTA butonu
- [x] Araç kartları grid: 5 araç, ikon, açıklama, "Kullan" butonu
- [x] Footer

## Sunum Aracı (/presentation)
- [x] PDF veya metin yükleme alanı
- [x] AI ile yapı/tasarım iyileştirme (LLM)
- [x] Prompt ile görsel üretme (image generation)
- [x] Sonuç önizleme ve metin indirme

## Logo Üreteci (/logo)
- [x] Marka/okul adı giriş formu
- [x] Stil seçimi: modern, temiz, eğitimsel, kurumsal
- [x] Prompt desteği ile AI logo üretimi
- [x] PNG indirme butonu

## Ses Değiştirici (/voice)
- [x] Ses/video dosyası yükleme
- [x] Ses tonu seçimi: doğal, derin, hızlı, sinematik
- [x] Whisper ile transkripsiyon + içerik analizi
- [x] Transkripsiyon indirme

## Video İyileştirici (/video)
- [x] Video dosyası yükleme
- [x] İşlem öncesi öneri ekranı (3 adımlı akış)
- [x] AI ile kalite önerileri (parlaklık, netlik, stabilizasyon)
- [x] Whisper ile transkripsiyon + altyazı üretimi
- [x] Altyazı dosyası indirme (.srt)

## Kodlama Asistanı (/coding)
- [x] Dil seçimi: HTML, CSS, JS, Python
- [x] Prompt ile kod üretimi (LLM)
- [x] Kod açıklama modu
- [x] Hata düzeltme ve iyileştirme önerisi
- [x] Kod kopyalama butonu

## Test
- [x] presentation router testi
- [x] logo router testi
- [x] coding router testi
- [x] auth logout testi

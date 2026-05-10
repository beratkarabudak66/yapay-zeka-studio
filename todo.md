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

## Yapay Zeka Araçları Kutuları
- [x] Video İyileştirici sayfasına AI araçları kutuları ekle (Runwayml, Topaz, Adobe Firefly vb.)
- [x] Ses Değiştirici sayfasına AI araçları kutuları ekle (Descript, Synthesia, ElevenLabs vb.)
- [x] Her kutuda araç adı, açıklama ve dış link olacak

## Sunum Örnekleri
- [x] Sunum sayfasına "Örnekler" bölümü ekle
- [x] Paragrafmetniniz.pptx dosyasını örnek olarak göster
- [x] Diğer örnek dosyaları ekle (kullanıcı tarafından sağlanacak)

## Ses Değiştirici Örnek Video
- [x] Video bölümü kaldırıldı (oynatma sorunları nedeniyle)

## Ağ Erişim Sorunu Düzeltmesi
- [x] tRPC URL'sini dinamik hale getir (window.location.origin kullan)
- [x] Farklı ağlarda erişim test edildi

## Ana Sayfa Yeniden Tasarımı
- [x] Hero bölümü — "Başlayın" ve "Okulumuz Hakkında" butonları
- [x] "Okulumuz Hakkında" → Suzan Mehmet Gönç okulunun sitesine yönlendirme
- [x] "Başlayın" → Araçlar grid'i göster (modal veya yeni sayfa)

## Test
- [x] presentation router testi
- [x] logo router testi
- [x] coding router testi
- [x] auth logout testi

## Video Test Aracı (/video-test)
- [x] Video dosyası yükleme alanı
- [x] AI ile video analiz: yapay zeka vs gerçek insan videosu ayırt etme
- [x] Analiz sonucu ve güven skoru gösterme
- [x] Detaylı rapor indirme
- [x] Navbar'a Test butonu eklendi
- [x] App.tsx'e /video-test rotası eklendi

## İletişim Formu
- [x] Veritabanında feedback tablosu oluştur
- [x] Backend'de feedback router'ı ekle
- [x] İletişim formu bileşeni oluştur (ad, email, mesaj, konu)
- [x] Ana sayfaya i̇letişim formu ekle
- [x] Form gönderimi başarılı mesajı göster
- [x] Şık tasarım — gradient renkler, smooth animasyon

## Ana Sayfa Düzeltmeleri
- [x] Başlayın butonuna tıklanınca araçlar grid'i modal/kutu olarak göster
- [x] "Test" → "Video Test" olarak değiştirildi (Navbar'da)

## Admin Dashboard
- [x] Geri bildirimleri listeleyen admin sayfası oluştur (/admin/feedbacks)
- [x] Admin rotasını App.tsx'e ekle (/admin/feedbacks)
- [x] Admin için role-based access control ekle (adminProcedure ile korunan)
- [x] Delete procedure'ı ekle (feedback silme işlevi)
- [x] Backend'de feedback.getAll ve feedback.delete için adminProcedure uygulandı

## Kullanıcı Geçmişi Sayfası
- [x] Giriş yapan kullanıcıların geçmişim sayfası oluştur (/history)
- [x] Logo, sunum, kod çıktılarını listele
- [x] İndirme bağlantıları ekle (presentation ve coding için metadata indirme desteği)
- [x] Rotayı App.tsx'e ekle
- [x] Navbar'a Geçmiş ve Admin linklerini ekle

## Video Analiz Engine Düzeltme (KRİTİK)
- [x] LLM prompt'u yeniden yaz - detaylı, hassas, dinamik skor üretimi
- [x] Backend scoring logic'i yeniden yaz - ağırlıklı sistem, fallback kaldır
- [x] Test et ve checkpoint kaydet

## Agresif AI Tespiti Upgrade (KRİTİK)
- [x] LLM prompt'u agresif AI tespiti için yeniden yaz - fazla kusursuz videoları AI olarak işaretle
- [x] Yeni kriterler ekle: Skin microtexture, Eye reflection, Hair edge, Compression anomaly, Temporal stability, Cinematic signature, GAN artifact, Diffusion smoothing
- [x] Karar motorunu sertleştir - fazla temiz/sinematik/kusursuz videoları agresif AI skoru ver
- [x] Test et ve checkpoint kaydet

## Agresif AI Tespiti Tamamlandı
- [x] LLM prompt agresif AI tespiti için yeniden yazıldı
- [x] 8 yeni kriter eklendi: Frame Consistency, Skin Microtexture, Eye Geometry, Cinematic Signature, Motion Physics, Compression Artifacts, Diffusion Smoothing, Overall Perfection
- [x] Verdict eşikleri sertleştirildi: 55/40 (eski 70/30)
- [x] Tüm testler geçiyor

## UI Düzeltmeler - Navigation ve Video İyileştir
- [x] Home.tsx'de "Video Test" linkini "AI Test" olarak değiştir ve route'u /ai-video-test yapıştır
- [x] VideoTool.tsx'de indirme butonlarını kaldır (Transkripsiyon İndir, Altyazı İndir)

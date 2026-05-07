import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Upload,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Download,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AnalysisResult {
  isAI: boolean | null;
  confidence: number;
  type: "AI Generated" | "Real Human" | "Uncertain";
  analysis: {
    faceMovement: string;
    eyeContact: string;
    lipSync: string;
    background: string;
    lighting: string;
    skinTexture: string;
    hairMovement: string;
    animation: string;
  };
  indicators: string[];
  summary: string;
  detailedAnalysis?: string;
}

export default function VideoTest() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const uploadMutation = trpc.upload.uploadFile.useMutation();
  const analyzeVideoMutation = trpc.videoTest.analyze.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("video/")) {
        setVideoFile(file);
        setAnalysisResult(null);

        // Video önizlemesi oluştur
        const reader = new FileReader();
        reader.onload = (event) => {
          setVideoPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        toast.success(`Video seçildi: ${file.name}`);
      } else {
        toast.error("Lütfen bir video dosyası seçin");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!videoFile) {
      toast.error("Lütfen bir video dosyası seçin");
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null); // Önceki sonuçları temizle
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;

          // Video dosyasını yükle
          toast.loading("Video yükleniyor...");
          const uploadResult = await uploadMutation.mutateAsync({
            base64,
            fileName: videoFile.name,
            fileType: videoFile.type,
            toolType: "video-test",
          });

          // Video analiz et
          toast.loading("Video analiz ediliyor (bu biraz zaman alabilir)...");
          const analysisRes = await analyzeVideoMutation.mutateAsync({
            videoUrl: uploadResult.url,
            fileName: videoFile.name,
          });

          console.log("Analiz sonucu:", analysisRes);
          setAnalysisResult(analysisRes);
          toast.success("Video analiz tamamlandı!");
          
          // Sonuçlara kaydır
          setTimeout(() => {
            const resultsElement = document.querySelector('[data-results]');
            if (resultsElement) {
              resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 500);
        } catch (error) {
          console.error("Analiz hatası:", error);
          toast.error("Video analiz sırasında bir hata oluştu");
          setAnalysisResult(null);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(videoFile);
    } catch (error) {
      console.error("Yükleme hatası:", error);
      toast.error("Dosya yükleme sırasında bir hata oluştu");
      setIsLoading(false);
      setAnalysisResult(null);
    }
  };

  const downloadReport = () => {
    if (!analysisResult) return;

    const report = `
╔════════════════════════════════════════════════════════════════╗
║                   VIDEO ANALİZ RAPORU                         ║
╚════════════════════════════════════════════════════════════════╝

📊 GENEL SONUÇ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sonuç: ${analysisResult.type}
Güven Skoru: %${analysisResult.confidence}
Özet: ${analysisResult.summary}

🔍 DETAYLI ANALİZ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. YÜZ HAREKETLERİ
   ${analysisResult.analysis.faceMovement}

2. GÖZ KONTAĞI
   ${analysisResult.analysis.eyeContact}

3. SES-DUDAK SENKRONİZASYONU
   ${analysisResult.analysis.lipSync}

4. ARKA PLAN
   ${analysisResult.analysis.background}

5. AYDINLATMA
   ${analysisResult.analysis.lighting}

6. CİLT DOKUSU
   ${analysisResult.analysis.skinTexture}

7. SAÇ HAREKETİ
   ${analysisResult.analysis.hairMovement}

8. ANİMASYON
   ${analysisResult.analysis.animation}

⚠️ ÖNEMLİ GÖSTERGELER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${analysisResult.indicators.map((ind, idx) => `${idx + 1}. ${ind}`).join("\n")}

📝 AÇIKLAMALAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Bu analiz yapay zeka tarafından yapılmıştır ve %100 doğru olmayabilir
• Yüksek kaliteli yapay zeka videoları gerçek gibi görünebilir
• Çok düşük kaliteli gerçek videolar yapay zeka olarak algılanabilir
• Profesyonel doğrulama için uzman görüşü alınız

Rapor Tarihi: ${new Date().toLocaleString("tr-TR")}
    `.trim();

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:text/plain;charset=utf-8,${encodeURIComponent(report)}`
    );
    element.setAttribute("download", `video-analiz-raporu-${Date.now()}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Rapor indirildi");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b border-border py-6 bg-white/50 backdrop-blur-sm">
        <div className="container">
          <h1 className="text-4xl font-bold text-foreground">Video Test</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Videonun yapay zeka tarafından oluşturulmuş mu yoksa gerçek insan
            videosu mu olduğunu detaylı analiz ile öğrenin
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Upload Card */}
            <Card className="p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Video Yükle
              </h2>
              <div className="space-y-6">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="video-input"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="video-input"
                    className={`cursor-pointer block ${
                      isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-semibold text-lg text-foreground">
                      Video dosyası seçin
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {videoFile
                        ? `Seçili: ${videoFile.name} (${(videoFile.size / 1024 / 1024).toFixed(2)} MB)`
                        : "MP4, WebM, MOV, AVI, vb. formatlar desteklenir"}
                    </p>
                  </label>
                </div>

                {/* Video Preview */}
                {videoPreview && (
                  <div className="rounded-lg overflow-hidden bg-black">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={!videoFile || isLoading}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analiz Ediliyor...
                    </>
                  ) : (
                    "Videoyu Analiz Et"
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Info Section */}
          <div className="space-y-4">
            {/* How It Works */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex gap-3">
                <HelpCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-3">
                    Nasıl Çalışır?
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li>✓ Videoyu yükleyin</li>
                    <li>✓ Yapay zeka analiz eder</li>
                    <li>✓ 8 farklı kriter incelenir</li>
                    <li>✓ Detaylı rapor alırsınız</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Analysis Criteria */}
            <Card className="p-6 bg-purple-50 border-purple-200">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-purple-900 mb-3">
                    Analiz Kriterleri
                  </h3>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Yüz hareketleri</li>
                    <li>• Göz kontağı</li>
                    <li>• Ses-dudak senkronizasyonu</li>
                    <li>• Arka plan tutarlılığı</li>
                    <li>• Aydınlatma</li>
                    <li>• Cilt dokusu</li>
                    <li>• Saç hareketi</li>
                    <li>• Animasyon kalitesi</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Warning */}
            <Card className="p-6 bg-amber-50 border-amber-200">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Uyarı</h3>
                  <p className="text-sm text-amber-800">
                    Analiz sonuçları tahmini niteliktedir. Yüksek kaliteli yapay
                    zeka videoları gerçek gibi görünebilir. Profesyonel
                    doğrulama için uzman görüşü alınız.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="mt-12 space-y-6" data-results>
            {/* Main Result Card */}
            <Card
              className={`p-8 border-2 ${
                analysisResult.isAI
                  ? "border-red-300 bg-red-50"
                  : analysisResult.isAI === false
                    ? "border-green-300 bg-green-50"
                    : "border-yellow-300 bg-yellow-50"
              }`}
            >
              <div className="flex items-start gap-6">
                {analysisResult.isAI ? (
                  <AlertCircle className="w-12 h-12 text-red-600 flex-shrink-0" />
                ) : analysisResult.isAI === false ? (
                  <CheckCircle className="w-12 h-12 text-green-600 flex-shrink-0" />
                ) : (
                  <HelpCircle className="w-12 h-12 text-yellow-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3
                    className={`text-3xl font-bold mb-4 ${
                      analysisResult.isAI
                        ? "text-red-900"
                        : analysisResult.isAI === false
                          ? "text-green-900"
                          : "text-yellow-900"
                    }`}
                  >
                    {analysisResult.type}
                  </h3>

                  {/* Confidence Bar */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium">Güven Skoru:</span>
                      <span className="text-2xl font-bold">
                        %{analysisResult.confidence}
                      </span>
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          analysisResult.isAI
                            ? "bg-red-600"
                            : analysisResult.isAI === false
                              ? "bg-green-600"
                              : "bg-yellow-600"
                        }`}
                        style={{ width: `${analysisResult.confidence}%` }}
                      />
                    </div>
                  </div>

                  <p
                    className={`text-base leading-relaxed ${
                      analysisResult.isAI
                        ? "text-red-800"
                        : analysisResult.isAI === false
                          ? "text-green-800"
                          : "text-yellow-800"
                    }`}
                  >
                    {analysisResult.summary}
                  </p>
                </div>
              </div>
            </Card>

            {/* Detailed Analysis */}
            <Card className="p-8">
              <h3 className="text-2xl font-semibold text-foreground mb-8">
                🔍 Detaylı Analiz
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    key: "faceMovement",
                    label: "🧑 Yüz Hareketleri",
                    value: analysisResult.analysis.faceMovement,
                  },
                  {
                    key: "eyeContact",
                    label: "👁️ Göz Kontağı",
                    value: analysisResult.analysis.eyeContact,
                  },
                  {
                    key: "lipSync",
                    label: "🗣️ Ses-Dudak Senkronizasyonu",
                    value: analysisResult.analysis.lipSync,
                  },
                  {
                    key: "background",
                    label: "🏞️ Arka Plan",
                    value: analysisResult.analysis.background,
                  },
                  {
                    key: "lighting",
                    label: "💡 Aydınlatma",
                    value: analysisResult.analysis.lighting,
                  },
                  {
                    key: "skinTexture",
                    label: "🎨 Cilt Dokusu",
                    value: analysisResult.analysis.skinTexture,
                  },
                  {
                    key: "hairMovement",
                    label: "💇 Saç Hareketi",
                    value: analysisResult.analysis.hairMovement,
                  },
                  {
                    key: "animation",
                    label: "✨ Animasyon Kalitesi",
                    value: analysisResult.analysis.animation,
                  },
                ].map(({ key, label, value }) => (
                  <div
                    key={key}
                    className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <p className="font-semibold text-foreground mb-3">
                      {label}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Key Indicators */}
            {analysisResult.indicators.length > 0 && (
              <Card className="p-8">
                <h3 className="text-2xl font-semibold text-foreground mb-6">
                  ⚠️ Önemli Göstergeler
                </h3>
                <div className="space-y-3">
                  {analysisResult.indicators.map((indicator, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-border"
                    >
                      <span className="text-lg font-bold text-primary flex-shrink-0 mt-0.5">
                        {idx + 1}.
                      </span>
                      <span className="text-foreground">{indicator}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Download Report Button */}
            <Button
              onClick={downloadReport}
              variant="outline"
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Raporu İndir (TXT)
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12 bg-slate-50/50">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2025 SMG Yapay Zeka. Öğrenciler için tasarlandı.</p>
          <span
            className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: "800",
              letterSpacing: "-0.3px",
            }}
          >
            Made by @Beratkarabudak
          </span>
        </div>
      </footer>
    </div>
  );
}

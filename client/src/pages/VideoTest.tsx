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
    setAnalysisResult(null);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;

          toast.loading("Video yükleniyor...");
          const uploadResult = await uploadMutation.mutateAsync({
            base64,
            fileName: videoFile.name,
            fileType: videoFile.type,
            toolType: "video-test",
          });

          toast.loading("Video analiz ediliyor (bu biraz zaman alabilir)...");
          const analysisRes = await analyzeVideoMutation.mutateAsync({
            videoUrl: uploadResult.url,
            fileName: videoFile.name,
          });

          console.log("Analiz sonucu:", analysisRes);
          console.log("Type:", typeof analysisRes);
          console.log("Keys:", Object.keys(analysisRes || {}));
          
          if (analysisRes && typeof analysisRes === 'object') {
            setAnalysisResult(analysisRes as AnalysisResult);
            console.log("State set edildi");
          } else {
            console.error("Geçersiz analiz sonucu:", analysisRes);
            toast.error("Analiz sonucu geçersiz format");
          }
          toast.success("Video analiz tamamlandı!");

          setTimeout(() => {
            const resultsElement = document.querySelector("[data-results]");
            if (resultsElement) {
              resultsElement.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
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
            videosu mu olduğunu öğrenin
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 flex-1">
        <div className="max-w-2xl mx-auto">
          {/* Upload Card */}
          <Card className="p-8 mb-8">
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

          {/* Analysis Results - Single Box */}
          {analysisResult && (
            <div data-results>
              <Card
                className={`p-10 border-2 ${
                  analysisResult.isAI
                    ? "border-red-400 bg-red-50"
                    : analysisResult.isAI === false
                      ? "border-green-400 bg-green-50"
                      : "border-yellow-400 bg-yellow-50"
                }`}
              >
                {/* Header with Icon and Result */}
                <div className="flex items-start gap-6 mb-8">
                  {analysisResult.isAI ? (
                    <AlertCircle className="w-16 h-16 text-red-600 flex-shrink-0" />
                  ) : analysisResult.isAI === false ? (
                    <CheckCircle className="w-16 h-16 text-green-600 flex-shrink-0" />
                  ) : (
                    <HelpCircle className="w-16 h-16 text-yellow-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h2
                      className={`text-4xl font-bold mb-3 ${
                        analysisResult.isAI
                          ? "text-red-900"
                          : analysisResult.isAI === false
                            ? "text-green-900"
                            : "text-yellow-900"
                      }`}
                    >
                      {analysisResult.type}
                    </h2>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold">
                        Güven Skoru:
                      </span>
                      <span
                        className={`text-3xl font-bold ${
                          analysisResult.isAI
                            ? "text-red-600"
                            : analysisResult.isAI === false
                              ? "text-green-600"
                              : "text-yellow-600"
                        }`}
                      >
                        %{analysisResult.confidence}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="mb-8">
                  <div className="flex-1 bg-gray-300 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-4 rounded-full transition-all ${
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

                {/* Summary */}
                <div className="mb-8 pb-8 border-b border-current border-opacity-20">
                  <h3 className="text-lg font-semibold mb-3">📝 Özet</h3>
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

                {/* Detailed Analysis Grid */}
                <div className="mb-8 pb-8 border-b border-current border-opacity-20">
                  <h3 className="text-lg font-semibold mb-6">
                    🔍 Detaylı Analiz Kriterleri
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="p-4 bg-white/50 rounded-lg border border-current border-opacity-10"
                      >
                        <p className="font-semibold mb-2">{label}</p>
                        <p className="text-sm leading-relaxed">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Indicators */}
                {analysisResult.indicators.length > 0 && (
                  <div className="mb-8 pb-8 border-b border-current border-opacity-20">
                    <h3 className="text-lg font-semibold mb-4">
                      ⚠️ Önemli Göstergeler
                    </h3>
                    <div className="space-y-2">
                      {analysisResult.indicators.map((indicator, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-white/50 rounded border border-current border-opacity-10"
                        >
                          <span className="font-bold flex-shrink-0">
                            {idx + 1}.
                          </span>
                          <span>{indicator}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <Button
                  onClick={downloadReport}
                  className="w-full h-11 text-base font-semibold"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Raporu İndir (TXT)
                </Button>
              </Card>
            </div>
          )}
        </div>
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

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
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
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const uploadMutation = trpc.upload.uploadFile.useMutation();
  const analyzeVideoMutation = trpc.videoTest.analyze.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("video/")) {
        setVideoFile(file);
        setAnalysisResult(null);
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
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;
          const uploadResult = await uploadMutation.mutateAsync({
            base64,
            fileName: videoFile.name,
            fileType: videoFile.type,
            toolType: "video-test",
          });

          const analysisRes = await analyzeVideoMutation.mutateAsync({
            videoUrl: uploadResult.url,
            fileName: videoFile.name,
          });

          setAnalysisResult(analysisRes);
          toast.success("Video analiz edildi!");
        } catch (error) {
          console.error("Analiz hatası:", error);
          toast.error("Video analiz sırasında bir hata oluştu");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(videoFile);
    } catch (error) {
      console.error("Yükleme hatası:", error);
      toast.error("Dosya yükleme sırasında bir hata oluştu");
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    if (!analysisResult) return;

    const report = `
Video Analiz Raporu
===================

Sonuç: ${analysisResult.type}
Güven Skoru: %${analysisResult.confidence}

Özet:
${analysisResult.summary}

Detaylı Analiz:
- Yüz Hareketleri: ${analysisResult.analysis.faceMovement}
- Göz Kontağı: ${analysisResult.analysis.eyeContact}
- Ses-Dudak Senkronizasyonu: ${analysisResult.analysis.lipSync}
- Arka Plan: ${analysisResult.analysis.background}
- Aydınlatma: ${analysisResult.analysis.lighting}
- Cilt Dokusu: ${analysisResult.analysis.skinTexture}
- Saç Hareketi: ${analysisResult.analysis.hairMovement}
- Animasyon: ${analysisResult.analysis.animation}

Göstergeler:
${analysisResult.indicators.map((ind) => `- ${ind}`).join("\n")}
    `.trim();

    const element = document.createElement("a");
    element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(report)}`);
    element.setAttribute("download", "video-analiz-raporu.txt");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b border-border py-4 bg-white/50 backdrop-blur-sm">
        <div className="container">
          <h1 className="text-3xl font-bold text-foreground">Video Test</h1>
          <p className="text-muted-foreground mt-1">
            Videonun yapay zeka tarafından oluşturulmuş mu yoksa gerçek insan videosu mu olduğunu öğrenin
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Video Yükle</h2>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="video-input"
                    />
                    <label htmlFor="video-input" className="cursor-pointer block">
                      <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="font-medium text-foreground">Video dosyası seçin</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {videoFile ? videoFile.name : "MP4, WebM, Ogg, vb."}
                      </p>
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={!videoFile || isLoading}
                  className="w-full h-11 text-base"
                  size="lg"
                >
                  {isLoading ? "Analiz Ediliyor..." : "Videoyu Analiz Et"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Info Section */}
          <div className="space-y-4">
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex gap-3">
                <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Nasıl Çalışır?</h3>
                  <p className="text-sm text-blue-800">
                    Yüklediğiniz video yapay zeka tarafından oluşturulmuş mu yoksa gerçek insan videosu mu olduğunu analiz eder. Yüz hareketleri, göz kontağı, ses senkronizasyonu ve daha fazlasını inceleyerek sonuç verir.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-amber-50 border-amber-200">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Not</h3>
                  <p className="text-sm text-amber-800">
                    Analiz sonuçları tahmini niteliktedir. Yüksek kaliteli yapay zeka videoları gerçek gibi görünebilir.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="mt-8 space-y-6">
            {/* Result Card */}
            <Card className={`p-8 border-2 ${
              analysisResult.isAI
                ? "border-red-300 bg-red-50"
                : analysisResult.isAI === false
                ? "border-green-300 bg-green-50"
                : "border-yellow-300 bg-yellow-50"
            }`}>
              <div className="flex items-start gap-4">
                {analysisResult.isAI ? (
                  <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                ) : analysisResult.isAI === false ? (
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                ) : (
                  <HelpCircle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`text-2xl font-bold mb-2 ${
                    analysisResult.isAI
                      ? "text-red-900"
                      : analysisResult.isAI === false
                      ? "text-green-900"
                      : "text-yellow-900"
                  }`}>
                    {analysisResult.type}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          analysisResult.isAI
                            ? "bg-red-600"
                            : analysisResult.isAI === false
                            ? "bg-green-600"
                            : "bg-yellow-600"
                        }`}
                        style={{ width: `${analysisResult.confidence}%` }}
                      />
                    </div>
                    <span className="font-semibold text-lg">%{analysisResult.confidence}</span>
                  </div>
                  <p className={`text-sm ${
                    analysisResult.isAI
                      ? "text-red-800"
                      : analysisResult.isAI === false
                      ? "text-green-800"
                      : "text-yellow-800"
                  }`}>
                    {analysisResult.summary}
                  </p>
                </div>
              </div>
            </Card>

            {/* Detailed Analysis */}
            <Card className="p-8">
              <h3 className="text-xl font-semibold text-foreground mb-6">Detaylı Analiz</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analysisResult.analysis).map(([key, value]) => (
                  <div key={key} className="p-4 bg-slate-50 rounded-lg border border-border">
                    <p className="font-medium text-foreground mb-2 capitalize">
                      {key === "faceMovement" && "Yüz Hareketleri"}
                      {key === "eyeContact" && "Göz Kontağı"}
                      {key === "lipSync" && "Ses-Dudak Senkronizasyonu"}
                      {key === "background" && "Arka Plan"}
                      {key === "lighting" && "Aydınlatma"}
                      {key === "skinTexture" && "Cilt Dokusu"}
                      {key === "hairMovement" && "Saç Hareketi"}
                      {key === "animation" && "Animasyon"}
                    </p>
                    <p className="text-sm text-muted-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Indicators */}
            {analysisResult.indicators.length > 0 && (
              <Card className="p-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">Önemli Göstergeler</h3>
                <ul className="space-y-2">
                  {analysisResult.indicators.map((indicator, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span className="text-foreground">{indicator}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Download Button */}
            <Button
              onClick={downloadReport}
              variant="outline"
              className="w-full h-11 text-base"
              size="lg"
            >
              Raporu İndir
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-8 bg-slate-50/50">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2025 SMG Yapay Zeka. Öğrenciler için tasarlandı.</p>
          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text" style={{fontFamily: "'Poppins', sans-serif", fontWeight: "800", letterSpacing: "-0.3px"}}>Made by @Beratkarabudak</span>
        </div>
      </footer>
    </div>
  );
}

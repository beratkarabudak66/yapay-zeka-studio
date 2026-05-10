import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Zap,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

type Criterion = {
  name: string;
  humanProbability: number;
  aiProbability: number;
  explanation: string;
};

type AnalysisResult = {
  criteria: Criterion[];
  overall: {
    humanProbability: number;
    aiProbability: number;
    verdict: string;
    summary: string;
  };
};

type Step = "upload" | "analyzing" | "result";

export default function AIVideoTest() {
  const [step, setStep] = useState<Step>("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = trpc.video.testAI.useMutation({
    onSuccess: (data: any) => {
      console.log("✅ Analiz başarılı:", data);
      setResult(data);
      setStep("result");
    },
    onError: (error: any) => {
      console.error("❌ Analiz hatası:", error);
      toast.error(error.message || "Analiz sırasında hata oluştu");
      setStep("upload");
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Lütfen bir video dosyası seçin");
      return;
    }
    setUploadedFile(file);
    setStep("upload");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-blue-500", "bg-blue-50");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleTest = async () => {
    if (!uploadedFile) {
      toast.error("Lütfen bir video seçin");
      return;
    }

    setStep("analyzing");
    console.log("📹 Analiz başlatılıyor...");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      console.log("✅ Video base64'e dönüştürüldü, uzunluk:", base64.length);
      
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            console.warn("⏱️ Timeout tetiklendi");
            reject(new Error("Analiz zaman aşımına uğradı"));
          }, 20000);
        });

        const analyzePromise = analyzeMutation.mutateAsync({
          videoData: base64,
          fileName: uploadedFile.name,
        });

        console.log("🚀 Backend'e istek gönderiliyor...");
        await Promise.race([analyzePromise, timeoutPromise]);
      } catch (error) {
        console.error("❌ Hata:", error);
        toast.error(error instanceof Error ? error.message : "Analiz başarısız");
        setStep("upload");
      }
    };
    reader.readAsDataURL(uploadedFile);
  };

  const resetTest = () => {
    setStep("upload");
    setUploadedFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict.includes("AI")) return "bg-red-50 border-red-200";
    if (verdict.includes("gerçek")) return "bg-green-50 border-green-200";
    return "bg-yellow-50 border-yellow-200";
  };

  const getVerdictIcon = (verdict: string) => {
    if (verdict.includes("AI")) return <TrendingUp className="w-5 h-5 text-red-600" />;
    if (verdict.includes("gerçek")) return <TrendingDown className="w-5 h-5 text-green-600" />;
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">AI Video Test</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Videonun yapay zeka ile üretilmiş mi yoksa gerçek mi olduğunu detaylı analiz ile öğrenin
          </p>
        </div>

        {/* Upload Section */}
        {step === "upload" && (
          <Card className="border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors">
            <CardContent className="pt-12 pb-12">
              <div className="text-center p-8">
                <Upload className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Video Yükleyin
                </h3>
                <p className="text-gray-600 mb-6">
                  Videoyu seçerek AI analiz yapabilirsiniz
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="default"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Video Seç
                </Button>
              </div>

              {uploadedFile && (
                <div className="mt-8 text-center">
                  <div className="inline-block bg-purple-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Seçilen Dosya:</span>{" "}
                      {uploadedFile.name}
                    </p>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={handleTest}
                      disabled={analyzeMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {analyzeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analiz Ediliyor...
                        </>
                      ) : (
                        "Test Et"
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setUploadedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      variant="outline"
                    >
                      Temizle
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Analyzing Section */}
        {step === "analyzing" && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Video Analiz Ediliyor
              </h3>
              <p className="text-gray-600">
                Lütfen bekleyin, video detaylı analiz edilmektedir...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Result Section */}
        {step === "result" && result && (
          <div className="space-y-6">
            {/* Overall Verdict */}
            <Card className={`border-2 ${getVerdictColor(result.overall.verdict)}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getVerdictIcon(result.overall.verdict)}
                    <CardTitle>Analiz Sonucu</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-base">
                    {result.overall.verdict}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Probabilities */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Human Probability */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        İnsan Yapımı
                      </label>
                      <span className="text-2xl font-bold text-green-600">
                        %{result.overall.humanProbability}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${result.overall.humanProbability}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Probability */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        AI Üretimi
                      </label>
                      <span className="text-2xl font-bold text-red-600">
                        %{result.overall.aiProbability}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${result.overall.aiProbability}%` }}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Summary */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Genel Yorum
                      </h4>
                      <p className="text-gray-600 text-sm">{result.overall.summary}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Criteria */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Detaylı Kriter Analizi
              </h2>
              <div className="grid gap-4">
                {result.criteria.map((criterion, idx) => (
                  <Card key={idx} className="border border-gray-200">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Criterion Name */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {idx + 1}. {criterion.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            {criterion.explanation}
                          </p>
                        </div>

                        {/* Probabilities */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Human */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold text-gray-600 uppercase">
                                İnsan
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                %{criterion.humanProbability}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-green-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${criterion.humanProbability}%` }}
                              />
                            </div>
                          </div>

                          {/* AI */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold text-gray-600 uppercase">
                                AI
                              </span>
                              <span className="text-sm font-bold text-red-600">
                                %{criterion.aiProbability}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-red-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${criterion.aiProbability}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={resetTest}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Başka Video Test Et
              </Button>
              <Button
                onClick={() => {
                  const text = `AI Video Test Sonucu:\n\nGenel Sonuç:\nİnsan Yapımı: %${result.overall.humanProbability}\nAI Üretimi: %${result.overall.aiProbability}\nVerdikt: ${result.overall.verdict}\n\nÖzet: ${result.overall.summary}`;
                  navigator.clipboard.writeText(text);
                  toast.success("Sonuç kopyalandı!");
                }}
                variant="outline"
              >
                Sonucu Kopyala
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

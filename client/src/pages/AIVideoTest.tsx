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
} from "lucide-react";

type AnalysisResult = {
  isAI: boolean;
  isReal: boolean;
  aiProbability: number;
  realProbability: number;
  confidence: number;
  indicators: string[];
  summary: string;
};

type Step = "upload" | "analyzing" | "result";

export default function AIVideoTest() {
  const [step, setStep] = useState<Step>("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = trpc.video.testAI.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setStep("result");
    },
    onError: (error) => {
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

    // Video'yu base64'e dönüştür
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        await analyzeMutation.mutateAsync({
          videoData: base64,
          fileName: uploadedFile.name,
        });
      } catch (error) {
        console.error("Test hatası:", error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">AI Video Test</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Videonun yapay zeka ile üretilmiş mi yoksa gerçek mi olduğunu öğrenin
          </p>
        </div>

        {/* Upload Section */}
        {step === "upload" && (
          <Card className="border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors">
            <CardContent className="pt-12 pb-12">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="text-center cursor-pointer p-8 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all"
              >
                <Upload className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Video Yükleyin
                </h3>
                <p className="text-gray-600 mb-4">
                  Videoyu sürükleyip bırakın veya tıklayarak seçin
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
                <div className="mt-8">
                  <div className="bg-purple-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Seçilen Dosya:</span>{" "}
                      {uploadedFile.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Boyut:</span>{" "}
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleTest}
                      disabled={analyzeMutation.isPending}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
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
                Lütfen bekleyin, video yapay zeka tarafından analiz edilmektedir...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Result Section */}
        {step === "result" && result && (
          <div className="space-y-6">
            {/* Main Result Card */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    Analiz Tamamlandı
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-800"
                  >
                    Güven: {result.confidence}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AI Probability */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-gray-700">
                      AI ile Üretilmiş Olma İhtimali
                    </label>
                    <span className="text-lg font-bold text-purple-600">
                      %{result.aiProbability}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${result.aiProbability}%` }}
                    />
                  </div>
                </div>

                <Separator />

                {/* Real Probability */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-gray-700">
                      İnsan Yapımı Olma İhtimali
                    </label>
                    <span className="text-lg font-bold text-green-600">
                      %{result.realProbability}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${result.realProbability}%` }}
                    />
                  </div>
                </div>

                <Separator />

                {/* Summary */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Analiz Özeti
                      </h4>
                      <p className="text-gray-600 text-sm">{result.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Indicators */}
                {result.indicators.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Tespit Edilen Göstergeler
                    </h4>
                    <div className="space-y-2">
                      {result.indicators.map((indicator, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{indicator}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
                  const text = `AI Video Test Sonucu:\n\nAI Olma İhtimali: %${result.aiProbability}\nGerçek Olma İhtimali: %${result.realProbability}\n\nÖzet: ${result.summary}`;
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

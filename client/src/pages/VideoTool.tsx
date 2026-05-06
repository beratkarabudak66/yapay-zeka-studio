import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Video,
  Upload,
  Loader2,
  FileVideo,
  AlignLeft,
  Lightbulb,
  Download,
  CheckCircle2,
  Play,
  Subtitles,
  Sparkles,
  ExternalLink,
} from "lucide-react";

type VideoAnalysis = {
  summary: string;
  topics: string[];
  suggestedEnhancements: string[];
  subtitleLines: Array<{ time: string; text: string }>;
  contentType: string;
};

type VideoResult = {
  transcription: string;
  analysis: VideoAnalysis;
};

type Step = "upload" | "preview" | "result";

type AITool = {
  name: string;
  description: string;
  url: string;
  icon: string;
};

const videoAITools: AITool[] = [
  {
    name: "Runway ML",
    description: "AI video editing, generation, and enhancement",
    url: "https://runwayml.com",
    icon: "🎬",
  },
  {
    name: "Topaz Video AI",
    description: "Video upscaling and enhancement",
    url: "https://www.topazlabs.com/topaz-video-ai",
    icon: "✨",
  },
  {
    name: "Adobe Firefly",
    description: "Generative AI for video content",
    url: "https://www.adobe.com/products/firefly.html",
    icon: "🔥",
  },
  {
    name: "HeyGen",
    description: "AI video generation and avatars",
    url: "https://www.heygen.com",
    icon: "🎥",
  },
  {
    name: "Synthesia",
    description: "AI video creation platform",
    url: "https://www.synthesia.io",
    icon: "🤖",
  },
  {
    name: "Descript",
    description: "Video editing with AI transcription",
    url: "https://www.descript.com",
    icon: "📝",
  },
];

export default function VideoTool() {
  const [step, setStep] = useState<Step>("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VideoResult | null>(null);
  const [activeTab, setActiveTab] = useState<"transcript" | "enhancements" | "subtitles">(
    "enhancements"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.upload.getUploadUrl.useMutation({
    onSuccess: (data) => {
      setUploadedUrl(data.url);
      setStep("preview");
      toast.success("Video yüklendi! Öneriler için analiz başlatabilirsiniz.");
    },
    onError: (err) => toast.error("Yükleme hatası: " + err.message),
  });

  const analyzeMutation = trpc.video.analyze.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setStep("result");
      toast.success("Video analizi tamamlandı!");
    },
    onError: (err) => toast.error("Analiz hatası: " + err.message),
  });

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 16 * 1024 * 1024) {
      toast.error("Dosya boyutu 16MB'ı geçemez.");
      return;
    }

    setUploadedFile(file);
    setResult(null);
    setStep("upload");

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      if (!base64) return;
      uploadMutation.mutate({
        fileName: file.name,
        fileType: file.type,
        toolType: "video",
        fileBase64: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = () => {
    if (!uploadedUrl) {
      toast.error("Önce bir video yükleyin.");
      return;
    }
    analyzeMutation.mutate({ videoUrl: uploadedUrl });
  };

  const downloadSubtitles = () => {
    if (!result?.analysis.subtitleLines) return;

    let srtContent = "";
    result.analysis.subtitleLines.forEach((line, index) => {
      srtContent += `${index + 1}\n${line.time} --> ${line.time}\n${line.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "altyazi.srt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Altyazı indirildi!");
  };

  const isLoading = uploadMutation.isPending || analyzeMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Video className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Video İyileştirici</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Videolarınızı AI ile analiz edin, kalite önerileri alın ve altyazı oluşturun
          </p>
        </div>

        {/* Main Content */}
        {step === "upload" && (
          <div className="space-y-8">
            {/* Upload Area */}
            <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
              <CardContent className="pt-12 pb-12">
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <FileVideo className="w-16 h-16 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Video Dosyası Yükleyin
                    </h3>
                    <p className="text-gray-600 mb-6">
                      MP4, WebM veya diğer video formatları (Max 16MB)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Dosya Seç
                      </>
                    )}
                  </Button>
                  {uploadedFile && (
                    <div className="mt-4 p-3 bg-green-100 rounded-lg">
                      <p className="text-green-800 text-sm">
                        ✓ {uploadedFile.name} seçildi
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Tools Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Video İyileştirme Araçları
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videoAITools.map((tool) => (
                  <Card
                    key={tool.name}
                    className="hover:shadow-lg transition-shadow cursor-pointer border-gray-200"
                  >
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <div className="text-4xl">{tool.icon}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                          <p className="text-sm text-gray-600 mt-2">{tool.description}</p>
                        </div>
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Ziyaret Et <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "preview" && uploadedUrl && (
          <div className="space-y-8">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Analiz Önerileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Kalite Önerileri:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-gray-700">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Parlaklık ve kontrast analizi yapılacak</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Stabilizasyon gerekliliği kontrol edilecek</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Ses kalitesi değerlendirilecek</span>
                    </li>
                  </ul>
                </div>
                <Separator />
                <Button
                  onClick={handleAnalyze}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analiz Yapılıyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analiz Başlat
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-8">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  Analiz Tamamlandı
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              {(["transcript", "enhancements", "subtitles"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab === "transcript" && "Transkripsiyon"}
                  {tab === "enhancements" && "Öneriler"}
                  {tab === "subtitles" && "Altyazılar"}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "transcript" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlignLeft className="w-5 h-5" />
                    Video Transkripsiyon
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap">{result.transcription}</p>
                  </div>
                  <Button
                    onClick={() => {
                      const blob = new Blob([result.transcription], {
                        type: "text/plain;charset=utf-8",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "transkripsiyon.txt";
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Transkripsiyon indirildi!");
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Transkripsiyon İndir
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "enhancements" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Kalite Önerileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      İçerik Türü: {result.analysis.contentType}
                    </h4>
                    <h4 className="font-semibold text-gray-900 mb-3">Öneriler:</h4>
                    <ul className="space-y-2">
                      {result.analysis.suggestedEnhancements.map((enhancement, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg"
                        >
                          <span className="text-yellow-600 font-bold mt-1">•</span>
                          <span className="text-gray-700">{enhancement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Konular:</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.analysis.topics.map((topic, idx) => (
                        <Badge key={idx} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "subtitles" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Subtitles className="w-5 h-5" />
                    Altyazılar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto space-y-3">
                    {result.analysis.subtitleLines.map((line, idx) => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-3">
                        <p className="text-sm text-gray-500">{line.time}</p>
                        <p className="text-gray-800">{line.text}</p>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={downloadSubtitles}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Altyazı İndir (.srt)
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-8 bg-slate-50/50">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2025 Yapay Zeka Stüdyo. Öğrenciler için tasarlandı.</p>
          <span className="font-medium text-primary">Tasarımcı: @Beratkarabudak</span>
        </div>
      </footer>
    </div>
  );
}

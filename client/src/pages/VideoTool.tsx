import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
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
  Subtitles,
  Sparkles,
  Play,
  Eye,
} from "lucide-react";
import { addHistoryItem } from "@/lib/history";

type VideoAnalysis = {
  summary: string;
  topics: string[];
  suggestedEnhancements: string[];
  subtitleLines: Array<{ time: string; text: string }>;
  contentType: string;
  metrics: {
    duration: string;
    resolution: string;
    aspectRatio: string;
    frameRate: string;
    fileSize: string;
  };
};

type VideoResult = {
  transcription: string;
  analysis: VideoAnalysis;
};

type Step = "upload" | "preview" | "result";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function analyzeVideo(file: File, videoEl: HTMLVideoElement): VideoResult {
  const duration = videoEl.duration;
  const videoWidth = videoEl.videoWidth;
  const videoHeight = videoEl.videoHeight;
  const aspectRatio = videoWidth && videoHeight ? (videoWidth / videoHeight).toFixed(2) : "Bilinmiyor";

  const metrics = {
    duration: formatTime(duration),
    resolution: videoWidth && videoHeight ? `${videoWidth}×${videoHeight}` : "Bilinmiyor",
    aspectRatio: `${aspectRatio}:1`,
    frameRate: "~30fps",
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
  };

  // Determine content type from resolution
  let contentType = "Standart Video";
  if (videoWidth >= 3840) contentType = "4K Ultra HD Video";
  else if (videoWidth >= 1920) contentType = "Full HD Video";
  else if (videoWidth >= 1280) contentType = "HD Video";
  else if (videoWidth >= 720) contentType = "Düşük Çözünürlüklü Video";

  // Suggested enhancements based on metrics
  const enhancements: string[] = [];
  if (videoWidth && videoWidth < 1280) {
    enhancements.push("Çözünürlük düşük — 1080p'ye yükseltmek için Topaz Video AI kullanın");
  }
  if (file.size / duration > 5 * 1024 * 1024) {
    enhancements.push("Dosya boyutu yüksek — sıkıştırma ile kaliteyi koruyarak boyutu azaltın");
  }
  if (duration > 120) {
    enhancements.push("Video uzun — izleyici dikkatini artırmak için kısa klipler halinde bölün");
  }
  enhancements.push("Ses kalitesini iyileştirmek için Adobe Podcast kullanın");
  enhancements.push("Erişilebilirlik için altyazı ekleyin (aşağıdaki altyazı şablonunu kullanın)");
  if (aspectRatio !== "1.78:1" && aspectRatio !== "0.56:1") {
    enhancements.push(`En-boy oranı ${aspectRatio}:1 — sosyal medya için 16:9 veya 9:16 kullanın`);
  }

  // Topics based on file name
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const topics = baseName
    .split(/[-_\s]+/)
    .filter((w) => w.length > 2)
    .slice(0, 5)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  if (topics.length === 0) topics.push("Genel Video");

  // Subtitle lines — template based on duration
  const subtitleLines: Array<{ time: string; text: string }> = [];
  const segmentCount = Math.min(6, Math.max(2, Math.ceil(duration / 15)));
  const segmentDuration = duration / segmentCount;
  for (let i = 0; i < segmentCount; i++) {
    const start = i * segmentDuration;
    subtitleLines.push({
      time: formatTime(start),
      text: i === 0 ? "[Video başlangıcı — buraya altyazı metni girin]" : `[${formatTime(start)} anı — altyazı metni]`,
    });
  }

  const summary = `${contentType} (${metrics.resolution}, ${metrics.duration}). ${topics.join(", ")} konulu video. ${enhancements.length} kalite önerisi mevcut.`;

  // Transcription placeholder
  const transcription = `[Bu video ${metrics.duration} uzunluğunda, ${metrics.resolution} çözünürlükte. Video içeriğinin transkripsiyonu için ses tanıma aracı (örn. Descript) kullanabilirsiniz. Dosya adı: ${file.name}]`;

  return {
    transcription,
    analysis: {
      summary,
      topics,
      suggestedEnhancements: enhancements,
      subtitleLines,
      contentType,
      metrics,
    },
  };
}

export default function VideoTool() {
  const [step, setStep] = useState<Step>("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VideoResult | null>(null);
  const [activeTab, setActiveTab] = useState<"transcript" | "enhancements" | "subtitles">("enhancements");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Dosya boyutu 50MB'ı geçemez.");
      return;
    }

    setUploadedFile(file);
    setResult(null);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setStep("preview");
    toast.info("Video yüklendi. Analiz için butona tıklayın.");
  };

  const handleAnalyze = () => {
    if (!uploadedFile || !videoRef.current) {
      toast.error("Önce bir video yükleyin.");
      return;
    }

    setIsLoading(true);
    // Wait for video metadata to be loaded
    const video = videoRef.current;
    const doAnalyze = () => {
      setTimeout(() => {
        try {
          const analysisResult = analyzeVideo(uploadedFile, video);
          setResult(analysisResult);
          setStep("result");
          addHistoryItem({
            toolType: "video",
            outputUrl: videoUrl || undefined,
            metadata: JSON.stringify({
              summary: analysisResult.analysis.summary,
              topics: analysisResult.analysis.topics,
              contentType: analysisResult.analysis.contentType,
            }),
          });
          setIsLoading(false);
          toast.success("Video analizi tamamlandı!");
        } catch (err) {
          console.error(err);
          toast.error("Analiz sırasında hata oluştu");
          setIsLoading(false);
        }
      }, 300);
    };

    if (video.readyState >= 1) {
      doAnalyze();
    } else {
      video.onloadedmetadata = doAnalyze;
    }
  };

  const handleDownloadVideo = () => {
    if (!uploadedFile) return;
    const url = URL.createObjectURL(uploadedFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = uploadedFile.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast.success("Video indirildi!");
  };

  const downloadSubtitles = () => {
    if (!result?.analysis.subtitleLines) return;
    let srtContent = "";
    result.analysis.subtitleLines.forEach((line, index) => {
      const startTime = line.time;
      const nextTime = result.analysis.subtitleLines[index + 1]?.time || "00:00:00,000";
      srtContent += `${index + 1}\n${startTime},000 --> ${nextTime},000\n${line.text}\n\n`;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Video className="w-8 h-8 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">Video Aracı</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Videoyu analiz edin, kalite önerileri alın ve altyazı şablonu oluşturun
          </p>
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <Card className="border-2 border-dashed border-orange-300 bg-orange-50/30">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <FileVideo className="w-16 h-16 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Video Dosyası Yükleyin
                  </h3>
                  <p className="text-gray-600 mb-6">
                    MP4, WebM veya diğer video formatları (Max 50MB)
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
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Dosya Seç
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Step */}
        {step === "preview" && videoUrl && (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="max-h-[400px] w-full"
                />
              </div>
            </Card>

            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Analiz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileVideo className="w-4 h-4" />
                  <span>{uploadedFile?.name}</span>
                  <Badge variant="outline">
                    {(uploadedFile ? uploadedFile.size / 1024 / 1024 : 0).toFixed(2)} MB
                  </Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleAnalyze}
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 gap-2"
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
                  <Button
                    onClick={handleDownloadVideo}
                    size="lg"
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Videoyu İndir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Result Step */}
        {step === "result" && result && (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  Analiz Tamamlandı
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(result.analysis.metrics).map(([key, value]) => (
                <Card key={key} className="text-center">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground capitalize">{key}</p>
                    <p className="text-sm font-semibold text-foreground mt-1">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              {(["transcript", "enhancements", "subtitles"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-orange-600 text-orange-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab === "transcript" && "Transkripsiyon"}
                  {tab === "enhancements" && "Öneriler"}
                  {tab === "subtitles" && "Altyazılar"}
                </button>
              ))}
            </div>

            {activeTab === "transcript" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlignLeft className="w-5 h-5" />
                    Video Transkripsiyon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap">{result.transcription}</p>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <Eye className="w-4 h-4 inline mr-1" />
                      Sesli transkripsiyon için "Ses Aracı"nı kullanarak videonun sesini
                      kaydedebilir veya Descript gibi araçlarla transkripsiyon alabilirsiniz.
                    </p>
                  </div>
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
                    Altyazı Şablonu
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto space-y-3">
                    {result.analysis.subtitleLines.map((line, idx) => (
                      <div key={idx} className="border-l-4 border-orange-500 pl-3">
                        <p className="text-sm text-gray-500">{line.time}</p>
                        <p className="text-gray-800">{line.text}</p>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={downloadSubtitles}
                    className="w-full bg-orange-600 hover:bg-orange-700 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    SRT Olarak İndir
                  </Button>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={() => {
                setStep("upload");
                setUploadedFile(null);
                setResult(null);
                if (videoUrl) URL.revokeObjectURL(videoUrl);
                setVideoUrl(null);
              }}
              variant="outline"
              className="w-full gap-2"
            >
              <Upload className="w-4 h-4" />
              Başka Video Yükle
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

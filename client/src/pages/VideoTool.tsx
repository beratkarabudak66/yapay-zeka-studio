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
    if (!uploadedUrl) return;
    analyzeMutation.mutate({ videoUrl: uploadedUrl, fileName: uploadedFile?.name });
  };

  const downloadSubtitles = () => {
    if (!result?.analysis.subtitleLines.length) return;
    let srt = "";
    result.analysis.subtitleLines.forEach((line, i) => {
      // Generate sequential timestamps (3 seconds per subtitle line)
      const startSec = i * 3;
      const endSec = startSec + 3;
      const toSrtTime = (s: number) => {
        const h = Math.floor(s / 3600).toString().padStart(2, "0");
        const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
        const sec = Math.floor(s % 60).toString().padStart(2, "0");
        return `${h}:${m}:${sec},000`;
      };
      srt += `${i + 1}\n${toSrtTime(startSec)} --> ${toSrtTime(endSec)}\n${line.text}\n\n`;
    });
    const blob = new Blob([srt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "altyazi.srt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Altyazı dosyası indirildi!");
  };

  const downloadTranscript = () => {
    if (!result) return;
    const content = `VİDEO ANALİZİ\n${"=".repeat(40)}\n\nİçerik Türü: ${result.analysis.contentType}\n\nÖzet: ${result.analysis.summary}\n\nKonular:\n${result.analysis.topics.map((t) => `• ${t}`).join("\n")}\n\nİyileştirme Önerileri:\n${result.analysis.suggestedEnhancements.map((e) => `• ${e}`).join("\n")}\n\nTRANSKRİPSİYON\n${"=".repeat(40)}\n\n${result.transcription}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "video-analizi.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analiz raporu indirildi!");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
            <Video className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Video İyileştirici</h1>
            <p className="text-muted-foreground text-sm">
              Video yükle, kalite önerileri al ve otomatik altyazı üret
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(["upload", "preview", "result"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  step === s
                    ? "bg-orange-100 text-orange-700 border border-orange-300"
                    : i < ["upload", "preview", "result"].indexOf(step)
                    ? "bg-orange-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < ["upload", "preview", "result"].indexOf(step) ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span>{i + 1}</span>
                )}
                {s === "upload" ? "Yükle" : s === "preview" ? "Önizle" : "Sonuç"}
              </div>
              {i < 2 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upload Card */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4 text-orange-600" />
                  Video Yükle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`upload-zone cursor-pointer ${uploadMutation.isPending ? "opacity-60 pointer-events-none" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="w-8 h-8 text-orange-500 mx-auto mb-2 animate-spin" />
                  ) : uploadedFile ? (
                    <CheckCircle2 className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  ) : (
                    <FileVideo className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  )}
                  <p className="text-sm font-medium text-foreground">
                    {uploadMutation.isPending
                      ? "Yükleniyor..."
                      : uploadedFile
                      ? uploadedFile.name
                      : "Video dosyası seç"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">MP4, WEBM, MOV • Maks. 16MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {uploadedFile && uploadedUrl && (
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                    <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                    <p className="text-xs text-orange-700 font-medium truncate">
                      {uploadedFile.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview / Suggestions */}
            {step === "preview" && uploadedUrl && (
              <Card className="border-orange-200 bg-orange-50/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-orange-600" />
                    İşlem Öncesi Öneriler
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {[
                      "Parlaklık ve kontrast analizi yapılacak",
                      "Ses kalitesi değerlendirilecek",
                      "Otomatik altyazı oluşturulacak",
                      "İçerik özeti çıkarılacak",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-orange-800">
                        <Play className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full gap-2 bg-orange-600 hover:bg-orange-700 mt-2"
                    onClick={handleAnalyze}
                    disabled={analyzeMutation.isPending}
                  >
                    {analyzeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analiz Ediliyor...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analizi Başlat
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === "result" && result && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={downloadTranscript}
                >
                  <Download className="w-4 h-4" />
                  Analiz Raporunu İndir
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={downloadSubtitles}
                  disabled={!result.analysis.subtitleLines.length}
                >
                  <Subtitles className="w-4 h-4" />
                  Altyazı İndir (.srt)
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-3">
            {result ? (
              <Card className="border-border shadow-sm h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Analiz Sonuçları</CardTitle>
                    <Badge className="bg-orange-600 text-white capitalize">
                      {result.analysis.contentType}
                    </Badge>
                  </div>
                  {/* Tabs */}
                  <div className="flex gap-1 mt-2 bg-muted rounded-lg p-1">
                    {(["enhancements", "transcript", "subtitles"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                          activeTab === tab
                            ? "bg-white text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab === "enhancements"
                          ? "Öneriler"
                          : tab === "transcript"
                          ? "Transkripsiyon"
                          : "Altyazı"}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {activeTab === "enhancements" && (
                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-xl p-4 border border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                          Video Özeti
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {result.analysis.summary}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                          Konular
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.analysis.topics.map((topic, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                          İyileştirme Önerileri
                        </p>
                        <ul className="space-y-2">
                          {result.analysis.suggestedEnhancements.map((enh, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100 text-sm"
                            >
                              <Lightbulb className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                              <span className="text-orange-900">{enh}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === "transcript" && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-border max-h-96 overflow-y-auto">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {result.transcription}
                      </p>
                    </div>
                  )}

                  {activeTab === "subtitles" && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {result.analysis.subtitleLines.length > 0 ? (
                        result.analysis.subtitleLines.map((line, i) => (
                          <div
                            key={i}
                            className="flex gap-3 p-2 rounded-lg bg-slate-50 border border-border text-sm"
                          >
                            <span className="text-muted-foreground font-mono text-xs shrink-0 mt-0.5">
                              {line.time}
                            </span>
                            <span className="text-foreground">{line.text}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm text-center py-8">
                          Altyazı satırı bulunamadı.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-border h-full min-h-[400px] flex items-center justify-center bg-white shadow-sm">
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-orange-300" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {step === "upload" ? "Video Bekleniyor" : "Analiz Bekleniyor"}
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    {step === "upload"
                      ? "Video dosyası yükleyin, AI ile analiz edin."
                      : "Sol taraftaki 'Analizi Başlat' butonuna tıklayın."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

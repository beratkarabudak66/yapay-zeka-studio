import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Mic,
  Upload,
  Loader2,
  FileAudio,
  AlignLeft,
  BarChart2,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type ToneOption = {
  id: string;
  label: string;
  desc: string;
  emoji: string;
};

const toneOptions: ToneOption[] = [
  { id: "natural", label: "Doğal", desc: "Orijinal ses tonu", emoji: "🎙️" },
  { id: "deeper", label: "Derin", desc: "Daha güçlü, otoriter ses", emoji: "🔊" },
  { id: "faster", label: "Hızlı", desc: "Daha enerjik, dinamik", emoji: "⚡" },
  { id: "cinematic", label: "Sinematik", desc: "Film kalitesi, dramatik", emoji: "🎬" },
];

type VoiceResult = {
  transcription: string;
  segments: Array<{ start: number; end: number; text: string }>;
  analysis: {
    summary: string;
    keyPoints: string[];
    tone: string;
    wordCount: number;
    language: string;
  };
};

export default function VoiceTool() {
  const [selectedTone, setSelectedTone] = useState("natural");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [activeTab, setActiveTab] = useState<"transcript" | "analysis">("transcript");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.upload.getUploadUrl.useMutation({
    onSuccess: (data) => {
      setUploadedUrl(data.url);
      toast.success("Dosya yüklendi! Şimdi transkripsiyon başlatabilirsiniz.");
    },
    onError: (err) => toast.error("Yükleme hatası: " + err.message),
  });

  const transcribeMutation = trpc.voice.transcribe.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("Transkripsiyon tamamlandı!");
    },
    onError: (err) => toast.error("Transkripsiyon hatası: " + err.message),
  });

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 16 * 1024 * 1024) {
      toast.error("Dosya boyutu 16MB'ı geçemez.");
      return;
    }

    setUploadedFile(file);
    setResult(null);

    // Convert to base64 and upload
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      if (!base64) return;
      uploadMutation.mutate({
        fileName: file.name,
        fileType: file.type,
        toolType: "voice",
        fileBase64: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleTranscribe = () => {
    if (!uploadedUrl) {
      toast.error("Önce bir dosya yükleyin.");
      return;
    }
    transcribeMutation.mutate({ audioUrl: uploadedUrl, language: "tr" });
  };

  const downloadTranscript = () => {
    if (!result) return;
    const content = `TRANSKRİPSİYON\n${"=".repeat(40)}\n\n${result.transcription}\n\nANALİZ\n${"=".repeat(40)}\n\nÖzet: ${result.analysis.summary}\n\nAnahtar Noktalar:\n${result.analysis.keyPoints.map((p) => `• ${p}`).join("\n")}\n\nSes Tonu: ${result.analysis.tone}\nKelime Sayısı: ${result.analysis.wordCount}\nDil: ${result.analysis.language}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transkripsiyon.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Transkripsiyon indirildi!");
  };

  const isLoading = uploadMutation.isPending || transcribeMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Mic className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ses Değiştirici</h1>
            <p className="text-muted-foreground text-sm">
              Ses/video yükle, transkripsiyon al ve içerik analizi yap
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upload */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  Dosya Yükle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`upload-zone cursor-pointer ${uploadMutation.isPending ? "opacity-60 pointer-events-none" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 animate-spin" />
                  ) : uploadedFile ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  ) : (
                    <FileAudio className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  )}
                  <p className="text-sm font-medium text-foreground">
                    {uploadMutation.isPending
                      ? "Yükleniyor..."
                      : uploadedFile
                      ? uploadedFile.name
                      : "Ses veya video dosyası seç"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP3, WAV, MP4, WEBM • Maks. 16MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {uploadedFile && uploadedUrl && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-xs text-emerald-700 font-medium truncate">
                      {uploadedFile.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tone Selection */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  Ses Tonu Seçimi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {toneOptions.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                      selectedTone === tone.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-border bg-white hover:border-emerald-200"
                    }`}
                  >
                    <span className="text-xl">{tone.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{tone.label}</p>
                      <p className="text-xs text-muted-foreground">{tone.desc}</p>
                    </div>
                    {selectedTone === tone.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Process Button */}
            <Button
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleTranscribe}
              disabled={isLoading || !uploadedUrl}
            >
              {transcribeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Transkripsiyon Yapılıyor...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Transkripsiyon Başlat
                </>
              )}
            </Button>

            {/* Info */}
            <Card className="border-border bg-emerald-50/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-800/80">
                    Ses tonu değiştirme özelliği transkripsiyon sonrası öneriler şeklinde sunulur.
                    Gerçek zamanlı ses işleme için sonuçları indirin.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-3">
            {result ? (
              <Card className="border-border shadow-sm h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Sonuçlar</CardTitle>
                    <Button size="sm" variant="outline" className="gap-2" onClick={downloadTranscript}>
                      <Download className="w-4 h-4" />
                      İndir
                    </Button>
                  </div>
                  {/* Tabs */}
                  <div className="flex gap-1 mt-2 bg-muted rounded-lg p-1">
                    {(["transcript", "analysis"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
                          activeTab === tab
                            ? "bg-white text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab === "transcript" ? (
                          <>
                            <AlignLeft className="w-3.5 h-3.5" />
                            Transkripsiyon
                          </>
                        ) : (
                          <>
                            <BarChart2 className="w-3.5 h-3.5" />
                            Analiz
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {activeTab === "transcript" ? (
                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-xl p-4 border border-border">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {result.transcription}
                        </p>
                      </div>
                      {result.segments.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                            Zaman Damgalı Segmentler
                          </p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {result.segments.slice(0, 20).map((seg, i) => (
                              <div key={i} className="flex gap-3 text-xs">
                                <span className="text-muted-foreground shrink-0 font-mono">
                                  {Math.floor(seg.start / 60)}:
                                  {String(Math.floor(seg.start % 60)).padStart(2, "0")}
                                </span>
                                <span className="text-foreground">{seg.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Kelime", value: result.analysis.wordCount },
                          { label: "Dil", value: result.analysis.language },
                          { label: "Ton", value: result.analysis.tone },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100"
                          >
                            <p className="text-lg font-bold text-emerald-700">{stat.value}</p>
                            <p className="text-xs text-emerald-600/70">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Summary */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                          Özet
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {result.analysis.summary}
                        </p>
                      </div>

                      {/* Key Points */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                          Anahtar Noktalar
                        </p>
                        <ul className="space-y-2">
                          {result.analysis.keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-foreground">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-border h-full min-h-[400px] flex items-center justify-center bg-white shadow-sm">
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <Mic className="w-8 h-8 text-emerald-300" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Sonuç Bekleniyor</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Ses veya video dosyası yükleyin, ton seçin ve transkripsiyon başlatın.
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

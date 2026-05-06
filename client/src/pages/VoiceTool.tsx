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
  ExternalLink,
} from "lucide-react";

type ToneOption = {
  id: string;
  label: string;
  desc: string;
  emoji: string;
};

type AITool = {
  name: string;
  description: string;
  url: string;
  icon: string;
};

const toneOptions: ToneOption[] = [
  { id: "natural", label: "Doğal", desc: "Orijinal ses tonu", emoji: "🎙️" },
  { id: "deeper", label: "Derin", desc: "Daha güçlü, otoriter ses", emoji: "🔊" },
  { id: "faster", label: "Hızlı", desc: "Daha enerjik, dinamik", emoji: "⚡" },
  { id: "cinematic", label: "Sinematik", desc: "Film kalitesi, dramatik", emoji: "🎬" },
];

const voiceAITools: AITool[] = [
  {
    name: "Descript",
    description: "AI-powered audio editing and transcription",
    url: "https://www.descript.com",
    icon: "📝",
  },
  {
    name: "ElevenLabs",
    description: "AI voice generation and cloning",
    url: "https://elevenlabs.io",
    icon: "🎙️",
  },
  {
    name: "Synthesia",
    description: "AI video creation with voice",
    url: "https://www.synthesia.io",
    icon: "🤖",
  },
  {
    name: "Adobe Podcast",
    description: "Enhance audio with AI",
    url: "https://podcast.adobe.com",
    icon: "🎧",
  },
  {
    name: "Murf AI",
    description: "AI voice studio and generator",
    url: "https://murf.ai",
    icon: "🎵",
  },
  {
    name: "Voicemod",
    description: "Real-time voice changer",
    url: "https://www.voicemod.net",
    icon: "🔄",
  },
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
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mic className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Ses Değiştirici</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Ses dosyalarınızı yükleyin, transkripsiyon alın ve içerik analizi yapın
          </p>
        </div>

        {/* Upload Section */}
        <div className="space-y-8">
          {/* Upload Area */}
          <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <FileAudio className="w-16 h-16 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Ses veya Video Dosyası Yükleyin
                  </h3>
                  <p className="text-gray-600 mb-6">
                    MP3, WAV, M4A veya video formatları (Max 16MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,video/*"
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
                    <p className="text-green-800 text-sm">✓ {uploadedFile.name} seçildi</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tone Selection */}
          {uploadedUrl && !result && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle>Ses Tonu Seçin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {toneOptions.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedTone(tone.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedTone === tone.id
                          ? "border-blue-600 bg-blue-100"
                          : "border-gray-200 bg-white hover:border-blue-400"
                      }`}
                    >
                      <div className="text-3xl mb-2">{tone.emoji}</div>
                      <div className="font-semibold text-gray-900">{tone.label}</div>
                      <div className="text-xs text-gray-600">{tone.desc}</div>
                    </button>
                  ))}
                </div>
                <Separator />
                <Button
                  onClick={handleTranscribe}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Transkripsiyon Yapılıyor...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Transkripsiyon Başlat
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <>
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    Transkripsiyon Tamamlandı
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200">
                {(["transcript", "analysis"] as const).map((tab) => (
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
                    {tab === "analysis" && "Analiz"}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "transcript" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlignLeft className="w-5 h-5" />
                      Ses Transkripsiyon
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <p className="text-gray-700 whitespace-pre-wrap">{result.transcription}</p>
                    </div>
                    <Button
                      onClick={downloadTranscript}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Transkripsiyon İndir
                    </Button>
                  </CardContent>
                </Card>
              )}

              {activeTab === "analysis" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart2 className="w-5 h-5" />
                      İçerik Analizi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Özet</h4>
                      <p className="text-gray-700">{result.analysis.summary}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Anahtar Noktalar</h4>
                      <ul className="space-y-2">
                        {result.analysis.keyPoints.map((point, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                          >
                            <span className="text-blue-600 font-bold mt-1">•</span>
                            <span className="text-gray-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Ses Tonu</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.analysis.tone}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Kelime Sayısı</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.analysis.wordCount}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Dil</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.analysis.language}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* AI Tools Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ses Düzenleme Araçları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voiceAITools.map((tool) => (
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

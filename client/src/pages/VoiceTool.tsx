import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Upload,
  Loader2,
  AlignLeft,
  BarChart2,
  Download,
  CheckCircle2,
  Square,
  AlertCircle,
} from "lucide-react";
import { addHistoryItem } from "@/lib/history";

// Minimal type declarations for Web Speech API (not in standard lib.d.ts)
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

type VoiceResult = {
  transcription: string;
  analysis: {
    summary: string;
    keyPoints: string[];
    tone: string;
    wordCount: number;
    language: string;
  };
};

function analyzeText(text: string): VoiceResult["analysis"] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const wordCount = words.length;

  // Key points: pick first sentence of each "paragraph" or first few sentences
  const keyPoints: string[] = [];
  const meaningfulSentences = sentences
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 3);
  const pickCount = Math.min(5, meaningfulSentences.length);
  const step = Math.max(1, Math.floor(meaningfulSentences.length / pickCount));
  for (let i = 0; i < meaningfulSentences.length && keyPoints.length < pickCount; i += step) {
    const s = meaningfulSentences[i];
    keyPoints.push(s.length > 80 ? s.slice(0, 80) + "..." : s);
  }

  // Determine tone based on punctuation and keywords
  let tone = "Bilgilendirici";
  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;
  if (exclamationCount > wordCount * 0.03) tone = "Heyecanlı / Enerjik";
  else if (questionCount > wordCount * 0.04) tone = "Soru Soran / Etkileşimli";
  else if (text.length > 500) tone = "Detaylı / Kapsamlı";
  else if (wordCount < 30) tone = "Kısa / Öz";

  // Summary: first 2 sentences
  const summary = meaningfulSentences.slice(0, 2).join(" ") || text.slice(0, 150);

  return {
    summary,
    keyPoints: keyPoints.length > 0 ? keyPoints : ["Metin çok kısa, anahtar nokta çıkarılamadı."],
    tone,
    wordCount,
    language: "tr",
  };
}

export default function VoiceTool() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [activeTab, setActiveTab] = useState<"transcript" | "analysis">("transcript");
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Tarayıcınız ses tanımayı desteklemiyor. Chrome veya Edge kullanın.");
      return;
    }

    const recognition = new SpeechRecognition() as SpeechRecognitionLike;
    recognition.lang = "tr-TR";
    recognition.continuous = true;
    recognition.interimResults = true;

    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setResult(null);

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptPart + " ";
        } else {
          interim += transcriptPart;
        }
      }
      if (final) {
        finalTranscriptRef.current += final;
        setTranscript(finalTranscriptRef.current);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Mikrofon erişimi reddedildi. Tarayıcı ayarlarından izin verin.");
      } else if (event.error === "no-speech") {
        // Not an error worth showing — just stopped listening
      } else {
        toast.error("Ses tanıma hatası: " + event.error);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    toast.info("Dinleniyor... Konuşmaya başlayın.");
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnalyze = () => {
    const fullText = finalTranscriptRef.current.trim();
    if (!fullText) {
      toast.error("Önce ses kaydı yapın veya metin yükleyin.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const analysis = analyzeText(fullText);
      const voiceResult: VoiceResult = { transcription: fullText, analysis };
      setResult(voiceResult);
      addHistoryItem({
        toolType: "voice",
        metadata: JSON.stringify({ transcription: fullText, analysis }),
      });
      setIsLoading(false);
      toast.success("Analiz tamamlandı!");
    }, 400);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      finalTranscriptRef.current = text;
      setTranscript(text);
      setResult(null);
      toast.info("Metin yüklendi. Analiz için butona tıklayın.");
    };
    reader.readAsText(file, "UTF-8");
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

  const fullDisplay = transcript + (interimTranscript ? " " + interimTranscript : "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mic className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-gray-900">Ses Aracı</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Mikrofonla konuşun veya metin yükleyin — transkripsiyon ve analiz alın
          </p>
        </div>

        {/* Recording Section */}
        <Card className="border-emerald-200 bg-emerald-50/50 mb-6">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-6">
              {/* Mic Button */}
              <div className="relative inline-block">
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />
                )}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30"
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-7 h-7 text-white" fill="white" />
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                </button>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {isRecording ? "Dinleniyor... Durdurmak için tıklayın" : "Kayıt başlatmak için mikrofona tıklayın"}
                </p>
                {isRecording && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-emerald-500 rounded-full animate-pulse"
                        style={{
                          height: `${8 + Math.random() * 16}px`,
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Live Transcript */}
              {(transcript || interimTranscript) && (
                <div className="bg-white rounded-lg p-4 border border-emerald-200 text-left max-h-48 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {transcript}
                    {interimTranscript && (
                      <span className="text-gray-400 italic"> {interimTranscript}</span>
                    )}
                  </p>
                </div>
              )}

              {/* File Upload & Analyze */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".txt,.md"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-sm font-medium text-foreground hover:bg-muted transition-all">
                    <Upload className="w-4 h-4" />
                    Metin Yükle
                  </span>
                </label>
                <Button
                  onClick={handleAnalyze}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  disabled={isLoading || !transcript.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analiz Yapılıyor...
                    </>
                  ) : (
                    <>
                      <BarChart2 className="w-4 h-4" />
                      Analiz Et
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <>
            <Card className="border-green-200 bg-green-50 mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  Analiz Tamamlandı
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 mb-4">
              {(["transcript", "analysis"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab === "transcript" && "Transkripsiyon"}
                  {tab === "analysis" && "Analiz"}
                </button>
              ))}
            </div>

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
                    className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    <Download className="w-4 h-4" />
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
                          className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg"
                        >
                          <span className="text-emerald-600 font-bold mt-1">•</span>
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

        {/* Browser support notice */}
        {!result && !transcript && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 mb-1">Tarayıcı Uyumluluğu</p>
                  <p className="text-xs text-amber-700/80">
                    Ses tanıma özelliği Chrome ve Edge tarayıcılarında çalışır. Alternatif olarak
                    metin dosyası yükleyip analiz edebilirsiniz.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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

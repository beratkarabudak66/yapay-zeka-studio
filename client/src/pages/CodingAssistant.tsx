import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Code2,
  Sparkles,
  Copy,
  CheckCheck,
  Loader2,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  Wrench,
  Zap,
} from "lucide-react";

type Language = "html" | "css" | "javascript" | "python";
type Mode = "generate" | "explain" | "fix";

type CodingResult = {
  code: string;
  explanation: string;
  improvements: string[];
  errors: string[];
};

const languages: { id: Language; label: string; color: string; bg: string; icon: string }[] = [
  { id: "html", label: "HTML", color: "text-orange-600", bg: "bg-orange-50", icon: "🌐" },
  { id: "css", label: "CSS", color: "text-blue-600", bg: "bg-blue-50", icon: "🎨" },
  { id: "javascript", label: "JavaScript", color: "text-yellow-600", bg: "bg-yellow-50", icon: "⚡" },
  { id: "python", label: "Python", color: "text-green-600", bg: "bg-green-50", icon: "🐍" },
];

const modes: { id: Mode; label: string; icon: typeof Zap; desc: string }[] = [
  { id: "generate", label: "Kod Üret", icon: Zap, desc: "Açıklamadan kod oluştur" },
  { id: "explain", label: "Açıkla", icon: BookOpen, desc: "Kodu sade dille açıkla" },
  { id: "fix", label: "Düzelt", icon: Wrench, desc: "Hataları bul ve düzelt" },
];

export default function CodingAssistant() {
  const [selectedLang, setSelectedLang] = useState<Language>("javascript");
  const [selectedMode, setSelectedMode] = useState<Mode>("generate");
  const [prompt, setPrompt] = useState("");
  const [existingCode, setExistingCode] = useState("");
  const [result, setResult] = useState<CodingResult | null>(null);
  const [copied, setCopied] = useState(false);

  const generateMutation = trpc.coding.generate.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("İşlem tamamlandı!");
    },
    onError: (err) => toast.error("Hata: " + err.message),
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Lütfen bir açıklama veya soru girin.");
      return;
    }
    if ((selectedMode === "explain" || selectedMode === "fix") && !existingCode.trim()) {
      toast.error("Bu mod için mevcut kodu girin.");
      return;
    }
    generateMutation.mutate({
      prompt,
      language: selectedLang,
      mode: selectedMode,
      existingCode: existingCode || undefined,
    });
  };

  const handleCopy = async () => {
    if (!result?.code) return;
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    toast.success("Kod kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  };

  const langInfo = languages.find((l) => l.id === selectedLang)!;

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
            <Code2 className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kodlama Asistanı</h1>
            <p className="text-muted-foreground text-sm">
              AI ile kod üret, açıkla ve hataları düzelt
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Language Selection */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Programlama Dili</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setSelectedLang(lang.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                        selectedLang === lang.id
                          ? `border-pink-400 ${lang.bg}`
                          : "border-border bg-white hover:border-pink-200"
                      }`}
                    >
                      <span className="text-lg">{lang.icon}</span>
                      <span
                        className={`text-sm font-semibold ${
                          selectedLang === lang.id ? lang.color : "text-foreground"
                        }`}
                      >
                        {lang.label}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mode Selection */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">İşlem Modu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                        selectedMode === mode.id
                          ? "border-pink-400 bg-pink-50"
                          : "border-border bg-white hover:border-pink-200"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          selectedMode === mode.id ? "bg-pink-100" : "bg-muted"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            selectedMode === mode.id ? "text-pink-600" : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{mode.label}</p>
                        <p className="text-xs text-muted-foreground">{mode.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Prompt */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {selectedMode === "generate"
                    ? "Ne yapmak istiyorsunuz?"
                    : selectedMode === "explain"
                    ? "Açıklama isteği"
                    : "Hata açıklaması"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder={
                    selectedMode === "generate"
                      ? `${langInfo.label} ile bir todo listesi uygulaması yaz...`
                      : selectedMode === "explain"
                      ? "Bu kodu açıkla, ne yapıyor?"
                      : "Kodda şu hata var: ..."
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none text-sm"
                />

                {(selectedMode === "explain" || selectedMode === "fix") && (
                  <>
                    <p className="text-xs font-medium text-muted-foreground">Mevcut Kod:</p>
                    <Textarea
                      placeholder={`${langInfo.label} kodunuzu buraya yapıştırın...`}
                      value={existingCode}
                      onChange={(e) => setExistingCode(e.target.value)}
                      rows={6}
                      className="resize-none text-sm font-mono"
                    />
                  </>
                )}

                <Button
                  className="w-full gap-2 bg-pink-600 hover:bg-pink-700"
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !prompt.trim()}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {selectedMode === "generate"
                        ? "Kod Üret"
                        : selectedMode === "explain"
                        ? "Açıkla"
                        : "Düzelt"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-3 space-y-4">
            {result ? (
              <>
                {/* Code Block */}
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">Kod</CardTitle>
                        <Badge className={`${langInfo.bg} ${langInfo.color} border-0 text-xs`}>
                          {langInfo.icon} {langInfo.label}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-green-600" />
                            Kopyalandı
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Kopyala
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="code-block">
                      <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                        {result.code}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Explanation */}
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-pink-600" />
                      Açıklama
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground leading-relaxed">{result.explanation}</p>
                  </CardContent>
                </Card>

                {/* Errors */}
                {result.errors.length > 0 && (
                  <Card className="border-red-200 bg-red-50/50 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-4 h-4" />
                        Tespit Edilen Hatalar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.errors.map((error, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-red-800 bg-red-100/50 rounded-lg p-2"
                          >
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            {error}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Improvements */}
                {result.improvements.length > 0 && (
                  <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        İyileştirme Önerileri
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.improvements.map((imp, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-foreground"
                          >
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {imp}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-dashed border-2 border-border h-full min-h-[400px] flex items-center justify-center bg-white shadow-sm">
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
                    <Code2 className="w-8 h-8 text-pink-300" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Kod Bekleniyor</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Dil ve mod seçin, açıklama girin ve AI'ın kod üretmesini izleyin.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {["HTML", "CSS", "JS", "Python"].map((l) => (
                      <Badge key={l} variant="secondary" className="text-xs">
                        {l}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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

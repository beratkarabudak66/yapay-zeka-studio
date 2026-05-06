import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Presentation,
  Upload,
  Sparkles,
  Download,
  FileText,
  Image,
  Loader2,
  ChevronDown,
  ChevronUp,
  Wand2,
  FileDown,
} from "lucide-react";

type Slide = {
  slideNumber: number;
  heading: string;
  bullets: string[];
  notes: string;
};

type PresentationResult = {
  title: string;
  slides: Slide[];
  summary: string;
};

type ExampleFile = {
  name: string;
  url: string;
  description: string;
  icon: string;
};

const exampleFiles: ExampleFile[] = [
  {
    name: "Bilişim Teknolojileri Sunumu",
    url: "/manus-storage/Paragrafmetniniz_8a46d91b.pptx",
    description: "Profesyonel sunum örneği - Bilişim Teknolojileri Bölümü",
    icon: "📊",
  },
];

export default function PresentationTool() {
  const [inputText, setInputText] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<PresentationResult | null>(null);
  const [expandedSlides, setExpandedSlides] = useState<Set<number>>(new Set([1]));
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const improveMutation = trpc.presentation.improve.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setExpandedSlides(new Set([1]));
      toast.success("Sunum başarıyla iyileştirildi!");
    },
    onError: (err) => toast.error("Hata: " + err.message),
  });

  const generateImageMutation = trpc.presentation.generateImage.useMutation({
    onSuccess: (data) => {
      setGeneratedImage(data.url ?? null);
      toast.success("Görsel oluşturuldu!");
    },
    onError: (err) => toast.error("Görsel oluşturulamadı: " + err.message),
  });

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      // For PDF files, raw text may contain encoding artifacts
      const cleanText = text.replace(/[^\x20-\x7E\u00C0-\u024F\u0100-\u017E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
      setInputText(cleanText || text);
      if (file.type === "application/pdf") {
        toast.info("PDF yüklendi. Ham metin çıkarıldı. Daha iyi sonuç için metni yapıştırmanız önerilir.");
      } else {
        toast.info("Dosya yüklendi. AI ile iyileştirmek için butona tıklayın.");
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImprove = () => {
    if (!inputText.trim()) {
      toast.error("Lütfen metin girin veya dosya yükleyin.");
      return;
    }
    improveMutation.mutate({ text: inputText, fileName });
  };

  const toggleSlide = (num: number) => {
    setExpandedSlides((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const downloadAsText = () => {
    if (!result) return;
    let content = `# ${result.title}\n\n`;
    content += `**Özet:** ${result.summary}\n\n---\n\n`;
    result.slides.forEach((s) => {
      content += `## Slayt ${s.slideNumber}: ${s.heading}\n\n`;
      s.bullets.forEach((b) => (content += `- ${b}\n`));
      if (s.notes) content += `\n*Not: ${s.notes}*\n`;
      content += "\n";
    });
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.title.replace(/\s+/g, "_")}_sunum.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sunum indirildi!");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Presentation className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sunum Aracı</h1>
            <p className="text-muted-foreground text-sm">
              Metni veya PDF'i AI ile profesyonel sunuma dönüştür
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  İçerik Girişi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div
                  className="upload-zone cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    {fileName || "Dosya yükle"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">TXT, PDF desteklenir</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">veya</span>
                  <Separator className="flex-1" />
                </div>

                {/* Text Input */}
                <Textarea
                  placeholder="Sunum konunuzu buraya yazın... (örn: 'Yapay zekanın eğitimdeki rolü ve gelecekteki uygulamaları')"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={8}
                  className="resize-none text-sm"
                />

                <Button
                  className="w-full gap-2"
                  onClick={handleImprove}
                  disabled={improveMutation.isPending || !inputText.trim()}
                >
                  {improveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI İyileştiriyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI ile İyileştir
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Image Generator */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="w-4 h-4 text-purple-600" />
                  Görsel Üret
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Görsel açıklaması girin... (örn: 'Yapay zeka ve eğitim temalı modern illüstrasyon')"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    if (!imagePrompt.trim()) {
                      toast.error("Görsel açıklaması girin.");
                      return;
                    }
                    generateImageMutation.mutate({ prompt: imagePrompt });
                  }}
                  disabled={generateImageMutation.isPending}
                >
                  {generateImageMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Görsel Oluştur
                    </>
                  )}
                </Button>

                {generatedImage && (
                  <div className="space-y-2">
                    <img
                      src={generatedImage}
                      alt="Üretilen görsel"
                      className="w-full rounded-lg border border-border shadow-sm"
                    />
                    <a href={generatedImage} download="sunum-gorseli.png" target="_blank">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Download className="w-4 h-4" />
                        Görseli İndir
                      </Button>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Examples Section */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  Örnekler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {exampleFiles.map((example) => (
                  <div
                    key={example.name}
                    className="p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-2xl mb-2">{example.icon}</div>
                        <h4 className="font-medium text-foreground text-sm">{example.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{example.description}</p>
                      </div>
                    </div>
                    <a href={example.url} download className="mt-3 block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-xs"
                      >
                        <FileDown className="w-3 h-3" />
                        İndir
                      </Button>
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-3">          {result ? (
              <div className="space-y-4">
                {/* Summary Card */}
                <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-foreground mb-2">{result.title}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.summary}
                        </p>
                      </div>
                      <Badge className="bg-blue-600 text-white shrink-0">
                        {result.slides.length} Slayt
                      </Badge>
                    </div>
                    <Button
                      className="mt-4 gap-2"
                      size="sm"
                      variant="outline"
                      onClick={downloadAsText}
                    >
                      <Download className="w-4 h-4" />
                      Sunumu İndir
                    </Button>
                  </CardContent>
                </Card>

                {/* Slides */}
                <div className="space-y-3">
                  {result.slides.map((slide) => (
                    <Card key={slide.slideNumber} className="border-border shadow-sm overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                        onClick={() => toggleSlide(slide.slideNumber)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {slide.slideNumber}
                          </span>
                          <span className="font-semibold text-foreground text-sm">
                            {slide.heading}
                          </span>
                        </div>
                        {expandedSlides.has(slide.slideNumber) ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>

                      {expandedSlides.has(slide.slideNumber) && (
                        <CardContent className="pt-0 pb-4 px-4">
                          <Separator className="mb-3" />
                          <ul className="space-y-2 mb-3">
                            {slide.bullets.map((bullet, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                                {bullet}
                              </li>
                            ))}
                          </ul>
                          {slide.notes && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                              <span className="font-semibold">Konuşmacı Notu: </span>
                              {slide.notes}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border h-full min-h-[400px] flex items-center justify-center bg-white shadow-sm">
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <Presentation className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Sunum Hazır Değil</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Sol taraftan metin girin veya dosya yükleyin, ardından "AI ile İyileştir"
                    butonuna tıklayın.
                  </p>
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

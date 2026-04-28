import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Image,
  Sparkles,
  Download,
  Loader2,
  Wand2,
  CheckCircle2,
} from "lucide-react";

type StyleOption = {
  id: "modern" | "clean" | "educational" | "corporate";
  label: string;
  desc: string;
  emoji: string;
};

const styleOptions: StyleOption[] = [
  { id: "modern", label: "Modern", desc: "Cesur, yenilikçi tasarım", emoji: "⚡" },
  { id: "clean", label: "Temiz", desc: "Minimalist, zarif çizgiler", emoji: "✨" },
  { id: "educational", label: "Eğitimsel", desc: "Okul ve akademi temalı", emoji: "🎓" },
  { id: "corporate", label: "Kurumsal", desc: "Profesyonel, güvenilir", emoji: "🏢" },
];

export default function LogoGenerator() {
  const [brandName, setBrandName] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<StyleOption["id"]>("modern");
  const [description, setDescription] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const generateMutation = trpc.logo.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedUrl(data.url ?? null);
      toast.success("Logo başarıyla oluşturuldu!");
    },
    onError: (err) => toast.error("Logo oluşturulamadı: " + err.message),
  });

  const handleGenerate = () => {
    if (!brandName.trim()) {
      toast.error("Lütfen marka veya okul adını girin.");
      return;
    }
    generateMutation.mutate({
      brandName,
      style: selectedStyle,
      description: description || undefined,
    });
  };

  const handleDownload = async () => {
    if (!generatedUrl) return;
    try {
      const response = await fetch(generatedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${brandName.replace(/\s+/g, "_")}_logo.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Logo indirildi!");
    } catch {
      window.open(generatedUrl, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Image className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Logo Üreteci</h1>
            <p className="text-muted-foreground text-sm">
              AI ile profesyonel logolar oluştur ve indir
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-5">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-600" />
                  Logo Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Brand Name */}
                <div className="space-y-2">
                  <Label htmlFor="brandName" className="text-sm font-medium">
                    Marka / Okul Adı <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="brandName"
                    placeholder="örn: TechAkademi, Bilim Lisesi..."
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Style Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Logo Stili</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {styleOptions.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                          selectedStyle === style.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-border bg-white hover:border-purple-200 hover:bg-purple-50/30"
                        }`}
                      >
                        <span className="text-lg leading-none mt-0.5">{style.emoji}</span>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-semibold text-foreground">{style.label}</p>
                            {selectedStyle === style.id && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{style.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Ek Açıklama{" "}
                    <span className="text-muted-foreground font-normal">(isteğe bağlı)</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Renk tercihleri, semboller veya özel istekler... (örn: 'Mavi tonlar, kitap sembolü içersin')"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>

                <Button
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !brandName.trim()}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Logo Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Logo Oluştur
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="border-border bg-purple-50/50 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-purple-700 mb-2">💡 İpuçları</p>
                <ul className="space-y-1.5 text-xs text-purple-800/80">
                  <li>• Kısa ve akılda kalıcı isimler daha iyi sonuç verir</li>
                  <li>• Renk tercihlerini açıklamaya ekleyin</li>
                  <li>• Sektörünüzü belirtin (teknoloji, eğitim, sağlık...)</li>
                  <li>• Farklı stiller deneyerek en iyisini seçin</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div>
            <Card className="border-border shadow-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="w-4 h-4 text-purple-600" />
                  Logo Önizleme
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                {generateMutation.isPending ? (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto animate-pulse">
                      <Sparkles className="w-10 h-10 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">AI Logo Oluşturuyor</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Bu işlem 10-20 saniye sürebilir...
                      </p>
                    </div>
                    <div className="flex gap-1 justify-center">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                ) : generatedUrl ? (
                  <div className="w-full space-y-4">
                    {/* Logo Preview */}
                    <div className="relative group">
                      <div className="bg-white rounded-2xl border-2 border-border p-6 flex items-center justify-center shadow-inner">
                        <img
                          src={generatedUrl}
                          alt={`${brandName} logosu`}
                          className="max-w-full max-h-64 object-contain rounded-xl"
                        />
                      </div>
                      {/* Dark bg preview */}
                      <div className="bg-slate-900 rounded-2xl border-2 border-slate-700 p-6 flex items-center justify-center mt-3">
                        <img
                          src={generatedUrl}
                          alt={`${brandName} logosu (koyu)`}
                          className="max-w-full max-h-32 object-contain rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Brand Name Display */}
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{brandName}</p>
                      <p className="text-sm text-muted-foreground capitalize">{selectedStyle} stil</p>
                    </div>

                    {/* Download Buttons */}
                    <div className="grid grid-cols-1 gap-2">
                      <Button className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={handleDownload}>
                        <Download className="w-4 h-4" />
                        PNG İndir
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          setGeneratedUrl(null);
                          generateMutation.mutate({
                            brandName,
                            style: selectedStyle,
                            description: description || undefined,
                          });
                        }}
                        disabled={generateMutation.isPending}
                      >
                        <Sparkles className="w-4 h-4" />
                        Yeniden Oluştur
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="w-20 h-20 rounded-2xl bg-purple-50 border-2 border-dashed border-purple-200 flex items-center justify-center mx-auto">
                      <Image className="w-10 h-10 text-purple-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Logo Henüz Oluşturulmadı</p>
                      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                        Sol taraftan marka adını girin, stili seçin ve "Logo Oluştur" butonuna tıklayın.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

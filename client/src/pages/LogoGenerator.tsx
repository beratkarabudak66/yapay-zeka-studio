import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Download,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { addHistoryItem } from "@/lib/history";

type LogoStyle = {
  id: string;
  label: string;
  desc: string;
};

const logoStyles: LogoStyle[] = [
  { id: "geometric", label: "Geometrik", desc: "Keskin şekiller ve sembol" },
  { id: "minimal", label: "Minimal", desc: "Sade, az detay" },
  { id: "badge", label: "Rozet", desc: "Daire içinde marka adı" },
  { id: "modern", label: "Modern", desc: "Gradyan ve kalın tipografi" },
  { id: "tech", label: "Teknoloji", desc: "Kod/dijital temalı ikon" },
  { id: "elegant", label: "Zarif", desc: "İnce çizgi, serif tipografi" },
];

const colorPalettes = [
  { name: "Mavi", primary: "#2563eb", secondary: "#1e40af", accent: "#60a5fa" },
  { name: "Yeşil", primary: "#059669", secondary: "#047857", accent: "#34d399" },
  { name: "Turuncu", primary: "#ea580c", secondary: "#c2410c", accent: "#fb923c" },
  { name: "Mor", primary: "#7c3aed", secondary: "#6d28d9", accent: "#a78bfa" },
  { name: "Pembe", primary: "#db2777", secondary: "#be185d", accent: "#f472b6" },
  { name: "Siyah-Beyaz", primary: "#18181b", secondary: "#3f3f46", accent: "#a1a1aa" },
  { name: "Teal", primary: "#0d9488", secondary: "#0f766e", accent: "#2dd4bf" },
  { name: "Kırmızı", primary: "#dc2626", secondary: "#b91c1c", accent: "#f87171" },
];

type LogoResult = {
  svg: string;
  brandName: string;
  style: string;
  paletteName: string;
};

/** Generate initials from brand name */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function generateSVG(brandName: string, styleId: string, palette: typeof colorPalettes[0]): string {
  const initials = getInitials(brandName);
  const { primary, secondary, accent } = palette;
  const safeName = brandName.replace(/[<>&"']/g, "").trim() || "Brand";

  switch (styleId) {
    case "geometric": {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="400" height="200" fill="white"/>
  <polygon points="40,100 80,40 120,100 80,160" fill="${primary}"/>
  <polygon points="80,100 120,40 160,100 120,160" fill="${secondary}" opacity="0.8"/>
  <text x="190" y="95" font-family="Poppins, sans-serif" font-size="32" font-weight="700" fill="${primary}">${safeName}</text>
  <text x="190" y="125" font-family="Inter, sans-serif" font-size="14" font-weight="400" fill="${accent}">${safeName}</text>
  <rect x="190" y="135" width="60" height="3" fill="${accent}"/>
</svg>`;
    }
    case "minimal": {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="400" height="200" fill="white"/>
  <circle cx="60" cy="100" r="28" fill="none" stroke="${primary}" stroke-width="3"/>
  <circle cx="60" cy="100" r="10" fill="${primary}"/>
  <text x="110" y="108" font-family="Poppins, sans-serif" font-size="28" font-weight="600" fill="${primary}">${safeName}</text>
</svg>`;
    }
    case "badge": {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="400" height="200" fill="white"/>
  <circle cx="100" cy="100" r="60" fill="${primary}"/>
  <circle cx="100" cy="100" r="52" fill="none" stroke="${accent}" stroke-width="2"/>
  <text x="100" y="95" font-family="Poppins, sans-serif" font-size="22" font-weight="800" fill="white" text-anchor="middle">${initials}</text>
  <text x="100" y="118" font-family="Inter, sans-serif" font-size="9" font-weight="500" fill="${accent}" text-anchor="middle" letter-spacing="2">EST 2025</text>
  <text x="185" y="95" font-family="Poppins, sans-serif" font-size="24" font-weight="700" fill="${primary}">${safeName}</text>
  <rect x="185" y="108" width="120" height="2" fill="${secondary}"/>
  <text x="185" y="128" font-family="Inter, sans-serif" font-size="11" fill="${accent}">MARKA STÜDYOSU</text>
</svg>`;
    }
    case "modern": {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primary}"/>
      <stop offset="100%" style="stop-color:${secondary}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="200" fill="white"/>
  <rect x="30" y="60" width="60" height="80" rx="14" fill="url(#grad)"/>
  <text x="48" y="112" font-family="Poppins, sans-serif" font-size="28" font-weight="800" fill="white">${initials}</text>
  <text x="110" y="100" font-family="Poppins, sans-serif" font-size="30" font-weight="800" fill="${primary}">${safeName}</text>
  <rect x="110" y="115" width="180" height="4" rx="2" fill="url(#grad)"/>
  <text x="110" y="138" font-family="Inter, sans-serif" font-size="12" font-weight="500" fill="${accent}" letter-spacing="1">DIGITAL STUDIO</text>
</svg>`;
    }
    case "tech": {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="400" height="200" fill="white"/>
  <rect x="35" y="55" width="70" height="90" rx="8" fill="${primary}"/>
  <text x="42" y="80" font-family="Fira Code, monospace" font-size="10" fill="${accent}">&lt;/&gt;</text>
  <text x="42" y="100" font-family="Fira Code, monospace" font-size="10" fill="white">{ }</text>
  <text x="42" y="120" font-family="Fira Code, monospace" font-size="10" fill="${accent}">[ ]</text>
  <text x="125" y="95" font-family="Poppins, sans-serif" font-size="26" font-weight="700" fill="${primary}">${safeName}</text>
  <text x="125" y="120" font-family="Fira Code, monospace" font-size="11" fill="${secondary}">// tech solutions</text>
  <rect x="125" y="130" width="100" height="3" fill="${accent}"/>
</svg>`;
    }
    case "elegant": {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="400" height="200" fill="white"/>
  <line x1="60" y1="80" x2="60" y2="120" stroke="${primary}" stroke-width="2"/>
  <line x1="55" y1="100" x2="65" y2="100" stroke="${primary}" stroke-width="2"/>
  <text x="85" y="100" font-family="Playfair Display, serif" font-size="26" font-weight="700" font-style="italic" fill="${primary}">${safeName}</text>
  <line x1="85" y1="112" x2="290" y2="112" stroke="${accent}" stroke-width="1"/>
  <text x="85" y="130" font-family="Inter, sans-serif" font-size="9" font-weight="400" fill="${secondary}" letter-spacing="3">EST. 2025</text>
</svg>`;
    }
    default: {
      return generateSVG(brandName, "minimal", palette);
    }
  }
}

export default function LogoGenerator() {
  const [brandName, setBrandName] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("geometric");
  const [selectedPalette, setSelectedPalette] = useState(0);
  const [result, setResult] = useState<LogoResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerate = () => {
    if (!brandName.trim()) {
      toast.error("Lütfen marka adını girin.");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      const palette = colorPalettes[selectedPalette];
      const svg = generateSVG(brandName, selectedStyle, palette);
      const logoResult: LogoResult = {
        svg,
        brandName: brandName.trim(),
        style: logoStyles.find((s) => s.id === selectedStyle)?.label || selectedStyle,
        paletteName: palette.name,
      };
      setResult(logoResult);
      // Convert SVG to data URL for history
      const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
      addHistoryItem({
        toolType: "logo",
        outputUrl: dataUrl,
        metadata: JSON.stringify({ brandName: brandName.trim(), style: logoResult.style }),
      });
      setIsProcessing(false);
      toast.success("Logo oluşturuldu!");
    }, 500);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.brandName.replace(/\s+/g, "_")}_logo.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Logo indirildi!");
  };

  const handleDownloadPNG = () => {
    if (!result) return;
    const img = new Image();
    const svgBlob = new Blob([result.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${result.brandName.replace(/\s+/g, "_")}_logo.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
        toast.success("PNG indirildi!");
      }, "image/png");
    };
    img.src = url;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Logo Oluşturucu</h1>
            <p className="text-muted-foreground text-sm">
              Marka adını gir, stil ve renk seç — logon anında oluşsun
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Marka Bilgisi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Marka Adı
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="örn: SMG Studio"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Logo Stili
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {logoStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedStyle === style.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="font-semibold text-sm text-foreground">{style.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{style.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Renk Paleti
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorPalettes.map((pal, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPalette(idx)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                          selectedPalette === idx
                            ? "border-primary"
                            : "border-transparent hover:border-border"
                        }`}
                        title={pal.name}
                      >
                        <div className="flex gap-0.5">
                          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: pal.primary }} />
                          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: pal.secondary }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{pal.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleGenerate}
                  disabled={isProcessing || !brandName.trim()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Logo Oluştur
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-3">
            {result ? (
              <div className="space-y-4">
                <Card className="shadow-sm overflow-hidden">
                  <div className="bg-white p-8 flex items-center justify-center min-h-[240px]">
                    <div
                      className="max-w-full"
                      dangerouslySetInnerHTML={{ __html: result.svg }}
                    />
                  </div>
                  <CardContent className="p-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{result.style}</Badge>
                      <Badge variant="outline">{result.paletteName}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleDownload} className="gap-2">
                        <Download className="w-4 h-4" />
                        SVG
                      </Button>
                      <Button size="sm" onClick={handleDownloadPNG} className="gap-2">
                        <Download className="w-4 h-4" />
                        PNG
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm bg-purple-50/40">
                  <CardContent className="p-4">
                    <p className="text-xs text-purple-800/80">
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                      Logonuz SVG formatında oluşturuldu — istediğiniz boyuta ölçeklenebilir ve
                      kalite kaybı olmadan kullanılabilir. PNG olarak da indirebilirsiniz.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border h-full min-h-[300px] flex items-center justify-center bg-white shadow-sm">
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Logo Hazır Değil</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Marka adını gir, stil ve renk seç, ardından "Logo Oluştur" butonuna tıkla.
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
          <p>© 2025 SMG Yapay Zeka. Öğrenciler için tasarlandı.</p>
          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text" style={{fontFamily: "'Poppins', sans-serif", fontWeight: "800", letterSpacing: "-0.3px"}}>Made by @Beratkarabudak</span>
        </div>
      </footer>
    </div>
  );
}

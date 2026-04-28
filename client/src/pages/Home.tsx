import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Presentation,
  Image,
  Mic,
  Video,
  Code2,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Users,
  ChevronRight,
} from "lucide-react";

const tools = [
  {
    id: "presentation",
    href: "/presentation",
    icon: Presentation,
    label: "Sunum Aracı",
    description:
      "PDF veya metin yükle, AI ile yapı ve tasarımını iyileştir. Başlık, biçimlendirme ve görsel düzen önerileri al.",
    badge: "PDF & Slayt",
    color: "from-blue-500 to-blue-700",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    borderColor: "hover:border-blue-300",
  },
  {
    id: "logo",
    href: "/logo",
    icon: Image,
    label: "Logo Üreteci",
    description:
      "Okul veya marka adını gir, AI ile modern, temiz ve profesyonel logolar oluştur. PNG formatında indir.",
    badge: "PNG İndir",
    color: "from-purple-500 to-purple-700",
    bg: "bg-purple-50",
    iconColor: "text-purple-600",
    borderColor: "hover:border-purple-300",
  },
  {
    id: "voice",
    href: "/voice",
    icon: Mic,
    label: "Ses Değiştirici",
    description:
      "Ses veya video dosyası yükle, AI ile ses tonunu değiştir. Otomatik transkripsiyon ve içerik analizi.",
    badge: "Transkripsiyon",
    color: "from-emerald-500 to-emerald-700",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    borderColor: "hover:border-emerald-300",
  },
  {
    id: "video",
    href: "/video",
    icon: Video,
    label: "Video İyileştirici",
    description:
      "Video yükle, AI ile kalite artır. Parlaklık, netlik ve stabilizasyon önerileri. Otomatik altyazı üret.",
    badge: "Altyazı",
    color: "from-orange-500 to-orange-600",
    bg: "bg-orange-50",
    iconColor: "text-orange-600",
    borderColor: "hover:border-orange-300",
  },
  {
    id: "coding",
    href: "/coding",
    icon: Code2,
    label: "Kodlama Asistanı",
    description:
      "HTML, CSS, JS ve Python kod üret. Kodu sade dille açıkla, hataları bul ve iyileştirme önerileri al.",
    badge: "4 Dil",
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-50",
    iconColor: "text-pink-600",
    borderColor: "hover:border-pink-300",
  },
];

const features = [
  {
    icon: Zap,
    title: "Hızlı İşlem",
    desc: "Saniyeler içinde AI destekli sonuçlar",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    icon: Shield,
    title: "Güvenli Depolama",
    desc: "Dosyalarınız şifreli olarak saklanır",
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    icon: Users,
    title: "Öğrenci Dostu",
    desc: "Sezgisel arayüz, kolay kullanım",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-50/80 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 right-10 w-32 h-32 bg-purple-100/60 rounded-full blur-2xl" />
          <div className="absolute top-32 left-10 w-24 h-24 bg-emerald-100/60 rounded-full blur-2xl" />
        </div>

        <div className="container relative text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Öğrenciler için AI Platformu
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Yapay Zeka ile{" "}
            <span className="gradient-text">Üretkenliğini</span>
            <br />
            Bir Üst Seviyeye Taşı
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Sunum hazırla, logo üret, ses ve video düzenle, kod yaz — hepsi tek platformda,
            tek tıkla. Öğrenciler için tasarlanmış güçlü AI araçları.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/presentation">
              <Button size="lg" className="gap-2 px-8 shadow-lg shadow-primary/25">
                Hemen Başla
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#tools">
              <Button variant="outline" size="lg" className="gap-2 px-8">
                Araçları Keşfet
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground text-base">5</span> AI Araç
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground text-base">100%</span> Ücretsiz
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground text-base">4</span> Programlama Dili
            </div>
          </div>
        </div>
      </section>

      {/* ── Tools Grid ─────────────────────────────────────────────────── */}
      <section id="tools" className="py-16 bg-slate-50/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">AI Araçlarımız</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Her araç, öğrencilerin ihtiyaçlarına özel olarak tasarlandı.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.id} href={tool.href}>
                  <Card
                    className={`tool-card h-full border-2 border-border ${tool.borderColor} cursor-pointer bg-white shadow-sm`}
                  >
                    <CardContent className="p-6 flex flex-col h-full">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl ${tool.bg} flex items-center justify-center mb-4 shadow-sm`}
                      >
                        <Icon className={`w-6 h-6 ${tool.iconColor}`} />
                      </div>

                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-foreground">{tool.label}</h3>
                        <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                          {tool.badge}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">
                        {tool.description}
                      </p>

                      {/* CTA */}
                      <div
                        className={`flex items-center gap-2 text-sm font-medium bg-gradient-to-r ${tool.color} bg-clip-text text-transparent`}
                      >
                        Kullanmaya Başla
                        <ArrowRight className="w-4 h-4 text-current" style={{ color: "inherit" }} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}

            {/* Coming Soon card */}
            <Card className="border-2 border-dashed border-border bg-slate-50/50 flex items-center justify-center min-h-[220px]">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">Yakında Yeni Araçlar</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Daha fazlası geliyor...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-border shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 bg-slate-50/50">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">Yapay Zeka Stüdyo</span>
          </div>
          <p>© 2025 Yapay Zeka Stüdyo. Öğrenciler için tasarlandı.</p>
        </div>
      </footer>
    </div>
  );
}

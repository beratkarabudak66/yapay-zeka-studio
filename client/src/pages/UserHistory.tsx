import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Output } from "@/../../drizzle/schema";
import {
  FileText,
  Image,
  Mic,
  Video,
  Code,
  Eye,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type ToolType = "presentation" | "logo" | "voice" | "video" | "coding" | "video-test";

const toolIcons: Record<ToolType, React.ReactNode> = {
  presentation: <FileText className="w-5 h-5" />,
  logo: <Image className="w-5 h-5" />,
  voice: <Mic className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  coding: <Code className="w-5 h-5" />,
  "video-test": <Eye className="w-5 h-5" />,
};

const toolNames: Record<ToolType, string> = {
  presentation: "Sunum",
  logo: "Logo",
  voice: "Ses",
  video: "Video",
  coding: "Kodlama",
  "video-test": "Video Test",
};

const toolColors: Record<ToolType, string> = {
  presentation: "bg-blue-100 text-blue-700",
  logo: "bg-purple-100 text-purple-700",
  voice: "bg-green-100 text-green-700",
  video: "bg-red-100 text-red-700",
  coding: "bg-orange-100 text-orange-700",
  "video-test": "bg-pink-100 text-pink-700",
};

export default function UserHistory() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedOutput, setSelectedOutput] = useState<number | null>(null);

  const outputsQuery = trpc.outputs.getUserOutputs.useQuery(undefined, {
    enabled: !!user,
  });

  // Yetki kontrolü
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
      toast.error("Bu sayfaya erişmek için giriş yapmalısınız");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const outputs = outputsQuery.data || [];

  // Araçlara göre grupla
  const groupedByTool: Record<ToolType, Output[]> = outputs.reduce(
    (acc: Record<ToolType, Output[]>, output: Output) => {
      const tool = output.toolType as ToolType;
      if (!acc[tool]) acc[tool] = [];
      acc[tool].push(output);
      return acc;
    },
    {} as Record<ToolType, Output[]>
  );

  const handleDownload = (output: Output) => {
    if (output.outputUrl) {
      const link = document.createElement("a");
      link.href = output.outputUrl;
      link.download = `${output.toolType}-${output.id}`;
      link.click();
      toast.success("İndirme başladı");
    } else {
      toast.error("İndirilebilir dosya bulunamadı");
    }
  };

  const renderMetadata = (metadata: string | null, toolType: ToolType): React.ReactNode => {
    if (!metadata) return null;

    try {
      const data = JSON.parse(metadata);

      if (toolType === "presentation") {
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Başlık: {data.title}</p>
            <p className="text-sm text-muted-foreground">
              Slayt Sayısı: {data.slides?.length || 0}
            </p>
            {data.summary && (
              <p className="text-sm text-muted-foreground line-clamp-2">{data.summary}</p>
            )}
          </div>
        );
      }

      if (toolType === "logo") {
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Marka: {data.brandName}
            </p>
            <p className="text-sm text-muted-foreground">Stil: {data.style}</p>
          </div>
        );
      }

      if (toolType === "voice") {
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Transkripsiyon: {data.transcription?.substring(0, 50)}...
            </p>
            {data.analysis && (
              <p className="text-sm text-muted-foreground">
                Ton: {data.analysis.tone}
              </p>
            )}
          </div>
        );
      }

      if (toolType === "video") {
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Özet: {data.summary?.substring(0, 50)}...
            </p>
            <p className="text-sm text-muted-foreground">
              Konular: {data.topics?.join(", ") || "Yok"}
            </p>
          </div>
        );
      }

      if (toolType === "coding") {
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Dil: {data.language || "Bilinmiyor"}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {data.explanation?.substring(0, 50)}...
            </p>
          </div>
        );
      }

      if (toolType === "video-test") {
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Sonuç: {data.isAI ? "Yapay Zeka" : "İnsan"}
            </p>
            <p className="text-sm text-muted-foreground">
              Güven: {data.confidence ? `${Math.round(data.confidence * 100)}%` : "Yok"}
            </p>
          </div>
        );
      }
    } catch (error) {
      console.error("Metadata parse hatası:", error);
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-border bg-white sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Geçmiş</h1>
              <p className="text-muted-foreground mt-1">
                Tüm araçlarınızdan oluşturulan çıktıları görüntüleyin
              </p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Ana Sayfa
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12">
        {outputs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Henüz hiçbir çıktı oluşturmadınız
              </p>
              <Button onClick={() => setLocation("/")} variant="default">
                Araçlara Git
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {(Object.entries(groupedByTool) as [ToolType, Output[]][]).map(([tool, toolOutputs]) => (
              <div key={tool}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-primary">
                    {toolIcons[tool as ToolType]}
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {toolNames[tool as ToolType]}
                  </h2>
                  <Badge variant="secondary" className="ml-auto">
                    {toolOutputs.length} çıktı
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {toolOutputs.map((output: Output) => (
                    <Card
                      key={output.id}
                      className={`cursor-pointer transition-all ${
                        selectedOutput === output.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() =>
                        setSelectedOutput(
                          selectedOutput === output.id ? null : output.id
                        )
                      }
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                className={toolColors[tool as ToolType]}
                                variant="secondary"
                              >
                                {toolNames[tool as ToolType]}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {new Date(output.createdAt).toLocaleDateString(
                                  "tr-TR"
                                )}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(output.createdAt).toLocaleTimeString(
                                  "tr-TR"
                                )}
                              </span>
                            </div>
                          </div>
                          {output.outputUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(output);
                              }}
                            >
                              <Download className="w-4 h-4 text-primary" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>

                      {selectedOutput === output.id && (
                        <CardContent className="pt-0 pb-6 border-t border-border">
                          <div className="mt-4 space-y-4">
                            {renderMetadata(output.metadata, tool as ToolType)}

                            {output.outputUrl && (
                              <div className="pt-4 border-t border-border">
                                <p className="text-sm font-medium text-foreground mb-2">
                                  Çıktı
                                </p>
                                {tool === "logo" && (
                                  <img
                                    src={output.outputUrl}
                                    alt="Logo"
                                    className="w-32 h-32 object-contain rounded"
                                  />
                                )}
                                {(tool === "voice" || tool === "video") && (
                                  <a
                                    href={output.outputUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-2"
                                  >
                                    <Download className="w-4 h-4" />
                                    Dosyayı Aç
                                  </a>
                                )}
                              </div>
                            )}

                            {(tool === "presentation" || tool === "coding") && output.metadata && (
                              <div className="pt-4 border-t border-border">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    try {
                                      const data = JSON.parse(output.metadata || "{}");
                                      let content = "";
                                      let filename = "";

                                      if (tool === "presentation") {
                                        content = JSON.stringify(data, null, 2);
                                        filename = `sunum-${output.id}.json`;
                                      } else if (tool === "coding") {
                                        content = data.code || data.explanation || JSON.stringify(data, null, 2);
                                        filename = `kod-${output.id}.txt`;
                                      }

                                      if (content) {
                                        const blob = new Blob([content], { type: "text/plain" });
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement("a");
                                        link.href = url;
                                        link.download = filename;
                                        link.click();
                                        URL.revokeObjectURL(url);
                                        toast.success("İndirme başladı");
                                      }
                                    } catch (error) {
                                      console.error("İndirme hatası:", error);
                                      toast.error("İndirme başarısız oldu");
                                    }
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Metadata İndir
                                </Button>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {new Date(output.createdAt).toLocaleString(
                                "tr-TR"
                              )}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-white mt-12">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">SMG Yapay Zeka</span>
          </div>
          <span
            className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: "800",
              letterSpacing: "-0.3px",
              fontSize: "14px",
            }}
          >
            ✨ Made by @Beratkarabudak
          </span>
        </div>
      </footer>
    </div>
  );
}

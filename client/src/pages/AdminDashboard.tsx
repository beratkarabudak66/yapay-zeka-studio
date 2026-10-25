import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Mail, MessageSquare, Calendar, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Feedback = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: feedbacks = [], isLoading } = useQuery<Feedback[]>({
    queryKey: ["feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("feedbacks").delete().eq("id", id);
      if (error) throw error;
      toast.success("Geri bildirim silindi");
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
    } catch {
      toast.error("Silme işlemi başarısız oldu");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-border bg-white sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Geri bildirimleri yönet</p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Ana Sayfa
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Toplam Geri Bildirim</p>
                  <p className="text-3xl font-bold text-foreground">{feedbacks.length}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bu Ay</p>
                  <p className="text-3xl font-bold text-foreground">
                    {feedbacks.filter((f) => {
                      const date = new Date(f.created_at);
                      const now = new Date();
                      return (
                        date.getMonth() === now.getMonth() &&
                        date.getFullYear() === now.getFullYear()
                      );
                    }).length}
                  </p>
                </div>
                <Calendar className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Benzersiz Gönderenler</p>
                  <p className="text-3xl font-bold text-foreground">
                    {new Set(feedbacks.map((f) => f.email)).size}
                  </p>
                </div>
                <Mail className="w-10 h-10 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedbacks List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground mb-6">Geri Bildirimler</h2>

          {feedbacks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Henüz geri bildirim yok</p>
              </CardContent>
            </Card>
          ) : (
            feedbacks.map((feedback) => (
              <Card
                key={feedback.id}
                className={`cursor-pointer transition-all ${
                  selectedFeedback === feedback.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() =>
                  setSelectedFeedback(selectedFeedback === feedback.id ? null : feedback.id)
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{feedback.subject}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {new Date(feedback.created_at).toLocaleDateString("tr-TR")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{feedback.email}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(feedback.id);
                      }}
                      disabled={deletingId === feedback.id}
                    >
                      {deletingId === feedback.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {selectedFeedback === feedback.id && (
                  <CardContent className="pt-0 pb-6 border-t border-border">
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Gönderen</p>
                        <p className="text-sm text-muted-foreground">{feedback.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Mesaj</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {feedback.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border">
                        <Calendar className="w-4 h-4" />
                        {new Date(feedback.created_at).toLocaleString("tr-TR")}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-white mt-12">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">SMG Yapay Zeka Admin</span>
          </div>
          <span
            className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text"
            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: "800", letterSpacing: "-0.3px", fontSize: "14px" }}
          >
            ✨ Made by @Beratkarabudak
          </span>
        </div>
      </footer>
    </div>
  );
}

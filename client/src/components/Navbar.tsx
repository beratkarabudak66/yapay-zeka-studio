import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Presentation,
  Image,
  Mic,
  Video,
  Code2,
  Sparkles,
  LogOut,
  LogIn,
  Menu,
  X,
  History,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const tools = [
  { label: "Sunum", href: "/presentation", icon: Presentation, color: "text-blue-600" },
  { label: "Logo", href: "/logo", icon: Image, color: "text-purple-600" },
  { label: "Ses", href: "/voice", icon: Mic, color: "text-emerald-600" },
  { label: "Video", href: "/video", icon: Video, color: "text-orange-600" },
  { label: "Kod", href: "/coding", icon: Code2, color: "text-pink-600" },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:block">
              Yapay Zeka <span className="gradient-text">Stüdyo</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = location === tool.href;
              return (
                <Link key={tool.href} href={tool.href}>
                  <button
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-primary" : tool.color}`} />
                    {tool.label}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* History & Admin Links */}
          {isAuthenticated && user && (
            <div className="hidden md:flex items-center gap-1">
              <Link href="/history">
                <button
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location === "/history"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <History className="w-4 h-4" />
                  Geçmiş
                </button>
              </Link>
              {user.role === "admin" && (
                <Link href="/admin/feedbacks">
                  <button
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location === "/admin/feedbacks"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </button>
                </Link>
              )}
            </div>
          )}

          {/* Auth */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
                  {user.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => (window.location.href = getLoginUrl())}
                className="gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Giriş Yap</span>
              </Button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menü"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <div className="container py-3 flex flex-col gap-1">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = location === tool.href;
              return (
                <Link key={tool.href} href={tool.href}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-primary" : tool.color}`} />
                    {tool.label}
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

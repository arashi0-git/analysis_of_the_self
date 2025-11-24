"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    logout();
  };

  // Don't show header on login/register pages
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="text-xl font-bold text-primary">
            自己分析AI
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`transition-colors ${
                isActive("/")
                  ? "text-primary font-semibold"
                  : "text-foreground hover:text-primary"
              }`}
            >
              ホーム
            </Link>
            <Link
              href="/questionnaire"
              className={`transition-colors ${
                isActive("/questionnaire")
                  ? "text-primary font-semibold"
                  : "text-foreground hover:text-primary"
              }`}
            >
              質問回答
            </Link>
            <Link
              href="/analysis"
              className={`transition-colors ${
                isActive("/analysis")
                  ? "text-primary font-semibold"
                  : "text-foreground hover:text-primary"
              }`}
            >
              分析結果
            </Link>
            <Link
              href="/chat"
              className={`transition-colors ${
                isActive("/chat")
                  ? "text-primary font-semibold"
                  : "text-foreground hover:text-primary"
              }`}
            >
              チャット
            </Link>
          </nav>

          {/* User Menu */}
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground/70">{user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-muted hover:bg-border rounded-lg transition-colors"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

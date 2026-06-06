"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  RotateCcw,
  ScanText,
  User,
  LogOut,
  Zap,
  Sun,
  Moon,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/words", label: "單字庫", icon: BookOpen },
  { href: "/quiz", label: "每日測驗", icon: Brain },
  { href: "/review", label: "複習", icon: RotateCcw },
  { href: "/ocr", label: "OCR 辨識", icon: ScanText },
  { href: "/profile", label: "個人資料", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-brand-500 to-blue-600 bg-clip-text text-transparent">
            VocabAI
          </span>
        </div>
        <button
          onClick={toggleDark}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        {user && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          登出
        </button>
      </div>
    </aside>
  );
}

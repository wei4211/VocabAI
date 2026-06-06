"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { Zap, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("登入成功！");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "登入失敗，請確認帳號密碼");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-500 via-blue-600 to-purple-700 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 100 + 20,
                height: Math.random() * 100 + 20,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5,
              }}
            />
          ))}
        </div>
        <div className="relative text-center text-white">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
              <Zap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">VocabAI</h1>
          <p className="text-blue-100 text-lg mb-8">AI 智慧英文單字學習平台</p>
          <div className="space-y-4 text-left">
            {["🤖 AI 自動產生單字卡", "🧠 間隔複習系統", "📊 每日 & 每週測驗", "📱 多平台支援"].map((f) => (
              <div key={f} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <span className="text-white text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-brand-500">VocabAI</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">歡迎回來 👋</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">登入以繼續學習</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">密碼</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  登入中...
                </span>
              ) : (
                "登入"
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 dark:text-gray-400 mt-6 text-sm">
            還沒有帳號？{" "}
            <Link href="/auth/register" className="text-brand-500 font-semibold hover:underline">
              立即註冊
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

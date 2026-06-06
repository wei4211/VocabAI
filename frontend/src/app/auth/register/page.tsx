"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { Zap, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("密碼至少需要 6 個字元");
      return;
    }
    try {
      await register(email, username, password);
      toast.success("註冊成功！歡迎加入 VocabAI 🎉");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "註冊失敗");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 p-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-500 to-blue-600 bg-clip-text text-transparent">VocabAI</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">建立帳號</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">開始你的 AI 單字學習之旅</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">使用者名稱</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field pl-12"
                  placeholder="vocablearner"
                  required
                />
              </div>
            </div>

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
                  placeholder="••••••••（至少 6 個字元）"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
              {isLoading ? "建立帳號中..." : "建立帳號"}
            </button>
          </form>

          <p className="text-center text-gray-500 dark:text-gray-400 mt-5 text-sm">
            已有帳號？{" "}
            <Link href="/auth/login" className="text-brand-500 font-semibold hover:underline">
              登入
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

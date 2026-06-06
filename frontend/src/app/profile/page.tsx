"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { authApi, api } from "@/lib/api";
import toast from "react-hot-toast";
import { User, Mail, Lock, Save, MessageCircle, CheckCircle, RefreshCw } from "lucide-react";

export default function ProfilePage() {
  const { user, loadFromStorage } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lineStatus, setLineStatus] = useState<{ is_bound: boolean } | null>(null);
  const [bindCode, setBindCode] = useState<{ code: string; expires_in_minutes: number } | null>(null);
  const [lineLoading, setLineLoading] = useState(false);

  useEffect(() => {
    api.get("/line/bind-status").then((res) => setLineStatus(res.data)).catch(() => {});
  }, []);

  const handleGenerateCode = async () => {
    setLineLoading(true);
    try {
      const res = await api.post("/line/generate-bind-code");
      setBindCode(res.data);
    } catch {
      toast.error("產生失敗");
    } finally {
      setLineLoading(false);
    }
  };

  const handleUnbind = async () => {
    if (!confirm("確定要解除 LINE 綁定？")) return;
    try {
      await api.delete("/line/unbind");
      setLineStatus({ is_bound: false });
      setBindCode(null);
      toast.success("已解除綁定");
    } catch {
      toast.error("解除失敗");
    }
  };
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      toast.error("密碼不一致");
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, string> = {};
      if (form.username !== user?.username) payload.username = form.username;
      if (form.email !== user?.email) payload.email = form.email;
      if (form.password) payload.password = form.password;

      if (Object.keys(payload).length === 0) {
        toast("沒有變更", { icon: "ℹ️" });
        return;
      }

      const res = await authApi.updateMe(payload);
      localStorage.setItem("user", JSON.stringify(res.data));
      loadFromStorage();
      toast.success("個人資料已更新");
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "更新失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl animate-slide-up">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">個人資料</h1>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{user?.username}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
            <p className="text-brand-500 text-sm font-medium mt-1">🔥 {user?.streak_days} 天連續學習</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">使用者名稱</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input-field pl-12"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field pl-12"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">修改密碼（選填）</p>
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pl-12"
                  placeholder="新密碼"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="input-field pl-12"
                  placeholder="確認新密碼"
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            <Save className="w-5 h-5" />
            {loading ? "儲存中..." : "儲存變更"}
          </button>
        </form>

        {/* LINE 綁定 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">LINE Bot 綁定</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">綁定後可直接用 LINE 傳單字</p>
            </div>
            {lineStatus?.is_bound && (
              <span className="ml-auto flex items-center gap-1 text-green-500 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> 已綁定
              </span>
            )}
          </div>

          {lineStatus?.is_bound ? (
            <button onClick={handleUnbind} className="text-sm text-red-500 hover:underline">
              解除綁定
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleGenerateCode}
                disabled={lineLoading}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${lineLoading ? "animate-spin" : ""}`} />
                產生綁定碼
              </button>

              {bindCode && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    在 LINE Bot 傳送以下指令（{bindCode.expires_in_minutes} 分鐘內有效）：
                  </p>
                  <div
                    className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 font-mono text-lg font-bold text-green-600 dark:text-green-400 tracking-widest cursor-pointer text-center border border-green-200 dark:border-green-700"
                    onClick={() => {
                      navigator.clipboard.writeText(`BIND ${bindCode.code}`);
                      toast.success("已複製！");
                    }}
                  >
                    BIND {bindCode.code}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">點擊複製</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

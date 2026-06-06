"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { wordsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewWordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    word: "",
    meaning: "",
    part_of_speech: "",
    example_sentence: "",
    synonyms: "",
    antonyms: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.word.trim()) return;
    setLoading(true);
    try {
      await wordsApi.create({ ...form, source: "manual" });
      toast.success(`「${form.word}」已新增！AI 正在產生單字卡... ✨`);
      router.push("/words");
    } catch (err: any) {
      const detail = err.response?.data?.detail || "";
      if (detail.includes("already exists")) {
        toast.error(`「${form.word}」已在你的單字庫中`, { icon: "⚠️" });
      } else {
        toast.error(detail || "新增失敗");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl animate-slide-up">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/words" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">新增單字</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              只需輸入單字，AI 會自動填充其他欄位
            </p>
          </div>
        </div>

        {/* AI Hint */}
        <div className="bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 border border-brand-100 dark:border-brand-800 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-brand-700 dark:text-brand-300">AI 自動產生</p>
            <p className="text-sm text-brand-600 dark:text-brand-400 mt-0.5">
              只要輸入英文單字，AI 會自動產生中文解釋、詞性、例句、同義詞和反義詞。
              也可以手動填寫覆蓋 AI 的結果。
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              英文單字 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.word}
              onChange={(e) => setForm({ ...form, word: e.target.value })}
              className="input-field text-lg font-semibold"
              placeholder="e.g. sustain"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                中文解釋 <span className="text-gray-400 font-normal">（選填，AI 自動產生）</span>
              </label>
              <input
                type="text"
                value={form.meaning}
                onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                className="input-field"
                placeholder="維持；支撐"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">詞性</label>
              <select
                value={form.part_of_speech}
                onChange={(e) => setForm({ ...form, part_of_speech: e.target.value })}
                className="input-field"
              >
                <option value="">選擇詞性</option>
                <option value="noun">名詞 (noun)</option>
                <option value="verb">動詞 (verb)</option>
                <option value="adjective">形容詞 (adjective)</option>
                <option value="adverb">副詞 (adverb)</option>
                <option value="preposition">介詞 (preposition)</option>
                <option value="conjunction">連接詞 (conjunction)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">英文例句</label>
            <textarea
              value={form.example_sentence}
              onChange={(e) => setForm({ ...form, example_sentence: e.target.value })}
              className="input-field resize-none"
              rows={2}
              placeholder="She could not sustain the pace."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">同義詞</label>
              <input
                type="text"
                value={form.synonyms}
                onChange={(e) => setForm({ ...form, synonyms: e.target.value })}
                className="input-field"
                placeholder="maintain, support"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">反義詞</label>
              <input
                type="text"
                value={form.antonyms}
                onChange={(e) => setForm({ ...form, antonyms: e.target.value })}
                className="input-field"
                placeholder="abandon, neglect"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {loading ? "新增中..." : "新增單字"}
            </button>
            <Link href="/words" className="btn-secondary">取消</Link>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

"use client";
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { wordsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { ArrowLeft, Sparkles, CheckCircle, XCircle, Loader } from "lucide-react";
import Link from "next/link";

interface Result {
  word: string;
  status: "success" | "duplicate" | "error";
}

export default function BatchAddPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  const parseWords = (input: string): string[] => {
    return input
      .split(/[\n,，、\s]+/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0 && /^[a-zA-Z\-]+$/.test(w));
  };

  const handleSubmit = async () => {
    const words = parseWords(text);
    if (words.length === 0) {
      toast.error("請輸入英文單字");
      return;
    }
    if (words.length > 50) {
      toast.error("一次最多 50 個單字");
      return;
    }

    setLoading(true);
    setResults([]);
    const newResults: Result[] = [];

    for (const word of words) {
      try {
        await wordsApi.create({ word, source: "manual" });
        newResults.push({ word, status: "success" });
      } catch (err: any) {
        const detail = err.response?.data?.detail || "";
        if (detail.includes("already exists")) {
          newResults.push({ word, status: "duplicate" });
        } else {
          newResults.push({ word, status: "error" });
        }
      }
      setResults([...newResults]);
    }

    setLoading(false);
    const successCount = newResults.filter((r) => r.status === "success").length;
    toast.success(`完成！成功新增 ${successCount} 個單字`);
  };

  const preview = parseWords(text);

  return (
    <AppLayout>
      <div className="max-w-2xl animate-slide-up">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/words" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">批次新增單字</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">一次貼上多個單字，AI 自動產生解釋</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            輸入單字（換行、逗號、空格分隔）
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input-field resize-none"
            rows={8}
            placeholder={"sustain\nabandon\npersevere\n或者 sustain, abandon, persevere"}
            disabled={loading}
          />
          {preview.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              偵測到 <span className="font-semibold text-brand-500">{preview.length}</span> 個單字
            </p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || preview.length === 0}
          className="btn-primary flex items-center gap-2 mb-8 disabled:opacity-50"
        >
          {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {loading ? `新增中 (${results.length}/${preview.length})...` : "開始新增"}
        </button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">新增結果</h3>
            {results.map((r) => (
              <div key={r.word} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                {r.status === "success" && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                {r.status === "duplicate" && <XCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
                {r.status === "error" && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                <span className="font-medium text-gray-900 dark:text-white">{r.word}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                  {r.status === "success" && "已新增"}
                  {r.status === "duplicate" && "已存在"}
                  {r.status === "error" && "新增失敗"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

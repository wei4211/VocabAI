"use client";
import { useEffect, useState, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { wordsApi } from "@/lib/api";
import { Word } from "@/types";
import Link from "next/link";
import toast from "react-hot-toast";
import { cn, getReviewLevelLabel, getReviewLevelColor, formatDate } from "@/lib/utils";
import { Plus, Search, Trash2, Edit, RefreshCw, BookOpen, Volume2 } from "lucide-react";

function speakWord(word: string) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = "en-US";
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

const SOURCES = ["all", "manual", "ocr", "extension", "line"] as const;
type SourceFilter = typeof SOURCES[number];

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wordsApi.list({
        page,
        page_size: 20,
        search: search || undefined,
        source: source !== "all" ? source : undefined,
      });
      setWords(res.data.items);
      setTotal(res.data.total);
    } catch {
      toast.error("載入單字失敗");
    } finally {
      setLoading(false);
    }
  }, [page, search, source]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async (id: number, word: string) => {
    if (!confirm(`確定要刪除「${word}」？`)) return;
    try {
      await wordsApi.delete(id);
      toast.success("單字已刪除");
      fetchWords();
    } catch {
      toast.error("刪除失敗");
    }
  };

  const handleRegenerateAI = async (id: number) => {
    try {
      await wordsApi.regenerateAI(id);
      toast.success("AI 已重新產生單字卡");
      fetchWords();
    } catch {
      toast.error("重新產生失敗");
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">單字庫</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">共 {total} 個單字</p>
          </div>
          <div className="flex gap-2">
            <Link href="/words/batch" className="btn-secondary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              批次新增
            </Link>
            <Link href="/words/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              新增單字
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜尋單字..."
                className="input-field pl-12"
              />
            </div>
            <button type="submit" className="btn-secondary px-4">搜尋</button>
          </form>
          <div className="flex gap-2">
            {SOURCES.map((s) => (
              <button
                key={s}
                onClick={() => { setSource(s); setPage(1); }}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  source === s
                    ? "bg-brand-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                )}
              >
                {s === "all" ? "全部" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Word List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse border border-gray-100 dark:border-gray-700">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-48" />
              </div>
            ))}
          </div>
        ) : words.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">還沒有單字</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">新增你第一個單字開始學習！</p>
            <Link href="/words/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              新增單字
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {words.map((word) => (
              <div
                key={word.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Link href={`/words/${word.id}`} className="text-xl font-bold text-gray-900 dark:text-white hover:text-brand-500 transition-colors">
                        {word.word}
                      </Link>
                      <button
                        onClick={() => speakWord(word.word)}
                        className="p-1 text-gray-400 hover:text-brand-500 transition-colors"
                        title="播放發音"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      {word.part_of_speech && (
                        <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                          {word.part_of_speech}
                        </span>
                      )}
                      <span className={cn("text-xs text-white px-2 py-0.5 rounded-full font-medium", getReviewLevelColor(word.review_level))}>
                        {getReviewLevelLabel(word.review_level)}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                        {word.source}
                      </span>
                    </div>
                    {word.meaning && (
                      <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{word.meaning}</p>
                    )}
                    {word.example_sentence && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm italic">"{word.example_sentence}"</p>
                    )}
                    {(word.synonyms || word.antonyms) && (
                      <div className="flex gap-4 mt-2 text-sm">
                        {word.synonyms && <span className="text-green-600 dark:text-green-400">同: {word.synonyms}</span>}
                        {word.antonyms && <span className="text-red-500 dark:text-red-400">反: {word.antonyms}</span>}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">{formatDate(word.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                    <button
                      onClick={() => handleRegenerateAI(word.id)}
                      className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-xl transition-all"
                      title="AI 重新產生"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/words/${word.id}/edit`}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(word.id, word.word)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="btn-secondary px-4 py-2 disabled:opacity-50"
            >
              上一頁
            </button>
            <span className="flex items-center px-4 text-gray-600 dark:text-gray-400 text-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="btn-secondary px-4 py-2 disabled:opacity-50"
            >
              下一頁
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

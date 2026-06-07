"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { wordsApi } from "@/lib/api";
import { Word } from "@/types";
import { cn, getReviewLevelLabel, getReviewLevelColor, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, RefreshCw, Volume2 } from "lucide-react";

function speakWord(word: string) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = "en-US";
  utter.rate = 0.85;
  utter.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes("Samantha") ||
    v.name.includes("Karen") ||
    v.name.includes("Daniel") ||
    v.name.includes("Google US English") ||
    v.name.includes("Microsoft Aria")
  );
  if (preferred) utter.voice = preferred;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export default function WordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wordsApi.get(id)
      .then((res) => setWord(res.data))
      .catch(() => toast.error("載入失敗"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!word || !confirm(`確定要刪除「${word.word}」？`)) return;
    await wordsApi.delete(id);
    toast.success("已刪除");
    router.push("/words");
  };

  const handleRegenerate = async () => {
    try {
      const res = await wordsApi.regenerateAI(id);
      setWord(res.data);
      toast.success("AI 已重新產生");
    } catch {
      toast.error("重新產生失敗");
    }
  };

  if (loading) return <AppLayout><div className="animate-pulse text-gray-400">載入中...</div></AppLayout>;
  if (!word) return <AppLayout><div className="text-gray-400">找不到單字</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/words" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">單字詳情</h1>
        </div>

        {/* Word Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 mb-6">
          {/* Word + 發音 */}
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white">{word.word}</h2>
            <button
              onClick={() => speakWord(word.word)}
              className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center text-brand-500 hover:bg-brand-100 transition-all"
              title="播放發音"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>

          {/* 標籤 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {word.part_of_speech && (
              <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                {word.part_of_speech}
              </span>
            )}
            <span className={cn("text-white px-3 py-1 rounded-full text-sm font-medium", getReviewLevelColor(word.review_level))}>
              {getReviewLevelLabel(word.review_level)}
            </span>
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full text-sm">
              {word.source}
            </span>
          </div>

          {/* 中文解釋 */}
          {word.meaning && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">中文解釋</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{word.meaning}</p>
            </div>
          )}

          {/* 例句 */}
          {word.example_sentence && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 mb-4">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">例句</p>
              <p className="text-gray-700 dark:text-gray-300 italic text-lg">"{word.example_sentence}"</p>
              <button
                onClick={() => speakWord(word.example_sentence!)}
                className="mt-2 text-blue-400 hover:text-blue-500 flex items-center gap-1 text-sm"
              >
                <Volume2 className="w-4 h-4" /> 播放例句
              </button>
            </div>
          )}

          {/* 同反義詞 */}
          {(word.synonyms || word.antonyms) && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {word.synonyms && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-2">同義詞</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{word.synonyms}</p>
                </div>
              )}
              {word.antonyms && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">反義詞</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{word.antonyms}</p>
                </div>
              )}
            </div>
          )}

          {/* 統計 */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-400 mb-1">答錯次數</p>
              <p className="text-2xl font-bold text-red-500">{word.wrong_count}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">新增日期</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatDate(word.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleRegenerate} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> AI 重新產生
          </button>
          <Link href={`/words/${id}/edit`} className="btn-secondary flex items-center gap-2">
            <Edit className="w-4 h-4" /> 編輯
          </Link>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-all">
            <Trash2 className="w-4 h-4" /> 刪除
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

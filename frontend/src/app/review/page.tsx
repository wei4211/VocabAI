"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { reviewApi } from "@/lib/api";
import { ReviewSchedule } from "@/types";
import toast from "react-hot-toast";
import { cn, getReviewLevelLabel, getReviewLevelColor } from "@/lib/utils";
import { RotateCcw, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

export default function ReviewPage() {
  const [items, setItems] = useState<ReviewSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [done, setDone] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    reviewApi.getDue()
      .then((res) => setItems(res.data))
      .catch(() => toast.error("載入複習項目失敗"))
      .finally(() => setLoading(false));
  }, []);

  const handleAnswer = async (scheduleId: number, isCorrect: boolean) => {
    try {
      await reviewApi.submitAnswer(scheduleId, isCorrect);
      if (isCorrect) setCorrect((c) => c + 1);
      setDone((d) => [...d, scheduleId]);
      setShowAnswer(false);
      setCurrent((c) => c + 1);
    } catch {
      toast.error("提交失敗");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="animate-pulse text-gray-400">載入複習項目中...</div>
      </AppLayout>
    );
  }

  if (items.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">間隔複習</h1>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl p-10 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">今日複習完成！</h2>
            <p className="text-green-600 dark:text-green-500 text-sm">沒有待複習的單字，明天再來！</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (current >= items.length) {
    return (
      <AppLayout>
        <div className="max-w-2xl animate-slide-up">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">複習完成</h1>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
              {correct}/{items.length}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              正確率 {Math.round((correct / items.length) * 100)}%
            </p>
            <button onClick={() => window.location.reload()} className="btn-primary flex items-center gap-2 mx-auto">
              <RotateCcw className="w-5 h-5" />
              重新整理
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const item = items[current];
  const word = item.word;

  return (
    <AppLayout>
      <div className="max-w-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">間隔複習</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {current + 1} / {items.length}
          </span>
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-8">
          <div
            className="bg-brand-500 h-2 rounded-full transition-all"
            style={{ width: `${(current / items.length) * 100}%` }}
          />
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 mb-6 min-h-64">
          <div className="flex items-center gap-3 mb-6">
            <span className={cn("text-xs text-white px-3 py-1 rounded-full font-medium", getReviewLevelColor(item.review_level))}>
              {getReviewLevelLabel(item.review_level)}
            </span>
            {word?.part_of_speech && (
              <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full">
                {word.part_of_speech}
              </span>
            )}
          </div>

          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 text-center py-4">
            {word?.word}
          </h2>

          {!showAnswer ? (
            <div className="text-center">
              <button
                onClick={() => setShowAnswer(true)}
                className="flex items-center gap-2 mx-auto text-brand-500 hover:text-brand-600 font-medium transition-colors"
              >
                <Eye className="w-5 h-5" />
                顯示答案
              </button>
            </div>
          ) : (
            <div className="animate-fade-in space-y-4">
              {word?.meaning && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">中文解釋</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{word.meaning}</p>
                </div>
              )}
              {word?.example_sentence && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <p className="text-sm text-blue-500 mb-1">例句</p>
                  <p className="text-gray-700 dark:text-gray-300 italic">"{word.example_sentence}"</p>
                </div>
              )}
              {(word?.synonyms || word?.antonyms) && (
                <div className="flex gap-4">
                  {word.synonyms && <span className="text-sm text-green-600 dark:text-green-400">同: {word.synonyms}</span>}
                  {word.antonyms && <span className="text-sm text-red-500 dark:text-red-400">反: {word.antonyms}</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Answer Buttons */}
        {showAnswer && (
          <div className="flex gap-4 animate-fade-in">
            <button
              onClick={() => handleAnswer(item.id, false)}
              className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
            >
              <XCircle className="w-6 h-6" />
              不熟悉
            </button>
            <button
              onClick={() => handleAnswer(item.id, true)}
              className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-semibold hover:bg-green-100 dark:hover:bg-green-900/30 transition-all"
            >
              <CheckCircle className="w-6 h-6" />
              已記住
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

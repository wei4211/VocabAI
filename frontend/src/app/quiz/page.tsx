"use client";
import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { quizApi } from "@/lib/api";
import { Quiz, QuizResult } from "@/types";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Brain, Clock, CheckCircle, XCircle, Trophy, RotateCcw, ChevronRight } from "lucide-react";

type QuizState = "idle" | "loading" | "active" | "submitting" | "result";

export default function QuizPage() {
  const [state, setState] = useState<QuizState>("idle");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongDetails, setWrongDetails] = useState<Array<{ question: string; your: string; correct: string }>>([]);
  const [seconds, setSeconds] = useState(0);
  const [quizType, setQuizType] = useState<"daily" | "weekly">("daily");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (state === "active") {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  const generateQuiz = async () => {
    setState("loading");
    try {
      const res = await quizApi.generate(quizType);
      setQuiz(res.data);
      setCurrentQ(0);
      setAnswers({});
      setSelected(null);
      setSeconds(0);
      setState("active");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "無法生成測驗，請先新增至少 3 個單字");
      setState("idle");
    }
  };

  const handleAnswer = (answer: string) => {
    setSelected(answer);
    const question = quiz!.questions[currentQ];
    setAnswers((prev) => ({ ...prev, [question.id]: answer }));
  };

  const handleNext = () => {
    if (currentQ < quiz!.questions.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelected(null);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setState("submitting");
    try {
      const submissionAnswers = quiz.questions.map((q) => ({
        question_id: q.id,
        user_answer: answers[q.id] || "",
      }));
      const res = await quizApi.submit(quiz.id, {
        answers: submissionAnswers,
        duration_seconds: seconds,
      });
      // 計算每題答錯的詳情
      const details = quiz.questions
        .filter((q) => (answers[q.id] || "").trim().toLowerCase() !== q.correct_answer?.trim().toLowerCase())
        .map((q) => ({
          question: q.question_text,
          your: answers[q.id] || "（未作答）",
          correct: (q as any).correct_answer || "",
        }));
      setWrongDetails(details);
      setResult(res.data);
      setState("result");
    } catch {
      toast.error("提交失敗");
      setState("active");
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Idle State
  if (state === "idle") {
    return (
      <AppLayout>
        <div className="max-w-2xl animate-slide-up">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">測驗</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">選擇測驗類型開始挑戰</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {(["daily", "weekly"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setQuizType(type)}
                className={cn(
                  "p-6 rounded-2xl border-2 transition-all text-left",
                  quizType === type
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300"
                )}
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  type === "daily" ? "bg-brand-500" : "bg-purple-500"
                )}>
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  {type === "daily" ? "每日測驗" : "每週測驗"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {type === "daily"
                    ? "測驗所有單字，優先顯示錯誤率高的單字"
                    : "測驗本週新增的單字"}
                </p>
              </button>
            ))}
          </div>

          <button onClick={generateQuiz} className="btn-primary flex items-center gap-2 text-lg">
            <Brain className="w-6 h-6" />
            開始測驗
          </button>
        </div>
      </AppLayout>
    );
  }

  // Loading
  if (state === "loading") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-64 gap-4">
          <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center animate-bounce-light">
            <Brain className="w-8 h-8 text-brand-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">AI 正在出題中...</p>
        </div>
      </AppLayout>
    );
  }

  // Result
  if (state === "result" && result) {
    return (
      <AppLayout>
        <div className="max-w-2xl animate-slide-up">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 text-center mb-6">
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6",
              result.score >= 80 ? "bg-green-50 dark:bg-green-900/30" : "bg-orange-50 dark:bg-orange-900/30"
            )}>
              <Trophy className={cn("w-12 h-12", result.score >= 80 ? "text-green-500" : "text-orange-500")} />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {result.score.toFixed(0)}%
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              答對 {result.correct_count} / {result.total_questions} 題・{formatTime(result.duration_seconds)}
            </p>

            {result.score >= 80 ? (
              <p className="text-green-600 dark:text-green-400 font-semibold text-lg">太棒了！繼續保持 🎉</p>
            ) : (
              <p className="text-orange-600 dark:text-orange-400 font-semibold text-lg">加油！多練習才能進步 💪</p>
            )}
          </div>

          {wrongDetails.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl p-5 mb-6">
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                答錯的題目
              </h3>
              <div className="space-y-3">
                {wrongDetails.map((d, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-100 dark:border-red-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{d.question}</p>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm">
                        <span className="text-red-500 font-medium">你的答案：</span>
                        <span className="text-gray-700 dark:text-gray-300">{d.your}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-green-600 font-medium">正確答案：</span>
                        <span className="text-gray-700 dark:text-gray-300">{d.correct}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={generateQuiz} className="btn-primary flex items-center gap-2 flex-1 justify-center">
              <RotateCcw className="w-5 h-5" />
              再測一次
            </button>
            <button onClick={() => setState("idle")} className="btn-secondary">回到測驗選單</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Active Quiz
  if (state === "active" && quiz) {
    const question = quiz.questions[currentQ];
    const options = question.options ? JSON.parse(question.options) : null;
    const progress = ((currentQ + 1) / quiz.questions.length) * 100;
    const isAnswered = selected !== null;

    return (
      <AppLayout>
        <div className="max-w-2xl animate-slide-up">
          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {currentQ + 1} / {quiz.questions.length}
            </span>
            <div className="flex items-center gap-2 text-brand-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono font-medium">{formatTime(seconds)}</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-8">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 mb-6">
            <span className="text-xs font-medium text-brand-500 uppercase tracking-wide mb-3 block">
              {question.question_type === "multiple_choice" ? "選擇題" :
               question.question_type === "fill_blank" ? "填空題" : "中翻英"}
            </span>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{question.question_text}</p>
          </div>

          {/* Options or Input */}
          {options ? (
            <div className="space-y-3 mb-6">
              {options.map((opt: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 font-medium",
                    !isAnswered && "hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                    isAnswered && opt === selected
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                      : isAnswered && "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-60"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {["A", "B", "C", "D"][i]}
                    </span>
                    {opt}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">題目載入中...</div>
          )}

          {isAnswered && (
            <button onClick={handleNext} className="btn-primary w-full flex items-center justify-center gap-2">
              {currentQ < quiz.questions.length - 1 ? (
                <>下一題 <ChevronRight className="w-5 h-5" /></>
              ) : (
                <>提交答案 <CheckCircle className="w-5 h-5" /></>
              )}
            </button>
          )}
        </div>
      </AppLayout>
    );
  }

  return null;
}

function FillInput({ onSubmit, disabled }: { onSubmit: (val: string) => void; disabled: boolean }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex gap-3 mb-6">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && value.trim() && !disabled && onSubmit(value.trim())}
        className="input-field flex-1"
        placeholder="輸入你的答案..."
        disabled={disabled}
        autoFocus
      />
      <button
        onClick={() => value.trim() && !disabled && onSubmit(value.trim())}
        disabled={disabled || !value.trim()}
        className="btn-primary px-6"
      >
        確認
      </button>
    </div>
  );
}

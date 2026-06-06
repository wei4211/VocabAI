"use client";
import { useState, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { ocrApi, wordsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { ScanText, Upload, Plus, CheckCircle, Loader } from "lucide-react";

interface SuggestedWord {
  word: string;
  context: string;
}

export default function OcrPage() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [suggestedWords, setSuggestedWords] = useState<SuggestedWord[]>([]);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [savingWord, setSavingWord] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("請上傳圖片檔案");
      return;
    }
    setLoading(true);
    setExtractedText("");
    setSuggestedWords([]);
    setSavedWords(new Set());

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await ocrApi.extract(formData);
      setExtractedText(res.data.extracted_text);
      setSuggestedWords(res.data.suggested_words || []);
      toast.success("OCR 辨識完成！");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "OCR 辨識失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleSaveWord = async (word: SuggestedWord) => {
    setSavingWord(word.word);
    try {
      await wordsApi.create({
        word: word.word,
        example_sentence: word.context,
        source: "ocr",
      });
      setSavedWords((prev) => new Set([...prev, word.word]));
      toast.success(`「${word.word}」已新增，AI 正在產生單字卡...`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "新增失敗");
    } finally {
      setSavingWord(null);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl animate-slide-up">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">OCR 圖片辨識</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">上傳英文講義、考卷或書籍圖片，AI 自動辨識並提取單字</p>
        </div>

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-200 cursor-pointer mb-8 ${
            dragging
              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
              : "border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-12 h-12 text-brand-500 animate-spin" />
              <p className="text-brand-600 dark:text-brand-400 font-medium">AI 辨識中，請稍候...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center">
                <Upload className="w-8 h-8 text-brand-500" />
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">拖放圖片到這裡</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">或點擊選擇圖片（JPG, PNG, WEBP）</p>
              </div>
            </div>
          )}
        </div>

        {/* Extracted Text */}
        {extractedText && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ScanText className="w-5 h-5 text-brand-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">辨識文字</h3>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 max-h-48 overflow-y-auto">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">{extractedText}</pre>
            </div>
          </div>
        )}

        {/* Suggested Words */}
        {suggestedWords.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-500" />
              AI 建議加入的單字（{suggestedWords.length} 個）
            </h3>
            <div className="space-y-3">
              {suggestedWords.map((w) => (
                <div
                  key={w.word}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{w.word}</p>
                    {w.context && <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-0.5">"{w.context}"</p>}
                  </div>
                  <button
                    onClick={() => !savedWords.has(w.word) && handleSaveWord(w)}
                    disabled={savedWords.has(w.word) || savingWord === w.word}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      savedWords.has(w.word)
                        ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-default"
                        : "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50"
                    }`}
                  >
                    {savedWords.has(w.word) ? (
                      <><CheckCircle className="w-4 h-4" />已加入</>
                    ) : savingWord === w.word ? (
                      <><Loader className="w-4 h-4 animate-spin" />加入中</>
                    ) : (
                      <><Plus className="w-4 h-4" />加入單字庫</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

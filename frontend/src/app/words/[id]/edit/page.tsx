"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { wordsApi } from "@/lib/api";
import { Word } from "@/types";
import toast from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function EditWordPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [loading, setLoading] = useState(false);
  const [word, setWord] = useState<Word | null>(null);
  const [form, setForm] = useState({
    word: "",
    meaning: "",
    part_of_speech: "",
    example_sentence: "",
    synonyms: "",
    antonyms: "",
  });

  useEffect(() => {
    wordsApi.get(id).then((res) => {
      const w = res.data as Word;
      setWord(w);
      setForm({
        word: w.word,
        meaning: w.meaning || "",
        part_of_speech: w.part_of_speech || "",
        example_sentence: w.example_sentence || "",
        synonyms: w.synonyms || "",
        antonyms: w.antonyms || "",
      });
    }).catch(() => toast.error("載入失敗"));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await wordsApi.update(id, form);
      toast.success("單字已更新");
      router.push("/words");
    } catch {
      toast.error("更新失敗");
    } finally {
      setLoading(false);
    }
  };

  if (!word) return <AppLayout><div className="animate-pulse text-gray-400">載入中...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-2xl animate-slide-up">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/words" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">編輯單字</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">英文單字</label>
            <input
              type="text"
              value={form.word}
              onChange={(e) => setForm({ ...form, word: e.target.value })}
              className="input-field text-lg font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">中文解釋</label>
              <input
                type="text"
                value={form.meaning}
                onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                className="input-field"
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
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">同義詞</label>
              <input type="text" value={form.synonyms} onChange={(e) => setForm({ ...form, synonyms: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">反義詞</label>
              <input type="text" value={form.antonyms} onChange={(e) => setForm({ ...form, antonyms: e.target.value })} className="input-field" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save className="w-5 h-5" />
              {loading ? "儲存中..." : "儲存"}
            </button>
            <Link href="/words" className="btn-secondary">取消</Link>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

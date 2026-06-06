export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  streak_days: number;
  created_at: string;
}

export interface Word {
  id: number;
  user_id: number;
  word: string;
  meaning: string | null;
  part_of_speech: string | null;
  example_sentence: string | null;
  synonyms: string | null;
  antonyms: string | null;
  source: "manual" | "line" | "ocr" | "extension";
  review_level: number;
  wrong_count: number;
  created_at: string;
  updated_at: string | null;
}

export interface WordListResponse {
  items: Word[];
  total: number;
  page: number;
  page_size: number;
}

export interface QuizQuestion {
  id: number;
  question_type: "multiple_choice" | "fill_blank" | "translation";
  question_text: string;
  correct_answer: string;
  options: string | null;
}

export interface Quiz {
  id: number;
  quiz_type: "daily" | "weekly";
  total_questions: number;
  created_at: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  quiz_id: number;
  score: number;
  correct_count: number;
  total_questions: number;
  duration_seconds: number;
  wrong_words: string[];
}

export interface DashboardStats {
  total_words: number;
  today_added: number;
  today_review: number;
  week_added: number;
  accuracy_rate: number;
  streak_days: number;
}

export interface ReviewSchedule {
  id: number;
  word_id: number;
  next_review_date: string;
  review_level: number;
  is_completed: boolean;
  word: Word | null;
}

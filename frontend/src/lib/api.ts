import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  updateMe: (data: Partial<{ username: string; email: string; password: string }>) =>
    api.put("/auth/me", data),
};

// Words
export const wordsApi = {
  list: (params?: { page?: number; page_size?: number; search?: string; source?: string }) =>
    api.get("/words", { params }),
  get: (id: number) => api.get(`/words/${id}`),
  create: (data: {
    word: string;
    meaning?: string;
    part_of_speech?: string;
    example_sentence?: string;
    synonyms?: string;
    antonyms?: string;
    source?: string;
  }) => api.post("/words", data),
  update: (id: number, data: Partial<{ word: string; meaning: string; part_of_speech: string; example_sentence: string; synonyms: string; antonyms: string }>) =>
    api.put(`/words/${id}`, data),
  delete: (id: number) => api.delete(`/words/${id}`),
  regenerateAI: (id: number) => api.post(`/words/${id}/regenerate-ai`),
};

// Quiz
export const quizApi = {
  generate: (quiz_type: "daily" | "weekly") => api.post("/quiz/generate", { quiz_type }),
  submit: (quizId: number, data: { answers: Array<{ question_id: number; user_answer: string }>; duration_seconds: number }) =>
    api.post(`/quiz/${quizId}/submit`, data),
  history: () => api.get("/quiz/history"),
};

// Review
export const reviewApi = {
  getDue: () => api.get("/review/due"),
  submitAnswer: (scheduleId: number, is_correct: boolean) =>
    api.post(`/review/${scheduleId}/answer?is_correct=${is_correct}`),
};

// Dashboard
export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
};

// OCR
export const ocrApi = {
  extract: (formData: FormData) =>
    api.post("/ocr/extract", formData, { headers: { "Content-Type": "multipart/form-data" } }),
};

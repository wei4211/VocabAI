"use client";
import { create } from "zustand";
import { User } from "@/types";
import { authApi } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login({ email, password });
      const { access_token, user } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      set({ token: access_token, user, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  register: async (email, username, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register({ email, username, password });
      const { access_token, user } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      set({ token: access_token, user, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },
}));

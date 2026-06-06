"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, loadFromStorage } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-brand-500 text-2xl font-bold">VocabAI</div>
    </div>
  );
}

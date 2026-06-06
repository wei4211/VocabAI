"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loadFromStorage } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (user === null) {
      const token = localStorage.getItem("token");
      if (!token) router.replace("/auth/login");
    }
  }, [user]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

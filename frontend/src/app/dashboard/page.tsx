"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { dashboardApi } from "@/lib/api";
import { DashboardStats } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  BookOpen, Brain, RotateCcw, TrendingUp, Flame, Plus, ArrowRight,
} from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
}

function StatCard({ label, value, icon, color, suffix }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">
        {value}{suffix}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.stats()
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "早安";
    if (h < 17) return "午安";
    return "晚安";
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {greeting()}，{user?.username} 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">繼續今天的學習目標</p>
          </div>
          <Link
            href="/words/new"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            新增單字
          </Link>
        </div>

        {/* Streak Banner */}
        {stats && stats.streak_days > 0 && (
          <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-5 text-white flex items-center gap-4">
            <Flame className="w-10 h-10" />
            <div>
              <p className="text-2xl font-bold">{stats.streak_days} 天連續學習</p>
              <p className="text-orange-100 text-sm">保持這個勢頭！每天學習讓記憶更深刻</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="stat-card animate-pulse">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-24" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="總單字數"
              value={stats.total_words}
              icon={<BookOpen className="w-6 h-6 text-blue-600" />}
              color="bg-blue-50 dark:bg-blue-900/30"
            />
            <StatCard
              label="今日新增"
              value={stats.today_added}
              icon={<Plus className="w-6 h-6 text-green-600" />}
              color="bg-green-50 dark:bg-green-900/30"
            />
            <StatCard
              label="今日待複習"
              value={stats.today_review}
              icon={<RotateCcw className="w-6 h-6 text-orange-600" />}
              color="bg-orange-50 dark:bg-orange-900/30"
            />
            <StatCard
              label="本週新增"
              value={stats.week_added}
              icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
              color="bg-purple-50 dark:bg-purple-900/30"
            />
            <StatCard
              label="答題正確率"
              value={stats.accuracy_rate}
              suffix="%"
              icon={<Brain className="w-6 h-6 text-brand-600" />}
              color="bg-brand-50 dark:bg-brand-900/30"
            />
            <StatCard
              label="連續學習"
              value={stats.streak_days}
              suffix=" 天"
              icon={<Flame className="w-6 h-6 text-red-500" />}
              color="bg-red-50 dark:bg-red-900/30"
            />
          </div>
        ) : null}

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "開始每日測驗",
                desc: "測試今天的單字掌握度",
                href: "/quiz",
                color: "from-brand-500 to-blue-600",
                icon: <Brain className="w-6 h-6 text-white" />,
              },
              {
                title: "複習單字",
                desc: `${stats?.today_review || 0} 個單字待複習`,
                href: "/review",
                color: "from-orange-400 to-red-500",
                icon: <RotateCcw className="w-6 h-6 text-white" />,
              },
              {
                title: "瀏覽單字庫",
                desc: `共 ${stats?.total_words || 0} 個單字`,
                href: "/words",
                color: "from-green-400 to-emerald-500",
                icon: <BookOpen className="w-6 h-6 text-white" />,
              },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:-translate-y-1 flex items-center gap-4"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">{action.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{action.desc}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

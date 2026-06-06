import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function getReviewLevelLabel(level: number) {
  const labels = ["新學", "初學", "熟悉", "掌握", "精通"];
  return labels[Math.min(level, labels.length - 1)];
}

export function getReviewLevelColor(level: number) {
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  return colors[Math.min(level, colors.length - 1)];
}

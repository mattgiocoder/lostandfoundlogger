import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short", // Add day of week
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

export function generateRandomColor(): string {
  // Generate pastel colors that are not too light
  const hue = Math.floor(Math.random() * 360)
  const saturation = 60 + Math.floor(Math.random() * 20) // 60-80%
  const lightness = 45 + Math.floor(Math.random() * 15) // 45-60%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}


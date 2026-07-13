import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncate(value: string | null | undefined, length = 80) {
  if (!value) return "";
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

export function getAlumniSlug(email: string, name?: string | null): string {
  if (name && name.trim()) {
    const cleanName = name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
    if (cleanName.length > 0) {
      return cleanName;
    }
  }
  return (email || '').replace('@', '').replace(/[^a-zA-Z0-9_.-]/g, '');
}


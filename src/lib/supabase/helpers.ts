// src/lib/supabase/helpers.ts
// Supabase returns joined relations as arrays even for singular relationships.
// This helper safely extracts the first (and only) item.
export function first<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

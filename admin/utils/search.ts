/**
 * Case-insensitive substring search across several fields at once.
 * Empty/blank queries match everything, so callers never need a special-case.
 */
export const matches = (query: string, ...fields: (string | number | boolean | null | undefined)[]): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => field != null && String(field).toLowerCase().includes(q));
};
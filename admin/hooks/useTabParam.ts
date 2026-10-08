import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Keeps a tab selection in the URL query (e.g. /inventory?tab=purchases) so a
 * refresh, reload or shared link lands on the same tab.
 *
 * - Values not in `keys` fall back to `fallback`, so a hand-edited URL can
 *   never render an empty page.
 * - Selecting `fallback` removes the param to keep default URLs clean.
 * - Other query params are preserved, and updates replace the history entry
 *   instead of pushing a new one (no history spam while clicking around).
 */
export const useTabParam = (param: string, keys: readonly string[], fallback: string) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(param);
  const tab = value !== null && keys.includes(value) ? value : fallback;

  const setTab = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === fallback) params.delete(param);
          else params.set(param, next);
          return params;
        },
        { replace: true }
      );
    },
    [param, fallback, setSearchParams]
  );

  return [tab, setTab] as const;
};

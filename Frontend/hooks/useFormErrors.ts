import { useCallback, useState } from 'react';
import { showToast } from '@/components/feedback/toast';

type Reason = string | false | null | undefined;

/**
 * Submit-time validation state shared by every storefront form.
 *
 * `validate` collects ALL failing reasons (nothing fails silently on the
 * first problem), lists them in the `FormErrors` banner rendered above the
 * form's buttons, and toasts the same reasons — so the user is told exactly
 * why the form can't be submitted, both inline and as a toast.
 *
 * ```tsx
 * const { errors, validate, clearErrors } = useFormErrors();
 *
 * if (!validate([!name.trim() && 'Name is required.'])) return;
 * // zod: if (!parsed.success) return validate(parsed.error.issues.map((i) => i.message));
 * ```
 *
 * Wire `clearErrors` to the form's `onChangeCapture` so stale reasons
 * disappear as soon as the user starts editing again.
 */
export const useFormErrors = () => {
  const [errors, setErrors] = useState<string[]>([]);

  const validate = useCallback((reasons: Reason[]): boolean => {
    const failed = reasons.filter((reason): reason is string => Boolean(reason));
    setErrors(failed);
    if (failed.length > 0) {
      showToast(failed.join(' '), 'error');
      return false;
    }
    return true;
  }, []);

  const clearErrors = useCallback(() => setErrors([]), []);

  return { errors, validate, clearErrors };
};

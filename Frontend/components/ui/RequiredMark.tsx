/**
 * Red asterisk marking a field the user must fill in before submitting.
 *
 * Default placement is inline right after a label ("Email <RequiredMark />").
 * Pass `className` to position it (e.g. absolutely inside a label-less input).
 */
const RequiredMark = ({ className = '' }: { className?: string }) => (
  <span className={`text-red-500 ${className}`.trim()} aria-hidden="true">
    {' *'}
  </span>
);

export default RequiredMark;

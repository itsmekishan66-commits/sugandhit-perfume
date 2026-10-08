interface FormErrorsProps {
  errors: string[];
}

/**
 * Lists exactly why a form can't be submitted. Render it directly above the
 * form's buttons (alongside the toast from `useFormErrors`), so the reasons
 * are visible next to the action the user is about to take.
 */
const FormErrors = ({ errors }: FormErrorsProps) => {
  if (errors.length === 0) return null;

  return (
    <div
      role="alert"
      className="px-4 py-3 rounded-xl text-sm border bg-red-50/80 text-red-600 border-red-300/60"
    >
      <p className="font-medium mb-1">Fix the following before submitting:</p>
      <ul className="list-disc list-inside space-y-0.5">
        {errors.map((error, index) => (
          <li key={`${index}-${error}`}>{error}</li>
        ))}
      </ul>
    </div>
  );
};

export default FormErrors;

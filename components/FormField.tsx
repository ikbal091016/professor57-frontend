export function FormField({
  id,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-forest mb-1.5">
        {label}
      </label>
      <input
        id={id}
        {...props}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full rounded-md border border-rule bg-white px-3.5 py-2.5 text-sm text-forest placeholder:text-forest/35
                   focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30 transition-colors"
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

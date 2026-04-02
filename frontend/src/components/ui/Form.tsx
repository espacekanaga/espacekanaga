import { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  name,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || name || generatedId;
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <input
        id={inputId}
        name={name || inputId}
        className={`input-field ${error ? 'border-red-500 ring-red-500/20' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      {helperText && !error && <p className="mt-2 text-sm text-slate-400">{helperText}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  options,
  className = '',
  id,
  name,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || name || generatedId;
  return (
    <div className="w-full">
      {label && <label htmlFor={selectId} className="input-label">{label}</label>}
      <select
        id={selectId}
        name={name || selectId}
        className={`input-field ${error ? 'border-red-500 ring-red-500/20' : ''} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({
  label,
  error,
  className = '',
  id,
  name,
  ...props
}: TextAreaProps) {
  const generatedId = useId();
  const textAreaId = id || name || generatedId;
  return (
    <div className="w-full">
      {label && <label htmlFor={textAreaId} className="input-label">{label}</label>}
      <textarea
        id={textAreaId}
        name={name || textAreaId}
        className={`input-field min-h-[120px] ${error ? 'border-red-500 ring-red-500/20' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

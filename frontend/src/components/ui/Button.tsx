import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'whatsapp';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary:
      'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700 focus:ring-blue-500 shadow-lg shadow-blue-500/25',
    secondary:
      'bg-white/70 text-slate-900 hover:bg-white focus:ring-slate-400 border border-slate-200/70 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-slate-500 dark:border-slate-700/50',
    whatsapp:
      'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-lg shadow-green-500/20',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-lg shadow-red-500/25',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100/70 focus:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:focus:ring-slate-500',
    outline:
      'bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-100/70 focus:ring-slate-400 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:focus:ring-slate-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="spinner spinner-sm border-white/30 border-t-white mr-2" />
          Chargement...
        </>
      ) : (
        children
      )}
    </button>
  );
}

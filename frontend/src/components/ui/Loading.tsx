interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'spinner-sm',
    md: 'w-8 h-8 border-3',
    lg: 'spinner-lg',
  };

  return (
    <div className={`spinner-container ${className}`}>
      <div className={`spinner ${sizeClasses[size]}`} />
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Chargement...' }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="spinner spinner-lg" />
        <p className="loading-text">{message}</p>
      </div>
    </div>
  );
}

export function EmptyState({ message = 'Aucune donnée' }: { message?: string }) {
  return (
    <div className="empty-state">
      <svg
        className="empty-state-icon"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p>{message}</p>
    </div>
  );
}

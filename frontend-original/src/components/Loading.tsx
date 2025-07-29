interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const Loading = ({ message = 'Loading...', size = 'md', fullScreen = false }: LoadingProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className={`${sizeClasses[size]} border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin`}>
            <div className={`${sizeClasses[size]} border-4 border-transparent border-t-blue-600 rounded-full absolute top-0 left-0`} />
          </div>
        </div>
        {message && (
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loading;
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 transition-all duration-300 hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
      aria-label="Toggle theme"
    >
      <div className={`absolute inset-0 rounded-full bg-gradient-to-r transition-all duration-300 ${
        theme === 'dark' 
          ? 'from-indigo-500 to-purple-600 opacity-100' 
          : 'from-yellow-400 to-orange-500 opacity-100'
      }`} />
      
      <div className={`relative flex h-6 w-12 items-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300`}>
        <div className={`absolute h-5 w-5 rounded-full bg-white shadow-lg transition-all duration-300 flex items-center justify-center ${
          theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
        }`}>
          {theme === 'dark' ? (
            <MoonIcon className="h-3 w-3 text-indigo-600" />
          ) : (
            <SunIcon className="h-3 w-3 text-orange-500" />
          )}
        </div>
      </div>
      
      {/* Background icons */}
      <SunIcon className={`absolute left-1.5 h-3 w-3 text-white transition-opacity duration-300 ${
        theme === 'dark' ? 'opacity-50' : 'opacity-100'
      }`} />
      <MoonIcon className={`absolute right-1.5 h-3 w-3 text-white transition-opacity duration-300 ${
        theme === 'dark' ? 'opacity-100' : 'opacity-50'
      }`} />
    </button>
  );
};

export default ThemeToggle;
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, LanguageIcon } from '@heroicons/react/24/outline';

interface LanguageSwitcherProps {
  variant?: 'sidebar' | 'header';
  showLabel?: boolean;
}

const LanguageSwitcher = ({ variant = 'sidebar', showLabel = true }: LanguageSwitcherProps) => {
  const { i18n, t } = useTranslation();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLanguageMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'pt-BR' ? 'Português' : 'English';
  };

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'pt-BR', label: 'Português', flag: '🇧🇷' }
  ];

  const buttonClasses = variant === 'header' 
    ? "inline-flex items-center gap-2 rounded-lg bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-gray-300/20 dark:ring-gray-700/50 hover:bg-white/20 dark:hover:bg-gray-800/70 transition-all"
    : "w-full flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all";

  const dropdownClasses = variant === 'header'
    ? "absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white dark:bg-gray-800 py-2 shadow-lg ring-1 ring-black/5 dark:ring-gray-700/50 backdrop-blur-sm"
    : "absolute left-0 z-10 mt-2 w-full origin-top-left rounded-lg bg-white dark:bg-gray-800 py-2 shadow-lg ring-1 ring-black/5 dark:ring-gray-700/50";

  if (variant === 'sidebar') {
    return (
      <div className="px-4 py-2">
        {showLabel && (
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t('sidebar.language')}
          </label>
        )}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className={buttonClasses}
            onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
            aria-expanded={isLanguageMenuOpen}
            aria-haspopup="true"
          >
            <div className="flex items-center gap-2">
              <LanguageIcon className="h-4 w-4" />
              <span>{getCurrentLanguageLabel()}</span>
            </div>
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLanguageMenuOpen && (
            <div className={dropdownClasses}>
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    i18n.language === language.code 
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span>{language.label}</span>
                  {i18n.language === language.code && (
                    <span className="ml-auto text-primary-600 dark:text-primary-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Header variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={buttonClasses}
        onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
        aria-expanded={isLanguageMenuOpen}
        aria-haspopup="true"
      >
        <LanguageIcon className="h-4 w-4" />
        <span>{getCurrentLanguageLabel()}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {isLanguageMenuOpen && (
        <div className={dropdownClasses}>
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
            {t('sidebar.language')}
          </div>
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                i18n.language === language.code 
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span>{language.label}</span>
              {i18n.language === language.code && (
                <span className="ml-auto text-primary-600 dark:text-primary-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;

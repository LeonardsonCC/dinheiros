import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lng', lng);
  };

  return (
    <div className="px-4 py-2">
      <label htmlFor="language-select" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {t('sidebar.language')}
      </label>
      <select
        id="language-select"
        className="block w-full rounded-md border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        value={i18n.language}
        onChange={e => changeLanguage(e.target.value)}
      >
        <option value="en">English</option>
        <option value="pt-BR">Português (Brasil)</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;

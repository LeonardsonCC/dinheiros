import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface SharedAccountBadgeProps {
  isShared?: boolean;
  ownerName?: string;
  ownerEmail?: string;
  className?: string;
}

export default function SharedAccountBadge({ 
  isShared = false, 
  ownerName, 
  ownerEmail, 
  className = '' 
}: SharedAccountBadgeProps) {
  const { t } = useTranslation();

  if (!isShared) return null;

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
        <UserGroupIcon className="h-3 w-3" />
        <span>{t('sharing.shared')}</span>
      </div>
      {ownerName && (
        <div className="ml-2 flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <UserIcon className="h-3 w-3" />
          <span title={ownerEmail}>
            {t('sharing.ownedBy', { owner: ownerName })}
          </span>
        </div>
      )}
    </div>
  );
}
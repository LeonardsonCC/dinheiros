import { 
  HomeIcon, 
  BanknotesIcon, 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  Cog6ToothIcon, 
  UserCircleIcon 
} from '@heroicons/react/24/outline';
import CategoryIcon from '../components/CategoryIcon';

export interface NavigationItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  end?: boolean;
}

export const navigationItems: NavigationItem[] = [
  {
    to: '/',
    icon: HomeIcon,
    labelKey: 'sidebar.dashboard',
    end: false
  },
  {
    to: '/accounts',
    icon: BanknotesIcon,
    labelKey: 'sidebar.accounts',
    end: true
  },
  {
    to: '/accounts/transactions',
    icon: CurrencyDollarIcon,
    labelKey: 'sidebar.allTransactions',
    end: true
  },
  {
    to: '/accounts/transactions/import',
    icon: DocumentTextIcon,
    labelKey: 'sidebar.importTransactions',
    end: false
  },
  {
    to: '/statistics',
    icon: ChartBarIcon,
    labelKey: 'sidebar.statistics',
    end: false
  },
  {
    to: '/categories',
    icon: CategoryIcon,
    labelKey: 'sidebar.categories',
    end: false
  },
  {
    to: '/categorization-rules',
    icon: Cog6ToothIcon,
    labelKey: 'sidebar.categorizationRules',
    end: false
  },
  {
    to: '/profile',
    icon: UserCircleIcon,
    labelKey: 'sidebar.profile',
    end: false
  }
];
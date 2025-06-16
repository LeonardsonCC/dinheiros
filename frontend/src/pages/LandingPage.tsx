import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ShareIcon, 
  DocumentArrowUpIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    {
      name: t('landing.features.accountManagement.name'),
      description: t('landing.features.accountManagement.description'),
      icon: CurrencyDollarIcon,
    },
    {
      name: t('landing.features.transactionTracking.name'),
      description: t('landing.features.transactionTracking.description'),
      icon: DocumentArrowUpIcon,
    },
    {
      name: t('landing.features.smartAnalytics.name'),
      description: t('landing.features.smartAnalytics.description'),
      icon: ChartBarIcon,
    },
    {
      name: t('landing.features.accountSharing.name'),
      description: t('landing.features.accountSharing.description'),
      icon: ShareIcon,
    },
    {
      name: t('landing.features.securePrivate.name'),
      description: t('landing.features.securePrivate.description'),
      icon: ShieldCheckIcon,
    },
    {
      name: t('landing.features.mobileFriendly.name'),
      description: t('landing.features.mobileFriendly.description'),
      icon: DevicePhoneMobileIcon,
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <span className="text-xl font-bold text-gray-900 dark:text-white">Dinheiros</span>
          </div>
          <div className="flex lg:flex-1 lg:justify-end items-center gap-4">
            <LanguageSwitcher variant="header" showLabel={false} />
          </div>
        </nav>
      </header>
      
      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-400 to-primary-600 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>
        
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              {t('landing.hero.title')}
              <span className="text-primary-600 dark:text-primary-400">{t('landing.hero.titleHighlight')}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              {t('landing.hero.description')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
              >
                {t('landing.hero.getStarted')}
              </Link>
              <Link
                to="/login"
                className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {t('landing.hero.signIn')} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-primary-400 to-primary-600 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
        </div>
      </div>

      {/* Features section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600 dark:text-primary-400">
              {t('landing.features.sectionTitle')}
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              {t('landing.features.title')}
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              {t('landing.features.description')}
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-primary-600 dark:bg-primary-700">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t('landing.cta.title')}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
              {t('landing.cta.description')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
              >
                {t('landing.cta.createAccount')}
              </Link>
              <Link
                to="/login"
                className="text-sm font-semibold leading-6 text-white hover:text-primary-100 transition-colors"
              >
                {t('landing.cta.alreadyHaveAccount')} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
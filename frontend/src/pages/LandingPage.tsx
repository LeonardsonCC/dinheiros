import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { 
  BanknotesIcon, 
  ChartBarIcon, 
  ShareIcon, 
  DocumentTextIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSwitcher from '../components/LanguageSwitcher';

const LandingPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      icon: BanknotesIcon,
      title: 'Account Management',
      description: 'Manage multiple bank accounts and track your finances in one place.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      description: 'Get detailed insights into your spending patterns and financial health.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: ShareIcon,
      title: 'Account Sharing',
      description: 'Share accounts with family members and collaborate on finances.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: DocumentTextIcon,
      title: 'PDF Import',
      description: 'Import transactions directly from bank statements and PDFs.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Private',
      description: 'Your financial data is encrypted and stored securely.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: GlobeAltIcon,
      title: 'Multi-language',
      description: 'Available in multiple languages with full localization support.',
      gradient: 'from-teal-500 to-blue-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="relative z-10">
        <nav className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Dinheiros
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <LanguageSwitcher />
              <div className="hidden sm:flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t('auth.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {t('auth.register')}
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 dark:from-blue-400/5 dark:via-purple-400/5 dark:to-indigo-400/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-slate-200/50 dark:border-slate-700/50">
              <SparklesIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Modern Financial Management
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Take Control
              </span>
              <br />
              <span className="text-slate-900 dark:text-white">
                of Your Finances
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Manage your accounts, track expenses, analyze spending patterns, and share financial data with family members - all in one secure platform.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                to="/register"
                className="group inline-flex items-center space-x-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                <span>Get Started Free</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 px-8 py-4 text-lg font-semibold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600"
              >
                <span>Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Powerful features designed to make financial management simple and effective.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users who trust Dinheiros with their financial management.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span>Create Your Account</span>
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-6 text-sm text-slate-600 dark:text-slate-400">
            <span>© 2024 Dinheiros. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
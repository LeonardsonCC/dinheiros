import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Loading from '../components/Loading';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';

export default function AcceptInvitation() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    acceptInvitation();
  }, [token]);

  const acceptInvitation = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch('/api/shares/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setStatus('success');
        toast.success(t('sharing.invitationAcceptedSuccess'));
        
        // Redirect to accounts page after 3 seconds
        setTimeout(() => {
          navigate('/accounts');
        }, 3000);
      } else {
        const error = await response.json();
        if (error.error?.includes('expired')) {
          setStatus('expired');
        } else {
          setStatus('error');
        }
        toast.error(error.error || t('sharing.invitationAcceptFailed'));
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      toast.error(t('sharing.invitationAcceptFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoToAccounts = () => {
    navigate('/accounts');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <GlassCard className="max-w-md w-full" variant="elevated" animation="scale-in">
          <div className="p-8 text-center">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
              {t('sharing.invalidInvitation')}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('sharing.invalidInvitationMessage')}
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (loading || status === 'loading') {
    return <Loading message={t('sharing.acceptingInvitation')} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <GlassCard className="max-w-md w-full" variant="elevated" animation="scale-in">
        <div className="p-8 text-center">
          {status === 'success' && (
            <>
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                {t('sharing.invitationAccepted')}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t('sharing.invitationAcceptedMessage')}
              </p>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {t('sharing.redirectingToAccounts')}
              </p>
              <button
                onClick={handleGoToAccounts}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t('sharing.goToAccounts')}
              </button>
            </>
          )}

          {status === 'expired' && (
            <>
              <ClockIcon className="mx-auto h-12 w-12 text-yellow-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                {t('sharing.invitationExpired')}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t('sharing.invitationExpiredMessage')}
              </p>
              <button
                onClick={handleGoToAccounts}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t('sharing.goToAccounts')}
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                {t('sharing.invitationError')}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t('sharing.invitationErrorMessage')}
              </p>
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleGoToAccounts}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('sharing.goToAccounts')}
                </button>
                <button
                  onClick={handleGoToLogin}
                  className="w-full glass-button px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30 rounded-lg transition-all duration-300"
                >
                  {t('auth.login')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
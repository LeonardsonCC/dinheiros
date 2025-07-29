import { useState, useEffect } from 'react';
import { XMarkIcon, UserPlusIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface ShareInvitation {
  id: number;
  invited_email: string;
  permission_level: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface AccountShare {
  id: number;
  shared_user_email: string;
  shared_user_name: string;
  permission_level: string;
  shared_at: string;
}

interface ShareAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  accountName: string;
}

export default function ShareAccountModal({ isOpen, onClose, accountId, accountName }: ShareAccountModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState<AccountShare[]>([]);
  const [invitations, setInvitations] = useState<ShareInvitation[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchShares();
      fetchInvitations();
    }
  }, [isOpen, accountId]);

  const fetchShares = async () => {
    try {
      setLoadingShares(true);
      const response = await fetch(`/api/accounts/${accountId}/shares`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setShares(data || []);
      }
    } catch (error) {
      console.error('Error fetching shares:', error);
    } finally {
      setLoadingShares(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/accounts/${accountId}/invitations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvitations(data || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/accounts/${accountId}/shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          invited_email: email.trim(),
          permission_level: 'read',
        }),
      });

      if (response.ok) {
        toast.success(t('sharing.invitationSent'));
        setEmail('');
        fetchInvitations();
      } else {
        const error = await response.json();
        toast.error(error.error || t('sharing.invitationFailed'));
      }
    } catch (error) {
      console.error('Error sharing account:', error);
      toast.error(t('sharing.invitationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (userId: number) => {
    if (!window.confirm(t('sharing.confirmRevoke'))) return;

    try {
      const response = await fetch(`/api/accounts/${accountId}/shares/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success(t('sharing.shareRevoked'));
        fetchShares();
      } else {
        const error = await response.json();
        toast.error(error.error || t('sharing.revokeFailed'));
      }
    } catch (error) {
      console.error('Error revoking share:', error);
      toast.error(t('sharing.revokeFailed'));
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    if (!window.confirm(t('sharing.confirmCancelInvitation'))) return;

    try {
      const response = await fetch(`/api/accounts/${accountId}/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success(t('sharing.invitationCanceled'));
        fetchInvitations();
      } else {
        const error = await response.json();
        toast.error(error.error || t('sharing.cancelFailed'));
      }
    } catch (error) {
      console.error('Error canceling invitation:', error);
      toast.error(t('sharing.cancelFailed'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('sharing.shareAccount', { accountName })}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Share Form */}
          <form onSubmit={handleShare} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('sharing.inviteByEmail')}
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('sharing.emailPlaceholder')}
                  className="flex-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <UserPlusIcon className="h-4 w-4 mr-2" />
                      {t('sharing.sendInvitation')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Current Shares */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
              {t('sharing.currentShares')}
            </h3>
            {loadingShares ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : shares.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('sharing.noShares')}
              </p>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {share.shared_user_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {share.shared_user_email}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {t('sharing.sharedOn', { date: formatDate(share.shared_at) })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokeShare(share.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title={t('sharing.revokeAccess')}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                {t('sharing.pendingInvitations')}
              </h3>
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {invitation.invited_email}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {t('sharing.expiresOn', { date: formatDate(invitation.expires_at) })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title={t('sharing.cancelInvitation')}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
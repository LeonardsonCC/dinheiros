import { useState, useEffect } from 'react';
import { XMarkIcon, UserPlusIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { sharingApi } from '../services/api';

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
      const response = await sharingApi.getAccountShares(accountId);
      setShares(response.data || []);
    } catch (error) {
      console.error('Error fetching shares:', error);
    } finally {
      setLoadingShares(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await sharingApi.getPendingInvitations(accountId);
      setInvitations(response.data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      await sharingApi.shareAccount(accountId, email.trim());
      toast.success(t('sharing.invitationSent') || 'Invitation sent successfully!');
      setEmail('');
      fetchInvitations();
    } catch (error) {
      console.error('Error sharing account:', error);
      toast.error(t('sharing.invitationFailed') || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (userId: number) => {
    if (!window.confirm(t('sharing.confirmRevoke') || 'Are you sure you want to revoke access?')) return;

    try {
      await sharingApi.revokeAccountShare(accountId, String(userId));
      toast.success(t('sharing.shareRevoked') || 'Access revoked successfully');
      fetchShares();
    } catch (error) {
      console.error('Error revoking share:', error);
      toast.error(t('sharing.revokeFailed') || 'Failed to revoke access');
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    if (!window.confirm(t('sharing.confirmCancelInvitation') || 'Are you sure you want to cancel this invitation?')) return;

    try {
      await sharingApi.cancelInvitation(accountId, String(invitationId));
      toast.success(t('sharing.invitationCanceled') || 'Invitation canceled successfully');
      fetchInvitations();
    } catch (error) {
      console.error('Error canceling invitation:', error);
      toast.error(t('sharing.cancelFailed') || 'Failed to cancel invitation');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Share "{accountName}"
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Share Form */}
          <form onSubmit={handleShare} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Invite by email
              </label>
              <div className="flex gap-3">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <UserPlusIcon className="h-4 w-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Current Shares */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Current Shares
            </h3>
            {loadingShares ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <p className="text-slate-500 dark:text-slate-400">
                  No one has access to this account yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {share.shared_user_name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {share.shared_user_email}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Shared on {formatDate(share.shared_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokeShare(share.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                      title="Revoke access"
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
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Pending Invitations
              </h3>
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {invitation.invited_email}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Expires on {formatDate(invitation.expires_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                      title="Cancel invitation"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
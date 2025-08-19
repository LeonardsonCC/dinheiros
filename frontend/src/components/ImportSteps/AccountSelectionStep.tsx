import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { twJoin } from 'tailwind-merge';

interface Account {
  id: string;
  name: string;
}

interface AccountSelectionStepProps {
  accounts: Account[];
  selectedAccountId: string;
  onAccountSelect: (accountId: string) => void;
  loading?: boolean;
}

export default function AccountSelectionStep({
  accounts,
  selectedAccountId,
  onAccountSelect,
  loading = false
}: AccountSelectionStepProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-12 bg-muted rounded"></div>
        <div className="h-12 bg-muted rounded"></div>
        <div className="h-12 bg-muted rounded"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            {t('importTransactions.noAccounts')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {accounts.map(account => {
          const isSelected = selectedAccountId === account.id;
          return (
            <Button
              key={account.id}
              variant={isSelected ? "default" : "outline"}
              className="w-full justify-start h-auto p-4 text-left"
              onClick={() => onAccountSelect(account.id)}
            >
              <div>
                <div className="font-medium font-bold">{account.name}</div>
                <div className={twJoin("text-xs mt-1", !isSelected ? 'text-muted-foreground' : '')}>
                  {t('common.account', 'Account')} ID: {account.id}
                </div>
              </div>
            </Button>
          )
        })}
      </div>

      {selectedAccountId && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            ✓ {t('importTransactions.accountSelected', 'Account selected')}: {' '}
            <span className="font-medium">
              {accounts.find(acc => acc.id === selectedAccountId)?.name}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

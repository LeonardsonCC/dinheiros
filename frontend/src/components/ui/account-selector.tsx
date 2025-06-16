import * as React from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { cn } from "@/lib/utils"

export interface Account {
  id: string
  name: string
}

export interface AccountSelectorProps {
  accounts: Account[]
  onAccountSelect: (accountId: string) => void
  onBack?: () => void
  title?: string
  loading?: boolean
  emptyMessage?: string
  backText?: string
  className?: string
}

const AccountSelector = React.forwardRef<HTMLDivElement, AccountSelectorProps>(
  ({
    accounts,
    onAccountSelect,
    onBack,
    title = "Select Account",
    loading = false,
    emptyMessage = "No accounts available",
    backText = "Back",
    className,
    ...props
  }, ref) => {
    if (loading) {
      return (
        <div className={cn("p-6 max-w-lg mx-auto", className)} ref={ref} {...props}>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={cn("p-6 max-w-lg mx-auto", className)} ref={ref} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {accounts.length === 0 ? (
              <p className="text-muted-foreground">{emptyMessage}</p>
            ) : (
              <div className="space-y-2">
                {accounts.map(account => (
                  <Button
                    key={account.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => onAccountSelect(account.id)}
                  >
                    {account.name}
                  </Button>
                ))}
              </div>
            )}
            
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="mt-6 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {backText}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
)

AccountSelector.displayName = "AccountSelector"

export { AccountSelector }
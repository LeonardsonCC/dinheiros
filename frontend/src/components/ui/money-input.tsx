import * as React from "react"
import { cn } from "@/lib/utils"
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

export interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'step' | 'onChange'> {
  value?: number | string
  onChange?: (value: number) => void
  currency?: string
  locale?: string
  allowNegative?: boolean
  showSymbol?: boolean
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({
    className,
    value,
    onChange,
    currency = 'BRL',
    locale = 'pt-BR',
    allowNegative = false,
    showSymbol = false,
    placeholder = "0.00",
    min,
    ...props
  }, ref) => {
    // Convert value to number if it's a string and remove leading zeros
    const displayValue = React.useMemo(() => {
      if (value === undefined || value === '') return ''
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
      // Convert to string without leading zeros (parseFloat removes them automatically)
      return numValue.toString()
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value

      if (onChange) {
        // Remove leading zeros and let the browser handle the numeric conversion
        const numValue = parseFloat(inputVal) || 0

        // Apply constraints
        if (!allowNegative && numValue < 0) {
          return
        }

        const minValue = min ? parseFloat(min.toString()) : undefined
        if (minValue !== undefined && numValue < minValue) {
          return
        }

        onChange(numValue)
      }
    }

    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <CurrencyDollarIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="number"
          step="1"
          style={{ paddingLeft: '32px' }}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          min={!allowNegative ? (min || "0.01") : min}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
MoneyInput.displayName = "MoneyInput"

export { MoneyInput }

// Utility function to format currency (for display purposes)
export const formatCurrency = (
  amount: number,
  currency: string = 'BRL',
  locale: string = 'pt-BR'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

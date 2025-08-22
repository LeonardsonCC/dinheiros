import * as React from "react"
import { cn } from "@/lib/utils"
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

export interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'step' | 'onChange'> {
  value?: number | string
  onChange?: (value: number) => void
  allowNegative?: boolean
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({
    className,
    value,
    onChange,
    allowNegative = false,
    placeholder = "0.00",
    min,
    ...props
  }, ref) => {
    const { i18n } = useTranslation()
    const isBrazilian = i18n.language === 'pt-BR'
    const [displayValue, setDisplayValue] = React.useState('')
    const [isFocused, setIsFocused] = React.useState(false)
    
    // Format number to Brazilian format (1.234,56) or US format (1,234.56)
    const formatDisplayValue = (numValue: number): string => {
      if (isBrazilian) {
        return numValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      } else {
        return numValue.toFixed(2)
      }
    }

    // Format for editing (less aggressive formatting during input)
    const formatForEditing = (inputVal: string): string => {
      if (!isBrazilian) return inputVal
      
      // Remove all non-digit characters except comma
      const digitsOnly = inputVal.replace(/[^\d,]/g, '')
      
      // Split by comma to handle decimal part
      const parts = digitsOnly.split(',')
      let integerPart = parts[0] || ''
      const decimalPart = parts[1] || ''
      
      // Add thousand separators to integer part
      if (integerPart.length > 3) {
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      }
      
      // Combine parts
      if (parts.length > 1) {
        return integerPart + ',' + decimalPart.slice(0, 2) // Limit to 2 decimal places
      }
      
      return integerPart
    }

    // Parse Brazilian format (1.234,56) or US format (1,234.56) to number
    const parseInputValue = (inputVal: string): number => {
      if (isBrazilian) {
        // Replace dots (thousand separators) and comma (decimal separator) for Brazilian format
        const normalized = inputVal
          .replace(/\./g, '') // Remove thousand separators
          .replace(',', '.') // Replace decimal comma with dot
        return parseFloat(normalized) || 0
      } else {
        // For US format, remove commas (thousand separators)
        const normalized = inputVal.replace(/,/g, '')
        return parseFloat(normalized) || 0
      }
    }

    // Update display value when prop value changes
    React.useEffect(() => {
      if (!isFocused) {
        if (value === undefined || value === '') {
          setDisplayValue('')
        } else {
          const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
          setDisplayValue(formatDisplayValue(numValue))
        }
      }
    }, [value, isBrazilian, isFocused])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputVal = e.target.value

      if (isBrazilian && isFocused) {
        // Apply light formatting during editing
        inputVal = formatForEditing(inputVal)
        setDisplayValue(inputVal)
      } else {
        setDisplayValue(inputVal)
      }

      if (onChange) {
        const numValue = parseInputValue(inputVal)

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

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      if (props.onFocus) {
        props.onFocus(e)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      // Reformat to final display format when losing focus
      if (value !== undefined && value !== '') {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
        setDisplayValue(formatDisplayValue(numValue))
      }
      if (props.onBlur) {
        props.onBlur(e)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isBrazilian) {
        const key = e.key
        const isDigit = /^[0-9]$/.test(key)
        const isComma = key === ','
        const isDot = key === '.'
        const isControlKey = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(key)
        const isCtrlCommand = e.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())
        
        if (!(isDigit || isComma || isDot || isControlKey || isCtrlCommand)) {
          e.preventDefault()
        }
      }
      
      if (props.onKeyDown) {
        props.onKeyDown(e)
      }
    }

    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <CurrencyDollarIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type={isBrazilian ? "text" : "number"}
          step={isBrazilian ? undefined : "0.01"}
          inputMode="decimal"
          style={{ paddingLeft: '32px' }}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={isBrazilian ? "0,00" : placeholder}
          min={!isBrazilian && !allowNegative ? (min || "0.01") : undefined}
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

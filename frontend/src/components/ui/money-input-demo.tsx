import { useState } from 'react'
import { MoneyInput, formatCurrency } from './money-input'

export default function MoneyInputDemo() {
  const [value, setValue] = useState<number>(100.50)

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">MoneyInput Component Demo</h2>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Standard Money Input (BRL) - No leading zeros!
        </label>
        <MoneyInput
          value={value}
          onChange={setValue}
          placeholder="0.00"
        />
        <p className="text-sm text-gray-500 mt-1">
          Value: {value} | Formatted: {formatCurrency(value)}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Money Input Allowing Negative Values
        </label>
        <MoneyInput
          value={value}
          onChange={setValue}
          allowNegative={true}
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          USD Money Input
        </label>
        <MoneyInput
          value={value}
          onChange={setValue}
          placeholder="0.00"
        />
        <p className="text-sm text-gray-500 mt-1">
          Formatted in USD: {formatCurrency(value, 'USD', 'en-US')}
        </p>
      </div>

      <div className="mt-4">
        <button 
          onClick={() => setValue(v => v + 10)} 
          className="mr-2 px-3 py-1 bg-blue-500 text-white rounded"
        >
          +10
        </button>
        <button 
          onClick={() => setValue(v => Math.max(0, v - 10))} 
          className="mr-2 px-3 py-1 bg-red-500 text-white rounded"
        >
          -10
        </button>
        <button 
          onClick={() => setValue(0)} 
          className="px-3 py-1 bg-gray-500 text-white rounded"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
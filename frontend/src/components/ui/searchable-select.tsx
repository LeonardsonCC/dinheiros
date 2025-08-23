import React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Input } from "./input"

export interface SearchableSelectOption {
  value: string
  label: string
  sublabel?: string
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  noOptionsText?: string
}

const SearchableSelect = React.forwardRef<HTMLDivElement, SearchableSelectProps>(
  ({
    options,
    value,
    onChange,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    disabled = false,
    className,
    noOptionsText = "No options found"
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
          setSearchTerm("")
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const filteredOptions = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (option.sublabel && option.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const handleSelect = (optionValue: string) => {
      if (disabled) return
      onChange(optionValue)
      setIsOpen(false)
      setSearchTerm("")
    }

    const selectedOption = options.find(option => option.value === value)

    return (
      <div ref={ref} className={cn("relative", className)}>
        <div ref={dropdownRef}>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className={cn(
              "w-full justify-between",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
          >
            <span className="truncate text-left">
              {selectedOption ? (
                <div className="flex flex-col items-start">
                  <span>{selectedOption.label}</span>
                  {selectedOption.sublabel && (
                    <span className="text-xs text-muted-foreground truncate">
                      {selectedOption.sublabel}
                    </span>
                  )}
                </div>
              ) : (
                placeholder
              )}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md">
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    {noOptionsText}
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        "flex items-center px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground",
                        value === option.value && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate">{option.label}</span>
                        {option.sublabel && (
                          <span className="text-xs text-muted-foreground truncate">
                            {option.sublabel}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

SearchableSelect.displayName = "SearchableSelect"

export { SearchableSelect }
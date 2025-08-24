import * as React from "react"
import { Check, ChevronDown, X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"
import { Button } from "./button"
import { Input } from "./input"

export interface MultiSelectOption {
  id: number | string
  name: string
  value?: string
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: (number | string)[]
  onChange: (selected: (number | string)[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  onAddOption?: (name: string) => void | Promise<unknown>
  searchPlaceholder?: string
  addText?: string
  noMatchText?: string
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({
    options,
    selected,
    onChange,
    placeholder = "Select options...",
    disabled = false,
    className,
    onAddOption,
    searchPlaceholder = "Search or add option...",
    addText = "Add",
    noMatchText = "No match, add:",
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const filteredOptions = options.filter(option =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const toggleOption = (optionId: number | string) => {
      if (disabled) return
      const newSelected = selected.includes(optionId)
        ? selected.filter(id => id !== optionId)
        : [...selected, optionId]
      onChange(newSelected)
    }

    const removeOption = (optionId: number | string, e: React.MouseEvent) => {
      e.stopPropagation()
      if (disabled) return
      onChange(selected.filter(id => id !== optionId))
    }

    const handleAddOption = async () => {
      if (onAddOption && searchTerm.trim()) {
        await onAddOption(searchTerm.trim())
        setSearchTerm("")
        setIsOpen(false)
      }
    }

    const selectedOptions = selected.map(id => options.find(opt => opt.id === id)).filter(Boolean) as MultiSelectOption[]

    return (
      <div className={cn("relative", className)} ref={ref} {...props}>
        <div
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            disabled && "cursor-not-allowed opacity-50",
            !disabled && "cursor-pointer",
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedOptions.map(option => (
                <Badge
                  key={option.id}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 gap-1"
                >
                  {option.name}
                  <button
                    type="button"
                    onClick={(e) => removeOption(option.id, e)}
                    disabled={disabled}
                    className="ml-1 hover:text-destructive disabled:pointer-events-none"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95" ref={dropdownRef}>
            <div className="p-2">
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="h-8 text-xs"
              />
            </div>

            <div className="max-h-60 overflow-auto p-2">
              {filteredOptions.length === 0 && searchTerm.trim() ? (
                <div className="px-3 py-2 text-muted-foreground flex items-center justify-between">
                  <span className="text-xs">{noMatchText} {searchTerm}</span>
                  {onAddOption && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        handleAddOption()
                        setIsOpen(false)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {addText}
                    </Button>
                  )}
                </div>
              ) : (
                filteredOptions.map(option => (
                  <div
                    key={option.id}
                    className={cn(
                      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      selected.includes(option.id) && "font-semibold"
                    )}
                    onClick={() => toggleOption(option.id)}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {selected.includes(option.id) && (
                        <Check className="h-4 w-4" />
                      )}
                    </span>
                    {option.name}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)

MultiSelect.displayName = "MultiSelect"

export { MultiSelect }

import * as React from "react"
import { MultiSelect, MultiSelectOption, MultiSelectProps } from "./multi-select"

export interface CategoryOption {
  id: number
  name: string
}

export interface CategoryMultiSelectProps {
  options: CategoryOption[]
  selected: number[]
  onChange: (selected: number[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  onAddCategory?: (name: string) => void | Promise<unknown>
  searchPlaceholder?: string
  addText?: string
  noMatchText?: string
}

const CategoryMultiSelect = React.forwardRef<HTMLDivElement, CategoryMultiSelectProps>(
  ({
    options,
    selected,
    onChange,
    placeholder = "Select categories...",
    disabled = false,
    className,
    onAddCategory,
    searchPlaceholder = "Search or add category...",
    addText = "Add",
    noMatchText = "No match, add:",
    ...props
  }, ref) => {
    const multiSelectOptions: MultiSelectOption[] = options.map(option => ({
      id: option.id,
      name: option.name
    }))

    const handleChange = (newSelected: (number | string)[]) => {
      onChange(newSelected as number[])
    }

    const handleAddCategory = async (name: string) => {
      if (onAddCategory) {
        await onAddCategory(name)
      }
    }

    const multiSelectProps: MultiSelectProps = {
      options: multiSelectOptions,
      selected,
      onChange: handleChange,
      placeholder,
      disabled,
      className,
      onAddOption: onAddCategory ? handleAddCategory : undefined,
      searchPlaceholder,
      addText,
      noMatchText,
      ...props
    }

    return <MultiSelect ref={ref} {...multiSelectProps} />
  }
)

CategoryMultiSelect.displayName = "CategoryMultiSelect"

export { CategoryMultiSelect }

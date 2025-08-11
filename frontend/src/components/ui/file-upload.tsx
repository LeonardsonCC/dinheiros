import * as React from "react"
import { DocumentTextIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

export interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  accept?: string
  maxSize?: number // in bytes
  className?: string
  disabled?: boolean
  error?: string
  dragText?: string
  uploadText?: string
  sizeLimit?: string
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({
    onFileSelect,
    selectedFile,
    accept = ".pdf",
    maxSize = 10 * 1024 * 1024, // 10MB default
    className,
    disabled = false,
    error,
    dragText = "or drag and drop",
    uploadText = "Upload a file",
    sizeLimit = "PDF up to 10MB",
    ...props
  }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const validateFile = React.useCallback((file: File): { valid: boolean; error?: string } => {
      if (accept && !accept.split(',').some(type => file.type.includes(type.replace('.', '').trim()))) {
        return { valid: false, error: `Only ${accept} files are allowed` }
      }

      if (file.size > maxSize) {
        return { valid: false, error: `File is too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(0)}MB` }
      }

      return { valid: true }
    }, [accept, maxSize])

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragging(true)
      }
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        const validation = validateFile(file)
        if (validation.valid) {
          onFileSelect(file)
        } else {
          onFileSelect(null)
        }
      }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0]
        const validation = validateFile(file)
        if (validation.valid) {
          onFileSelect(file)
        } else {
          onFileSelect(null)
        }
      }
    }

    const removeFile = () => {
      onFileSelect(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

    if (selectedFile) {
      return (
        <div className={cn("flex items-center justify-between px-4 py-3 bg-muted rounded-md", className)} ref={ref} {...props}>
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 text-muted-foreground mr-3" />
            <span className="text-sm font-medium truncate max-w-xs">
              {selectedFile.name}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <button
            type="button"
            onClick={removeFile}
            disabled={disabled}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5" />
            <span className="sr-only">Remove file</span>
          </button>
        </div>
      )
    }

    return (
      <div className={cn("space-y-2", className)} ref={ref} {...props}>
        <div 
          className={cn(
            "flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            error ? "border-destructive" : "",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="space-y-1 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="flex text-sm text-muted-foreground">
              <span className="font-medium text-primary hover:text-primary/80">
                {uploadText}
              </span>
              <p className="pl-1">{dragText}</p>
            </div>
            <p className="text-xs text-muted-foreground">{sizeLimit}</p>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled}
        />
        
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

FileUpload.displayName = "FileUpload"

export { FileUpload }
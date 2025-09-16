import React, { useState, useRef, useEffect } from 'react'
import { Input } from './input'
import { Label } from './label'
import { ChevronDown, X } from 'lucide-react'

interface AutoSuggestInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  onValidate?: (value: string) => void
  placeholder: string
  suggestions: string[]
  error?: string
  required?: boolean
  className?: string
}

export function AutoSuggestInput({
  label,
  value,
  onChange,
  onValidate,
  placeholder,
  suggestions,
  error,
  required = false,
  className = ''
}: AutoSuggestInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [showAddNew, setShowAddNew] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter suggestions based on input value
  useEffect(() => {
    if (value.trim()) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredSuggestions(filtered)
      
      // Show "Add new" option if current value doesn't match any suggestion
      const exactMatch = suggestions.some(suggestion => 
        suggestion.toLowerCase() === value.toLowerCase()
      )
      setShowAddNew(!exactMatch && value.trim().length > 0)
    } else {
      setFilteredSuggestions(suggestions)
      setShowAddNew(false)
    }
  }, [value, suggestions])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
    if (onValidate) {
      onValidate(newValue)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setIsOpen(false)
    if (onValidate) {
      onValidate(suggestion)
    }
  }

  const handleAddNew = () => {
    setIsOpen(false)
    if (onValidate) {
      onValidate(value)
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'Enter' && isOpen && filteredSuggestions.length > 0) {
      e.preventDefault()
      handleSuggestionClick(filteredSuggestions[0])
    }
  }

  return (
    <div className={`space-y-2 relative ${className}`}>
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
        {label} {required && <span className="text-black-500">*</span>}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={label.toLowerCase().replace(/\s+/g, '-')}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`pr-8 ${error ? 'border-red-500' : ''}`}
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (filteredSuggestions.length > 0 || showAddNew) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
          
          {showAddNew && (
            <div
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-blue-600 border-t border-gray-200"
              onClick={handleAddNew}
            >
              <span className="font-medium">Add "{value}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

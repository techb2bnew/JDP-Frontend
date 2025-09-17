import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Checkbox } from './checkbox'
import { Badge } from './badge'
import { Button } from './button'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { ChevronDown, X } from 'lucide-react'

interface AutoScrollMultiSelectProps {
  selectedValues: string[]
  onSelectionChange: (selectedIds: string[], selectedItems: any[]) => void
  placeholder: string
  fetchData: (page: number, limit: number) => Promise<{
    data: Array<{ id: string; name: string; [key: string]: any }>
    totalPages: number
    currentPage: number
  }>
  displayField: string
  valueField: string
  className?: string
}

export function AutoScrollMultiSelect({
  selectedValues,
  onSelectionChange,
  placeholder,
  fetchData,
  displayField,
  valueField,
  className
}: AutoScrollMultiSelectProps) {
  const [items, setItems] = useState<Array<{ id: string; name: string; [key: string]: any }>>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async (page: number, append: boolean = false) => {
    try {
      if (page === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const response = await fetchData(page, 10)
      
      if (append) {
        setItems(prev => [...prev, ...response.data])
      } else {
        setItems(response.data)
      }
      
      setCurrentPage(response.currentPage)
      setTotalPages(response.totalPages)
      setHasMore(response.currentPage < response.totalPages)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [fetchData])

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && currentPage < totalPages) {
      loadData(currentPage + 1, true)
    }
  }, [hasMore, isLoadingMore, currentPage, totalPages, loadData])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const threshold = 50 // Load more when 50px from bottom

    if (scrollHeight - scrollTop - clientHeight < threshold) {
      loadMore()
    }
  }, [loadMore])

  useEffect(() => {
    if (isOpen && items.length === 0) {
      loadData(1)
    }
  }, [isOpen, items.length, loadData])

  const handleItemToggle = (item: any) => {
    const itemId = item[valueField]
    const isSelected = selectedValues.includes(itemId)
    
    let newSelectedValues: string[]
    let newSelectedItems: any[]
    
    if (isSelected) {
      newSelectedValues = selectedValues.filter(id => id !== itemId)
      newSelectedItems = selectedItems.filter(selectedItem => selectedItem[valueField] !== itemId)
    } else {
      newSelectedValues = [...selectedValues, itemId]
      newSelectedItems = [...selectedItems, item]
    }
    
    setSelectedItems(newSelectedItems)
    onSelectionChange(newSelectedValues, newSelectedItems)
  }

  const removeSelectedItem = (itemId: string) => {
    const newSelectedValues = selectedValues.filter(id => id !== itemId)
    const newSelectedItems = selectedItems.filter(item => item[valueField] !== itemId)
    setSelectedItems(newSelectedItems)
    onSelectionChange(newSelectedValues, newSelectedItems)
  }

  const getSelectedItemName = (itemId: string) => {
    const item = selectedItems.find(item => item[valueField] === itemId)
    return item ? item[displayField] : itemId
  }

  return (
    <div className="space-y-2">
      {/* Selected Items Display */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedValues.map((value) => (
            <Badge key={value} className="bg-[#E6F6FF] text-[#00A1FF] border-[#00A1FF]/20 flex items-center gap-1">
              {getSelectedItemName(value)}
              <button
                onClick={() => removeSelectedItem(value)}
                className="ml-1 hover:bg-[#00A1FF]/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Dropdown */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full justify-between ${className}`}
        >
          <span className="text-left">
            {selectedValues.length > 0 
              ? `${selectedValues.length} selected` 
              : placeholder
            }
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="max-h-60 overflow-y-auto"
            >
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  {items.map((item) => {
                    const isSelected = selectedValues.includes(item[valueField])
                    return (
                      <div
                        key={item[valueField]}
                        className="flex items-center space-x-2 p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleItemToggle(item)}
                      >
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => handleItemToggle(item)}
                        />
                        <span className="text-sm font-medium">{item[displayField]}</span>
                      </div>
                    )
                  })}
                  {isLoadingMore && (
                    <div className="flex items-center justify-center p-2">
                      <LoadingSpinner />
                    </div>
                  )}
                  {!hasMore && items.length > 0 && (
                    <div className="text-center text-sm text-gray-500 p-2">
                      No more items
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

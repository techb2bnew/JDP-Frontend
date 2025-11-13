import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { LoadingSpinner } from '../common/LoadingSpinner'

interface AutoScrollSelectProps {
  value: string
  onValueChange: (value: string, item?: any) => void
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

export function AutoScrollSelect({
  value,
  onValueChange,
  placeholder,
  fetchData,
  displayField,
  valueField,
  className
}: AutoScrollSelectProps) {
  const [items, setItems] = useState<Array<{ id: string; name: string; [key: string]: any }>>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const loadData = useCallback(async (page: number, append: boolean = false) => {
    try {
      if (page === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
 
      const response = await fetchData(page, 10) 
      
      // Check if response has data
      if (response && response.data && response.data.length > 0) {
        if (append) {
          setItems(prev => [...prev, ...response.data])
        } else {
          setItems(response.data)
        }
        
        setCurrentPage(response.currentPage || 1)
        setTotalPages(response.totalPages || 1)
        setHasMore((response.currentPage || 1) < (response.totalPages || 1))
         
      } else { 
        // Set empty data to avoid infinite loading
        if (!append) {
          setItems([])
        }
        setCurrentPage(1)
        setTotalPages(1)
        setHasMore(false)
      }
    } catch (error) {
      console.error('AutoScrollSelect: Error loading data:', error)
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

  useEffect(() => {
    if (isOpen && items.length === 0) {
      loadData(1)
    }
  }, [isOpen, items.length, loadData])

  // Find and set selected item when value or items change
  useEffect(() => {
    if (value && items.length > 0) {
      const foundItem = items.find(item => item[valueField] === value)
      if (foundItem) {
        setSelectedItem(foundItem)
      }
    }
  }, [value, items, valueField])

  // Load data when component mounts with a value but no items
  useEffect(() => {
    if (value && items.length === 0) { 
      loadData(1)
    }
  }, [value, items.length, loadData])

  const handleOpenChange = (open: boolean) => { 
    setIsOpen(open)
    if (open) {
      if (items.length === 0) { 
        loadData(1)
      } else if (hasMore && !isLoadingMore) {
        // Load more data if available when dropdown opens 
        loadMore()
      }
    }
  }

  const handleValueChange = (selectedValue: string) => {
    const foundItem = items.find(item => item[valueField] === selectedValue)
    setSelectedItem(foundItem)
    onValueChange(selectedValue, foundItem)
  }

  return (
    <Select value={value} onValueChange={handleValueChange} onOpenChange={handleOpenChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <LoadingSpinner  />
          </div>
        ) : (
          <>
            {items.map((item) => (
              <SelectItem 
                key={item[valueField]} 
                value={item[valueField]}
              >
                {item[displayField]}
              </SelectItem>
            ))}
            {isLoadingMore && (
              <div className="flex items-center justify-center p-2">
                <LoadingSpinner  />
              </div>
            )}
            {!hasMore && items.length > 0 && (
              <div className="text-center text-sm text-gray-500 p-2">
                No more items
              </div>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  )
}

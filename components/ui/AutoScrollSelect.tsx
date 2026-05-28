import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Input } from './input'
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
  refreshKey?: number
  /** Called when the user clicks "Create New" inside the dropdown */
  onCreateNew?: () => void
  /** Label for the create button (default: "+ Create New") */
  createNewLabel?: string
  renderItem?: (item: any) => React.ReactNode
}

export function AutoScrollSelect({
  value,
  onValueChange,
  placeholder,
  fetchData,
  displayField,
  valueField,
  className,
  refreshKey,
  onCreateNew,
  createNewLabel = '+ Create New', 
  renderItem
}: AutoScrollSelectProps) {
  const [items, setItems] = useState<Array<{ id: string; name: string; [key: string]: any }>>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = useCallback(async (page: number, append: boolean = false) => {
    try {
      if (page === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const response = await fetchData(page, 10)

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

  // Auto-select: find + fire onValueChange whenever value or items change
  // This covers the "after creation → refreshKey reload → items updated" case
  useEffect(() => {
    if (value && items.length > 0) {
      const foundItem = items.find(
        item => String(item[valueField]) === String(value)
      )
      if (foundItem) {
        // Only fire if the selectedItem reference actually changed
        setSelectedItem((prev: any) => {
          if (prev?.[valueField] !== foundItem[valueField]) {
            return foundItem
          }
          return prev
        })
      }
    }
  }, [value, items, valueField])

  // Load data when component mounts with a value but no items
  useEffect(() => {
    if (value && items.length === 0) {
      loadData(1)
    }
  }, [value, items.length, loadData])

  // Explicit refresh from parent (e.g. after creating new item)
  useEffect(() => {
    if (refreshKey !== undefined) {
      loadData(1)
    }
  }, [refreshKey, loadData])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      if (items.length === 0) {
        loadData(1)
      } else if (hasMore && !isLoadingMore) {
        loadMore()
      }
    }
  }

  const handleValueChange = (selectedValue: string) => {
    const foundItem = items.find(item => String(item[valueField]) === String(selectedValue))
    setSelectedItem(foundItem)
    onValueChange(selectedValue, foundItem)
  }

  const filteredItems = items.filter(item =>
    item[displayField]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  )

  const showCreateButton = !!onCreateNew && filteredItems.length === 0 && !isLoading

  return (
    <Select value={value} onValueChange={handleValueChange} onOpenChange={handleOpenChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="p-2 pb-1 border-b border-gray-100">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {filteredItems.map((item) => (
              <SelectItem
                key={item[valueField]}
                value={String(item[valueField])}
              >
                {renderItem ? renderItem(item) : item[displayField]}
              </SelectItem>
            ))}

            {/* Empty state: no results + optional create button */}
            {filteredItems.length === 0 && !isLoading && (
              <div className="p-3 text-center space-y-2">
                <p className="text-sm text-gray-500">
                  {searchTerm ? 'No results found' : 'No items available'}
                </p>
                {onCreateNew && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      // Use onMouseDown so the Select doesn't close before the click fires
                      e.preventDefault()
                      e.stopPropagation()
                      onCreateNew()
                    }}
                    className="w-full py-1.5 px-3 text-sm font-medium text-white bg-[#00A1FF] rounded hover:bg-[#0081CC] transition-colors"
                  >
                    {createNewLabel}
                  </button>
                )}
              </div>
            )}

            {isLoadingMore && (
              <div className="flex items-center justify-center p-2">
                <LoadingSpinner />
              </div>
            )}

            {!hasMore && items.length > 0 && filteredItems.length > 0 && (
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
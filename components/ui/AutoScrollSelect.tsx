import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Input } from './input'
import { LoadingSpinner } from '../common/LoadingSpinner'

type FetchResult = {
  data: Array<{ id: string; name: string; [key: string]: any }>
  totalPages: number
  currentPage: number
}

interface AutoScrollSelectProps {
  value: string
  onValueChange: (value: string, item?: any) => void
  placeholder: string
  fetchData: (page: number, limit: number) => Promise<FetchResult>
  displayField: string
  valueField: string
  className?: string
  refreshKey?: number
  /** Called when the user clicks "Create New" inside the dropdown */
  onCreateNew?: () => void
  /** Label for the create button (default: "+ Create New") */
  createNewLabel?: string
  renderItem?: (item: any) => React.ReactNode
  /** Page size for list + search requests (default 10) */
  pageSize?: number
  /** When set, non-empty search uses this API instead of client-side filter */
  serverSearchFetch?: (
    term: string,
    page: number,
    limit: number,
  ) => Promise<FetchResult>
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
  renderItem,
  pageSize = 10,
  serverSearchFetch,
}: AutoScrollSelectProps) {
  const [items, setItems] = useState<
    Array<{ id: string; name: string; [key: string]: any }>
  >([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const searchTermRef = useRef(searchTerm)
  searchTermRef.current = searchTerm
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadData = useCallback(
    async (page: number, append: boolean = false) => {
      try {
        if (page === 1) {
          setIsLoading(true)
        } else {
          setIsLoadingMore(true)
        }

        const term = searchTermRef.current.trim()
        const response: FetchResult =
          serverSearchFetch && term
            ? await serverSearchFetch(term, page, pageSize)
            : await fetchData(page, pageSize)

        if (response?.data?.length > 0) {
          if (append) {
            setItems((prev) => {
              const seen = new Set(prev.map((i) => String(i[valueField])))
              const merged = [...prev]
              for (const row of response.data) {
                const key = String(row[valueField])
                if (!seen.has(key)) {
                  seen.add(key)
                  merged.push(row)
                }
              }
              return merged
            })
          } else {
            setItems(response.data)
          }

          const pageNum = response.currentPage || page
          const total = response.totalPages || 1
          setCurrentPage(pageNum)
          setTotalPages(total)
          setHasMore(pageNum < total)
        } else {
          if (!append) {
            setItems([])
          }
          setCurrentPage(page)
          setTotalPages(page)
          setHasMore(false)
        }
      } catch (error) {
        console.error('AutoScrollSelect: Error loading data:', error)
        if (!append) {
          setItems([])
        }
        setHasMore(false)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [fetchData, serverSearchFetch, pageSize, valueField],
  )

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading && currentPage < totalPages) {
      void loadData(currentPage + 1, true)
    }
  }, [hasMore, isLoadingMore, isLoading, currentPage, totalPages, loadData])

  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 48
    if (nearBottom) {
      loadMore()
    }
  }

  useEffect(() => {
    if (isOpen && items.length === 0) {
      void loadData(1)
    }
  }, [isOpen, items.length, loadData])

  useEffect(() => {
    if (value && items.length > 0) {
      const foundItem = items.find(
        (item) => String(item[valueField]) === String(value),
      )
      if (foundItem) {
        setSelectedItem((prev: any) => {
          if (prev?.[valueField] !== foundItem[valueField]) {
            return foundItem
          }
          return prev
        })
      }
    }
  }, [value, items, valueField])

  useEffect(() => {
    if (value && items.length === 0) {
      void loadData(1)
    }
  }, [value, items.length, loadData])

  useEffect(() => {
    if (refreshKey !== undefined) {
      void loadData(1)
    }
  }, [refreshKey, loadData])

  useEffect(() => {
    if (!serverSearchFetch || !isOpenRef.current) return

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null
      if (isOpenRef.current) {
        void loadData(1)
      }
    }, 300)

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [searchTerm, serverSearchFetch, loadData])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      if (items.length === 0) {
        void loadData(1)
      }
    } else if (serverSearchFetch) {
      setSearchTerm('')
      searchTermRef.current = ''
    }
  }

  const handleValueChange = (selectedValue: string) => {
    const foundItem = items.find(
      (item) => String(item[valueField]) === String(selectedValue),
    )
    setSelectedItem(foundItem)
    onValueChange(selectedValue, foundItem)
  }

  const displayItems = serverSearchFetch
    ? items
    : items.filter((item) =>
        item[displayField]
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )

  return (
    <Select
      value={value}
      onValueChange={handleValueChange}
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-80 p-0">
        <div className="p-2 pb-1 border-b border-gray-100 bg-white sticky top-0 z-10">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="h-8 text-xs"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <LoadingSpinner />
          </div>
        ) : (
          <div
            className="max-h-60 overflow-y-auto"
            onScroll={handleListScroll}
          >
            {displayItems.map((item) => (
              <SelectItem
                key={item[valueField]}
                value={String(item[valueField])}
              >
                {renderItem ? renderItem(item) : item[displayField]}
              </SelectItem>
            ))}

            {displayItems.length === 0 && !isLoading && (
              <div className="p-3 text-center space-y-2">
                <p className="text-sm text-gray-500">
                  {searchTerm ? 'No results found' : 'No items available'}
                </p>
                {onCreateNew && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
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

            {!hasMore && items.length > 0 && displayItems.length > 0 && (
              <div className="text-center text-sm text-gray-500 p-2">
                No more items
              </div>
            )}
          </div>
        )}
      </SelectContent>
    </Select>
  )
}

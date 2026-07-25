import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Checkbox } from './checkbox'
import { Badge } from './badge'
import { Button } from './button'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { ChevronDown, X } from 'lucide-react'
import { Input } from './input'

interface AutoScrollMultiSelectProps {
  selectedValues: any[];
  // New: pass the full selected objects so we can render labels immediately
  selectedObjects?: any[];
  onSelectionChange: (selectedIds: string[], selectedItems: any[]) => void;
  placeholder: string;
  fetchData: (page: number, limit: number) => Promise<{
    data: Array<{ id: string; name: string;[key: string]: any }>;
    totalPages: number;
    currentPage: number;
  }>;
  displayField: string;
  valueField: string;
  className?: string;
}

export function AutoScrollMultiSelect({
  selectedValues,
  selectedObjects,
  onSelectionChange,
  placeholder,
  fetchData,
  displayField,
  valueField,
  className
}: AutoScrollMultiSelectProps) {
  const [items, setItems] = useState<Array<{ id: string; name: string;[key: string]: any }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initial Load
  const loadData = useCallback(async (page: number, append: boolean = false) => {
    try {
      page === 1 ? setIsLoading(true) : setIsLoadingMore(true);

      const response = await fetchData(page, 10);
      setItems(prev => append ? [...prev, ...response.data] : response.data);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
      setHasMore(response.currentPage < response.totalPages);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [fetchData]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && currentPage < totalPages) {
      loadData(currentPage + 1, true);
    }
  }, [hasMore, isLoadingMore, currentPage, totalPages, loadData]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50) loadMore();
  }, [loadMore]);

  useEffect(() => {
    if (isOpen && items.length === 0) {
      loadData(1);
    }
  }, [isOpen, items.length, loadData]);

  // Seed selected items from fetched list and from provided selectedObjects
  useEffect(() => {
    const matchedFromItems = items.filter(item =>
      selectedValues.includes(item[valueField]?.toString())
    );
    // Merge with provided objects (if any)
    const mappedFromObjects = (selectedObjects || [])
      .filter(obj => obj && obj[valueField] !== undefined)
      .map(obj => obj);

    // Deduplicate by valueField
    const byId = new Map<string, any>();
    [...mappedFromObjects, ...matchedFromItems].forEach(it => {
      const key = it[valueField]?.toString();
      if (key) byId.set(key, it);
    });
    setSelectedItems(Array.from(byId.values()));
  }, [items, selectedValues, selectedObjects, valueField]);

  const handleItemToggle = (item: any) => {
    const itemId = item[valueField]?.toString();
    const isSelected = selectedValues.includes(itemId);

    let newSelectedValues: string[];
    let newSelectedItems: any[];

    if (isSelected) {
      newSelectedValues = selectedValues.filter(id => id !== itemId);
      newSelectedItems = selectedItems.filter(selected => selected[valueField]?.toString() !== itemId);
    } else {
      // Prevent duplicates
      const alreadyExists = selectedItems.some(selected => selected[valueField]?.toString() === itemId);
      newSelectedValues = [...selectedValues, itemId];
      newSelectedItems = alreadyExists ? selectedItems : [...selectedItems, item];
    }

    setSelectedItems(newSelectedItems);
    onSelectionChange(newSelectedValues, newSelectedItems);
  };

  const removeSelectedItem = (itemId: string) => {
    const newSelectedValues = selectedValues.filter(id => id !== itemId);
    const newSelectedItems = selectedItems.filter(item => item[valueField]?.toString() !== itemId);
    setSelectedItems(newSelectedItems);
    onSelectionChange(newSelectedValues, newSelectedItems);
  };

  const getSelectedItemName = (itemId: string) => {
    const item = selectedItems.find(item => item[valueField]?.toString() === itemId);
    // Try common fallbacks if displayField is missing
    if (item) {
      return (
        item[displayField] ||
        item.name ||
        item.users?.full_name ||
        item.full_name ||
        item.label ||
        itemId
      );
    }
    return itemId;
  };

  const filteredItems = items.filter(item => {
    const label =
      item[displayField] ||
      item.name ||
      item.user?.full_name ||
      item.labor_code ||
      ''
    return label.toString().toLowerCase().includes(searchTerm.toLowerCase())
  });

  return (
    <div className="space-y-2">
      {/* Selected items */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedValues.map((value, index) => {
            const itemId = typeof value === 'string' ? value : value?.[valueField]?.toString();
            return (
              <Badge
                key={itemId || index}
                className="bg-[#E6F6FF] text-[#00A1FF] border-[#00A1FF]/20 flex items-center gap-1"
              >
                {getSelectedItemName(itemId)}
                <button
                  onClick={() => removeSelectedItem(itemId)}
                  className="ml-1 hover:bg-[#00A1FF]/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
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
              : placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-hidden">
            {/* Search input */}
            <div className="p-2 pb-1 border-b border-gray-100">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="max-h-64 overflow-y-auto select-1-new"
              style={{ maxHeight: '200px' }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  {filteredItems.map((item) => {
                    const itemId = item[valueField]?.toString();
                    const isSelected = selectedValues.includes(itemId);
                    return (
                      <div
                        key={itemId}
                        className="flex items-center space-x-2 p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleItemToggle(item)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleItemToggle(item)}
                        />
                        <span className="text-sm font-medium">{item[displayField]}</span>
                      </div>
                    );
                  })}
                  {isLoadingMore && (
                    <div className="flex items-center justify-center p-2">
                      <LoadingSpinner />
                    </div>
                  )}
                  {!hasMore && filteredItems.length > 0 && (
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

      {/* Outside click closes dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

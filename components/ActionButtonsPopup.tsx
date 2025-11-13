import { useState } from 'react'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { MoreVertical, Eye, Edit, Trash2, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'

interface ActionButtonsPopupProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onComplete?: () => void
  itemName?: string
  itemType?: string
  showView?: boolean
  showEdit?: boolean
  showDelete?: boolean
  showComplete?: boolean
  isLoading?: boolean
}

export function ActionButtonsPopup({ 
  onView, 
  onEdit, 
  onDelete, 
  onComplete,
  itemName = 'item',
  itemType = 'item',
  showView = true,
  showEdit = true,
  showDelete = true,
  showComplete = false,
  isLoading = false
}: ActionButtonsPopupProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const handleView = () => {
    if (onView) {
      onView()
      setIsPopoverOpen(false)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
      setIsPopoverOpen(false)
    }
  }

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete()
    }
    setIsPopoverOpen(false)
  }

  const handleCompleteClick = () => {
    if (onComplete) {
      onComplete()
    }
    setIsPopoverOpen(false)
  }

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <MoreVertical className="h-4 w-4 text-gray-600" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-44 p-2 bg-white border border-gray-200 shadow-lg rounded-lg" 
          align="end"
          side="bottom"
          sideOffset={8}
        >
          <div className="flex flex-col">
            {showView && onView && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md mb-1"
                onClick={handleView}
              >
                <Eye className="mr-2 h-4 w-4 text-gray-500" />
                View
              </Button>
            )}
            {showComplete && onComplete && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 px-2 py-1.5 text-sm text-green-700 hover:bg-green-50 hover:text-green-800 rounded-md mb-1"
                onClick={handleCompleteClick}
              >
                <CheckSquare className="mr-2 h-4 w-4 text-green-600" />
                Complete
              </Button>
            )}
            
            {showEdit && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md mb-1"
                onClick={handleEdit}
              >
                <Edit className="mr-2 h-4 w-4 text-gray-500" />
                Edit
              </Button>
            )}
            
            {showDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md"
                onClick={handleDeleteClick}
              >
                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                Delete
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
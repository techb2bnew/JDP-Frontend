import { useState } from 'react'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface ActionButtonsPopupProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  itemName?: string
  itemType?: string
  showView?: boolean
  showEdit?: boolean
  showDelete?: boolean
}

export function ActionButtonsPopup({ 
  onView, 
  onEdit, 
  onDelete, 
  itemName = 'item',
  itemType = 'item',
  showView = true,
  showEdit = true,
  showDelete = true
}: ActionButtonsPopupProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
    setIsDeleteDialogOpen(true)
    setIsPopoverOpen(false)
  }

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete()
      toast.success(`${itemType} deleted successfully`)
    }
    setIsDeleteDialogOpen(false)
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-xl rounded-lg max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-medium text-gray-900">
              Delete {itemType}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete <span className="font-medium">"{itemName}"</span>? This action cannot be undone and will permanently remove this {itemType.toLowerCase()} from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-3">
            <AlertDialogCancel 
              onClick={handleDeleteCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00A1FF]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
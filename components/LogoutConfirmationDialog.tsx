'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"
import { LogOut, X } from "lucide-react"

interface LogoutConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function LogoutConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="animate-scale-in max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <AlertDialogTitle className="text-xl">
            Confirm Logout
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Are you sure you want to logout? You will be redirected to the login page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            onClick={onClose}
            className="button-bounce"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="logout-button button-bounce"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
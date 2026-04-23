import * as React from 'react'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

type Props = React.ComponentPropsWithoutRef<typeof Button> & {
  display: React.ReactNode
  showClear?: boolean
  onClear?: () => void
  placeholder?: React.ReactNode
  showLeadingIcon?: boolean
}

export const DateRangeTrigger = React.forwardRef<HTMLButtonElement, Props>(
  (
    {
      display,
      placeholder,
      showClear,
      onClear,
      className,
      showLeadingIcon = true,
      ...props
    },
    ref,
  ) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn(
          'relative justify-start text-left font-normal pr-12 min-w-[300px]',
          className,
        )}
        {...props}
      >
        {showLeadingIcon && (
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
        )}

        <span className="min-w-0 flex-1 overflow-hidden">
          <span className="block truncate">{display ?? placeholder}</span>
        </span>

        {showClear && (
          <button
            type="button"
            aria-label="Clear date range"
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-sm hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation()
              onClear?.()
            }}
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </Button>
    )
  },
)

DateRangeTrigger.displayName = 'DateRangeTrigger'


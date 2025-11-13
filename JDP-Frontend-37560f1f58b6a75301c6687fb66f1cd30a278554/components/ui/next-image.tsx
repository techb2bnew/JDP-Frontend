'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NextImageProps extends Omit<ImageProps, 'src'> {
  src: string
  fallbackSrc?: string
  className?: string
}

export function NextImage({ 
  src, 
  fallbackSrc = '/assets/images/placeholder.jpg', 
  className,
  alt,
  ...props 
}: NextImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc)
    }
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={imgSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  )
}
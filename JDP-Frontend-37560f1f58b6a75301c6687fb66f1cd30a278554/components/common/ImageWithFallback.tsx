'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  fallbackSrc?: string
  alt: string
  className?: string
}

export function ImageWithFallback({ 
  src, 
  fallbackSrc = '/assets/images/placeholders/user-placeholder.svg', 
  alt, 
  className = '',
  ...props 
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setHasError(true)
      setImgSrc(fallbackSrc)
    }
  }

  return (
     <Image
      {...props}
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      width={1000}
      height={500}
    
              />
  
  )
}
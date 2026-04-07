'use client'

import { useState } from 'react'
import { ASSET_PATHS } from '../../utils/assets'
import Image from 'next/image'

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  fallbackSrc?: string
  alt: string
  className?: string
}

export function ImageWithFallback({
  src,
  fallbackSrc = ASSET_PATHS.images.placeholders.image,
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

  const handleLoad = () => {
    // Reset error state on successful load
    setHasError(false)
  }

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
      width={1000}
      height={500}

    />

  )
}
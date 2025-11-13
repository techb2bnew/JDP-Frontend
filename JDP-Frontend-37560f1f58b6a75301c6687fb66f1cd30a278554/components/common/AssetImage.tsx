'use client'

import { ImageWithFallback } from '../figma/ImageWithFallback'
import { ASSET_PATHS, getUserAvatar, getCompanyLogo } from '../../utils/assets'

interface AssetImageProps {
  type: 'avatar' | 'logo' | 'placeholder' | 'custom'
  src?: string
  alt: string
  className?: string
  userId?: string
  companyId?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function AssetImage({ 
  type, 
  src, 
  alt, 
  className = '', 
  userId, 
  companyId,
  size = 'md',
  ...props 
}: AssetImageProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16', 
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  }

  const getImageSrc = () => {
    switch (type) {
      case 'avatar':
        return src || getUserAvatar(userId)
      case 'logo':
        return src || getCompanyLogo(companyId)
      case 'placeholder':
        return ASSET_PATHS.images.placeholders.image
      case 'custom':
      default:
        return src || ASSET_PATHS.images.placeholders.image
    }
  }

  const getFallbackSrc = () => {
    switch (type) {
      case 'avatar':
        return ASSET_PATHS.images.placeholders.user
      case 'logo':
        return ASSET_PATHS.images.placeholders.company
      default:
        return ASSET_PATHS.images.placeholders.image
    }
  }

  return (
    <ImageWithFallback
      src={getImageSrc()}
      fallbackSrc={getFallbackSrc()}
      alt={alt}
      className={`${sizeClasses[size]} object-cover rounded-lg ${className}`}
      {...props}
    />
  )
}
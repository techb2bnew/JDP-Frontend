/**
 * Asset path utilities for JDP Admin Dashboard
 */

export const ASSET_PATHS = {
  logos: {
    jdp: '/assets/logos/jdp-logo.png',
  },
  images: {
    avatars: {
      admin: '/assets/images/avatars/admin-user.jpg',
    },
    placeholders: {
      user: '/assets/images/placeholders/user-placeholder.svg',
      company: '/assets/images/placeholders/company-placeholder.svg',
      image: '/assets/images/placeholders/image-placeholder.svg',
    },
    icons: {
      dashboard: '/assets/images/icons/app-icons/dashboard.svg',
    }
  }
} as const

/**
 * Get asset URL with fallback
 */
export function getAssetUrl(path: string, fallback?: string): string {
  // In a real application, you might want to add CDN logic here
  return path || fallback || ASSET_PATHS.images.placeholders.image
}

/**
 * Get user avatar with fallback
 */
export function getUserAvatar(userId?: string, customPath?: string): string {
  if (customPath) return customPath
  if (userId) return `/assets/images/avatars/user-${userId}.jpg`
  return ASSET_PATHS.images.avatars.admin
}

/**
 * Get company logo with fallback
 */
export function getCompanyLogo(companyId?: string): string {
  if (companyId) return `/assets/images/logos/${companyId}-logo.png`
  return ASSET_PATHS.logos.jdp
}

/**
 * Preload critical assets
 */
export function preloadAssets() {
  const criticalAssets = [
    ASSET_PATHS.logos.jdp,
    ASSET_PATHS.images.avatars.admin,
    ASSET_PATHS.images.placeholders.user
  ]

  criticalAssets.forEach(src => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
  })
}
# JDP Assets Organization

This directory contains all static assets for the JDP Admin Dashboard application.

## Folder Structure

```
/public/assets/
├── logos/
│   └── jdp-logo.png          # Main JDP company logo
├── images/
│   ├── avatars/
│   │   ├── admin-user.jpg    # Default admin user avatar
│   │   └── team-members/     # Team member profile photos
│   ├── banners/
│   │   └── dashboard-bg.jpg  # Dashboard background images
│   ├── placeholders/
│   │   ├── user-placeholder.svg      # Default user avatar
│   │   ├── company-placeholder.svg   # Default company logo
│   │   └── image-placeholder.svg     # General image placeholder
│   └── icons/
│       ├── app-icons/        # Application specific icons
│       └── ui-icons/         # UI interface icons
└── documents/
    └── templates/            # Document templates (invoices, reports)
```

## Asset Guidelines

### Image Formats
- **Logos**: PNG with transparent background
- **Photos**: JPG optimized for web (quality: 85%)
- **Icons**: SVG preferred, PNG fallback
- **Placeholders**: SVG for scalability

### Naming Convention
- Use kebab-case for file names
- Be descriptive but concise
- Include size suffix if multiple sizes exist (e.g., `logo-sm.png`, `logo-lg.png`)

### Optimization
- Compress images for web delivery
- Use appropriate sizes (avoid oversized images)
- Provide retina versions for high-DPI displays (@2x suffix)

## Asset Sources

### Original Assets
- JDP Logo: Converted from Figma asset `a3e40afe539df138ee43712dc0bf65b14d1b7224.png`
- Admin Avatar: Downloaded from Unsplash (photo-1472099645785-5658abf4ff4e)

### Generated Assets
- Placeholders: Custom SVG graphics created for the application
- UI Icons: Combination of Lucide React icons and custom SVGs

## Usage Examples

```tsx
// Logo usage
<img src="/assets/logos/jdp-logo.png" alt="JDP Logo" />

// Avatar with fallback
<ImageWithFallback 
  src="/assets/images/avatars/admin-user.jpg"
  fallbackSrc="/assets/images/placeholders/user-placeholder.svg"
  alt="Admin User"
/>

// Icon usage
<img src="/assets/images/icons/ui-icons/notification.svg" alt="Notifications" />
```

## Maintenance

- Review and optimize assets quarterly
- Remove unused assets during cleanup
- Update asset references when moving files
- Maintain consistent quality standards
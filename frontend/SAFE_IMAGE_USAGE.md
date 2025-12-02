# SafeImage Component Usage

The `SafeImage` component is a wrapper around Next.js `Image` component that provides better error handling for image optimization issues.

## Usage Examples

### Basic Usage
```tsx
import SafeImage from '@/components/SafeImage'

<SafeImage
  src="https://smarthr.my.id/api/images/some-image.jpg"
  alt="Description"
  width={400}
  height={300}
  className="rounded-lg"
/>
```

### With Fill (for responsive containers)
```tsx
<div className="relative w-full h-64">
  <SafeImage
    src="https://smarthr.my.id/api/images/some-image.jpg"
    alt="Description"
    fill
    className="object-cover rounded-lg"
  />
</div>
```

### With Error Handling
```tsx
<SafeImage
  src="https://smarthr.my.id/api/images/some-image.jpg"
  alt="Description"
  width={400}
  height={300}
  onError={() => console.log('Image failed to load')}
/>
```

## Features

- **Automatic Error Handling**: Shows fallback content when images fail to load
- **Loading States**: Displays loading animation while image loads
- **URL Validation**: Validates image URLs before attempting to load
- **Placeholder Generation**: Creates SVG placeholders for fallback content
- **Full Next.js Image Support**: Supports all Next.js Image component props

## Migration from next/image

Simply replace `Image` imports with `SafeImage`:

```tsx
// Before
import Image from 'next/image'

// After  
import SafeImage from '@/components/SafeImage'
```

The API is identical, so no other changes are needed.

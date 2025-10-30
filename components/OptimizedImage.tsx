import React, { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  // NO MORE LAZY LOADING - Load everything immediately!
  const shouldLoad = true;
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate Supabase transform URL for optimized loading
  const getOptimizedUrl = (originalUrl: string, targetWidth?: number) => {
    if (!originalUrl || !originalUrl.includes('supabase')) {
      return originalUrl;
    }

    // Supabase storage supports image transformations via URL params
    try {
      const url = new URL(originalUrl);
      
      // Add transformation parameters
      if (targetWidth) {
        url.searchParams.set('width', targetWidth.toString());
        url.searchParams.set('quality', '75'); // Optimized for web (75 is good balance)
        url.searchParams.set('format', 'webp'); // Modern format for better compression
      }
      
      return url.toString();
    } catch (e) {
      return originalUrl;
    }
  };

  // Use smaller images for mobile devices
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const targetWidth = width || (isMobile ? 400 : 600);
  
  const optimizedSrc = getOptimizedUrl(src, targetWidth);
  const thumbnailSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzFhMWExYSIvPjwvc3ZnPg=='; // Inline SVG placeholder

  return (
    <>
      {/* Simple loading state - minimal animation */}
      {!isLoaded && (
        <div className={`bg-brand-surface/30 ${className}`} />
      )}

      {/* Main image - Load ALL images immediately, no lazy loading */}
      <img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        className={`transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={() => setIsLoaded(true)}
        loading="eager"
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </>
  );
};


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
  const [shouldLoad, setShouldLoad] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (priority || hasLoadedOnce.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoadedOnce.current) {
            setShouldLoad(true);
            hasLoadedOnce.current = true; // Mark as loaded, never unload
            observer.disconnect(); // Stop observing once loaded
          }
        });
      },
      {
        rootMargin: '300px', // Start loading 300px before viewport (very aggressive)
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

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

  const containerStyle = width || height ? { 
    width: width ? `${width}px` : undefined, 
    height: height ? `${height}px` : undefined 
  } as React.CSSProperties : {};

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={containerStyle}
    >
      {/* Blur placeholder */}
      {!isLoaded && shouldLoad && (
        <img
          src={thumbnailSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-xl scale-110"
          aria-hidden="true"
        />
      )}

      {/* Skeleton loader */}
      {!shouldLoad && (
        <div className="absolute inset-0 bg-gradient-to-r from-brand-surface/50 via-brand-surface/30 to-brand-surface/50 animate-pulse" />
      )}

      {/* Main image - Once loaded, STAYS loaded */}
      {shouldLoad && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={() => setIsLoaded(true)}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
    </div>
  );
};


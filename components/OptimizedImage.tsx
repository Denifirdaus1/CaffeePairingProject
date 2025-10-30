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
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
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
    const url = new URL(originalUrl);
    
    // Add transformation parameters
    if (targetWidth) {
      url.searchParams.set('width', targetWidth.toString());
      url.searchParams.set('quality', '80'); // Good balance of quality/size
    }
    
    return url.toString();
  };

  const optimizedSrc = getOptimizedUrl(src, width || 800);
  const thumbnailSrc = getOptimizedUrl(src, 50); // Tiny blur placeholder

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {!isLoaded && isInView && (
        <img
          src={thumbnailSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-xl scale-110"
          aria-hidden="true"
        />
      )}

      {/* Skeleton loader */}
      {!isInView && (
        <div className="absolute inset-0 bg-gradient-to-r from-brand-surface/50 via-brand-surface/30 to-brand-surface/50 animate-pulse" />
      )}

      {/* Main image */}
      {isInView && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
};


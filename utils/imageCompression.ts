/**
 * Image Compression Utility
 * Automatically compresses images before upload to Supabase Storage
 * Target: Max 800px width, 85% quality, WebP format when possible
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetFormat?: 'webp' | 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.85,
  targetFormat: 'webp'
};

/**
 * Compress an image file using Canvas API
 * @param file - Original image file
 * @param options - Compression options
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check if browser supports WebP
  const supportsWebP = await checkWebPSupport();
  const targetFormat = supportsWebP ? opts.targetFormat : 'jpeg';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > (opts.maxWidth || 800)) {
          width = opts.maxWidth || 800;
          height = width / aspectRatio;
        }

        if (height > (opts.maxHeight || 800)) {
          height = opts.maxHeight || 800;
          width = height * aspectRatio;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new file from blob
            const compressedFile = new File(
              [blob],
              generateFileName(file.name, targetFormat || 'jpeg'),
              {
                type: `image/${targetFormat}`,
                lastModified: Date.now()
              }
            );

            // Log compression results
            const originalSize = (file.size / 1024).toFixed(2);
            const compressedSize = (compressedFile.size / 1024).toFixed(2);
            const savedPercentage = (((file.size - compressedFile.size) / file.size) * 100).toFixed(1);

            console.log('✅ Image compressed:', {
              original: `${originalSize} KB`,
              compressed: `${compressedSize} KB`,
              saved: `${savedPercentage}%`,
              dimensions: `${width}x${height}`,
              format: targetFormat
            });

            resolve(compressedFile);
          },
          `image/${targetFormat}`,
          opts.quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Check if browser supports WebP format
 */
function checkWebPSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    const img = new Image();
    img.onload = () => resolve(img.width === 2);
    img.onerror = () => resolve(false);
    img.src = webP;
  });
}

/**
 * Generate new filename with correct extension
 */
function generateFileName(originalName: string, format: string): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const timestamp = Date.now();
  return `${nameWithoutExt}_${timestamp}.${format}`;
}

/**
 * Validate if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}


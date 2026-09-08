/**
 * Image processing utilities for bakery products and assets
 */

/**
 * Reads a File object and compresses it to an optimized base64 JPEG data URL.
 * Keeps file size under ~50-80KB to maintain localStorage performance.
 */
export async function fileToOptimizedDataUrl(
  file: File,
  maxWidth = 640,
  maxHeight = 640,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('الملف المرفوع ليس صورة صالحة'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('حدث خطأ أثناء قراءة ملف الصورة'));
    };

    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (!result) {
        reject(new Error('تعذر قراءة الصورة'));
        return;
      }

      // If SVG or gif, return as is since canvas rasterizes them
      if (file.type.includes('svg') || file.type.includes('gif')) {
        resolve(result);
        return;
      }

      const img = new Image();
      img.onerror = () => {
        // Fallback to raw data url if image decode fails
        resolve(result);
      };

      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Calculate scaling
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          // Fill white background for transparent pngs converted to jpeg
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Export as optimized JPEG
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(optimizedDataUrl);
        } catch {
          // Fallback to original
          resolve(result);
        }
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Common quick-pick bakery images for fast product creation
 */
export const BAKERY_PRESET_IMAGES = [
  {
    name: 'خبز بلدي / عيش',
    category: 'خبز',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'كرواسون زبدة',
    category: 'كرواسون',
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'باتيه بالجبنة / شوكولاتة',
    category: 'فطائر',
    url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'فينو ومخبوزات أفران',
    category: 'خبز',
    url: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'فطير مشلتت / عسل',
    category: 'فطائر',
    url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'كيك وحلويات شرقية',
    category: 'حلويات',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'كعك وبسكويت ومخبوزات جافة',
    category: 'بسكويت',
    url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'بيتزا شرقية وميني بيتزا',
    category: 'فطائر',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
  },
];

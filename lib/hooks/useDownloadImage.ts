import { useState, useCallback, RefObject } from 'react';
import html2canvas from 'html2canvas-pro';

/**
 * Custom hook that provides functionality to download a DOM element as an image
 * 
 * @param elementRef - React ref pointing to the DOM element to capture
 * @param options - Configuration options
 * @returns Object containing download function and loading state
 */
export function useDownloadImage(
  elementRef: RefObject<HTMLDivElement>,
  options?: {
    fileName?: string;
    scale?: number;
    backgroundColor?: string;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * Function to download the referenced DOM element as an image
   * Uses html2canvas-pro to render the element to a canvas, then triggers a download
   */
  const downloadImage = useCallback(async () => {
    if (!elementRef.current) {
      console.error('Element reference is not available');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Temporarily modify the element for better capture if needed
      // This helps with certain styling issues like box-shadows being cut off
      const originalTransform = elementRef.current.style.transform;
      const originalTransition = elementRef.current.style.transition;
      elementRef.current.style.transform = 'none';
      elementRef.current.style.transition = 'none';
      
      // Configure html2canvas-pro with options optimized for Tailwind output
      const canvas = await html2canvas(elementRef.current, {
        // Apply custom options or fall back to sensible defaults
        scale: options?.scale || window.devicePixelRatio * 2, // 2x for retina quality
        backgroundColor: options?.backgroundColor || null,
        logging: false,
        useCORS: true, // Attempts to load cross-origin images
        allowTaint: true, // Allow potentially tainted images
        
        // html2canvas-pro has better support for modern CSS features including OKLCH
        // While regular html2canvas captures what the browser renders,
        // html2canvas-pro has native understanding of OKLCH and other modern color formats
        foreignObjectRendering: false,
        removeContainer: true,
        
        // Optimize for shadow rendering
        onclone: (documentClone) => {
          // Fix potential styling issues in the cloned document
          return documentClone;
        }
      });
      
      // Restore original styles
      elementRef.current.style.transform = originalTransform;
      elementRef.current.style.transition = originalTransition;
      
      // Create a download link
      const link = document.createElement('a');
      link.download = options?.fileName || 'wedding-invitation.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsLoading(false);
    }
  }, [elementRef, options]);
  
  return { downloadImage, isLoading };
} 
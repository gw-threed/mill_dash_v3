import { useState, useEffect, useCallback } from 'react';

type ScannerCallback = (scannedValue: string) => void;

interface ScannerOptions {
  minLength?: number;
  maxDelay?: number;
  startChar?: string;
  endChar?: string;
}

/**
 * A hook that detects barcode scanner input
 * 
 * @param onScan Callback function that will be called with the scanned value
 * @param options Configuration options
 * @returns An object with the current scanned value and a function to clear it
 */
export const useBarcodeScanner = (
  onScan: ScannerCallback,
  options: ScannerOptions = {}
) => {
  const {
    minLength = 6,             // Minimum length of a valid scan
    maxDelay = 50,             // Max delay between keystrokes in ms
    startChar = '',            // Character that indicates start of scan
    endChar = 'Enter'          // Character that indicates end of scan
  } = options;

  const [buffer, setBuffer] = useState<string>('');
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  
  // Reset the scanner temporarily (e.g., when typing in an input)
  const disableScanner = useCallback(() => {
    setIsActive(false);
  }, []);
  
  const enableScanner = useCallback(() => {
    setIsActive(true);
  }, []);

  // Process keydown events
  useEffect(() => {
    if (!isActive) return;
    
    let timeoutId: number | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if target is an input, textarea, or select
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      
      const currentTime = new Date().getTime();
      
      // If it's been too long since the last keystroke, reset the buffer
      if (currentTime - lastKeyTime > maxDelay && buffer.length > 0) {
        setBuffer('');
      }
      
      setLastKeyTime(currentTime);
      
      // Handle special keys
      if (e.key === 'Escape') {
        setBuffer('');
        return;
      }
      
      // If we have a start character and this is the first character, check if it matches
      if (startChar && buffer.length === 0 && e.key !== startChar) {
        return;
      }
      
      // If we receive the end character, process the scan
      if (e.key === endChar) {
        if (buffer.length >= minLength) {
          onScan(buffer);
        }
        setBuffer('');
        return;
      }
      
      // Add the character to the buffer if it's a printable character
      if (e.key.length === 1) {
        setBuffer(prev => prev + e.key);
        
        // Clear the buffer after a delay as a safety measure
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        
        timeoutId = window.setTimeout(() => {
          setBuffer('');
        }, 2000);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [buffer, lastKeyTime, maxDelay, minLength, startChar, endChar, onScan, isActive]);
  
  return {
    currentBuffer: buffer,
    clearBuffer: () => setBuffer(''),
    disableScanner,
    enableScanner
  };
};

export default useBarcodeScanner; 
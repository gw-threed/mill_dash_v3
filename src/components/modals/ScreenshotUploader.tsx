import React, { useCallback, useRef, useState } from 'react';

interface Props {
  screenshot: string | null;
  setScreenshot: (url: string) => void;
  title?: string;
}

const ACCEPT_TYPES = ['image/png', 'image/jpeg', 'image/bmp'];

const ScreenshotUploader: React.FC<Props> = ({ screenshot, setScreenshot, title }) => {
  const [error, setError] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const processFile = useCallback((file: File) => {
    if (!ACCEPT_TYPES.includes(file.type)) {
      setError('Unsupported file type');
      return;
    }
    const url = URL.createObjectURL(file);
    setScreenshot(url);
    setError(null);
    setIsReplacing(false);
  }, [setScreenshot]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && ACCEPT_TYPES.includes(item.type)) {
        const file = item.getAsFile();
        if (file) {
          processFile(file);
          return;
        }
      }
    }
    setError('Clipboard does not contain an image');
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleReplace = () => {
    setIsReplacing(true);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onPaste={handlePaste}
      className="w-full h-64 bg-[#2D2D2D] rounded flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-500 relative"
    >
      {title && <h4 className="font-semibold mb-2">{title}</h4>}
      {screenshot && !isReplacing ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <img src={screenshot} alt="screenshot" className="max-h-full max-w-full object-contain p-2" />
          <button
            onClick={handleReplace}
            className="absolute top-2 right-2 px-2 py-1 rounded bg-[#BB86FC] text-xs"
          >
            Replace
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm opacity-80 mb-2">Drag & drop, paste, or click to upload screenshot</p>
          <button
            onClick={() => inputRef.current?.click()}
            className="px-3 py-1 rounded bg-[#BB86FC] text-white text-xs"
          >
            Choose File
          </button>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={inputRef}
        onChange={handleSelect}
      />
      {error && <p className="absolute bottom-2 text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default ScreenshotUploader; 
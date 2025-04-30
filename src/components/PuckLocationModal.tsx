import React from 'react';
import { Puck } from '../types';

interface Props {
  puck: Puck | null;
  onClose: () => void;
  scanDebugInfo?: {
    originalBarcode: string;
    parsedData?: {
      serialNumber?: number;
      lotNumber?: number;
      materialId?: number;
    }
  } | null;
}

const PuckLocationModal: React.FC<Props> = ({ puck, onClose, scanDebugInfo }) => {
  if (!puck) return null;
  
  const isInMill = puck.currentLocation.includes('/');
  const locationLabel = isInMill ? 'Mill Location:' : 'Storage Location:';
  const locationClass = isInMill ? 'border-yellow-500' : 'border-green-500';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-70" onClick={onClose} />
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-lg p-8 w-[650px] max-w-[90vw]">
        <div className="relative">
          <button 
            onClick={onClose}
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        
          <h3 className="text-2xl font-bold mb-2 pr-8">{puck.puckId}</h3>
          <div className="text-sm mb-6">
            <span className="opacity-80">Shade:</span> <span className="font-semibold">{puck.shade}</span>
            <span className="mx-3">|</span>
            <span className="opacity-80">Thickness:</span> <span className="font-semibold">{puck.thickness}</span>
            <span className="mx-3">|</span>
            <span className="opacity-80">Serial:</span> <span className="font-semibold">{puck.serialNumber}</span>
            <span className="mx-3">|</span>
            <span className="opacity-80">Lot:</span> <span className="font-semibold">{puck.lotNumber}</span>
            <span className="mx-3">|</span>
            <span className="opacity-80">Material ID:</span> <span className="font-semibold">{puck.materialId}</span>
          </div>
          
          <div className="bg-[#2D2D2D] p-5 rounded-md">
            <div className="text-lg font-semibold mb-2">{locationLabel}</div>
            <div className={`text-5xl font-bold text-center p-6 bg-[#212121] rounded-md border-4 ${locationClass}`}>
              {puck.currentLocation}
            </div>
          </div>
          
          {/* Debug information section */}
          {scanDebugInfo && (
            <div className="mt-6 bg-[#2D2D2D] p-4 rounded-md">
              <h4 className="text-md font-semibold mb-2 text-yellow-400">Scan Debug Info</h4>
              <div className="text-sm">
                <div className="mb-2">
                  <span className="opacity-80">Original Barcode:</span> <span className="font-mono bg-[#212121] px-2 py-1 rounded">{scanDebugInfo.originalBarcode}</span>
                </div>
                
                {scanDebugInfo.parsedData && (
                  <div className="grid grid-cols-3 gap-2">
                    {scanDebugInfo.parsedData.serialNumber !== undefined && (
                      <div>
                        <span className="opacity-80">Scanned Serial:</span>{' '}
                        <span className={`font-mono ${scanDebugInfo.parsedData.serialNumber === puck.serialNumber ? 'text-green-400' : 'text-red-400'}`}>
                          {scanDebugInfo.parsedData.serialNumber}
                        </span>
                      </div>
                    )}
                    
                    {scanDebugInfo.parsedData.lotNumber !== undefined && (
                      <div>
                        <span className="opacity-80">Scanned Lot:</span>{' '}
                        <span className={`font-mono ${scanDebugInfo.parsedData.lotNumber === puck.lotNumber ? 'text-green-400' : 'text-red-400'}`}>
                          {scanDebugInfo.parsedData.lotNumber}
                        </span>
                      </div>
                    )}
                    
                    {scanDebugInfo.parsedData.materialId !== undefined && (
                      <div>
                        <span className="opacity-80">Scanned Material ID:</span>{' '}
                        <span className={`font-mono ${scanDebugInfo.parsedData.materialId === puck.materialId ? 'text-green-400' : 'text-red-400'}`}>
                          {scanDebugInfo.parsedData.materialId}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-6 text-sm opacity-70 text-center">
            Press ESC or click outside to close
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuckLocationModal; 
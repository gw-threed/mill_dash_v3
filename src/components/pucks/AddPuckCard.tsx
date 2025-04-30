import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { usePuckContext } from '../../context/PuckContext';
import { useStorageContext } from '../../context/StorageContext';
import { MATERIAL_LOOKUP } from '../../data/seed';
import placeholderImg from '../../assets/puck_placeholder.png';

interface Props {
  selectedShade: string | null;
}

const AddPuckCard: React.FC<Props> = ({ selectedShade }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // Two-step process like LastJobModal
  const [qrInput, setQrInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<{
    shrinkageFactor: number;
    serialNumber: number;
    materialId: number;
    lotNumber: number;
    shade: string;
    thickness: string;
  } | null>(null);
  
  const { pucks, setPucks } = usePuckContext();
  const { findFirstAvailableSlot, occupySlot } = useStorageContext();

  const parseQr = (val: string) => {
    const parts = val.split('|');
    if (parts.length !== 4) {
      setError('QR string must have 4 parts');
      setParsed(null);
      return;
    }
    const [sfStr, serialStr, materialStr, lotStr] = parts;
    const shrinkageFactor = parseFloat(sfStr);
    const serialNumber = parseInt(serialStr, 10);
    const materialId = parseInt(materialStr, 10);
    const lotNumber = parseInt(lotStr, 10);

    if (Number.isNaN(shrinkageFactor) || Number.isNaN(serialNumber) || Number.isNaN(materialId) || Number.isNaN(lotNumber)) {
      setError('QR contains invalid numbers');
      setParsed(null);
      return;
    }

    const lookup = MATERIAL_LOOKUP.find((m) => m.materialId === materialId);
    if (!lookup) {
      setError('Material ID not found in lookup');
      setParsed(null);
      return;
    }

    if (selectedShade && lookup.shade !== selectedShade) {
      setError(`Puck shade (${lookup.shade}) doesn't match selected shade (${selectedShade})`);
      setParsed(null);
      return;
    }

    setError(null);
    setParsed({
      shrinkageFactor,
      serialNumber,
      materialId,
      lotNumber,
      shade: lookup.shade,
      thickness: lookup.thickness,
    });
  };

  const nextPuckId = useMemo(() => {
    const nums = pucks
      .map((p) => {
        const match = p.puckId.match(/PUCK-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !Number.isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `PUCK-${(max + 1).toString().padStart(6, '0')}`;
  }, [pucks]);

  const handleAdd = () => {
    if (!parsed) return;
    
    // Find available storage slot
    const vacant = findFirstAvailableSlot();
    if (!vacant) {
      setError('No vacant storage slots available');
      return;
    }
    
    // Create the new puck
    const newPuck = {
      puckId: nextPuckId,
      shrinkageFactor: parsed.shrinkageFactor,
      serialNumber: parsed.serialNumber,
      materialId: parsed.materialId,
      lotNumber: parsed.lotNumber,
      shade: parsed.shade,
      thickness: parsed.thickness,
      currentLocation: vacant.fullLocation,
      screenshotUrl: '/puck_placeholder.png',
      status: 'in_storage' as const,
    };
    
    // Update contexts
    setPucks([...pucks, newPuck]);
    occupySlot(vacant.fullLocation, newPuck.puckId);
    
    // Close modal and show success with large text for the location
    setIsModalOpen(false);
    setStep(1); // Reset step for next time
    setQrInput(''); // Clear QR input
    setParsed(null); // Clear parsed data
    
    // Show placement confirmation with large text
    setShowPlacementConfirmation(true);
    setStorageLocation(vacant.fullLocation);
  };

  // State for placement confirmation
  const [showPlacementConfirmation, setShowPlacementConfirmation] = useState(false);
  const [storageLocation, setStorageLocation] = useState('');

  const isQrValid = !!parsed;
  const resetModal = () => {
    setStep(1);
    setQrInput('');
    setParsed(null);
    setError(null);
    setIsModalOpen(false);
  };

  if (!selectedShade) return null;

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={clsx(
          'relative cursor-pointer bg-[#1E1E1E] text-white rounded-md p-4 shadow transition transform hover:-translate-y-0.5 hover:shadow-lg flex flex-col',
          'border-2 border-dashed border-gray-600 hover:border-[#BB86FC]'
        )}
      >
        {/* Placeholder image with plus icon overlay */}
        <div className="relative">
          <img
            src={placeholderImg}
            alt="Add new puck"
            className="w-full aspect-square object-cover rounded-md shadow-md mb-3 opacity-60"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-[#BB86FC] rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <div className="mt-auto flex justify-center items-center text-center">
          <div className="text-lg font-bold leading-none text-[#BB86FC]">
            Add {selectedShade} Puck
          </div>
        </div>
      </div>

      {/* Modal for QR scanning process */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={resetModal} />
          <div className="relative z-10 bg-[#1E1E1E] text-white rounded-lg p-6 w-[420px] space-y-5">
            <div>
              <h3 className="text-lg font-semibold">Add New Puck</h3>
              {selectedShade && (
                <p className="text-sm text-gray-300 mt-1">
                  Adding puck shade: <span className="font-medium text-white">{selectedShade}</span>
                </p>
              )}
            </div>
            
            {step === 1 && (
              <div className="space-y-4 text-sm">
                <p>Step 1: Scan Inventory QR Code to verify new puck pull.</p>
                <button
                  onClick={() => setStep(2)}
                  className="w-full px-4 py-2 rounded bg-[#BB86FC] hover:brightness-110 text-sm font-medium"
                >
                  Simulate Scan (Continue)
                </button>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-4 text-sm">
                <p>Step 2: Scan or enter the New Puck QR Code:</p>
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQrInput(val);
                    parseQr(val);
                  }}
                  placeholder="e.g., 1.2331|48|128562|70796766"
                  className="w-full px-3 py-2 rounded bg-[#2D2D2D] border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#BB86FC]"
                />
                {error && <p className="text-red-400 text-xs">{error}</p>}
                {parsed && (
                  <div className="border border-gray-600 rounded p-3 space-y-1 text-xs bg-[#2D2D2D]">
                    <p><span className="font-semibold">Shade:</span> {parsed.shade}</p>
                    <p><span className="font-semibold">Thickness:</span> {parsed.thickness}</p>
                    <p><span className="font-semibold">Shrinkage:</span> {parsed.shrinkageFactor.toFixed(4)}</p>
                    <p><span className="font-semibold">Lot:</span> {parsed.lotNumber}</p>
                    <p><span className="font-semibold">Serial:</span> {parsed.serialNumber}</p>
                    <p className="mt-2 text-green-400">Will be stored in first vacant slot upon confirmation.</p>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={resetModal}
                    className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!isQrValid}
                    onClick={handleAdd}
                    className={`px-4 py-2 rounded text-sm font-medium transition min-w-[120px] bg-[#BB86FC] hover:brightness-110 ${
                      !isQrValid ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Add New Puck
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Placement confirmation modal */}
      {showPlacementConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowPlacementConfirmation(false)} />
          <div className="relative z-10 bg-[#1E1E1E] text-white rounded-lg p-6 w-[500px] space-y-6">
            <h3 className="text-xl font-semibold">Puck Created Successfully</h3>
            
            <div className="bg-gray-800 p-4 rounded-md">
              <div className="mb-2 text-sm">
                Place new {parsed?.shade} {parsed?.thickness} puck in storage slot:
              </div>
              <div className="text-4xl font-bold text-center p-6 bg-[#2D2D2D] rounded-md text-white border-2 border-[#BB86FC]">
                {storageLocation}
              </div>
            </div>
            
            <button
              onClick={() => setShowPlacementConfirmation(false)}
              className="px-4 py-3 rounded bg-[#BB86FC] hover:brightness-110 w-full text-base font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddPuckCard; 
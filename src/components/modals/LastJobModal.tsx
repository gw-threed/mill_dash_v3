import React, { useState, useMemo } from 'react';
import { usePuckContext } from '../../context/PuckContext';
import { useStorageContext } from '../../context/StorageContext';
import { MATERIAL_LOOKUP } from '../../data/seed';
import { Puck } from '../../types';

interface Props {
  onConfirm: (replacementPuckId: string) => void;
  onCancel: () => void;
}

const LastJobModal: React.FC<Props> = ({ onConfirm, onCancel }) => {
  const { pucks, setPucks } = usePuckContext();
  const { findFirstAvailableSlot, occupySlot } = useStorageContext();

  const [step, setStep] = useState<1 | 2>(1);
  const [qrInput, setQrInput] = useState('');
  const [parsed, setParsed] = useState<{
    shrinkageFactor: number;
    serialNumber: number;
    materialId: number;
    lotNumber: number;
    shade: string;
    thickness: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    const vacant = findFirstAvailableSlot();
    if (!vacant) {
      setError('No vacant storage slot available');
      return;
    }

    const newPuck: Puck = {
      puckId: nextPuckId,
      shrinkageFactor: parsed.shrinkageFactor,
      serialNumber: parsed.serialNumber,
      materialId: parsed.materialId,
      lotNumber: parsed.lotNumber,
      shade: parsed.shade,
      thickness: parsed.thickness,
      currentLocation: vacant.fullLocation,
      screenshotUrl: '/puck_placeholder.png',
      status: 'in_storage',
    };

    // Update contexts
    setPucks([...pucks, newPuck]);
    occupySlot(vacant.fullLocation, newPuck.puckId);

    onConfirm(newPuck.puckId);
  };

  const isQrValid = !!parsed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onCancel} />
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-md p-6 w-[420px] space-y-5">
        <h3 className="text-lg font-semibold">Last Job – Replace Depleted Puck</h3>
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
                onClick={onCancel}
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
  );
};

export default LastJobModal; 
import React, { useState } from 'react';
import ConfirmFitProgressBar from './ConfirmFitProgressBar';
import MillSlotSelector from './MillSlotSelector';
import RelocationModal from './RelocationModal';
import ScreenshotUploader from './ScreenshotUploader';
import GcodeConfirmation from './GcodeConfirmation';
import FinalSummary from './FinalSummary';
import SubmissionSummary from './SubmissionSummary';
import { useMillContext } from '../../context/MillContext';
import { usePuckContext } from '../../context/PuckContext';
import { useCaseContext } from '../../context/CaseContext';
import { generateSeedData } from '../../data/seed';
import { useStorageContext } from '../../context/StorageContext';

interface Props {
  caseIds: string[];
  puckId: string;
  onClose: () => void;
}

const ConfirmFitModal: React.FC<Props> = ({ caseIds, puckId, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMillId, setSelectedMillId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>('');
  const [showRelocation, setShowRelocation] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [gcodeConfirmed, setGcodeConfirmed] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryItems, setSummaryItems] = useState<string[]>([]);

  const { mills } = useMillContext();
  const { movePuck, updatePuckScreenshot, pucks, updatePuckStatus } = usePuckContext();
  const { removeCases, addCases } = useCaseContext();
  const { findFirstAvailableSlot } = useStorageContext();

  const selectedPuck = pucks.find((p) => p.puckId === puckId);
  const selectedPuckLoc = selectedPuck?.currentLocation || '';

  const occupiedInfo = (() => {
    if (!selectedMillId || !selectedSlot) return { occupiedPuckId: undefined, occupiedShade: undefined };
    const mill = mills.find((m) => m.id === selectedMillId);
    const slot = mill?.slots.find((s) => s.slotName === selectedSlot);
    if (slot && slot.occupied && slot.puckId) {
      const pk = pucks.find((p) => p.puckId === slot.puckId);
      return { occupiedPuckId: slot.puckId, occupiedShade: pk?.shade };
    }
    return { occupiedPuckId: undefined, occupiedShade: undefined };
  })();

  const vacantSlotLoc = findFirstAvailableSlot()?.fullLocation;

  const millValid = selectedMillId !== null;
  const slotValid = (() => {
    if (!millValid) return false;
    const mill = mills.find((m) => m.id === selectedMillId);
    if (!mill) return false;
    if (mill.slots.length === 1) return true;
    return !!selectedSlot;
  })();

  const canNext =
    currentStep === 1
      ? millValid && slotValid
      : currentStep === 2
      ? !!screenshot
      : currentStep === 3
      ? gcodeConfirmed
      : true;

  const nextStep = () => {
    if (currentStep === 1) {
      setShowRelocation(true);
    } else {
      setCurrentStep((s) => Math.min(4, s + 1));
    }
  };

  const handleRelocationConfirm = () => {
    setShowRelocation(false);
    setCurrentStep(2);
  };

  const prevStep = () => setCurrentStep((s) => Math.max(1, s - 1));

  const isLast = currentStep === 4;

  const handleSubmit = () => {
    if (!selectedMillId || !selectedSlot || !screenshot) return;
    // update puck
    movePuck(puckId, `${selectedMillId}/${selectedSlot}`);
    updatePuckScreenshot(puckId, screenshot);
    updatePuckStatus(puckId, 'in_mill');
    // complete cases
    removeCases(caseIds);
    // add mock new cases to keep 45 (simple demo: generate 5 new)
    const seed = generateSeedData();
    addCases(seed.cases.slice(0, caseIds.length));
    const items: string[] = [
      `Selected Puck ${puckId} moved to ${selectedMillId} Slot ${selectedSlot}`,
      `Selected Cases ${caseIds.join(', ')} removed from queue and ${caseIds.length} new cases generated`,
    ];
    if (occupiedInfo.occupiedPuckId && vacantSlotLoc) {
      items.unshift(
        `Old Puck ${occupiedInfo.occupiedPuckId} relocated to Storage Slot ${vacantSlotLoc}`,
      );
    }
    setSummaryItems(items);
    setShowSummary(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-lg w-full max-w-5xl p-6 flex flex-col max-h-[90vh] overflow-hidden">
        <ConfirmFitProgressBar currentStep={currentStep} />
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Left - cases */}
          <div className="basis-1/2 bg-[#2D2D2D] rounded p-4 overflow-y-auto">
            <h4 className="font-semibold mb-2">Selected Cases ({caseIds.length})</h4>
            <ul className="text-xs space-y-1 opacity-80">
              {caseIds.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          </div>
          {/* Right - puck and step content placeholder */}
          <div className="basis-1/2 bg-[#2D2D2D] rounded p-4 overflow-y-auto flex flex-col">
            <h4 className="font-semibold mb-2">Selected Puck</h4>
            <p className="text-xs opacity-80 mb-4">{puckId}</p>
            <div className="flex-1 overflow-auto">
              {currentStep === 1 && (
                <MillSlotSelector
                  selectedMillId={selectedMillId}
                  setSelectedMillId={setSelectedMillId}
                  selectedSlot={selectedSlot}
                  setSelectedSlot={setSelectedSlot}
                />
              )}
              {currentStep === 2 && (
                <ScreenshotUploader screenshot={screenshot} setScreenshot={setScreenshot} />
              )}
              {currentStep === 3 && (
                <GcodeConfirmation
                  gcodeConfirmed={gcodeConfirmed}
                  setGcodeConfirmed={setGcodeConfirmed}
                />
              )}
              {showSummary ? (
                <SubmissionSummary
                  items={summaryItems}
                  onDone={onClose}
                />
              ) : currentStep === 4 && (
                <FinalSummary
                  caseIds={caseIds}
                  puckId={puckId}
                  millId={selectedMillId!}
                  slotName={selectedSlot || '1'}
                />
              )}
              {currentStep !== 1 && (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Step {currentStep} content placeholder
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Actions */}
        <div className="mt-4 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
          >
            Cancel
          </button>
          <div className="space-x-2">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
              >
                Back
              </button>
            )}
            <button
              disabled={!canNext || showSummary}
              onClick={isLast ? handleSubmit : nextStep}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                isLast ? 'bg-green-600 hover:bg-green-500' : 'bg-[#BB86FC] hover:brightness-110'
              }`}
            >
              {isLast ? 'Submit Milling Assignment' : 'Next'}
            </button>
          </div>
        </div>
      </div>
      {showRelocation && selectedMillId && (
        <RelocationModal
          selectedPuckId={puckId}
          selectedPuckLoc={selectedPuckLoc}
          millId={selectedMillId}
          slotName={selectedSlot || '1'}
          occupiedPuckId={occupiedInfo.occupiedPuckId}
          occupiedShade={occupiedInfo.occupiedShade}
          vacantSlot={vacantSlotLoc}
          onConfirm={handleRelocationConfirm}
          onCancel={() => setShowRelocation(false)}
        />
      )}
    </div>
  );
};

export default ConfirmFitModal; 
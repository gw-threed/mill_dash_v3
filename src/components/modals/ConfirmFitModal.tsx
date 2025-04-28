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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mills, occupyMillSlot, clearMillSlot } = useMillContext();
  const { movePuck, updatePuckScreenshot, pucks, updatePuckStatus } = usePuckContext();
  const { removeCases, addCases } = useCaseContext();
  const { findFirstAvailableSlot, clearSlot, occupySlot } = useStorageContext();

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

  const millValid = selectedMillId !== null;
  const slotValid = (() => {
    if (!millValid) return false;
    const mill = mills.find((m) => m.id === selectedMillId);
    if (!mill) return false;
    if (mill.slots.length === 1) return true;
    return !!selectedSlot;
  })();

  const newLocation = selectedMillId && selectedSlot ? `${selectedMillId}/${selectedSlot}` : '';
  const displacementNeeded = occupiedInfo.occupiedPuckId && occupiedInfo.occupiedPuckId !== puckId;

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
      if (occupiedInfo.occupiedPuckId && occupiedInfo.occupiedPuckId !== puckId) {
        setShowRelocation(true);
      } else {
        setCurrentStep(2);
      }
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

  const handleSubmit = async () => {
    if (!selectedMillId || !selectedSlot || !screenshot) return;
    setIsSubmitting(true);
    try {
      /* 1. If puck changing location, clear previous location & update */
      if (selectedPuckLoc !== newLocation) {
        if (selectedPuckLoc) {
          if (selectedPuckLoc.includes('/')) {
            const [oldMillId, oldSlotName] = selectedPuckLoc.split('/');
            clearMillSlot(oldMillId, oldSlotName);
          } else {
            clearSlot(selectedPuckLoc);
          }
        }
        movePuck(puckId, newLocation);
        updatePuckStatus(puckId, 'in_mill');
      }

      /* 2. Update screenshot always */
      updatePuckScreenshot(puckId, screenshot);

      /* 3. Ensure mill slot has correct puck */
      occupyMillSlot(selectedMillId, selectedSlot, puckId);

      /* 4. Handle displaced puck if different */
      if (displacementNeeded) {
        const vacant = findFirstAvailableSlot();
        if (!vacant) throw new Error('No vacant storage slot available');
        const vacantLoc = vacant.fullLocation;
        movePuck(occupiedInfo.occupiedPuckId!, vacantLoc);
        updatePuckStatus(occupiedInfo.occupiedPuckId!, 'in_storage');
        // ensure slot reflects new occupant
        occupySlot(vacantLoc, occupiedInfo.occupiedPuckId!);
      }

      /* 5. Case queue maintenance */
      removeCases(caseIds);
      const seed = generateSeedData();
      addCases(seed.cases.slice(0, caseIds.length));

      /* 6. Build summary */
      const items: string[] = [
        `Selected Puck ${puckId} moved to ${selectedMillId} Slot ${selectedSlot}`,
        `Selected Cases ${caseIds.join(', ')} removed from queue and ${caseIds.length} new cases generated`,
      ];
      if (displacementNeeded) {
        items.unshift(`Old Puck ${occupiedInfo.occupiedPuckId} relocated to Storage Rack`);
      }
      setSummaryItems(items);
      setShowSummary(true);
    } finally {
      setIsSubmitting(false);
    }
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
              disabled={!canNext || showSummary || isSubmitting}
              onClick={isLast ? handleSubmit : nextStep}
              className={`px-4 py-2 rounded text-sm font-medium transition flex items-center justify-center min-w-[180px] ${
                isLast ? 'bg-green-600 hover:bg-green-500' : 'bg-[#BB86FC] hover:brightness-110'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8"
                    />
                  </svg>
                  Submitting…
                </>
              ) : isLast ? (
                'Submit Milling Assignment'
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </div>
      {showRelocation && displacementNeeded && selectedMillId && (
        <RelocationModal
          selectedPuckId={puckId}
          selectedPuckLoc={selectedPuckLoc}
          millId={selectedMillId}
          slotName={selectedSlot || '1'}
          occupiedPuckId={occupiedInfo.occupiedPuckId}
          occupiedShade={occupiedInfo.occupiedShade}
          vacantSlot={undefined}
          onConfirm={handleRelocationConfirm}
          onCancel={() => setShowRelocation(false)}
        />
      )}
    </div>
  );
};

export default ConfirmFitModal; 
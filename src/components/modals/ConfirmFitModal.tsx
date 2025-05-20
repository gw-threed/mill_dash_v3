import React, { useState, useEffect, useMemo } from 'react';
import ConfirmFitProgressBar from './ConfirmFitProgressBar';
import MillSlotSelector from './MillSlotSelector';
import RelocationModal from './RelocationModal';
import ScreenshotUploader from './ScreenshotUploader';
import GcodeConfirmation from './GcodeConfirmation';
import FinalSummary from './FinalSummary';
import SubmissionSummary from './SubmissionSummary';
import LastJobModal from './LastJobModal';
import { useMillContext } from '../../context/MillContext';
import { usePuckContext } from '../../context/PuckContext';
import { useCaseContext } from '../../context/CaseContext';
import { generateSeedData } from '../../data/seed';
import { useStorageContext } from '../../context/StorageContext';
import { useMillLogContext } from '../../context/MillLogContext';

// Generate a batch number in the format of A1, where A is the bin (A-X) and 1 is the slot (1-6)
const generateBatchNumber = () => {
  // Bins are A through X (24 bins)
  const bins = 'ABCDEFGHIJKLMNOPQRSTUVWX';
  const bin = bins[Math.floor(Math.random() * bins.length)];
  
  // Slots are 1 through 6
  const slot = Math.floor(Math.random() * 6) + 1;
  
  return `${bin}${slot}`;
};

interface Props {
  caseIds: string[];
  puckId: string;
  onClose: () => void;
  isReassignment?: boolean;
  originalLocation?: string;
  onReassignmentComplete?: (newLocation: string) => void;
}

// Simple unique id generator for logs
const generateLogId = () => `log-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const ConfirmFitModal: React.FC<Props> = ({ 
  caseIds, 
  puckId, 
  onClose, 
  isReassignment = false,
  originalLocation = '',
  onReassignmentComplete
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMillId, setSelectedMillId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>('');
  const [showRelocation, setShowRelocation] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [gcodeConfirmed, setGcodeConfirmed] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryItems, setSummaryItems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastJobActive, setLastJobActive] = useState(false);
  const [replacementPuckId, setReplacementPuckId] = useState<string | null>(null);

  // Keep track of stl files the user skipped (did NOT fit)
  const [skippedStls, setSkippedStls] = useState<Set<string>>(new Set());
  
  // For reassignment, we need to create mock STL files for display
  const [reassignmentStlFiles, setReassignmentStlFiles] = useState<Record<string, string[]>>({});

  // Store batch numbers for STL files to ensure consistency
  const [batchNumbers, setBatchNumbers] = useState<Record<string, string>>({});

  const { mills, occupyMillSlot, clearMillSlot } = useMillContext();
  const { movePuck, updatePuckScreenshot, pucks, setPucks, updatePuckStatus, retirePuck } = usePuckContext();
  const { removeCases, addCases, cases, removeStlFromCase } = useCaseContext();
  const { findFirstAvailableSlot, clearSlot, occupySlot } = useStorageContext();
  const { addLogEntry, addRelocationLogEntry, logs } = useMillLogContext();

  const selectedPuck = pucks.find((p) => p.puckId === puckId);
  const selectedPuckLoc = selectedPuck?.currentLocation || '';

  // Generate STL files for reassignment cases
  useEffect(() => {
    if (isReassignment && caseIds.length > 0) {
      // Find cases that match our caseIds
      const matchingCases = cases.filter(c => caseIds.includes(c.caseId));
      
      // For each case ID, create entries in our reassignmentStlFiles object
      const stlMap: Record<string, string[]> = {};
      
      caseIds.forEach(caseId => {
        // Try to find the case in the current cases
        const foundCase = matchingCases.find(c => c.caseId === caseId);
        
        if (foundCase && foundCase.stlFiles.length > 0) {
          // If we find the case with STL files, use those
          stlMap[caseId] = foundCase.stlFiles;
        } else {
          // Otherwise, generate mock STL files based on the case ID
          // Generate a random number of STL files (between 1 and 3)
          const numFiles = Math.floor(Math.random() * 3) + 1;
          const mockFiles = Array(numFiles).fill(0).map((_, idx) => 
            `${caseId}|restoration|${idx + 1}|crown.stl`
          );
          stlMap[caseId] = mockFiles;
        }
      });
      
      setReassignmentStlFiles(stlMap);
    }
  }, [isReassignment, caseIds, cases]);

  // For reassignment, initialize with the existing puck's screenshot
  useEffect(() => {
    if (isReassignment && selectedPuck?.screenshotUrl && !screenshot) {
      setScreenshot(selectedPuck.screenshotUrl);
    }
  }, [isReassignment, selectedPuck, screenshot]);

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
  const lastJobCompleted = !lastJobActive || !!replacementPuckId;

  const canNext =
    currentStep === 1
      ? millValid && slotValid && lastJobCompleted
      : currentStep === 2
      ? !!screenshot && lastJobCompleted
      : currentStep === 3
      ? gcodeConfirmed && lastJobCompleted
      : lastJobCompleted;

  const nextStep = () => {
    if (currentStep === 1) {
      // Always show relocation modal after step 1, even if the target mill slot is empty
      // This ensures the user gets instructions on where to get the puck and where to place it
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

  const toggleSkipStl = (filename: string) => {
    // If G-code is confirmed, don't allow toggling (deleting) STL files
    if (gcodeConfirmed) return;
    
    setSkippedStls((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  };

  const handleDone = () => {
    // Ensure the modal closes completely
    setShowSummary(false);
    onClose();
  };
  
  // For displaying case STL files, we need a consolidated mapping
  const caseToStlMap = useMemo(() => {
    const result: Record<string, string[]> = {};
    
    if (isReassignment) {
      // For reassignment, use our generated/found STL files
      return reassignmentStlFiles;
    } else {
      // For normal operation, use the actual case data
      caseIds.forEach(caseId => {
        const c = cases.find(c => c.caseId === caseId);
        if (c) {
          result[caseId] = c.stlFiles;
        }
      });
      return result;
    }
  }, [cases, caseIds, isReassignment, reassignmentStlFiles]);

  // Initialize batch numbers for all STL files
  useEffect(() => {
    const newBatchNumbers: Record<string, string> = {};
    
    // Create batch numbers for all STL files across all cases
    Object.values(caseToStlMap).forEach(stlFiles => {
      stlFiles.forEach(stlFile => {
        if (!newBatchNumbers[stlFile]) {
          newBatchNumbers[stlFile] = generateBatchNumber();
        }
      });
    });
    
    setBatchNumbers(newBatchNumbers);
  }, [caseToStlMap]);

  const handleSubmit = async () => {
    if (!selectedMillId || !selectedSlot || !screenshot) return;
    const prevLoc = isReassignment ? originalLocation : selectedPuckLoc;
    setIsSubmitting(true);
    try {
      /* 1. If puck changing location, clear previous location & update */
      if (isReassignment || selectedPuckLoc !== newLocation) {
        if (isReassignment && originalLocation) {
          // For reassignment, clear the original mill slot
          const [oldMillId, oldSlotName] = originalLocation.split('/');
          clearMillSlot(oldMillId, oldSlotName);
        } else if (selectedPuckLoc) {
          // For normal assignment, clear the current location
          if (selectedPuckLoc.includes('/')) {
            const [oldMillId, oldSlotName] = selectedPuckLoc.split('/');
            clearMillSlot(oldMillId, oldSlotName);
          } else {
            clearSlot(selectedPuckLoc);
          }
        }
        
        // Update puck location
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

      /* 5. Case queue maintenance - only for normal assignments, not reassignments */
      if (!isReassignment) {
        // For each selected case, process STL files that were NOT skipped. Any skipped files remain in queue.
        caseIds.forEach((cid) => {
          const c = cases.find((cc) => cc.caseId === cid);
          if (!c) return;

          const remainingStls = c.stlFiles.filter((f) => skippedStls.has(f));

          if (remainingStls.length === 0) {
            // all units processed, remove whole case
            removeCases([cid]);
          } else {
            // Build updated tooth numbers from filenames
            const updatedTeeth = remainingStls.map((fname) => {
              const parts = fname.split('|');
              return parts.length >= 3 ? parseInt(parts[2], 10) : null;
            }).filter((n): n is number => n !== null && !Number.isNaN(n));

            // Replace existing case with updated data
            removeCases([cid]);
            addCases([{ ...c, stlFiles: remainingStls, toothNumbers: updatedTeeth, units: updatedTeeth.length }]);
          }
        });
      }

      /* 6. Build summary */
      let items: string[] = [];
      
      if (isReassignment) {
        items = [
          `Puck ${puckId} reassigned from ${originalLocation} to ${selectedMillId} Slot ${selectedSlot}`,
          `New G-code confirmed for ${caseIds.length} case(s)`
        ];
      } else {
        items = [
          `Selected Puck ${puckId} moved to ${selectedMillId} Slot ${selectedSlot}`,
          `Selected Cases ${caseIds.join(', ')} removed from queue and ${caseIds.length} new cases generated`,
        ];
        
        if (replacementPuckId) {
          // Mark puck as retired and clear its mill slot
          setPucks(pucks.map((p) => (p.puckId === puckId ? { ...p, status: 'retired' } : p)));
          clearMillSlot(selectedMillId!, selectedSlot!);
          items.push(`Puck ${puckId} retired after final job (Replaced by ${replacementPuckId})`);
        }
      }
      
      if (displacementNeeded) {
        items.unshift(`Old Puck ${occupiedInfo.occupiedPuckId} relocated to Storage Rack`);
      }
      
      setSummaryItems(items);
      setShowSummary(true);

      // 7. Log entry
      if (isReassignment) {
        // Add a relocation log entry for the reassignment
        addRelocationLogEntry(
          puckId,
          originalLocation, 
          `${selectedMillId}/${selectedSlot}`,
          caseIds,
          "G-code regenerated for new mill"
        );
        
        // Notify parent component that reassignment is complete
        if (onReassignmentComplete) {
          onReassignmentComplete(`${selectedMillId}/${selectedSlot}`);
        }
      } else {
        // Normal log entry for initial assignment
        addLogEntry({
          logId: generateLogId(),
          timestamp: new Date().toISOString(),
          puckId,
          previousLocation: prevLoc,
          newLocation: `${selectedMillId}/${selectedSlot}`,
          caseIds,
          technicianName: undefined,
          lastJobTriggered: !!replacementPuckId,
          newPuckId: replacementPuckId || null,
          notes: '',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="relative z-10 bg-[#1E1E1E] text-white rounded-lg w-full max-w-5xl p-6 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isReassignment 
              ? `Reassign Puck ${puckId} from ${originalLocation}` 
              : 'Confirm Fit and G-code'
            }
          </h3>
        </div>
        
        <ConfirmFitProgressBar currentStep={currentStep} />
        
        {showSummary ? (
          // Full-width summary when submission is complete
          <div className="flex-1 bg-[#2D2D2D] rounded p-4 overflow-y-auto">
            <SubmissionSummary
              items={summaryItems}
              onDone={handleDone}
              title={
                isReassignment 
                  ? 'Mill Reassignment Completed Successfully'
                  : replacementPuckId 
                    ? 'Milling Assignment Completed. Puck Replaced Successfully.' 
                    : undefined
              }
            />
          </div>
        ) : (
          // Regular two-column layout before submission
          <div className="flex flex-1 gap-4 overflow-hidden">
            {/* Left - cases */}
            <div className="basis-1/2 bg-[#2D2D2D] rounded p-4 overflow-y-auto">
              <h4 className="font-semibold mb-2">Selected Cases ({caseIds.length})</h4>
              <div className="space-y-3 text-xs opacity-80">
                {caseIds.map((id) => {
                  // Use the STL mapping we created above
                  const stlFiles = caseToStlMap[id] || [];
                  
                  if (stlFiles.length === 0) return (
                    <div key={id}>
                      <p className="text-sm font-semibold mb-1">{id}</p>
                      <p className="text-xs text-gray-400 italic">No STL files available</p>
                    </div>
                  );
                  
                  return (
                    <div key={id}>
                      <p className="text-sm font-semibold mb-1">{id}</p>
                      <ul className="space-y-1">
                        {stlFiles.filter((f)=>!skippedStls.has(f)).map((f) => (
                          <li key={f} className="flex justify-between items-center bg-surface-light px-2 py-1 rounded">
                            <div className="flex-1 truncate">
                              <span className="truncate">{f}</span>
                              <span className="ml-2 px-1.5 py-0.5 bg-primary/20 text-primary-light rounded text-xs font-medium">
                                Batch: {batchNumbers[f] || 'A1'}
                              </span>
                            </div>
                            {!isReassignment && (
                              <button
                                onClick={() => toggleSkipStl(f)}
                                className={`text-textSecondary transition ml-2 flex-shrink-0 ${
                                  skippedStls.has(f) ? 'text-green-400' : 'hover:text-primary'
                                } ${gcodeConfirmed ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={gcodeConfirmed}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2.25A2.25 2.25 0 0011.25 0h1.5A2.25 2.25 0 0015 2.25V3h5.25a.75.75 0 010 1.5h-.708l-.772 13.805A3.75 3.75 0 0115.028 22.5H8.972a3.75 3.75 0 01-3.742-4.195L4.458 4.5H3.75a.75.75 0 010-1.5H9v-.75zm1.5.75v-.75a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v.75h-3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Right - puck and step content placeholder */}
            <div className="basis-1/2 bg-[#2D2D2D] rounded p-4 overflow-y-auto flex flex-col">
              <h4 className="font-semibold mb-2">
                {isReassignment ? 'Reassigning Puck' : 'Selected Puck'}
              </h4>
              <p className="text-xs opacity-80 mb-4">{puckId}</p>
              <div className="flex-1 overflow-auto">
                {currentStep === 1 && (
                  <>
                    <MillSlotSelector
                      selectedMillId={selectedMillId}
                      setSelectedMillId={setSelectedMillId}
                      selectedSlot={selectedSlot}
                      setSelectedSlot={setSelectedSlot}
                    />
                    {!isReassignment && millValid && slotValid && (
                      <button
                        type="button"
                        onClick={() => setLastJobActive(true)}
                        className="mt-4 px-3 py-2 rounded text-xs font-medium border border-[#BB86FC] text-[#BB86FC] bg-transparent hover:bg-[#BB86FC]/20"
                      >
                        Last Job (Replace Puck)
                      </button>
                    )}
                  </>
                )}
                {currentStep === 2 && (
                  <ScreenshotUploader 
                    screenshot={screenshot} 
                    setScreenshot={setScreenshot}
                    title={isReassignment ? "Upload New Screenshot for Reassigned Mill" : undefined}
                  />
                )}
                {currentStep === 3 && (
                  <GcodeConfirmation
                    gcodeConfirmed={gcodeConfirmed}
                    setGcodeConfirmed={setGcodeConfirmed}
                    title={isReassignment ? "Confirm G-code for New Mill" : undefined}
                  />
                )}
                {currentStep === 4 && !showSummary && (
                  <FinalSummary
                    caseIds={caseIds}
                    puckId={puckId}
                    millId={selectedMillId!}
                    slotName={selectedSlot || '1'}
                    isReassignment={isReassignment}
                    originalLocation={originalLocation}
                  />
                )}
                {currentStep !== 1 && currentStep !== 4 && currentStep !== 2 && currentStep !== 3 && (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    Step {currentStep} content placeholder
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons - Only show when not in summary view */}
        {!showSummary && (
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
            >
              Cancel
            </button>

            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
              >
                Back
              </button>
            )}

            <button
              disabled={!canNext || isSubmitting}
              onClick={isLast ? handleSubmit : nextStep}
              className={`px-4 py-2 rounded text-sm font-medium transition flex items-center justify-center min-w-[150px] ${
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
                isReassignment ? 'Complete Mill Reassignment' : 'Submit Milling Assignment'
              ) : (
                'Next'
              )}
            </button>
          </div>
        )}
      </div>
      {showRelocation && selectedMillId && (
        <RelocationModal
          selectedPuckId={puckId}
          selectedPuckLoc={isReassignment ? originalLocation : selectedPuckLoc}
          millId={selectedMillId}
          slotName={selectedSlot || '1'}
          occupiedPuckId={occupiedInfo.occupiedPuckId}
          occupiedShade={occupiedInfo.occupiedShade}
          vacantSlot={findFirstAvailableSlot()?.fullLocation}
          onConfirm={handleRelocationConfirm}
          onCancel={() => setShowRelocation(false)}
        />
      )}
      {lastJobActive && (
        <LastJobModal
          expectedShade={selectedPuck?.shade || ''}
          expectedThickness={selectedPuck?.thickness || ''}
          onCancel={() => setLastJobActive(false)}
          onConfirm={(id) => {
            setReplacementPuckId(id);
            setLastJobActive(false);
          }}
        />
      )}
    </div>
  );
};

export default ConfirmFitModal; 
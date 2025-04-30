import React, { useState, useCallback, useEffect } from 'react';
import ShadeTiles from './cases/ShadeTiles';
import CaseList from './cases/CaseList';
import PuckList from './pucks/PuckList';
import ConfirmFitModal from './modals/ConfirmFitModal';
import ViewStorageModal from './modals/ViewStorageModal';
import ViewMillSlotsModal from './modals/ViewMillSlotsModal';
import MillLogModal from './modals/MillLogModal';
import PuckLocationModal from './PuckLocationModal';
import UsedPuckOrderQueueModal from './modals/UsedPuckOrderQueueModal';
import InventoryAnalysisModal from './modals/InventoryAnalysisModal';
import MachineAnalysisModal from './modals/MachineAnalysisModal';
import { useCaseContext } from '../context/CaseContext';
import { usePuckContext } from '../context/PuckContext';
import useBarcodeScanner from '../hooks/useBarcodeScanner';

// SVG icon components
const InventoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M5 8h14M5 12h14M5 16h10" />
  </svg>
);

const OrderQueueIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 8h.01M6 12h.01M6 16h.01M10 8h8M10 12h8M10 16h5" />
  </svg>
);

const StorageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
    <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
    <path d="M12 12v5" />
  </svg>
);

const MillIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="8" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

const ResetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21h5v-5" />
  </svg>
);

const DashboardLayout: React.FC = () => {
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [selectedPuckId, setSelectedPuckId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showStorage, setShowStorage] = useState(false);
  const [showMillSlots, setShowMillSlots] = useState(false);
  const [showMillLog, setShowMillLog] = useState(false);
  const [showUsedPuckQueue, setShowUsedPuckQueue] = useState(false);
  const [showInventoryAnalysis, setShowInventoryAnalysis] = useState(false);
  const [showMachineAnalysis, setShowMachineAnalysis] = useState(false);
  
  // State for puck location display
  const [scannedPuck, setScannedPuck] = useState<string | null>(null);
  const [showPuckLocation, setShowPuckLocation] = useState(false);

  const { cases } = useCaseContext();
  const { pucks } = usePuckContext();

  // Reset selected puck when no cases are selected
  useEffect(() => {
    if (selectedCaseIds.length === 0) {
      setSelectedPuckId(null);
    }
  }, [selectedCaseIds]);

  const handleBarcodeScanned = useCallback((barcode: string) => {
    // Look for a puck with matching puckId
    const puck = pucks.find(p => p.puckId === barcode);
    if (puck) {
      setScannedPuck(barcode);
      setShowPuckLocation(true);
      return;
    }
    
    // If not found by puckId, check if it matches a serialNumber
    const puckBySerial = pucks.find(p => p.serialNumber.toString() === barcode);
    if (puckBySerial) {
      setScannedPuck(puckBySerial.puckId);
      setShowPuckLocation(true);
      return;
    }
    
    // Check if it's a QR formatted code
    const parts = barcode.split('|');
    if (parts.length === 4) {
      // Format: shrinkageFactor|serialNumber|materialId|lotNumber
      const shrinkageFactor = parseFloat(parts[0]);
      const serialNumber = parseInt(parts[1], 10);
      const materialId = parseInt(parts[2], 10);
      const lotNumber = parseInt(parts[3], 10);
      
      if (!isNaN(serialNumber) && !isNaN(lotNumber)) {
        // STRICTLY match based on BOTH serial number AND lot number
        const matchingPuck = pucks.find(p => 
          p.serialNumber === serialNumber && 
          p.lotNumber === lotNumber
        );
        
        if (matchingPuck) {
          setScannedPuck(matchingPuck.puckId);
          setShowPuckLocation(true);
          return;
        } else {
          // No match found with both criteria
          console.log(`No puck found matching both serial ${serialNumber} and lot ${lotNumber}`);
        }
      } else {
        console.log('Invalid barcode format - need both serial and lot numbers');
      }
    }
    
    // Could add an alert or toast message here for unrecognized barcodes
    console.log('Unrecognized barcode:', barcode);
  }, [pucks]);

  // Setup barcode scanner
  useBarcodeScanner(handleBarcodeScanned, {
    minLength: 4, // Minimum length of a valid barcode
  });

  const totalCases = cases.length;
  const totalUnits = cases.reduce((sum, c) => sum + c.units, 0);
  const selectedUnits = selectedCaseIds.reduce((sum, id) => {
    const c = cases.find((cc) => cc.caseId === id);
    return c ? sum + c.units : sum;
  }, 0);

  const canProceed = selectedCaseIds.length > 0 && !!selectedPuckId;
  
  // Get the scanned puck object
  const scannedPuckObject = scannedPuck ? pucks.find(p => p.puckId === scannedPuck) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-textPrimary relative">
      {/* Header */}
      <header className="px-6 py-4 border-b border-borderMuted bg-background flex flex-col gap-4">
        {/* Top row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Title & stats */}
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-primary">Mill Dashboard</h1>
            <div className="text-xs sm:text-sm opacity-80 mt-1 space-x-4">
              <span>Total Cases: {totalCases}</span>
              <span>Total Units: {totalUnits}</span>
              <span>Selected Cases: {selectedCaseIds.length}</span>
              <span>Selected Units: {selectedUnits}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Analytics Group */}
            <div className="flex rounded-md overflow-hidden shadow-sm border border-borderMuted">
              <button 
                onClick={() => setShowMachineAnalysis(true)}
                className="px-3 py-2 flex items-center gap-1.5 bg-surface hover:bg-surface-light text-sm transition-colors"
              >
                <AnalyticsIcon />
                <span>Machine Analysis</span>
              </button>
              <div className="w-px h-full bg-borderMuted"></div>
              <button 
                onClick={() => setShowInventoryAnalysis(true)}
                className="px-3 py-2 flex items-center gap-1.5 bg-surface hover:bg-surface-light text-sm transition-colors"
              >
                <InventoryIcon />
                <span>Inventory Analysis</span>
              </button>
            </div>
            
            {/* Inventory Management */}
            <button 
              onClick={() => setShowUsedPuckQueue(true)}
              className="px-3 py-2 flex items-center gap-1.5 bg-surface hover:bg-surface-light text-sm transition-colors rounded-md border border-borderMuted shadow-sm"
            >
              <OrderQueueIcon />
              <span>Order Queue</span>
            </button>
            
            {/* View Group */}
            <div className="flex rounded-md overflow-hidden shadow-sm border border-borderMuted">
              <button 
                onClick={() => setShowStorage(true)}
                className="px-3 py-2 flex items-center gap-1.5 bg-surface hover:bg-surface-light text-sm transition-colors"
              >
                <StorageIcon />
                <span>Storage</span>
              </button>
              <div className="w-px h-full bg-borderMuted"></div>
              <button 
                onClick={() => setShowMillSlots(true)}
                className="px-3 py-2 flex items-center gap-1.5 bg-surface hover:bg-surface-light text-sm transition-colors"
              >
                <MillIcon />
                <span>Mill Slots</span>
              </button>
            </div>
            
            {/* Reset button */}
            <button
              onClick={() => {
                window.localStorage.clear();
                window.location.reload();
              }}
              className="px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <ResetIcon />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-borderMuted mt-2" />

        {/* Shade tiles centered */}
        <div className="w-full flex justify-center mt-3">
          <ShadeTiles />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 gap-6 px-6 pb-6 mt-8 overflow-hidden flex-col md:flex-row">
        {/* Cases column */}
        <section className="md:basis-2/5 md:flex-1 min-h-0 overflow-y-auto bg-surface rounded-md p-6 border border-borderMuted">
          <h2 className="text-lg font-semibold mb-4 text-primary-light">CAM-Ready Cases</h2>
          <CaseList selectedIds={selectedCaseIds} setSelectedIds={setSelectedCaseIds} />
        </section>

        {/* Pucks column - only show when cases are selected */}
        <section className="md:basis-3/5 md:flex-1 min-h-0 overflow-y-auto bg-surface rounded-md p-6 border border-borderMuted">
          <h2 className="text-lg font-semibold mb-4 text-primary-light">Available Pucks</h2>
          
          {selectedCaseIds.length > 0 ? (
            <PuckList selectedPuckId={selectedPuckId} setSelectedPuckId={setSelectedPuckId} />
          ) : (
            <div className="text-center py-12 text-textSecondary">
              <p>Select one or more cases to view available pucks</p>
            </div>
          )}
        </section>
      </div>

      {/* Global barcode scanning notice */}
      <div className="fixed bottom-24 left-6 max-w-xs">
        <div className="bg-[#1E1E1E] text-white text-sm rounded-md shadow-lg px-4 py-3 border border-[#BB86FC]">
          <p className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#BB86FC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Scan any puck barcode to see its location
          </p>
        </div>
      </div>

      {/* Proceed & Mill Log buttons */}
      <div className="fixed bottom-6 right-6 flex gap-3">
        <button
          onClick={() => setShowMillLog(true)}
          className="px-4 py-2 rounded-md bg-surface text-textPrimary border border-borderMuted hover:bg-surface-light text-sm"
        >
          View Mill Log
        </button>
        <button
          disabled={!canProceed}
          onClick={() => setShowModal(true)}
          className={`px-5 py-3 rounded-md text-sm font-medium transition shadow-lg ${
            canProceed ? 'bg-primary text-white hover:bg-primary-light' : 'bg-surface-light text-textDisabled cursor-not-allowed'
          }`}
        >
          Proceed to Confirm Fit
        </button>
      </div>

      {showModal && (
        <ConfirmFitModal
          caseIds={selectedCaseIds}
          puckId={selectedPuckId!}
          onClose={() => setShowModal(false)}
        />
      )}

      {showStorage && <ViewStorageModal onClose={() => setShowStorage(false)} />}

      {showMillSlots && <ViewMillSlotsModal onClose={() => setShowMillSlots(false)} />}

      {showMillLog && <MillLogModal onClose={() => setShowMillLog(false)} />}
      
      {showUsedPuckQueue && <UsedPuckOrderQueueModal onClose={() => setShowUsedPuckQueue(false)} />}
      
      {showInventoryAnalysis && <InventoryAnalysisModal onClose={() => setShowInventoryAnalysis(false)} />}
      
      {showMachineAnalysis && <MachineAnalysisModal onClose={() => setShowMachineAnalysis(false)} />}
      
      {/* Puck Location Modal */}
      {showPuckLocation && scannedPuckObject && (
        <PuckLocationModal 
          puck={scannedPuckObject} 
          onClose={() => setShowPuckLocation(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout; 
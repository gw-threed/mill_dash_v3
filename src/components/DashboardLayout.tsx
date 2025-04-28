import React, { useState } from 'react';
import ShadeTiles from './cases/ShadeTiles';
import CaseList from './cases/CaseList';
import PuckList from './pucks/PuckList';
import ConfirmFitModal from './modals/ConfirmFitModal';
import ViewStorageModal from './modals/ViewStorageModal';
import ViewMillSlotsModal from './modals/ViewMillSlotsModal';
import MillLogModal from './modals/MillLogModal';
import { useCaseContext } from '../context/CaseContext';

const DashboardLayout: React.FC = () => {
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [selectedPuckId, setSelectedPuckId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showStorage, setShowStorage] = useState(false);
  const [showMillSlots, setShowMillSlots] = useState(false);
  const [showMillLog, setShowMillLog] = useState(false);

  const { cases } = useCaseContext();

  const totalCases = cases.length;
  const totalUnits = cases.reduce((sum, c) => sum + c.units, 0);
  const selectedUnits = selectedCaseIds.reduce((sum, id) => {
    const c = cases.find((cc) => cc.caseId === id);
    return c ? sum + c.units : sum;
  }, 0);

  const canProceed = selectedCaseIds.length > 0 && !!selectedPuckId;

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
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setShowStorage(true)} className="px-3 py-1 rounded border border-borderMuted text-textPrimary text-xs hover:bg-surface-light">View Storage</button>
            <button onClick={() => setShowMillSlots(true)} className="px-3 py-1 rounded border border-borderMuted text-textPrimary text-xs hover:bg-surface-light">View Mill Slots</button>
            <button
              onClick={() => {
                window.localStorage.clear();
                window.location.reload();
              }}
              className="px-3 py-1 rounded bg-red-600 text-white text-xs"
            >
              Reset
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

        {/* Pucks column */}
        <section className="md:basis-3/5 md:flex-1 min-h-0 overflow-y-auto bg-surface rounded-md p-6 border border-borderMuted">
          <h2 className="text-lg font-semibold mb-4 text-primary-light">Available Pucks</h2>
          <PuckList selectedPuckId={selectedPuckId} setSelectedPuckId={setSelectedPuckId} />
        </section>
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
    </div>
  );
};

export default DashboardLayout; 
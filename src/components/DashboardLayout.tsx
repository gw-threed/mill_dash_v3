import React, { useState } from 'react';
import ShadeTiles from './cases/ShadeTiles';
import CaseList from './cases/CaseList';
import PuckList from './pucks/PuckList';
import ConfirmFitModal from './modals/ConfirmFitModal';
import ViewStorageModal from './modals/ViewStorageModal';
import ViewMillSlotsModal from './modals/ViewMillSlotsModal';

const DashboardLayout: React.FC = () => {
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [selectedPuckId, setSelectedPuckId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showStorage, setShowStorage] = useState(false);
  const [showMillSlots, setShowMillSlots] = useState(false);

  const canProceed = selectedCaseIds.length > 0 && !!selectedPuckId;

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white relative">
      {/* Top shade tiles */}
      <div className="px-4 pt-4 pb-4 flex justify-between items-center">
        <ShadeTiles />
        <button
          onClick={() => {
            window.localStorage.clear();
            window.location.reload();
          }}
          className="px-3 py-1 rounded bg-red-600 text-white text-xs ml-4 shrink-0"
        >
          Reset
        </button>
        <button onClick={() => setShowStorage(true)} className="px-3 py-1 rounded bg-gray-600 text-white text-xs ml-2">View Storage</button>
        <button onClick={() => setShowMillSlots(true)} className="px-3 py-1 rounded bg-gray-600 text-white text-xs ml-2">View Mill Slots</button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-6 px-4 pb-4 overflow-hidden flex-col md:flex-row">
        {/* Cases column */}
        <section className="md:basis-2/5 md:flex-1 min-h-0 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-3">CAM-Ready Cases</h2>
          <CaseList selectedIds={selectedCaseIds} setSelectedIds={setSelectedCaseIds} />
        </section>

        {/* Pucks column */}
        <section className="md:basis-3/5 md:flex-1 min-h-0 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-3">Available Pucks</h2>
          <PuckList selectedPuckId={selectedPuckId} setSelectedPuckId={setSelectedPuckId} />
        </section>
      </div>

      {/* Proceed button */}
      <button
        disabled={!canProceed}
        onClick={() => setShowModal(true)}
        className={`fixed bottom-6 right-6 px-5 py-3 rounded-md text-sm font-medium transition shadow-lg ${
          canProceed ? 'bg-[#BB86FC] text-white hover:brightness-110' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        Proceed to Confirm Fit
      </button>

      {showModal && (
        <ConfirmFitModal
          caseIds={selectedCaseIds}
          puckId={selectedPuckId!}
          onClose={() => setShowModal(false)}
        />
      )}

      {showStorage && <ViewStorageModal onClose={() => setShowStorage(false)} />}

      {showMillSlots && <ViewMillSlotsModal onClose={() => setShowMillSlots(false)} />}
    </div>
  );
};

export default DashboardLayout; 
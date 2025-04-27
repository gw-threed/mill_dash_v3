import React, { useEffect, useMemo } from 'react';
import CaseCard from './CaseCard';
import { useCaseContext } from '../../context/CaseContext';
import { CamCase } from '../../types';

interface Props {
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const CaseList: React.FC<Props> = ({ selectedIds, setSelectedIds }) => {
  const { cases, selectedShade, setSelectedShade } = useCaseContext();

  const filtered = selectedShade ? cases.filter((c) => c.shade === selectedShade) : cases;

  // auto-selection when selectedShade changes
  useEffect(() => {
    if (selectedShade) {
      setSelectedIds(filtered.map((c) => c.caseId));
    } else {
      setSelectedIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShade, JSON.stringify(filtered.map((c) => c.caseId))]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleCaseClick = (caseData: CamCase) => {
    if (selectedShade === caseData.shade) {
      toggleSelect(caseData.caseId);
    } else {
      setSelectedShade(caseData.shade);
    }
  };

  const casesToDisplay = useMemo(() => filtered, [filtered]);

  return (
    <div className="space-y-3">
      {casesToDisplay.map((c) => (
        <CaseCard
          key={c.caseId}
          caseData={c}
          isSelected={selectedIds.includes(c.caseId)}
          onToggle={toggleSelect}
          onCaseClick={handleCaseClick}
        />
      ))}
    </div>
  );
};

export default CaseList; 
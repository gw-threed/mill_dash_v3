import React, { useEffect, useMemo, useState } from 'react';
import CaseCard from './CaseCard';
import { useCaseContext } from '../../context/CaseContext';
import { CamCase } from '../../types';
import { ALL_OTHER_SHADES } from './ShadeTiles';

interface Props {
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const CaseList: React.FC<Props> = ({ selectedIds, setSelectedIds }) => {
  const { cases, selectedShade, setSelectedShade } = useCaseContext();
  
  // Track the active shade for selected cases
  const [activeSelectionShade, setActiveSelectionShade] = useState<string | null>(null);

  // Add activeSelectionShade to window object so it can be accessed by other components
  useEffect(() => {
    // @ts-ignore - Adding property to window
    window.activeSelectionShade = activeSelectionShade;
  }, [activeSelectionShade]);

  // Function to get filtered cases based on the selected shade
  const getFilteredCases = useMemo(() => {
    if (!selectedShade) {
      return cases;
    } else if (selectedShade === ALL_OTHER_SHADES) {
      // For "Other Shades", get the top 6 shades to exclude them
      const shadeCounts: Record<string, number> = {};
      cases.forEach(c => { shadeCounts[c.shade] = (shadeCounts[c.shade] || 0) + 1 });
      
      const topShades = Object.entries(shadeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([shade]) => shade);
      
      // Return cases that aren't in the top shades, sorted by shade
      const otherShadesCases = cases.filter(c => !topShades.includes(c.shade));
      // Sort by shade alphabetically for easier finding
      return otherShadesCases.sort((a, b) => a.shade.localeCompare(b.shade));
    } else {
      // Regular filtering for a specific shade
      return cases.filter(c => c.shade === selectedShade);
    }
  }, [cases, selectedShade]);

  // Automatically select all cases when a specific shade is selected (excluding Other Shades)
  useEffect(() => {
    if (selectedShade && selectedShade !== ALL_OTHER_SHADES) {
      // Get IDs of cases with the specific shade
      const idsToSelect = cases
        .filter(c => c.shade === selectedShade)
        .map(c => c.caseId);
      
      // Update the selection and the active selection shade
      setSelectedIds(idsToSelect);
      setActiveSelectionShade(selectedShade);
    } else if (selectedShade === ALL_OTHER_SHADES) {
      // For Other Shades, just filter the view but don't auto-select
      // Reset selections when switching to Other Shades
      setSelectedIds([]);
      setActiveSelectionShade(null);
    } else if (!selectedShade) {
      // When no shade is selected, clear the selection
      setSelectedIds([]);
      setActiveSelectionShade(null);
    }
  }, [selectedShade, cases, setSelectedIds]);

  const toggleSelect = (id: string) => {
    const caseToToggle = cases.find(c => c.caseId === id);
    if (!caseToToggle) return;
    
    setSelectedIds(prev => {
      // If this case is already selected, just remove it
      if (prev.includes(id)) {
        const newSelection = prev.filter(i => i !== id);
        
        // If no cases are selected anymore, reset the active selection shade
        if (newSelection.length === 0) {
          setActiveSelectionShade(null);
        }
        
        return newSelection;
      } 
      // Adding a new case
      else {
        // If we don't have an active selection shade yet, set it to this case's shade
        if (!activeSelectionShade) {
          setActiveSelectionShade(caseToToggle.shade);
          return [...prev, id];
        } 
        // If we have an active shade and this case matches it, allow selection
        else if (caseToToggle.shade === activeSelectionShade) {
          return [...prev, id];
        } 
        // Trying to select a case with a different shade - not allowed
        else {
          console.log(`Cannot select cases with different shades. Active: ${activeSelectionShade}, Attempted: ${caseToToggle.shade}`);
          return prev;
        }
      }
    });
  };

  const handleCaseClick = (caseData: CamCase) => {
    toggleSelect(caseData.caseId);
  };

  return (
    <div className="space-y-3">
      {getFilteredCases.map((c) => (
        <CaseCard
          key={c.caseId}
          caseData={c}
          isSelected={selectedIds.includes(c.caseId)}
          onToggle={toggleSelect}
          onCaseClick={handleCaseClick}
          activeSelectionShade={activeSelectionShade}
        />
      ))}
      {getFilteredCases.length === 0 && (
        <div className="text-center py-8 text-textSecondary">
          No cases available for the selected shade.
        </div>
      )}
    </div>
  );
};

export default CaseList; 
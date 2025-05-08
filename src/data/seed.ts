import { CamCase, DashboardData, Mill, MillLogEntry, MillSlot, Puck, StorageSlot } from '../types';

// Material ID lookup
export const MATERIAL_LOOKUP: { materialId: number; shade: string; thickness: string }[] = [
  // 14mm thickness
  { materialId: 128548, shade: 'A1', thickness: '14mm' },
  { materialId: 128549, shade: 'A2', thickness: '14mm' },
  { materialId: 128550, shade: 'A3', thickness: '14mm' },
  { materialId: 128551, shade: 'A3.5', thickness: '14mm' },
  { materialId: 128553, shade: 'B1', thickness: '14mm' },
  { materialId: 128554, shade: 'B2', thickness: '14mm' },
  { materialId: 128555, shade: 'B3', thickness: '14mm' },
  { materialId: 128556, shade: 'B4', thickness: '14mm' },
  { materialId: 128557, shade: 'C1', thickness: '14mm' },
  { materialId: 128558, shade: 'C2', thickness: '14mm' },
  { materialId: 128559, shade: 'C3', thickness: '14mm' },
  { materialId: 128560, shade: 'C4', thickness: '14mm' },
  { materialId: 128561, shade: 'D2', thickness: '14mm' },
  { materialId: 128562, shade: 'D3', thickness: '14mm' },
  { materialId: 128563, shade: 'D4', thickness: '14mm' },
  { materialId: 128564, shade: 'OM1', thickness: '14mm' },
  { materialId: 128566, shade: 'OM3', thickness: '14mm' },
  // 20mm thickness
  { materialId: 128605, shade: 'A1', thickness: '20mm' },
  { materialId: 128606, shade: 'A2', thickness: '20mm' },
  { materialId: 128607, shade: 'A3', thickness: '20mm' },
  { materialId: 128608, shade: 'A3.5', thickness: '20mm' },
  { materialId: 128609, shade: 'A4', thickness: '20mm' },
  { materialId: 128610, shade: 'B1', thickness: '20mm' },
  { materialId: 128611, shade: 'B2', thickness: '20mm' },
  { materialId: 128612, shade: 'B3', thickness: '20mm' },
  { materialId: 128613, shade: 'B4', thickness: '20mm' },
  { materialId: 128614, shade: 'C1', thickness: '20mm' },
  { materialId: 128615, shade: 'C2', thickness: '20mm' },
  { materialId: 128616, shade: 'C3', thickness: '20mm' },
  { materialId: 128617, shade: 'C4', thickness: '20mm' },
  { materialId: 128618, shade: 'D2', thickness: '20mm' },
  { materialId: 128619, shade: 'D3', thickness: '20mm' },
  { materialId: 128620, shade: 'D4', thickness: '20mm' },
  { materialId: 128621, shade: 'OM1', thickness: '20mm' },
  { materialId: 128623, shade: 'OM3', thickness: '20mm' },
];

// Most commonly used shades in order
const SHADE_LIST = [
  'A2',   // Most common shade
  'A1',
  'A3',
  'B1',
  'A3.5',
  'B2',
  'C1',
  'D2',
  'D3',
  'C2',
  'B3',
  'A4',
  'B4',
  'C3',
  'C4',
  'D4',
  'OM1',
  'OM3'
];

const DOCTOR_NAMES = [
  'Dr. Smith',
  'Dr. Johnson',
  'Dr. Williams',
  'Dr. Brown',
  'Dr. Jones',
  'Dr. Miller',
  'Dr. Davis',
  'Dr. Garcia',
  'Dr. Rodriguez',
  'Dr. Wilson',
  'Dr. Taylor',
  'Dr. Clark',
  'Dr. Lewis',
  'Dr. Young',
];

const OFFICE_NAMES = [
  'Smile Care Dental',
  'Healthy Teeth Clinic',
  'Bright Smiles Center',
  'Premier Dental Lab',
  'Happy Tooth Office',
  'Downtown Dental',
  'Riverfront Dentistry',
  'Lakeside Dental Studio',
  'Mountain View Dental',
  'Ocean Breeze Dentistry',
];

// Random utilities
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomWeighted = <T,>(items: T[], weights: number[]): T => {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  
  return items[items.length - 1];
};

// Generate past dates within the last X days
const getPastDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Generate case ID
const generateCaseId = (() => {
  let counter = 1;
  return () => {
    const id = counter.toString().padStart(3, '0');
    counter += 1;
    const alpha = String.fromCharCode(65 + randomInt(0, 25));
    const alpha2 = String.fromCharCode(65 + randomInt(0, 25));
    return `${alpha}${alpha2}${id}`;
  };
})();

// Function to generate 50 cases with mostly single units but some with 2-4 units
const generateCamCases = (): CamCase[] => {
  const cases: CamCase[] = [];
  
  // Generate the distribution of unit counts (35 singles, 10 doubles, 5 triples/quads)
  const unitDistribution = [
    ...Array(35).fill(1),  // 35 single unit cases
    ...Array(10).fill(2),  // 10 double unit cases
    ...Array(3).fill(3),   // 3 triple unit cases
    ...Array(2).fill(4),   // 2 quad unit cases
  ];
  
  // Generate 50 cases
  for (let i = 0; i < 50; i++) {
    const caseId = generateCaseId();
    
    // Randomly pick how many units for this case from our distribution
    const units = unitDistribution[i];
    
    // Generate random tooth numbers (no duplicates)
    const toothNumbers: number[] = [];
    while (toothNumbers.length < units) {
      const num = randomInt(1, 32);
      if (!toothNumbers.includes(num)) {
        toothNumbers.push(num);
      }
    }
    
    // Weight common shades more heavily
    const shadeWeights = SHADE_LIST.map((_, idx) => 
      Math.max(10 - idx, 1)  // First shades get higher weights
    );
    const shade = randomWeighted(SHADE_LIST, shadeWeights);
    
    // Generate STL files for each tooth
    const stlFiles = toothNumbers.map(
      (tooth) => `${caseId}|Crown|${tooth}|${shade}.stl`,
    );

    cases.push({
      caseId,
      doctorName: randomChoice(DOCTOR_NAMES),
      officeName: randomChoice(OFFICE_NAMES),
      shade,
      units,
      toothNumbers,
      stlFiles,
      status: 'cam_ready',
    });
  }

  return cases;
};

// Function to generate 30 additional cases (for the mill log feature)
export const generateAdditionalCases = (): CamCase[] => {
  const additionalCases: CamCase[] = [];
  
  for (let i = 0; i < 30; i++) {
    const caseId = `ADD${(i + 1).toString().padStart(3, '0')}`;
    
    // Random unit count, weighted toward single units
    const unitWeights = [7, 2, 1];  // 70% single, 20% double, 10% triple+
    const units = randomWeighted([1, 2, randomInt(3, 4)], unitWeights);
    
    // Random teeth
    const toothNumbers: number[] = [];
    while (toothNumbers.length < units) {
      const num = randomInt(1, 32);
      if (!toothNumbers.includes(num)) {
        toothNumbers.push(num);
      }
    }
    
    // Random shade, weighted toward common ones
    const shadeWeights = SHADE_LIST.map((_, idx) => 
      Math.max(10 - idx, 1)  // First shades get higher weights
    );
    const shade = randomWeighted(SHADE_LIST, shadeWeights);
    
    // STL files with different restoration types
    const restorationTypes = ['Crown', 'Bridge', 'Inlay', 'Onlay', 'Veneer'];
    const stlFiles = toothNumbers.map(
      (tooth) => `${caseId}|${randomChoice(restorationTypes)}|${tooth}|${shade}.stl`,
    );
    
    additionalCases.push({
      caseId,
      doctorName: randomChoice(DOCTOR_NAMES),
      officeName: randomChoice(OFFICE_NAMES),
      shade,
      units,
      toothNumbers,
      stlFiles,
      status: 'cam_ready',
    });
  }
  
  return additionalCases;
};

// Generate the storage slots
const generateStorageSlots = (): StorageSlot[] => {
  const slots: StorageSlot[] = [];
  const shelves = 'ABCDEFG'.split('');
  const columns = 'ABCDEFG'.split('');
  const rack = 1;

  for (const shelf of shelves) {
    for (const column of columns) {
      for (let slotNumber = 1; slotNumber <= 9; slotNumber++) {
        const fullLocation = `R${rack}-${shelf}-${column}-${slotNumber}`;
        slots.push({
          rack,
          shelf,
          column,
          slotNumber,
          fullLocation,
          occupied: false,
          puckId: null,
        });
      }
    }
  }

  return slots;
};

// Generate mills and their slots
const generateMills = (): Mill[] => {
  const mills: Mill[] = [];

  // A52 mills (1 slot)
  for (let i = 1; i <= 2; i++) {
    const id = `A52-${i}`;
    const slot: MillSlot = {
      millName: id,
      slotName: '1',
      occupied: false,
      puckId: null,
    };
    mills.push({ id, model: 'A52', slots: [slot] });
  }

  // DWX mills (slots A-F)
  const dwxSlots = 'ABCDEF'.split('');
  for (let i = 1; i <= 2; i++) {
    const id = `DWX-${i}`;
    const slots: MillSlot[] = dwxSlots.map((s) => ({
      millName: id,
      slotName: s,
      occupied: false,
      puckId: null,
    }));
    mills.push({ id, model: 'DWX', slots });
  }

  // 350i mill (slots 1-12)
  const slots350i: MillSlot[] = Array.from({ length: 12 }, (_, idx) => ({
    millName: '350i-1',
    slotName: (idx + 1).toString(),
    occupied: false,
    puckId: null,
  }));
  mills.push({ id: '350i-1', model: '350i', slots: slots350i });

  return mills;
};

// Generate pucks with the specified distribution
const generatePucks = (storageSlots: StorageSlot[]): { pucks: Puck[], millLogs: MillLogEntry[] } => {
  const pucks: Puck[] = [];
  const millLogs: MillLogEntry[] = [];
  let puckCounter = 1;
  let serialCounter = 1000;
  
  // Group lookups by shade for easier selection
  const lookupByShade: Record<string, { materialId: number; thickness: string }[]> = {};
  MATERIAL_LOOKUP.forEach((item) => {
    if (!lookupByShade[item.shade]) {
      lookupByShade[item.shade] = [];
    }
    lookupByShade[item.shade].push({ materialId: item.materialId, thickness: item.thickness });
  });
  
  // 1. Add 1-3 pucks in STORAGE for each shade
  for (const shade of SHADE_LIST) {
    const storageCount = randomInt(1, 3);
    
    for (let i = 0; i < storageCount; i++) {
      // Choose a material (random thickness)
      const { materialId, thickness } = randomChoice(lookupByShade[shade]);
      const puckId = `PUCK-${puckCounter.toString().padStart(6, '0')}`;
      puckCounter++;
      
      // Find first available storage slot
      const slot = storageSlots.find((s) => !s.occupied);
      if (!slot) {
        throw new Error('No storage slots available');
      }
      
      // Mark slot as occupied
      slot.occupied = true;
      slot.puckId = puckId;
      
      // Create the puck in storage
      pucks.push({
        puckId,
        shrinkageFactor: parseFloat((1.22 + Math.random() * 0.05).toFixed(4)),
        serialNumber: serialCounter++,
        materialId,
        lotNumber: randomInt(100000, 999999),
        shade,
        thickness,
        currentLocation: slot.fullLocation,
        screenshotUrl: '/puck_placeholder.png',
        status: 'in_storage',
      });
    }
  }
  
  // 2. Add 200 pucks in INVENTORY (various shades)
  // Calculate how many inventory pucks for each shade based on commonality
  const totalInventoryPucks = 200;
  
  // Create weights for each shade (first shades are more common)
  const shadeWeights = SHADE_LIST.map((_, idx) => Math.max(10 - idx, 1));
  const totalWeight = shadeWeights.reduce((a, b) => a + b, 0);
  
  // Calculate how many pucks per shade based on weights
  const pucksPerShade: Record<string, number> = {};
  SHADE_LIST.forEach((shade, idx) => {
    const shadeRatio = shadeWeights[idx] / totalWeight;
    pucksPerShade[shade] = Math.max(3, Math.round(totalInventoryPucks * shadeRatio));
  });
  
  // Actually create the inventory pucks
  for (const shade of SHADE_LIST) {
    const targetCount = pucksPerShade[shade];
    
    for (let i = 0; i < targetCount; i++) {
      // Choose a material (random thickness)
      const { materialId, thickness } = randomChoice(lookupByShade[shade]);
      const puckId = `PUCK-${puckCounter.toString().padStart(6, '0')}`;
      puckCounter++;
      
      // Create the puck in inventory
      pucks.push({
        puckId,
        shrinkageFactor: parseFloat((1.22 + Math.random() * 0.05).toFixed(4)),
        serialNumber: serialCounter++,
        materialId,
        lotNumber: randomInt(100000, 999999),
        shade,
        thickness,
        currentLocation: 'Inventory',
        screenshotUrl: '/puck_placeholder.png',
        status: 'in_inventory',
      });
    }
  }
  
  // 3. Add 43 USED pucks for analytics (last 5 weeks)
  // Generate date ranges for the past 5 weeks
  const weeks = Array.from({ length: 5 }, (_, i) => ({
    start: 7 * (i + 1),
    end: 7 * i,
    count: 0
  }));
  
  // Distribute the 43 pucks across the 5 weeks
  weeks[0].count = 12; // This week
  weeks[1].count = 10; // Last week
  weeks[2].count = 8;  // 2 weeks ago
  weeks[3].count = 7;  // 3 weeks ago
  weeks[4].count = 6;  // 4 weeks ago
  
  // Create the mill log entries and retired pucks
  for (const week of weeks) {
    for (let i = 0; i < week.count; i++) {
      // Choose a random shade weighted toward more common shades
      const shade = randomWeighted(
        SHADE_LIST,
        SHADE_LIST.map((_, idx) => Math.max(10 - idx, 1))
      );
      
      // Choose a material (random thickness)
      const { materialId, thickness } = randomChoice(lookupByShade[shade]);
      const puckId = `PUCK-${puckCounter.toString().padStart(6, '0')}`;
      puckCounter++;
      
      // Create the retired puck
      const retiredPuck: Puck = {
        puckId,
        shrinkageFactor: parseFloat((1.22 + Math.random() * 0.05).toFixed(4)),
        serialNumber: serialCounter++,
        materialId,
        lotNumber: randomInt(100000, 999999),
        shade,
        thickness,
        currentLocation: 'Retired',
        screenshotUrl: '/puck_placeholder.png',
        status: 'retired',
      };
      
      pucks.push(retiredPuck);
      
      // Create a random date within this week's range
      const daysAgo = randomInt(week.end, week.start);
      const timestamp = getPastDate(daysAgo);
      
      // Create mill log entry for this puck
      const logId = `log-${Date.now()}-${puckCounter}`;
      const caseIds = Array.from(
        { length: randomInt(1, 3) }, 
        () => `HIST-${randomInt(1000, 9999)}`
      );
      
      millLogs.push({
        logId,
        timestamp,
        puckId,
        previousLocation: 'Inventory',
        newLocation: 'Retired',
        caseIds,
        technicianName: randomChoice(DOCTOR_NAMES),
        lastJobTriggered: true,
        notes: `${shade} puck used ${daysAgo} days ago`,
      });
    }
  }
  
  // The pucks from this week should be in the order queue
  // (Already handled by making them retired with timestamps from this week)
  
  return { pucks, millLogs };
};

// Main function to generate all the seed data
export const generateSeedData = (): DashboardData => {
  const storageSlots = generateStorageSlots();
  const mills = generateMills();
  const { pucks, millLogs } = generatePucks(storageSlots);
  const cases = generateCamCases();

  const data: DashboardData = {
    cases,
    pucks,
    storageSlots,
    mills,
    millLogs,
  };

  return data;
}; 
import { CamCase, DashboardData, Puck, StorageSlot, Mill, MillSlot } from '../types';

// Material ID lookup
export const MATERIAL_LOOKUP: { materialId: number; shade: string; thickness: string }[] = [
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

const SHADE_LIST = [
  'B1',
  'A1',
  'B2',
  'D2',
  'A2',
  'C1',
  'C2',
  'D4',
  'A3',
  'D3',
  'B3',
  'A3.5',
  'B4',
  'C3',
  'A4',
  'C4',
  'OM1',
  'OM3',
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

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomChoice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateCaseId = (() => {
  let counter = 1;
  return () => {
    const id = counter.toString().padStart(2, '0');
    counter += 1;
    const alpha = String.fromCharCode(65 + randomInt(0, 25));
    const alpha2 = String.fromCharCode(65 + randomInt(0, 25));
    return `${alpha}${alpha2}${id}`;
  };
})();

const generateCamCases = (): CamCase[] => {
  const cases: CamCase[] = [];
  const requiredSingles = Math.ceil(45 * 0.5);
  let singlesCreated = 0;

  for (let i = 0; i < 45; i++) {
    const caseId = generateCaseId();

    let units: number;
    if (singlesCreated < requiredSingles) {
      units = 1;
      singlesCreated += 1;
    } else {
      units = randomInt(1, 4);
    }

    const toothNumbers: number[] = [];
    while (toothNumbers.length < units) {
      const num = randomInt(1, 32);
      if (!toothNumbers.includes(num)) {
        toothNumbers.push(num);
      }
    }

    const shade = randomChoice(SHADE_LIST);

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

const generatePucks = (storageSlots: StorageSlot[]): Puck[] => {
  const pucks: Puck[] = [];
  let serialCounter = 1000;
  let puckCounter = 1;
  // Group lookups by shade for easy selection
  const lookupByShade = MATERIAL_LOOKUP.reduce<Record<string, { materialId: number; thickness: string }[]>>(
    (acc, item) => {
      if (!acc[item.shade]) acc[item.shade] = [];
      acc[item.shade].push({ materialId: item.materialId, thickness: item.thickness });
      return acc;
    },
    {},
  );

  for (const shade of SHADE_LIST) {
    const puckCount = randomInt(1, 3);
    for (let i = 0; i < puckCount; i++) {
      const { materialId, thickness } = randomChoice(lookupByShade[shade]);
      const puckId = `PUCK-${puckCounter.toString().padStart(6, '0')}`;
      puckCounter += 1;

      // assign to first vacant slot
      const slot = storageSlots.find((s) => !s.occupied);
      if (!slot) {
        throw new Error('No storage slots available');
      }
      slot.occupied = true;
      slot.puckId = puckId;

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

  return pucks;
};

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

export const generateSeedData = (): DashboardData => {
  const storageSlots = generateStorageSlots();
  const pucks = generatePucks(storageSlots);
  const cases = generateCamCases();
  const mills = generateMills();

  const data: DashboardData = {
    cases,
    pucks,
    storageSlots,
    mills,
  };

  return data;
}; 
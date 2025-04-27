export interface CamCase {
  caseId: string;
  doctorName: string;
  officeName: string;
  shade: string;
  units: number;
  toothNumbers: number[];
  stlFiles: string[];
  status: 'cam_ready' | 'completed';
}

export interface Puck {
  puckId: string;
  shrinkageFactor: number;
  serialNumber: number;
  materialId: number;
  lotNumber: number;
  shade: string;
  thickness: string;
  currentLocation: string; // e.g., 'storage' or mill name
  screenshotUrl: string;
  status: 'in_storage' | 'in_mill' | 'retired';
}

export interface StorageSlot {
  rack: number;
  shelf: string; // A-G
  column: string; // A-G
  slotNumber: number; // 1-9 (1 bottom)
  fullLocation: string; // e.g., R1-A-A-1
  occupied: boolean;
  puckId: string | null;
}

export interface MillSlot {
  millName: string; // e.g., A52-1 or DWX-2A
  slotName: string; // e.g., '1', 'A'
  occupied: boolean;
  puckId: string | null;
}

export interface Mill {
  id: string;
  model: 'A52' | 'DWX' | '350i';
  slots: MillSlot[];
}

export interface DashboardData {
  cases: CamCase[];
  pucks: Puck[];
  storageSlots: StorageSlot[];
  mills: Mill[];
} 
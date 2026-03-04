export interface MedicationRecord {
  id: string;
  time: string; // ISO string
  method: string; // e.g., "Injection", "Beta", "Oral", "Sublingual"
  type: string; // e.g., "EV", "EB", "EC", "EN"
  dosage: number;
  unit: string; // e.g., "mg"
  createdAt: string;
}

const STORAGE_KEY = 'hrt_medication_records';

export const medicationStorage = {
  getRecords: (): MedicationRecord[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse medication records', e);
      return [];
    }
  },

  saveRecord: (record: Omit<MedicationRecord, 'id' | 'createdAt'>) => {
    const records = medicationStorage.getRecords();
    const newRecord: MedicationRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newRecord, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  },

  deleteRecord: (id: string) => {
    const records = medicationStorage.getRecords();
    const updated = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  updateRecord: (id: string, record: Partial<Omit<MedicationRecord, 'id' | 'createdAt'>>) => {
    const records = medicationStorage.getRecords();
    const updated = records.map(r => r.id === id ? { ...r, ...record } : r);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated.find(r => r.id === id);
  }
};

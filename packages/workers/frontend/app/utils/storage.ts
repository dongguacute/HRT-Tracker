export interface MedicationRecord {
  id: string;
  time: string; // ISO string
  method: string; // e.g., "Injection", "Beta", "Oral", "Sublingual"
  type: string; // e.g., "EV", "EB", "EC", "EN"
  dosage: number;
  unit: string; // e.g., "mg"
  createdAt: string;
}

export interface LabRecord {
  id: string;
  time: string; // ISO string
  value: number;
  unit: 'pg/ml' | 'pmol/l';
  createdAt: string;
}

const STORAGE_KEY = 'hrt_medication_records';
const LAB_STORAGE_KEY = 'hrt_lab_records';
const SETTINGS_STORAGE_KEY = 'hrt_settings';

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  weight: number;
  hasAcceptedDisclaimer: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  weight: 60,
  hasAcceptedDisclaimer: false,
};

export const settingsStorage = {
  getSettings: (): Settings => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (e) {
      console.error('Failed to parse settings', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings: (settings: Partial<Settings>) => {
    const current = settingsStorage.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    
    // 如果修改了主题，触发自定义事件通知 root.tsx 更新
    if (settings.theme) {
      window.dispatchEvent(new Event('theme-change'));
    }
    
    return updated;
  },

  exportData: () => {
    const data = {
      medicationRecords: medicationStorage.getRecords(),
      labRecords: labStorage.getRecords(),
      settings: settingsStorage.getSettings(),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.medicationRecords) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.medicationRecords));
      }
      if (data.labRecords) {
        localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(data.labRecords));
      }
      if (data.settings) {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data.settings));
      }
      return true;
    } catch (e) {
      console.error('Failed to import data', e);
      return false;
    }
  }
};

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
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2),
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

export const labStorage = {
  getRecords: (): LabRecord[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(LAB_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse lab records', e);
      return [];
    }
  },

  saveRecord: (record: Omit<LabRecord, 'id' | 'createdAt'>) => {
    const records = labStorage.getRecords();
    const newRecord: LabRecord = {
      ...record,
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      createdAt: new Date().toISOString(),
    };
    const updated = [newRecord, ...records].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  },

  deleteRecord: (id: string) => {
    const records = labStorage.getRecords();
    const updated = records.filter(r => r.id !== id);
    localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(updated));
  },

  updateRecord: (id: string, record: Partial<Omit<LabRecord, 'id' | 'createdAt'>>) => {
    const records = labStorage.getRecords();
    const updated = records.map(r => r.id === id ? { ...r, ...record } : r);
    localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(updated));
    return updated.find(r => r.id === id);
  }
};

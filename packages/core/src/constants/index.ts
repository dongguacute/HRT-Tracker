import { Ester } from '../types/index.js';

export const MOLECULAR_WEIGHTS: Record<Ester, number> = {
  [Ester.E2]: 272.38,
  [Ester.EB]: 376.50,
  [Ester.EV]: 356.50,
  [Ester.EC]: 396.58,
  [Ester.EN]: 384.56,
  [Ester.CPA]: 416.94,
};

export const CORE_PK = {
  vdPerKG: 2.0,           // L/kg for E2
  vdPerKG_CPA: 14.0,      // L/kg for CPA
  kClear: 0.41,           // Default elimination
  kClearInjection: 0.041, // Elimination for depot
  depotK1Corr: 1.0,
};

export const INJECTION_PK = {
  Frac_fast: { [Ester.EB]: 0.90, [Ester.EV]: 0.40, [Ester.EC]: 0.229164549, [Ester.EN]: 0.05, [Ester.E2]: 1.0 },
  k1_fast: { [Ester.EB]: 0.144, [Ester.EV]: 0.0216, [Ester.EC]: 0.005035046, [Ester.EN]: 0.0010, [Ester.E2]: 0.5 },
  k1_slow: { [Ester.EB]: 0.114, [Ester.EV]: 0.0138, [Ester.EC]: 0.004510574, [Ester.EN]: 0.0050, [Ester.E2]: 0 },
  formationFraction: { [Ester.EB]: 0.1092, [Ester.EV]: 0.0623, [Ester.EC]: 0.1173, [Ester.EN]: 0.12, [Ester.E2]: 1.0 },
  k2: { [Ester.EB]: 0.090, [Ester.EV]: 0.070, [Ester.EC]: 0.045, [Ester.EN]: 0.015, [Ester.E2]: 0 },
};

export const ORAL_PK = {
  kAbsE2: 0.32,
  kAbsEV: 0.05,
  bioavailability: 0.03,
  kAbsSL: 1.8,
};

export const GEL_SITE_ORDER = ["arm", "thigh", "scrotal"] as const;
export const GEL_SITE_PARAMS: Record<string, number> = {
  arm: 0.05,
  thigh: 0.05,
  scrotal: 0.40,
};

export const SL_TIER_ORDER = ["quick", "casual", "standard", "strict"] as const;
export const SL_TIER_PARAMS: Record<string, { theta: number; hold: number }> = {
  quick: { theta: 0.01, hold: 2 },
  casual: { theta: 0.04, hold: 5 },
  standard: { theta: 0.11, hold: 10 },
  strict: { theta: 0.18, hold: 15 },
};

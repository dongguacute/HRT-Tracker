/**
 * Estradiol & Other Compound types
 */
export enum Ester {
  E2 = 'E2',
  EB = 'EB',
  EV = 'EV',
  EC = 'EC',
  EN = 'EN',
  CPA = 'CPA', // Cyproterone Acetate
}

/**
 * Administration Routes
 */
export enum Route {
  Injection = 'injection',
  PatchApply = 'patchApply',
  PatchRemove = 'patchRemove',
  Gel = 'gel',
  Oral = 'oral',
  Sublingual = 'sublingual',
}

/**
 * Extra parameters for specific routes (e.g., gel site, sublingual tier)
 */
export enum ExtraKey {
  ConcentrationMGmL = 'concentrationMGmL',
  AreaCM2 = 'areaCM2',
  ReleaseRateUGPerDay = 'releaseRateUGPerDay',
  SublingualTheta = 'sublingualTheta',
  SublingualTier = 'sublingualTier',
  GelSite = 'gelSite',
}

/**
 * Pharmacokinetic Parameters (Supporting up to 3-compartment models)
 */
export interface PKParameters {
  k1_fast: number;   // Absorption rate (fast)
  k1_slow: number;   // Absorption rate (slow)
  k2: number;        // Hydrolysis/Distribution rate
  k3: number;        // Elimination rate
  F: number;         // Bioavailability (0-1)
  Frac_fast: number; // Fraction of dose using k1_fast
  F_fast: number;    // Specific bioavailability for fast branch
  F_slow: number;    // Specific bioavailability for slow branch
  rateMGh: number;   // Zero-order release rate (for patches)
}

/**
 * Lab Result for Calibration
 */
export interface LabResult {
  id: string;
  timeH: number;
  concValue: number;
  unit: 'pg/ml' | 'pmol/l';
}

/**
 * Dosing Event
 */
export interface DoseEvent {
  id: string;
  timeH: number;
  doseMG: number;
  ester: Ester;
  route: Route;
  extras?: Partial<Record<ExtraKey, number>>;
}

/**
 * Simulation Result (Multi-substance)
 */
export interface SimulationResult {
  timeH: number[];
  concPGmL: number[];      // Total E2-equivalent (pg/mL)
  concPGmL_E2: number[];   // Pure E2 (pg/mL)
  concPGmL_CPA: number[];  // Pure CPA (ng/mL)
  auc: number;
}

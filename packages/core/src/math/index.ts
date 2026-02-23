/**
 * 3-Compartment Analytical Solution
 * Calculates the amount in the central compartment at time tau.
 */
export function analytic3C(
  tau: number,
  dose: number,
  F: number,
  k1: number,
  k2: number,
  k3: number
): number {
  if (tau < 0 || k1 <= 0 || dose <= 0) return 0;
  
  const k1_k2 = k1 - k2;
  const k1_k3 = k1 - k3;
  const k2_k3 = k2 - k3;

  // Singularity protection
  if (Math.abs(k1_k2) < 1e-9 || Math.abs(k1_k3) < 1e-9 || Math.abs(k2_k3) < 1e-9) {
    return 0; 
  }

  const term1 = Math.exp(-k1 * tau) / (k1_k2 * k1_k3);
  const term2 = Math.exp(-k2 * tau) / (-k1_k2 * k2_k3);
  const term3 = Math.exp(-k3 * tau) / (k1_k3 * k2_k3);

  return dose * F * k1 * k2 * (term1 + term2 + term3);
}

/**
 * 1-Compartment (First-order absorption) helper
 */
export function analytic1C(
  tau: number,
  dose: number,
  F: number,
  ka: number,
  ke: number
): number {
  if (tau < 0 || dose <= 0) return 0;
  if (Math.abs(ka - ke) < 1e-9) {
    return dose * F * ka * tau * Math.exp(-ke * tau);
  }
  return (dose * F * ka) / (ka - ke) * (Math.exp(-ke * tau) - Math.exp(-ka * tau));
}

/**
 * Trapezoidal integration for AUC calculation.
 */
export function trapezoidalRule(time: number[], concentration: number[]): number {
  if (time.length !== concentration.length || time.length < 2) return 0;
  let auc = 0;
  for (let i = 0; i < time.length - 1; i++) {
    auc += 0.5 * (concentration[i] + concentration[i + 1]) * (time[i + 1] - time[i]);
  }
  return auc;
}

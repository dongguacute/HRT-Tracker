import { DoseEvent, PKParameters, Ester, Route, ExtraKey } from '../types/index.js';
import { 
  MOLECULAR_WEIGHTS, CORE_PK, INJECTION_PK, ORAL_PK, 
  GEL_SITE_ORDER, GEL_SITE_PARAMS, SL_TIER_ORDER, SL_TIER_PARAMS 
} from '../constants/index.js';
import { analytic3C, analytic1C } from '../math/index.js';

/**
 * Resolves raw event data into pharmacokinetic parameters.
 */
export function resolvePKParams(event: DoseEvent): PKParameters {
  const mwFactor = MOLECULAR_WEIGHTS[Ester.E2] / MOLECULAR_WEIGHTS[event.ester];
  const defaultK3 = event.route === Route.Injection ? CORE_PK.kClearInjection : CORE_PK.kClear;
  const extras = event.extras ?? {};

  const params: PKParameters = {
    Frac_fast: 1.0, k1_fast: 0, k1_slow: 0, k2: 0, k3: defaultK3, 
    F: 0, F_fast: 0, F_slow: 0, rateMGh: 0
  };

  switch (event.route) {
    case Route.Injection:
      params.Frac_fast = (INJECTION_PK.Frac_fast as any)[event.ester] ?? 0.5;
      params.k1_fast = ((INJECTION_PK.k1_fast as any)[event.ester] ?? 0.1) * CORE_PK.depotK1Corr;
      params.k1_slow = ((INJECTION_PK.k1_slow as any)[event.ester] ?? 0.01) * CORE_PK.depotK1Corr;
      params.k2 = (INJECTION_PK.k2 as any)[event.ester] ?? 0;
      params.F = ((INJECTION_PK.formationFraction as any)[event.ester] ?? 0.08) * mwFactor;
      params.F_fast = params.F;
      params.F_slow = params.F;
      break;

    case Route.Sublingual:
      let theta = 0.11;
      if (extras[ExtraKey.SublingualTheta] !== undefined) {
        theta = Math.min(1, Math.max(0, extras[ExtraKey.SublingualTheta]!));
      } else if (extras[ExtraKey.SublingualTier] !== undefined) {
        const tierIdx = Math.min(SL_TIER_ORDER.length - 1, Math.max(0, Math.round(extras[ExtraKey.SublingualTier]!)));
        const tierKey = SL_TIER_ORDER[tierIdx];
        theta = SL_TIER_PARAMS[tierKey]?.theta ?? 0.11;
      }
      params.Frac_fast = theta;
      params.k1_fast = ORAL_PK.kAbsSL;
      params.k1_slow = event.ester === Ester.EV ? ORAL_PK.kAbsEV : ORAL_PK.kAbsE2;
      params.k2 = (INJECTION_PK.k2 as any)[event.ester] ?? 0;
      params.F_fast = mwFactor;
      params.F_slow = ORAL_PK.bioavailability * mwFactor;
      params.F = theta * params.F_fast + (1 - theta) * params.F_slow;
      break;

    case Route.Oral:
      if (event.ester === Ester.CPA) {
        params.k1_fast = 1.0; params.k3 = 0.017; params.F = 0.7;
      } else {
        params.k1_fast = event.ester === Ester.EV ? ORAL_PK.kAbsEV : ORAL_PK.kAbsE2;
        params.k2 = event.ester === Ester.EV ? (INJECTION_PK.k2[Ester.EV] || 0) : 0;
        params.F = ORAL_PK.bioavailability * mwFactor;
      }
      params.F_fast = params.F; params.F_slow = params.F;
      break;

    case Route.Gel:
      const siteIdx = Math.min(GEL_SITE_ORDER.length - 1, Math.max(0, Math.round(extras[ExtraKey.GelSite] ?? 0)));
      const siteKey = GEL_SITE_ORDER[siteIdx];
      params.F = (GEL_SITE_PARAMS[siteKey] ?? 0.05) * mwFactor;
      params.k1_fast = 0.022;
      params.F_fast = params.F; params.F_slow = params.F;
      break;

    case Route.PatchApply:
      params.F = 1.0 * mwFactor;
      const releaseRate = extras[ExtraKey.ReleaseRateUGPerDay];
      if (typeof releaseRate === 'number' && releaseRate > 0) {
        params.rateMGh = (releaseRate / 24 / 1000) * params.F;
      } else {
        params.k1_fast = 0.0075;
      }
      params.F_fast = params.F; params.F_slow = params.F;
      break;
  }
  return params;
}

/**
 * Calculates the contribution of a single dosing event at time t.
 */
export function calculateEventContribution(t: number, event: DoseEvent, allEvents: DoseEvent[]): number {
  const params = resolvePKParams(event);
  const tau = t - event.timeH;
  if (tau < 0) return 0;

  switch (event.route) {
    case Route.Injection:
      return analytic3C(tau, event.doseMG * params.Frac_fast, params.F_fast, params.k1_fast, params.k2, params.k3) +
             analytic3C(tau, event.doseMG * (1 - params.Frac_fast), params.F_slow, params.k1_slow, params.k2, params.k3);

    case Route.Sublingual:
      const fast = params.k2 > 0 
        ? analytic3C(tau, event.doseMG * params.Frac_fast, params.F_fast, params.k1_fast, params.k2, params.k3)
        : analytic1C(tau, event.doseMG * params.Frac_fast, params.F_fast, params.k1_fast, params.k3);
      const slow = analytic1C(tau, event.doseMG * (1 - params.Frac_fast), params.F_slow, params.k1_slow, params.k3);
      return fast + slow;

    case Route.PatchApply:
      const remove = allEvents.find(e => e.route === Route.PatchRemove && e.timeH > event.timeH);
      const wearH = (remove?.timeH ?? Number.MAX_VALUE) - event.timeH;
      if (params.rateMGh > 0) {
        if (tau <= wearH) {
          return (params.rateMGh / params.k3) * (1 - Math.exp(-params.k3 * tau));
        } else {
          const amtAtRemoval = (params.rateMGh / params.k3) * (1 - Math.exp(-params.k3 * wearH));
          return amtAtRemoval * Math.exp(-params.k3 * (tau - wearH));
        }
      }
      const amt = analytic1C(tau, event.doseMG, params.F, params.k1_fast, params.k3);
      if (tau > wearH) {
        const amtAtRemoval = analytic1C(wearH, event.doseMG, params.F, params.k1_fast, params.k3);
        return amtAtRemoval * Math.exp(-params.k3 * (tau - wearH));
      }
      return amt;

    default:
      return analytic1C(tau, event.doseMG, params.F, params.k1_fast, params.k3);
  }
}

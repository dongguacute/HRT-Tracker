import { DoseEvent, SimulationResult, Ester, Route } from '../types/index.js';
import { CORE_PK } from '../constants/index.js';
import { calculateEventContribution } from '../model/index.js';
import { trapezoidalRule } from '../math/index.js';

export function runSimulation(events: DoseEvent[], bodyWeightKG: number): SimulationResult | null {
  if (events.length === 0) return null;

  const sortedEvents = [...events].sort((a, b) => a.timeH - b.timeH);
  const activeEvents = sortedEvents.filter(e => e.route !== Route.PatchRemove);

  const startTime = sortedEvents[0].timeH - 24;
  const endTime = sortedEvents[sortedEvents.length - 1].timeH + (24 * 14);
  const steps = 1000;

  const plasmaVolumeML_E2 = CORE_PK.vdPerKG * bodyWeightKG * 1000;
  const plasmaVolumeML_CPA = CORE_PK.vdPerKG_CPA * bodyWeightKG * 1000;

  const timeH: number[] = [];
  const concPGmL: number[] = [];
  const concPGmL_E2: number[] = [];
  const concPGmL_CPA: number[] = [];

  const stepSize = (endTime - startTime) / (steps - 1);
  const gridTimes = Array.from({ length: steps }, (_, i) => startTime + i * stepSize);
  const eventTimes = sortedEvents.map(e => e.timeH);
  const allTimes = Array.from(new Set([...gridTimes, ...eventTimes])).sort((a, b) => a - b);

  for (const t of allTimes) {
    let totalAmountMG_E2 = 0;
    let totalAmountMG_CPA = 0;

    for (const event of activeEvents) {
      const amount = calculateEventContribution(t, event, sortedEvents);
      if (event.ester === Ester.CPA) {
        totalAmountMG_CPA += amount;
      } else {
        totalAmountMG_E2 += amount;
      }
    }

    const currentConc_E2 = (totalAmountMG_E2 * 1e9) / plasmaVolumeML_E2;
    const currentConc_CPA = (totalAmountMG_CPA * 1e6) / plasmaVolumeML_CPA;
    const currentConcTotal = currentConc_E2 + (currentConc_CPA * 1000);

    timeH.push(t);
    concPGmL.push(currentConcTotal);
    concPGmL_E2.push(currentConc_E2);
    concPGmL_CPA.push(currentConc_CPA);
  }

  const auc = trapezoidalRule(timeH, concPGmL);

  return { timeH, concPGmL, concPGmL_E2, concPGmL_CPA, auc };
}

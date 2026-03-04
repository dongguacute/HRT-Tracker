import { SimulationResult, LabResult } from '../types/index.js';

/**
 * Unit conversion: pmol/L to pg/mL
 */
export function convertToPgMl(val: number, unit: 'pg/ml' | 'pmol/l'): number {
  return unit === 'pg/ml' ? val : val / 3.671;
}

/**
 * Linear interpolation for simulation results.
 */
export function interpolateConcentration(
  sim: SimulationResult, 
  hour: number, 
  key: 'concPGmL' | 'concPGmL_E2' | 'concPGmL_CPA' = 'concPGmL'
): number | null {
  if (!sim.timeH.length) return null;
  const times = sim.timeH;
  const values = sim[key];

  if (hour <= times[0]) return values[0];
  if (hour >= times[times.length - 1]) return values[values.length - 1];

  let low = 0, high = times.length - 1;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (times[mid] === hour) return values[mid];
    if (times[mid] < hour) low = mid;
    else high = mid;
  }

  const t0 = times[low], t1 = times[high];
  const v0 = values[low], v1 = values[high];
  return v0 + (v1 - v0) * (hour - t0) / (t1 - t0);
}

/**
 * Creates a calibration function based on lab results.
 */
export function createCalibrationInterpolator(sim: SimulationResult | null, results: LabResult[]) {
  if (!sim || !results.length) return (_t: number) => 1;

  const points = results
    .map(r => {
      const obs = convertToPgMl(r.concValue, r.unit);
      const pred = interpolateConcentration(sim, r.timeH, 'concPGmL_E2');
      if (pred === null || obs <= 0) return null;
      const sanitizedPred = Math.max(pred, 0.01);
      return { timeH: r.timeH, ratio: Math.max(0.01, Math.min(2000, obs / sanitizedPred)) };
    })
    .filter((p): p is { timeH: number; ratio: number } => !!p)
    .sort((a, b) => a.timeH - b.timeH);

  if (!points.length) return (_t: number) => 1;

  return (t: number) => {
    if (t <= points[0].timeH) return points[0].ratio;
    if (t >= points[points.length - 1].timeH) return points[points.length - 1].ratio;
    
    let low = 0, high = points.length - 1;
    while (high - low > 1) {
      const mid = Math.floor((low + high) / 2);
      if (points[mid].timeH === t) return points[mid].ratio;
      if (points[mid].timeH < t) low = mid;
      else high = mid;
    }
    const p0 = points[low], p1 = points[high];
    return p0.ratio + (p1.ratio - p0.ratio) * (t - p0.timeH) / (p1.timeH - p0.timeH);
  };
}

/**
 * Gzip compression/decompression for browser environments.
 */
export async function compressData(data: string): Promise<string> {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'));
  const bytes = new Uint8Array(await (new Response(stream)).arrayBuffer());
  return btoa(String.fromCharCode(...bytes));
}

export async function decompressData(base64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await (new Response(stream)).text();
}

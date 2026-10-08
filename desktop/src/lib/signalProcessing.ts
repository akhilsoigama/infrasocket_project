export function calculateStats(data: number[]) {
  if (!data || data.length === 0) return { min: 0, max: 0, mean: 0 };
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    if (val < min) min = val;
    if (val > max) max = val;
    sum += val;
  }
  return { min, max, mean: sum / data.length };
}

export function applyBandpassFilter(data: number[], lowHz: number, highHz: number, sampleRate: number): number[] {
  // Simple RC filter approximations
  // Lowpass EMA
  const alphaLow = 1 / (1 + sampleRate / (2 * Math.PI * highHz));
  // Highpass EMA
  const alphaHigh = 1 / (1 + (2 * Math.PI * lowHz) / sampleRate);

  let out = new Float64Array(data.length);

  // Lowpass pass 1
  let lowPassed = new Float64Array(data.length);
  lowPassed[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    lowPassed[i] = lowPassed[i - 1] + alphaLow * (data[i] - lowPassed[i - 1]);
  }

  // Highpass pass 2 on the lowpassed data
  out[0] = lowPassed[0];
  for (let i = 1; i < data.length; i++) {
    out[i] = alphaHigh * (out[i - 1] + lowPassed[i] - lowPassed[i - 1]);
  }

  return Array.from(out);
}

// Simple DFT for spectrum analysis (use a power of 2 window, e.g., 256 or 512, to avoid lag)
export function computeSpectrum(data: number[], sampleRate: number, maxPoints: number = 512) {
  const N = Math.min(data.length, maxPoints);
  const magnitudes = new Float64Array(N / 2);
  const frequencies = new Float64Array(N / 2);

  for (let k = 0; k < N / 2; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += data[n] * Math.cos(angle);
      im -= data[n] * Math.sin(angle);
    }
    magnitudes[k] = Math.sqrt(re * re + im * im) / N;
    frequencies[k] = (k * sampleRate) / N;
  }
  return { frequencies: Array.from(frequencies), magnitudes: Array.from(magnitudes) };
}

// STALTA (Short Time Average / Long Time Average) for arrival detection
export function detectArrival(data: number[], sampleRate: number, staWindow: number = 1.0, ltaWindow: number = 10.0, threshold: number = 3.0) {
  const staSamples = Math.floor(staWindow * sampleRate);
  const ltaSamples = Math.floor(ltaWindow * sampleRate);
  if (data.length < ltaSamples) return null;

  let staSum = 0;
  let ltaSum = 0;

  // Initialize
  for (let i = 0; i < ltaSamples; i++) {
    const val = Math.abs(data[i]);
    ltaSum += val;
    if (i >= ltaSamples - staSamples) {
      staSum += val;
    }
  }

  for (let i = ltaSamples; i < data.length; i++) {
    const val = Math.abs(data[i]);
    const oldStaVal = Math.abs(data[i - staSamples]);
    const oldLtaVal = Math.abs(data[i - ltaSamples]);

    staSum += val - oldStaVal;
    ltaSum += val - oldLtaVal;

    const sta = staSum / staSamples;
    const lta = ltaSum / ltaSamples;

    if (lta > 0.0001 && (sta / lta) > threshold) {
      return i; // index of arrival
    }
  }
  return null; // no arrival detected
}

export function crossCorrelate(data1: number[], data2: number[], maxLagPoints: number = 100) {
  let maxCorr = -Infinity;
  let bestLag = 0;

  // normalize arrays
  const m1 = calculateStats(data1).mean;
  const m2 = calculateStats(data2).mean;

  const len = Math.min(data1.length, data2.length);

  for (let lag = -maxLagPoints; lag <= maxLagPoints; lag++) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < len; i++) {
      if (i + lag >= 0 && i + lag < len) {
        sum += (data1[i] - m1) * (data2[i + lag] - m2);
        count++;
      }
    }
    if (count > 0) {
      const corr = sum / count;
      if (corr > maxCorr) {
        maxCorr = corr;
        bestLag = lag;
      }
    }
  }
  return { bestLag, maxCorr };
}

/**
 * PRIVAVEDA Bayesian Parameter Updating Engine
 * Implements conjugate prior updates and MAP estimation.
 */

export interface DistributionState {
  label: string;
  mean: number;
  stdDev: number;
  variance: number;
  credibleInterval90: [number, number];
}

export interface BayesianUpdateStep {
  prior: DistributionState;
  observation: {
    value: number;
    errorStd: number;
    timeHours: number;
  };
  posterior: DistributionState;
  varianceReductionPercent: number;
}

export function gaussianPdf(x: number, mean: number, stdDev: number): number {
  if (stdDev <= 0) return 0;
  const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
  return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
}

export function computeBayesianUpdate(
  priorMean: number,
  priorStd: number,
  obsValue: number,
  obsStd: number,
  timeHours: number = 3.5
): BayesianUpdateStep {
  const priorVar = Math.pow(priorStd, 2);
  const obsVar = Math.pow(obsStd, 2);

  const postVar = 1 / (1 / priorVar + 1 / obsVar);
  const postStd = Math.sqrt(postVar);
  const postMean = postVar * (priorMean / priorVar + obsValue / obsVar);

  const varianceReduction = ((priorVar - postVar) / priorVar) * 100;

  const priorCI: [number, number] = [
    Number((priorMean - 1.645 * priorStd).toFixed(3)),
    Number((priorMean + 1.645 * priorStd).toFixed(3)),
  ];

  const postCI: [number, number] = [
    Number((postMean - 1.645 * postStd).toFixed(3)),
    Number((postMean + 1.645 * postStd).toFixed(3)),
  ];

  return {
    prior: {
      label: 'Population Prior P(theta)',
      mean: Number(priorMean.toFixed(3)),
      stdDev: Number(priorStd.toFixed(3)),
      variance: Number(priorVar.toFixed(4)),
      credibleInterval90: priorCI,
    },
    observation: {
      value: Number(obsValue.toFixed(3)),
      errorStd: Number(obsStd.toFixed(3)),
      timeHours,
    },
    posterior: {
      label: 'Updated Posterior P(theta|y)',
      mean: Number(postMean.toFixed(3)),
      stdDev: Number(postStd.toFixed(3)),
      variance: Number(postVar.toFixed(4)),
      credibleInterval90: postCI,
    },
    varianceReductionPercent: Number(varianceReduction.toFixed(1)),
  };
}

export function generatePdfPoints(mean: number, stdDev: number, minX: number, maxX: number, steps: number = 60) {
  const points: { x: number; y: number }[] = [];
  const dx = (maxX - minX) / steps;
  for (let i = 0; i <= steps; i++) {
    const x = minX + i * dx;
    const y = gaussianPdf(x, mean, stdDev);
    points.push({ x: Number(x.toFixed(3)), y: Number(y.toFixed(4)) });
  }
  return points;
}

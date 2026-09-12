import {
  julianDay,
  solveNewMoon,
  solveSolarLongitude,
  ut1ToTt,
} from '/vendor/opendestiny-qishuo-v1.js?v=20260831-vendor-clean-v1';

const TWO_PI = 2 * Math.PI;
const DAYS_PER_SOLAR_TERM = 15.2184;
const DAYS_PER_TROPICAL_YEAR = 365.2422;
const DAYS_PER_SYNODIC_MONTH = 29.53058886;
const CHUNK_SIZE = 200;
let cancelledRunId = null;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function tick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

function solarInput(anchorJdTT, index) {
  const eventIndex = index % 192;
  const yearOffset = Math.floor(eventIndex / 24);
  const termOffset = eventIndex % 24;
  return {
    target: ((19 + termOffset) % 24) / 24 * TWO_PI,
    near: anchorJdTT + yearOffset * DAYS_PER_TROPICAL_YEAR + termOffset * DAYS_PER_SOLAR_TERM,
  };
}

async function runSolver(kind, count, round, runId, progress) {
  const benchmarkYear = Math.min(9992, Math.max(-6000, progress.year));
  const anchorJdTT = ut1ToTt(julianDay({ year: benchmarkYear, month: 1, day: 1, hour: 12 }));
  let computeMs = 0;
  let checksum = 0;
  for (let start = 0; start < count; start += CHUNK_SIZE) {
    if (cancelledRunId === runId) throw new DOMException('Benchmark cancelled', 'AbortError');
    const end = Math.min(count, start + CHUNK_SIZE);
    const before = performance.now();
    for (let index = start; index < end; index += 1) {
      let solved;
      if (kind === 'qi') {
        const input = solarInput(anchorJdTT, index);
        solved = solveSolarLongitude(input.target, input.near);
      } else {
        solved = solveNewMoon(anchorJdTT + (index % 128) * DAYS_PER_SYNODIC_MONTH);
      }
      checksum += solved.jdTT;
    }
    computeMs += performance.now() - before;
    progress.completed += end - start;
    self.postMessage({
      type: 'progress',
      runId,
      kind,
      round,
      completed: progress.completed,
      total: progress.total,
    });
    await tick();
  }
  return { computeMs, checksum };
}

async function benchmark({ runId, year, count, rounds }) {
  cancelledRunId = null;
  const benchmarkYear = Math.min(9992, Math.max(-6000, year));
  const anchorJdTT = ut1ToTt(julianDay({ year: benchmarkYear, month: 1, day: 1, hour: 12 }));
  for (let index = 0; index < 24; index += 1) {
    const input = solarInput(anchorJdTT, index);
    solveSolarLongitude(input.target, input.near);
    solveNewMoon(anchorJdTT + index * DAYS_PER_SYNODIC_MONTH);
  }

  const progress = { year, completed: 0, total: count * rounds * 2 };
  const timings = { qi: [], shuo: [] };
  let checksum = 0;
  for (let round = 1; round <= rounds; round += 1) {
    for (const kind of ['qi', 'shuo']) {
      const result = await runSolver(kind, count, round, runId, progress);
      timings[kind].push(result.computeMs);
      checksum += result.checksum;
    }
  }

  const qiMs = median(timings.qi);
  const shuoMs = median(timings.shuo);
  const qiPerSecond = count / qiMs * 1000;
  const shuoPerSecond = count / shuoMs * 1000;
  self.postMessage({
    type: 'result',
    runId,
    count,
    rounds,
    qi: {
      medianMs: qiMs,
      eventsPerSecond: qiPerSecond,
      annualMs: qiMs / count * 24,
    },
    shuo: {
      medianMs: shuoMs,
      eventsPerSecond: shuoPerSecond,
      annualMs: shuoMs / count * 13,
    },
    score: Math.round(Math.sqrt(qiPerSecond * shuoPerSecond)),
    hardwareConcurrency: self.navigator?.hardwareConcurrency ?? null,
    checksum,
  });
}

self.addEventListener('message', event => {
  if (event.data?.type === 'cancel') {
    cancelledRunId = event.data.runId;
    return;
  }
  if (event.data?.type !== 'benchmark') return;
  benchmark(event.data).catch(error => {
    self.postMessage({
      type: error?.name === 'AbortError' ? 'cancelled' : 'error',
      runId: event.data.runId,
      message: error?.message || String(error),
    });
  });
});

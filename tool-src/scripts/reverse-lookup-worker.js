import * as BAZICore from '/vendor/opendestiny-bazi.js?v=20260831-vendor-clean-v1';
import * as ZIWEICore from '/vendor/opendestiny-ziwei-cpp-boundary-v15.js?v=20260831-vendor-clean-v1';

function civil(value) {
  return {
    year: value.year,
    month: value.month,
    day: value.day,
    hour: value.hour,
    minute: value.minute,
    second: Math.min(59, Math.max(0, Math.round(value.second ?? 0))),
  };
}

function lunar(value) {
  return {
    year: value.year,
    month: value.month,
    day: value.day,
    isLeap: Boolean(value.isLeap),
    monthName: value.monthName,
  };
}

function pillarName(value) {
  return ZIWEICore.HEAVENLY_STEMS[ZIWEICore.ganzhiStem(value)] + ZIWEICore.EARTHLY_BRANCHES[ZIWEICore.ganzhiBranch(value)];
}

async function searchBazi(payload) {

  const options = new BAZICore.BaziOptions(payload.options);
  const pillar = ({ stem, branch }) => BAZICore.packPillar(stem, branch);
  const results = BAZICore.reverseLookupBazi({
    year: pillar(payload.pillars.year),
    month: pillar(payload.pillars.month),
    day: pillar(payload.pillars.day),
    hour: payload.pillars.hour ? pillar(payload.pillars.hour) : undefined,
    startDate: { year: payload.startYear, month: 1, day: 1 },
    endDate: { year: payload.endYear, month: 12, day: 31 },
    options,
  });
  return results.map((candidate) => {
    const time = candidate.timeCandidate;
    const sample = time?.sampleTime ?? candidate.dateCandidate.sampleTime;
    const lunarDate = BAZICore.instantToLunar(sample.toJulianTime(), options.toFourPillarsOptions());
    return {
      civil: civil(sample),
      lunar: lunar(lunarDate),
      startCivil: time ? civil(time.startTime) : null,
      endCivil: time ? civil(time.endTime) : null,
      label: time?.label ?? '全天候选',
      isLateZi: Boolean(time?.isLateZi),
      pillars: ['year', 'month', 'day', 'hour'].map((key) => BAZICore.unpackPillar(candidate.chart.pillars[key]).name),
    };
  });
}

function serializableZiweiOptions(options) {
  const rules = options.rules ?? {};
  return {
    ...options,
    rules: {
      placementDefault: rules.placementDefault,
      brightnessDefault: rules.brightnessDefault,
      sihuaDefault: rules.sihuaDefault,
      masters: rules.masters,
      longevity: rules.longevity,
      placement: rules.placement ?? {},
      brightness: rules.brightness ?? {},
      sihua: rules.sihua ?? {},
    },
  };
}

async function searchZiwei(payload) {

  const options = new ZIWEICore.ZiweiOptions(serializableZiweiOptions(payload.options));
  const start = new ZIWEICore.ZonedTime({
    year: payload.startYear, month: 1, day: 1, hour: 0, minute: 0, second: 0,
    offsetMinutes: options.utcOffsetMinutes,
  });
  const end = new ZIWEICore.ZonedTime({
    year: payload.endYear, month: 12, day: 31, hour: 23, minute: 59, second: 59,
    offsetMinutes: options.utcOffsetMinutes,
  });
  const results = ZIWEICore.reverseLookupZiweiTier1({ start, end, options, query: payload.query });
  return results.map((candidate) => {
    const physical = ZIWEICore.ZonedTime.fromJulianTime(candidate.jdUT1, options.utcOffsetMinutes);
    const pillars = candidate.chart.facts.solarTermPillars;
    return {
      civil: civil(physical),
      virtual: civil(candidate.virtualTime),
      lunar: lunar(candidate.lunarDate),
      hourBranch: candidate.hourBranch,
      ratHourSegment: candidate.ratHourSegment,
      pillars: ['year', 'month', 'day', 'hour'].map((key) => pillarName( pillars[key])),
    };
  });
}

self.addEventListener('message', async (event) => {
  const { id, kind, payload } = event.data ?? {};
  const started = performance.now();
  try {
    const results = kind === 'bazi' ? await searchBazi(payload) : await searchZiwei(payload);
    self.postMessage({ id, ok: true, results, elapsedMs: performance.now() - started });
  } catch (error) {
    self.postMessage({ id, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

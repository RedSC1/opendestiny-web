await (window.redsc1LocaleReady ?? Promise.resolve());
import {
  CALENDAR_DAY_BOUNDARY_MODE,
  CALENDAR_MODE,
  QI_SHUO_INFO,
  ZonedTime,
  getQiShuoYear,
} from '/vendor/opendestiny-qishuo-v1.js?v=20260831-vendor-clean-v1';

const form = document.querySelector('#qishuo-form');
const errorBox = document.querySelector('#qishuo-error');
const tableBody = document.querySelector('#qishuo-table-body');
const emptyState = document.querySelector('#qishuo-empty');
const resultContent = document.querySelector('#qishuo-result-content');
const summary = document.querySelector('#qishuo-summary');
const resultTitle = document.querySelector('#qishuo-result-title');
const copyButton = document.querySelector('#qishuo-copy');
const modeSelect = form.elements.mode;
const meridianField = document.querySelector('#qishuo-meridian-field');
const benchmarkButton = document.querySelector('#qishuo-benchmark-start');
const cancelButton = document.querySelector('#qishuo-benchmark-cancel');
const benchmarkStatus = document.querySelector('#qishuo-benchmark-status');
const benchmarkProgress = document.querySelector('#qishuo-benchmark-progress');
const benchmarkResults = document.querySelector('#qishuo-benchmark-results');
let latestResult = null;
let benchmarkWorker = null;
let activeRunId = null;

function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

function displayYear(year) {
  return year <= 0 ? `公元前${1 - year}年` : `${year}年`;
}

function formatDate(value) {
  return `${displayYear(value.year)}${pad(value.month)}月${pad(value.day)}日`;
}

function roundedZonedTime(event, offsetMinutes) {
  return ZonedTime.fromJulianTime(event.time.jdUT1 + 0.5 / 86400, offsetMinutes);
}

function formatDateTime(event, offsetMinutes) {
  const value = roundedZonedTime(event, offsetMinutes);
  return `${formatDate(value)} ${pad(value.hour)}:${pad(value.minute)}:${pad(Math.floor(value.second))}`;
}

function formatOffset(minutes) {
  const sign = minutes < 0 ? '−' : '+';
  const absolute = Math.abs(minutes);
  return `UTC${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}

function parseOffset() {
  const sign = Number(form.elements.offsetSign.value);
  const hour = Number(form.elements.offsetHour.value);
  const minute = Number(form.elements.offsetMinute.value);
  if (!Number.isInteger(hour) || hour < 0 || hour > 14 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new RangeError('UTC 偏移应为 00:00～14:00。');
  }
  if (hour === 14 && minute !== 0) throw new RangeError('UTC 偏移最大为 14:00。');
  return sign * (hour * 60 + minute);
}

function selectedPhases() {
  const phases = [];
  if (form.elements.includeNewMoon.checked) phases.push(0);
  if (form.elements.includeFirstQuarter.checked) phases.push(90);
  if (form.elements.includeFullMoon.checked) phases.push(180);
  if (form.elements.includeLastQuarter.checked) phases.push(270);
  return phases;
}

function eventClass(event) {
  if (event.kind === 'solar-term') return 'term';
  if (event.kind === 'pentad') return 'pentad';
  if (event.phaseAngleDeg === 0) return 'new-moon';
  if (event.phaseAngleDeg === 180) return 'full-moon';
  return 'quarter';
}

function eventType(event) {
  if (event.kind === 'solar-term') return '节气';
  if (event.kind === 'pentad') return '候';
  return '月相';
}

function assignmentLabel(event) {
  const source = event.assignmentSource === 'historical-profile'
    ? '历史历书'
    : event.assignmentSource === 'local-astronomical' ? '当地天象日' : '中国天象日';
  return `${formatDate(event.assignedDate)} · ${source}`;
}

function renderSummary(result) {
  const counts = {
    terms: result.events.filter(event => event.kind === 'solar-term').length,
    pentads: result.events.filter(event => event.kind === 'pentad').length,
    newMoons: result.events.filter(event => event.kind === 'lunar-phase' && event.phaseAngleDeg === 0).length,
    phases: result.events.filter(event => event.kind === 'lunar-phase' && event.phaseAngleDeg !== 0).length,
    adjusted: result.events.filter(event => event.assignmentDiffersFromLocalDate).length,
  };
  const items = [
    ['节气', counts.terms],
    ['候', counts.pentads],
    ['朔', counts.newMoons],
    ['其他月相', counts.phases],
    ['归日不同', counts.adjusted],
  ].filter(([, value], index) => value > 0 || index === 4);
  summary.innerHTML = items.map(([label, value]) => `<span><strong>${value}</strong><small>${label}</small></span>`).join('');
}

function renderResult(result) {
  latestResult = result;
  resultTitle.textContent = `${displayYear(result.civilYear)}气朔表`;
  renderSummary(result);
  tableBody.innerHTML = result.events.map(event => {
    const changed = event.assignmentDiffersFromLocalDate ? '<b class="assignment-alert">归日不同</b>' : '';
    return `<tr>
      <td data-label="事件"><span class="event-name ${eventClass(event)}"><i>${eventType(event)}</i><strong>${event.name}</strong></span></td>
      <td data-label="当地时间"><time>${formatDateTime(event, result.utcOffsetMinutes)}</time><small>${formatOffset(result.utcOffsetMinutes)}</small></td>
      <td data-label="UTC"><time>${formatDateTime(event, 0)}</time></td>
      <td data-label="历法归日"><time>${assignmentLabel(event)}</time>${changed}</td>
      <td data-label="JD (UT1)"><code>${event.time.jdUT1.toFixed(6)}</code><small>TT ${event.time.jdTT.toFixed(6)}</small></td>
      <td data-label="ΔT"><code>${event.time.deltaTSeconds.toFixed(2)} s</code><small>TT − UT1</small></td>
    </tr>`;
  }).join('');
  emptyState.hidden = true;
  resultContent.hidden = false;
  copyButton.disabled = false;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}

function calculate() {
  clearError();
  const year = Number(form.elements.year.value);
  if (!Number.isInteger(year) || year < QI_SHUO_INFO.rangeStartYear || year > QI_SHUO_INFO.rangeEndYear) {
    throw new RangeError(`年份范围为 ${QI_SHUO_INFO.rangeStartYear}～${QI_SHUO_INFO.rangeEndYear}。`);
  }
  const includeSolarTerms = form.elements.includeSolarTerms.checked;
  const includePentads = form.elements.includePentads.checked;
  const lunarPhaseAnglesDeg = selectedPhases();
  if (!includeSolarTerms && !includePentads && lunarPhaseAnglesDeg.length === 0) {
    throw new RangeError('至少选择一种气朔事件。');
  }
  const mode = modeSelect.value;
  const meridianDeg = mode === CALENDAR_MODE.LOCAL_ASTRONOMICAL
    ? Number(form.elements.meridianDeg.value)
    : undefined;
  const result = getQiShuoYear(year, {
    utcOffsetMinutes: parseOffset(),
    mode,
    dayBoundaryMode: mode === CALENDAR_MODE.LOCAL_ASTRONOMICAL
      ? CALENDAR_DAY_BOUNDARY_MODE.MEAN_SOLAR_MERIDIAN
      : CALENDAR_DAY_BOUNDARY_MODE.FIXED_UTC_OFFSET,
    meridianDeg,
    includeSolarTerms,
    includePentads,
    lunarPhaseAnglesDeg,
  });
  renderResult(result);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    calculate();
  } catch (error) {
    showError(error?.message || String(error));
  }
});

modeSelect.addEventListener('change', () => {
  meridianField.hidden = modeSelect.value !== CALENDAR_MODE.LOCAL_ASTRONOMICAL;
});

copyButton.addEventListener('click', async () => {
  if (!latestResult) return;
  const lines = [
    `${displayYear(latestResult.civilYear)}气朔表（${formatOffset(latestResult.utcOffsetMinutes)}）`,
    '事件\t当地时间\tUTC\t历法归日\tJD(UT1)\tΔT',
    ...latestResult.events.map(event => [
      event.name,
      formatDateTime(event, latestResult.utcOffsetMinutes),
      formatDateTime(event, 0),
      assignmentLabel(event),
      event.time.jdUT1.toFixed(6),
      `${event.time.deltaTSeconds.toFixed(2)}s`,
    ].join('\t')),
  ];
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    const original = copyButton.textContent;
    copyButton.textContent = '已复制';
    setTimeout(() => { copyButton.textContent = original; }, 1200);
  } catch {
    showError('浏览器未允许复制，请手动选择表格内容。');
  }
});

function benchmarkProfile() {
  const profile = form.ownerDocument.querySelector('#qishuo-benchmark-profile').value;
  if (profile === 'quick') return { count: 100, rounds: 3 };
  if (profile === 'stress') return { count: 10000, rounds: 3 };
  return { count: 1000, rounds: 3 };
}

function setBenchmarkRunning(running) {
  benchmarkButton.disabled = running;
  cancelButton.hidden = !running;
  document.querySelector('#qishuo-benchmark-profile').disabled = running;
}

function ensureWorker() {
  if (benchmarkWorker) return benchmarkWorker;
  benchmarkWorker = new Worker(new URL('./qishuo-worker.js',import.meta.url), { type: 'module' });
  benchmarkWorker.addEventListener('message', event => {
    if (!event.data || event.data.runId !== activeRunId) return;
    if (event.data.type === 'progress') {
      benchmarkProgress.value = event.data.completed / event.data.total;
      const kind = event.data.kind === 'qi' ? '定气' : '定朔';
      benchmarkStatus.textContent = `${kind} · 第 ${event.data.round} 轮 · ${Math.round(benchmarkProgress.value * 100)}%`;
      return;
    }
    if (event.data.type === 'result') {
      setBenchmarkRunning(false);
      benchmarkProgress.value = 1;
      benchmarkStatus.textContent = `完成：每项 ${event.data.count.toLocaleString()} 次 × ${event.data.rounds} 轮，中位数计分`;
      benchmarkResults.hidden = false;
      benchmarkResults.innerHTML = `
        <article><small>气朔综合分</small><strong>${event.data.score.toLocaleString()}</strong><span>几何平均 events/s</span></article>
        <article><small>定气</small><strong>${Math.round(event.data.qi.eventsPerSecond).toLocaleString()} <em>/s</em></strong><span>${event.data.qi.medianMs.toFixed(1)} ms / ${event.data.count.toLocaleString()} · 全年约 ${event.data.qi.annualMs.toFixed(2)} ms</span></article>
        <article><small>定朔</small><strong>${Math.round(event.data.shuo.eventsPerSecond).toLocaleString()} <em>/s</em></strong><span>${event.data.shuo.medianMs.toFixed(1)} ms / ${event.data.count.toLocaleString()} · 全年约 ${event.data.shuo.annualMs.toFixed(2)} ms</span></article>`;
      activeRunId = null;
      return;
    }
    if (event.data.type === 'cancelled') {
      setBenchmarkRunning(false);
      benchmarkStatus.textContent = '跑分已取消。';
      activeRunId = null;
      return;
    }
    if (event.data.type === 'error') {
      setBenchmarkRunning(false);
      benchmarkStatus.textContent = `跑分失败：${event.data.message}`;
      activeRunId = null;
    }
  });
  return benchmarkWorker;
}

benchmarkButton.addEventListener('click', () => {
  const year = Number(form.elements.year.value);
  if (!Number.isInteger(year) || year < QI_SHUO_INFO.rangeStartYear || year > QI_SHUO_INFO.rangeEndYear) {
    showError(`请先输入 ${QI_SHUO_INFO.rangeStartYear}～${QI_SHUO_INFO.rangeEndYear} 的整数年份。`);
    return;
  }
  const profile = benchmarkProfile();
  activeRunId = `${Date.now()}-${Math.random()}`;
  benchmarkProgress.value = 0;
  benchmarkResults.hidden = true;
  benchmarkStatus.textContent = '正在预热计算内核…';
  setBenchmarkRunning(true);
  ensureWorker().postMessage({ type: 'benchmark', runId: activeRunId, year, ...profile });
});

cancelButton.addEventListener('click', () => {
  if (benchmarkWorker && activeRunId) benchmarkWorker.postMessage({ type: 'cancel', runId: activeRunId });
});

form.elements.year.value = String(new Date().getFullYear());
try {
  calculate();
} catch (error) {
  showError(error?.message || String(error));
}

document.documentElement.dataset.toolReady="true";
window.parent.postMessage({type:"tool-ready"},location.origin);
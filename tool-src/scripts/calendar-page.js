await (window.redsc1LocaleReady ?? Promise.resolve());
import { calendarCellLabel, dateKey, lunarDateName, monthTermLabel, shiftedMonth, todayAtOffset, WEEKDAYS } from './calendar-display.js';
import { setupLocationPicker } from './location-picker.js?v=20260829-observer-v1';

const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const detectedOffsetMinutes = -new Date().getTimezoneOffset();
const systemOffsetMinutes = Number.isInteger(detectedOffsetMinutes) && Math.abs(detectedOffsetMinutes) <= 14 * 60
  ? detectedOffsetMinutes : 480;
const options = {
  utcOffsetMinutes: systemOffsetMinutes, mode: 'historical', festivalMode: 'all', activityScope: 'common', eventAccuracy: 'mid', hour: 12,
  longitudeDeg: 116.4074, latitudeDeg: 39.9042,
};
let selected = todayAtOffset(options.utcOffsetMinutes);
let displayed = { year: selected.year, month: selected.month };
let monthData, generation = 0, skyGeneration = 0, observerName = '北京';
let yearPageStart = Math.max(-5999, Math.min(9990, Math.floor(displayed.year / 10) * 10));
const worker = new Worker(new URL('./calendar-worker.js?v=20260831-vendor-clean-v1', import.meta.url), { type: 'module' });
const pending = new Map();
let workerFailure = null;
worker.addEventListener('message', ({ data }) => {
  const request = pending.get(data.id);
  if (!request) return;
  pending.delete(data.id);
  data.error ? request.reject(new Error(data.error)) : request.resolve(data.result);
});
worker.addEventListener('error', () => {
  workerFailure = new Error('历算模块加载失败，请刷新页面重试。');
  for (const request of pending.values()) request.reject(workerFailure);
  pending.clear();
  $('workspace').setAttribute('aria-busy', 'false');
  $('notice').classList.add('error');
  $('notice').textContent = workerFailure.message;
});
function requestMonth(id, year, month) {
  if (workerFailure) return Promise.reject(workerFailure);
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, year, month, options: { ...options } });
  });
}
function requestSky(id, date) {
  if (workerFailure) return Promise.reject(workerFailure);
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, type: 'sky', date, options: { ...options } });
  });
}
const yearNames = '零一二三四五六七八九';
const chineseYear = year => (year < 0 ? '前' : '') + String(Math.abs(year)).split('').map(n => yearNames[n]).join('');
const tags = (items, cls = '') => items.length ? items.map(name => `<span class="${cls}">${escape(name)}</span>`).join('') : '<span class="none">无</span>';
const altitudeStateName = state => ({ 'always-above': '整日可见', 'always-below': '整日不见', tangent: '掠过地平', 'not-found': '无结果' }[state] ?? '—');
const skyCard = (label, value, note, kind = '') => `<article class="sky-item ${kind}"><span>${escape(label)}</span><strong>${escape(value ?? '—')}</strong><small>${escape(note ?? '')}</small></article>`;
const offsetText = minutes => {
  const sign = minutes < 0 ? '−' : '+';
  const absolute = Math.abs(minutes);
  return `UTC${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
};

function setTimezoneMode(mode, refreshCalendar = false) {
  $('timezone-mode').value = mode;
  $('timezone-custom-field').hidden = mode !== 'custom';
  if (mode === 'local') options.utcOffsetMinutes = systemOffsetMinutes;
  else if (mode === 'china') options.utcOffsetMinutes = 480;
  else {
    const hours = Number($('timezone-custom').value);
    if (!Number.isFinite(hours) || hours < -12 || hours > 14) return;
    options.utcOffsetMinutes = Math.round(hours * 60);
  }
  if (refreshCalendar) void refresh();
}

function renderSky(data) {
  const sunFallback = altitudeStateName(data.sun.altitudeState), moonFallback = altitudeStateName(data.moon.altitudeState);
  $('observer-label').textContent = `${observerName} · ${Math.abs(options.longitudeDeg).toFixed(2)}°${options.longitudeDeg < 0 ? 'W' : 'E'} / ${Math.abs(options.latitudeDeg).toFixed(2)}°${options.latitudeDeg < 0 ? 'S' : 'N'}`;
  $('sky-grid').innerHTML = [
    skyCard('日出', data.sun.rise ?? sunFallback, '太阳上缘', 'sun'),
    skyCard('日落', data.sun.set ?? sunFallback, '太阳上缘', 'sun'),
    skyCard('日中', data.sun.transit, '上中天', 'sun'),
    skyCard('昼长', data.sun.daylight, '日出至日落', 'sun'),
    skyCard('月出', data.moon.rise ?? moonFallback, '月球上缘', 'moon'),
    skyCard('月落', data.moon.set ?? moonFallback, '月球上缘', 'moon'),
    skyCard('今日月相', data.moon.phaseName, data.moon.waxing ? '渐盈' : '渐亏', 'moon'),
    skyCard('月面照明', `${data.moon.illuminatedPercent.toFixed(1)}%`, `日月距 ${data.moon.elongationDeg.toFixed(1)}°`, 'moon'),
    skyCard('太阳星座', `${data.sun.zodiac.symbol} ${data.sun.zodiac.name}`, `黄经 ${data.sun.zodiac.longitudeDeg.toFixed(1)}°`, 'zodiac'),
    skyCard('月亮星座', `${data.moon.zodiac.symbol} ${data.moon.zodiac.name}`, `黄经 ${data.moon.zodiac.longitudeDeg.toFixed(1)}°`, 'zodiac'),
    skyCard('月龄', `${data.moon.ageDays.toFixed(1)} 天`, '朔后估算', 'moon'),
    skyCard('月球中天', data.moon.transit, '上中天', 'moon'),
  ].join('');
}

async function refreshSky(date) {
  const request = ++skyGeneration, key = dateKey(date);
  $('sky-grid').setAttribute('aria-busy', 'true');
  $('sky-grid').innerHTML = '<p class="sky-loading">正在推算日月升落与月相…</p>';
  try {
    const data = await requestSky(`sky-${request}`, date);
    if (request !== skyGeneration || key !== dateKey(selected)) return;
    renderSky(data);
  } catch (error) {
    if (request !== skyGeneration) return;
    $('sky-grid').innerHTML = `<p class="sky-loading error">无法计算今日天象：${escape(error.message)}</p>`;
  } finally {
    if (request === skyGeneration) $('sky-grid').setAttribute('aria-busy', 'false');
  }
}

$('month-options').innerHTML = Array.from({ length: 12 }, (_, i) => `<button type="button" data-month="${i + 1}">${i + 1} 月</button>`).join('');
$('query-hour').innerHTML = Array.from({ length: 24 }, (_, h) => `<option value="${h}" ${h === 12 ? 'selected' : ''}>${pad(h)}:00</option>`).join('');
$('timezone-mode').options[0].textContent = `本机时区（${offsetText(systemOffsetMinutes)}）`;
$('timezone-custom').value = String(systemOffsetMinutes / 60);
setTimezoneMode('local');

function renderYearOptions() {
  const years = Array.from({ length: 10 }, (_, i) => yearPageStart + i).filter(year => year >= -5999 && year <= 9999);
  $('year-range-label').textContent = `${years[0]} — ${years.at(-1)}`;
  $('year-options').innerHTML = years.map(year => `<button type="button" data-year="${year}" class="${year === displayed.year ? 'active' : ''}" aria-pressed="${year === displayed.year}">${year}</button>`).join('');
  $('year-range-previous').disabled = yearPageStart <= -5999;
  $('year-range-next').disabled = yearPageStart + 10 > 9999;
}

function closeDatePickers(except = null) {
  for (const name of ['year', 'month']) {
    if (name === except) continue;
    $(`${name}-picker`).hidden = true;
    $(`${name}-picker-trigger`).setAttribute('aria-expanded', 'false');
  }
}

function toggleDatePicker(name) {
  const picker = $(`${name}-picker`), open = picker.hidden;
  closeDatePickers(open ? name : null);
  picker.hidden = !open;
  $(`${name}-picker-trigger`).setAttribute('aria-expanded', String(open));
  if (open) {
    if (name === 'year') renderYearOptions();
    picker.querySelector('input')?.focus({ preventScroll: true });
  }
}

function chooseDisplayedDate(year, month) {
  if (!Number.isInteger(year) || year < -5999 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) return;
  displayed = { year, month };
  closeDatePickers();
  void refresh();
}

$('year-picker-trigger').addEventListener('click', () => toggleDatePicker('year'));
$('month-picker-trigger').addEventListener('click', () => toggleDatePicker('month'));
$('year-range-previous').addEventListener('click', () => { yearPageStart = Math.max(-5999, yearPageStart - 10); renderYearOptions(); });
$('year-range-next').addEventListener('click', () => { yearPageStart = Math.min(9990, yearPageStart + 10); renderYearOptions(); });
$('year-options').addEventListener('click', event => {
  const button = event.target.closest('button[data-year]');
  if (button) chooseDisplayedDate(Number(button.dataset.year), displayed.month);
});
$('month-options').addEventListener('click', event => {
  const button = event.target.closest('button[data-month]');
  if (button) chooseDisplayedDate(displayed.year, Number(button.dataset.month));
});
document.addEventListener('click', event => { if (!event.target.closest('.date-picker-field')) closeDatePickers(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDatePickers(); });

function renderGrid() {
  const today = dateKey(todayAtOffset(options.utcOffsetMinutes));
  $('calendar-grid').innerHTML = monthData.cells.map(day => {
    if (!day) return '<div class="empty-cell"></div>';
    const d = day.solarDate, key = dateKey(d), current = key === dateKey(selected);
    const label = calendarCellLabel(day);
    const aria = `${d.year}年${d.month}月${d.day}日，${lunarDateName(day.lunarDate)}${day.festivals.length ? '，' + day.festivals.join('、') : ''}${day.solarTerm ? '，' + day.solarTerm.name : ''}`;
    return `<button type="button" class="date-cell ${d.month !== displayed.month || d.year !== displayed.year ? 'outside' : ''} ${day.weekday > 5 ? 'weekend' : ''} ${current ? 'selected' : ''}" data-date="${key}" aria-label="${escape(aria)}" aria-pressed="${current}" ${key === today ? 'aria-current="date"' : ''}><span class="solar-number">${d.day}</span><span class="lunar-label ${label.kind}">${escape(label.text)}</span><span class="day-pillar">${day.pillarNames.day}</span>${key === today ? '<span class="today-mark">今</span>' : ''}</button>`;
  }).join('');
}

function renderDay(day) {
  const d = day.solarDate;
  $('selected-day').textContent = d.day;
  $('selected-solar').textContent = `${d.year} 年 ${pad(d.month)} 月`;
  $('selected-lunar').textContent = lunarDateName(day.lunarDate);
  $('cover-weekday').textContent = `星期${WEEKDAYS[day.weekday - 1]}`;
  $('selected-festivals').innerHTML = [...day.festivals, ...(day.solarTerm ? [day.solarTerm.name] : [])].map(name => `<span>${escape(name)}</span>`).join('');
  $('day-status').innerHTML = tags([`${day.officer}日`, `${day.dutyGod.name} · ${day.dutyGod.isHuangDao ? '黄道' : '黑道'}`, `冲${day.chongSha.animal} · 煞${day.chongSha.direction}`, ...(day.flags.isTuWangYongShi ? ['土王用事'] : []), ...(day.flags.isSiJue ? ['四绝日'] : []), ...(day.flags.isSiLi ? ['四离日'] : [])]);
  $('suitable').textContent = day.suitableActivities.join(' · ') || '无';
  $('taboo').textContent = day.tabooActivities.join(' · ') || '无';
  $('good-gods').innerHTML = tags(day.auspiciousGods);
  $('bad-gods').innerHTML = tags(day.inauspiciousGods);
  $('god-count').textContent = `${day.auspiciousGods.length} 吉神 / ${day.inauspiciousGods.length} 凶煞`;
  $('directions').innerHTML = Object.entries(day.godDirections).map(([name, value]) => `<div class="direction"><small>${escape(name)}</small><span>${escape(value)}</span></div>`).join('');
  $('flying-board').innerHTML = day.flyingStars.day.map(n => `<span><b>${n}</b></span>`).join('');
  $('flying-period').textContent = `${day.cycle} · ${day.period} 运`;
  $('facts-date').textContent = `${d.year}.${pad(d.month)}.${pad(d.day)}`;
  $('pillar-row').innerHTML = ['year', 'month', 'day'].map((key, i) => `<div class="pillar-item"><span>${['年柱', '月柱', '日柱'][i]}</span><strong>${day.pillarNames[key]}</strong></div>`).join('');
  const facts = [['廿八宿', `${day.mansion.fullName} · ${day.mansion.direction}`], ['胎神', day.taiShen], ['彭祖百忌', day.pengZu], ['规则日期', `${dateKey(day.ruleDate)} · ${lunarDateName(day.ruleLunarDate)}${dateKey(day.ruleDate) !== dateKey(day.solarDate) ? '（晚子时换日）' : ''}`]];
  $('detail-facts').innerHTML = facts.map(([name, value], i) => `<div class="${i > 1 ? 'wide' : ''}"><span class="fact-label">${name}</span>${escape(value)}</div>`).join('');
  void refreshSky(d);
  document.title = `${d.year}年${d.month}月${d.day}日 · 万年历 | RedSC1`;
}

async function refresh() {
  const request = ++generation;
  $('workspace').setAttribute('aria-busy', 'true');
  $('notice').classList.remove('error');
  // Keep routine month changes layout-stable. A temporary status line here
  // pushes the whole workspace down for two frames and then pulls it back up.
  $('notice').textContent = '';
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  if (request !== generation) return;
  try {
    const result = await requestMonth(request, displayed.year, displayed.month);
    if (request !== generation) return;
    monthData = result;
    const day = monthData.days.find(day => day.solarDate.day >= selected.day) ?? monthData.days.at(-1);
    selected = { year: day.solarDate.year, month: day.solarDate.month, day: day.solarDate.day };
    $('month-title').innerHTML = `${displayed.month} 月<small>${displayed.year}</small>`;
    $('year-caption').textContent = `${chineseYear(displayed.year)}年 · ${day.pillarNames.year}年`;
    $('year-input').value = displayed.year;
    $('month-input').value = displayed.month;
    $('year-picker-value').textContent = displayed.year;
    $('month-picker-value').textContent = displayed.month;
    yearPageStart = Math.max(-5999, Math.min(9990, Math.floor(displayed.year / 10) * 10));
    renderYearOptions();
    for (const button of $('month-options').querySelectorAll('button[data-month]')) {
      const active = Number(button.dataset.month) === displayed.month;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    $('month-terms').textContent = `节气 · ${monthData.terms.map(monthTermLabel).join('  /  ')}`;
    $('month-phases').textContent = `月相 · ${monthData.phases.map(({ name, localTime }) => `${name} ${pad(localTime.month)}.${pad(localTime.day)} ${pad(localTime.hour)}:${pad(localTime.minute)}`).join('  /  ')}`;
    $('previous-month').disabled = !shiftedMonth(displayed.year, displayed.month, -1);
    $('next-month').disabled = !shiftedMonth(displayed.year, displayed.month, 1);
    $('previous-year').disabled = !shiftedMonth(displayed.year, displayed.month, -12);
    $('next-year').disabled = !shiftedMonth(displayed.year, displayed.month, 12);
    const offset = options.utcOffsetMinutes;
    const accuracyText = { fast: '快速', mid: '均衡', accurate: '严谨' }[options.eventAccuracy];
    $('footer-settings').textContent = `${offsetText(offset)} · ${$('calendar-mode').selectedOptions[0].textContent} · 定朔${accuracyText} · ${pad(options.hour)}:00`;
    renderGrid(); renderDay(day);
    $('notice').textContent = '';
  } catch (error) {
    if (request !== generation) return;
    $('notice').classList.add('error');
    $('notice').textContent = `无法显示该日期：${error.message}`;
  } finally { if (request === generation) $('workspace').setAttribute('aria-busy', 'false'); }
}

$('calendar-grid').addEventListener('click', event => {
  const button = event.target.closest('button[data-date]');
  if (!button || $('workspace').getAttribute('aria-busy') === 'true') return;
  const [year, month, day] = button.dataset.date.split('/').map(Number);
  selected = { year, month, day };
  if (year !== displayed.year || month !== displayed.month) { displayed = { year, month }; refresh(); }
  else {
    const d = monthData.days.find(d => d.solarDate.day === day);
    renderGrid(); renderDay(d);
    $('calendar-grid').querySelector(`[data-date="${dateKey(selected)}"]`)?.focus({ preventScroll: true });
  }
});
function moveMonth(delta) {
  const next = shiftedMonth(displayed.year, displayed.month, delta);
  if (next) { displayed = next; refresh(); }
}
$('previous-month').addEventListener('click', () => moveMonth(-1));
$('next-month').addEventListener('click', () => moveMonth(1));
$('previous-year').addEventListener('click', () => moveMonth(-12));
$('next-year').addEventListener('click', () => moveMonth(12));
$('today').addEventListener('click', () => { selected = todayAtOffset(options.utcOffsetMinutes); displayed = { year: selected.year, month: selected.month }; refresh(); });
$('jump-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!$('jump-form').reportValidity()) return;
  chooseDisplayedDate(Number($('year-input').value), Number($('month-input').value));
});
$('settings-toggle').addEventListener('click', () => {
  const open = $('settings').hidden;
  $('settings').hidden = !open;
  $('settings-toggle').setAttribute('aria-expanded', String(open));
});
for (const [id, key, convert] of [['calendar-mode', 'mode', String], ['festival-mode', 'festivalMode', String], ['event-accuracy', 'eventAccuracy', String], ['activity-scope', 'activityScope', String], ['query-hour', 'hour', Number]]) {
  $(id).addEventListener('change', () => { options[key] = convert($(id).value); refresh(); });
}
$('timezone-mode').addEventListener('change', () => setTimezoneMode($('timezone-mode').value, true));
$('timezone-custom').addEventListener('change', () => {
  if (!$('timezone-custom').reportValidity()) return;
  setTimezoneMode('custom', true);
});
for (const [id, key] of [['longitude', 'longitudeDeg'], ['latitude', 'latitudeDeg']]) {
  $(id).addEventListener('change', () => {
    if (!$(id).reportValidity()) return;
    options[key] = Number($(id).value);
    observerName = '自定义位置';
    $('location').value = observerName;
    void refreshSky(selected);
  });
}
setupLocationPicker({
  form: $('settings'),
  trigger: document.querySelector('[data-location-picker]'),
  title: '选择国内观测地',
  onSelect(place, path) {
    options.longitudeDeg = place.longitude;
    options.latitudeDeg = place.latitude;
    $('timezone-custom').value = String(place.utcOffsetMinutes / 60);
    setTimezoneMode(place.utcOffsetMinutes === 480 ? 'china' : 'custom');
    observerName = path.map(item => item.name).filter((name, index, all) => name !== all[index - 1]).join(' · ');
    void refresh();
  },
});
$('use-device-location').addEventListener('click', () => {
  const button = $('use-device-location');
  if (!navigator.geolocation) { $('notice').textContent = '当前浏览器不支持读取设备位置。'; return; }
  button.disabled = true; button.textContent = '正在读取位置…';
  navigator.geolocation.getCurrentPosition(position => {
    options.longitudeDeg = position.coords.longitude;
    options.latitudeDeg = position.coords.latitude;
    $('longitude').value = options.longitudeDeg.toFixed(4);
    $('latitude').value = options.latitudeDeg.toFixed(4);
    $('location').value = '设备位置';
    observerName = '设备位置';
    $('notice').textContent = '';
    button.disabled = false; button.textContent = '重新读取设备位置';
    void refreshSky(selected);
  }, error => {
    $('notice').textContent = `无法读取设备位置：${error.message}`;
    button.disabled = false; button.textContent = '使用设备位置';
  }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
});
refresh();

window.parent.postMessage({type:"tool-ready"},location.origin);
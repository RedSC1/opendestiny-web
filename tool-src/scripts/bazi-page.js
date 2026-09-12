import {setupChartWorkspace} from '/shared/chart-workspace.js';
import {restoreChart} from '/shared/chart-bridge.js';
import {resolveCalendarBoundary,setupHistoricalUtcLock,setupLocalCalendarBoundary} from '/shared/calendar-boundary.js';
await (window.redsc1LocaleReady ?? Promise.resolve());
import { captureChartProfile, setupChartJsonExport } from '/scripts/chart-json-export.js?v=1';
import { birthHourShiftMinutes } from '/scripts/birth-time-step.js?v=1';
import { setupLocationPicker } from '/scripts/location-picker.js';
import { setupBaziReverseLookup } from '/scripts/reverse-lookup-ui.js?v=20260831-vendor-clean-v1';

import {
  BAZI_CLOCK_MODE, BaziChart, BaziOptions, CALENDAR_MODE,
  DAYUN_BOUNDARY_MODEL, EARTHLY_BRANCHES, EARTH_PALACE_MODE,
  GENDER, HEAVENLY_STEMS, LIFE_STAGE_NAMES, MONTH_NAME, QIYUN_TIME_MODEL,
  PILLAR_HISTORICAL_MODE, RENYUAN_SILING_ORIGIN, RENYUAN_SILING_TABLE, SHEN_SHA_TARGET,
  TEN_GOD_NAMES, ZonedTime, calculateFlowDay, calculateFlowHour,
  calculateFlowMonth, calculateFlowYear, calculateXiaoYun,
  calendarDateFromJulianDay, getHiddenStems, getKongWang, getLifeStage,
  getNayinId, getPreviousJie, getSpecificSolarTerm, getTenGod,
  instantToLunar, lunarToSolar, selectRenyuanSiling, shenShaNames, solarToLunar,
  unpackPillar,
 julianDay, JulianTime } from '/vendor/opendestiny-bazi.js?v=20260831-vendor-clean-v1';

const NAYIN_NAMES = [
  '海中金','炉中火','大林木','路旁土','剑锋金','山头火','涧下水','城头土','白蜡金','杨柳木',
  '泉中水','屋上土','霹雳火','松柏木','长流水','砂中金','山下火','平地木','壁上土','金箔金',
  '覆灯火','天河水','大驿土','钗钏金','桑柘木','大溪水','沙中土','天上火','石榴木','大海水',
];
const LUNAR_MONTHS = ['正','二','三','四','五','六','七','八','九','十','冬','腊','十三'];
const WATERMARK_MONTHS = ['正','二','三','四','五','六','七','八','九','十','十一','十二'];
const LUNAR_DAYS = [
  '初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十',
];
const PILLAR_LABELS = { year: '年柱', month: '月柱', day: '日元', hour: '时柱' };
const EXTRA_DEFINITIONS = [
  ['taiYuan','胎元',SHEN_SHA_TARGET.TAI_YUAN],
  ['taiXi','胎息',SHEN_SHA_TARGET.TAI_XI],
  ['mingGong','命宫',SHEN_SHA_TARGET.MING_GONG],
  ['shenGong','身宫',SHEN_SHA_TARGET.SHEN_GONG],
];
const MONTH_JIE_INDICES = [21, 23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
const HOUR_NAMES = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];

const form = document.querySelector('#bazi-form');
setupLocalCalendarBoundary(form);
const syncHistoricalUtcOffset=setupHistoricalUtcLock(form);
const app = document.querySelector('#bazi-app');
const errorBox = document.querySelector('#bazi-error');
const pillarBoard = document.querySelector('#pillar-board');
const workspace = document.querySelector('.bazi-workspace');
const inputToggle = document.querySelector('#bazi-input-toggle');
const birthReset = document.querySelector('#bazi-birth-reset');
setupLocationPicker({ form, trigger: document.querySelector('[data-location-picker]') });
let lastChart = null;
let lastContext = null;
let exportProfile = null;
const exportButton = document.querySelector('#bazi-export-json');
setupChartJsonExport({ trigger: exportButton, getSnapshot: () => (
  lastChart && exportProfile && !exportButton.disabled ? { ...lastChart.toJSON(), profile: exportProfile } : null
) });
let currentTemporal = null;
let activeTab = 'luck';
let selected = freshSelection();
let baseBirthInput = null;
let birthOffsetMinutes = 0;
let birthPanelScrollY = 0;

function freshSelection() {
  return { decade: null, year: null, month: null, day: null, hour: null };
}

function getCurrentTemporal(options) {
  const instant = new Date();
  const local = new Date(instant.getTime() + options.utcOffsetMinutes * 60000);
  const civil = {
    year: local.getUTCFullYear(), month: local.getUTCMonth() + 1, day: local.getUTCDate(),
    hour: local.getUTCHours(), minute: local.getUTCMinutes(), second: local.getUTCSeconds(),
  };
  const chart = BaziChart.fromZonedTime(new ZonedTime({ ...civil, offsetMinutes: options.utcOffsetMinutes }),options);
  return {
    civil,
    pillars: {
      year: chart.columns[0].value,
      month: chart.columns[1].value,
      day: chart.columns[2].value,
      hour: chart.columns[3].value,
    },
  };
}

function element(name, className, text) {
  const node = document.createElement(name);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function intValue(data, name) {
  const value = Number(data.get(name));
  if (!Number.isInteger(value)) throw new RangeError(`${name} 必须是整数`);
  return value;
}

function readUtcOffset(data) {
  const sign = data.get('offsetSign') === '-1' ? -1 : 1;
  const hour = intValue(data,'offsetHour');
  const minute = intValue(data,'offsetMinute');
  if (hour < 0 || hour > 14 || minute < 0 || minute > 59) throw new RangeError('UTC 偏移格式无效');
  const total = sign * (hour * 60 + minute);
  if (total < -720 || total > 840) throw new RangeError('固定 UTC 偏移须在 UTC−12:00～UTC+14:00 之间');
  return total;
}

function offsetLabel(minutes) {
  const sign = minutes >= 0 ? '+' : '−';
  const absolute = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2,'0')}:${String(absolute % 60).padStart(2,'0')}`;
}

function pad(value, width = 2) {
  return String(Math.trunc(Math.abs(value))).padStart(width, '0');
}

function formatYear(year) {
  return year > 0 ? `${year}年` : `公元前${1 - year}年`;
}

function formatDateTime(value, includeSeconds = true) {
  const seconds = Math.round(value.second ?? 0);
  return `${formatYear(value.year)}${value.month}月${value.day}日 ${pad(value.hour)}:${pad(value.minute)}${includeSeconds ? `:${pad(seconds)}` : ''}`;
}

function lunarMonthLabel(value) {
  if (value.monthName === MONTH_NAME.THIRTEEN) return '十三月';
  if (value.monthName === MONTH_NAME.LATER_NINE) return '后九月';
  if (value.monthName === MONTH_NAME.ALT_TWELVE) return '拾贰月';
  if (value.monthName === MONTH_NAME.ALT_ONE) return '一月';
  const base = LUNAR_MONTHS[value.month - 1] ?? value.month;
  if (value.monthName === MONTH_NAME.LATER_SAME_NAME) {
    return `${WATERMARK_MONTHS[value.month - 1] ?? value.month}月`;
  }
  return `${value.isLeap ? '闰' : ''}${base}月`;
}

function formatLunar(value) {
  return `${formatYear(value.year)} ${lunarMonthLabel(value)}${LUNAR_DAYS[value.day - 1] ?? value.day}`;
}

function lunarMonthIdentity(kind) {
  return {
    normal:{ isLeap:false, monthName:MONTH_NAME.NORMAL },
    leap:{ isLeap:true, monthName:MONTH_NAME.NORMAL },
    'later-nine':{ isLeap:true, monthName:MONTH_NAME.LATER_NINE, fixedMonth:9 },
    thirteen:{ isLeap:true, monthName:MONTH_NAME.THIRTEEN, fixedMonth:13 },
    'alt-twelve':{ isLeap:false, monthName:MONTH_NAME.ALT_TWELVE, fixedMonth:12 },
    'alt-one':{ isLeap:false, monthName:MONTH_NAME.ALT_ONE, fixedMonth:1 },
    'later-same':{ isLeap:false, monthName:MONTH_NAME.LATER_SAME_NAME },
  }[kind] ?? { isLeap:false, monthName:MONTH_NAME.NORMAL };
}

function lunarMonthKind(value) {
  if (value.monthName === MONTH_NAME.THIRTEEN) return 'thirteen';
  if (value.monthName === MONTH_NAME.LATER_NINE) return 'later-nine';
  if (value.monthName === MONTH_NAME.ALT_TWELVE) return 'alt-twelve';
  if (value.monthName === MONTH_NAME.ALT_ONE) return 'alt-one';
  if (value.monthName === MONTH_NAME.LATER_SAME_NAME) return 'later-same';
  return value.isLeap ? 'leap' : 'normal';
}

function applyLunarMonthKindToControls(kind) {
  const leapToggle = form.elements.lunarLeapToggle;
  const specialToggle = form.elements.lunarSpecialToggle;
  const specialName = form.elements.lunarSpecialName;
  const special = kind !== 'normal' && kind !== 'leap';
  leapToggle.checked = kind === 'leap';
  specialToggle.checked = special;
  if (special) specialName.value = kind;
  specialName.disabled = !special;
  form.elements.lunarMonthKind.value = kind;
}

function syncLunarMonthControls(event) {
  const leapToggle = form.elements.lunarLeapToggle;
  const specialToggle = form.elements.lunarSpecialToggle;
  const specialName = form.elements.lunarSpecialName;
  const target = event?.target;
  const isControlChange = target === leapToggle || target === specialToggle || target === specialName;
  if (!isControlChange) {
    applyLunarMonthKindToControls(form.elements.lunarMonthKind.value || 'normal');
  } else {
    if (target === leapToggle && leapToggle.checked) specialToggle.checked = false;
    if (target === specialToggle && specialToggle.checked) leapToggle.checked = false;
    const kind = specialToggle.checked ? specialName.value : (leapToggle.checked ? 'leap' : 'normal');
    applyLunarMonthKindToControls(kind);
  }
  const identity = lunarMonthIdentity(form.elements.lunarMonthKind.value);
  if (identity.fixedMonth) form.elements.month.value = String(identity.fixedMonth);
}

function elementClass(value) {
  if ('甲乙寅卯'.includes(value)) return 'wood';
  if ('丙丁巳午'.includes(value)) return 'fire';
  if ('戊己辰戌丑未'.includes(value)) return 'earth';
  if ('庚辛申酉'.includes(value)) return 'metal';
  return 'water';
}

function optionValues(data) {
  const clockMode = String(data.get('clockMode'));
  const calendarMode = String(data.get('calendarMode'));
  const pillarHistoricalMode = String(data.get('pillarHistoricalMode'));
  const longitude = Number(data.get('longitude'));
  const calendarBoundary = resolveCalendarBoundary(calendarMode,String(data.get('calendarDayBoundary')),data.get('longitude'));
  const utcOffsetMinutes = calendarMode === CALENDAR_MODE.HISTORICAL || pillarHistoricalMode === PILLAR_HISTORICAL_MODE.ON ? 480 : readUtcOffset(data);
  const qiyun = {
    'traditional-calendar': QIYUN_TIME_MODEL.TRADITIONAL_CALENDAR,
    'julian-year': QIYUN_TIME_MODEL.JULIAN_YEAR,
    'tropical-year': QIYUN_TIME_MODEL.TROPICAL_YEAR,
  }[String(data.get('qiyunModel'))];
  const boundary = {
    'civil-years': DAYUN_BOUNDARY_MODEL.CIVIL_YEARS,
    'fixed-days': DAYUN_BOUNDARY_MODEL.JULIAN_YEARS,
    'tropical-years': DAYUN_BOUNDARY_MODEL.TROPICAL_YEARS,
  }[String(data.get('dayunBoundary'))];
  return new BaziOptions({
    mode: calendarMode,
    utcOffsetMinutes,
    ...calendarBoundary,
    pillarHistoricalMode: {
      off: PILLAR_HISTORICAL_MODE.OFF,
      on: PILLAR_HISTORICAL_MODE.ON,
    }[pillarHistoricalMode],
    ratHourMode: String(data.get('ratHourMode')),
    earthPalaceMode: data.get('earthPalace') === 'water-earth' ? EARTH_PALACE_MODE.WATER_EARTH : EARTH_PALACE_MODE.FIRE_EARTH,
    gender: data.get('gender') === 'female' ? GENDER.FEMALE : GENDER.MALE,
    clockMode,
    longitudeDeg: clockMode === BAZI_CLOCK_MODE.CIVIL ? undefined : longitude,
    qiYunTimeModel: qiyun,
    daYunBoundaryModel: boundary,
    daYunCount: 8,
    renyuanSilingTable: data.get('silingTable') === 'commercial' ? RENYUAN_SILING_TABLE.COMMON : RENYUAN_SILING_TABLE.SAN_MING_TONG_HUI,
  });
}

function isGregorianLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function invalidCalendar(detail) {
  return new RangeError(`日历不合法：${detail}`);
}

function validateClockInput(civil) {
  if (civil.year < -6000 || civil.year > 10000) {
    throw invalidCalendar('年份须在天文学纪年 −6000～10000 之间');
  }
  if (civil.hour < 0 || civil.hour > 23 || civil.minute < 0 || civil.minute > 59 || civil.second < 0 || civil.second > 59) {
    throw new RangeError('出生时间无效：时、分、秒超出范围');
  }
}

function validateSolarDate(civil) {
  if (civil.month < 1 || civil.month > 12) throw invalidCalendar('公历月份须在 1～12 之间');
  const monthDays = [31, isGregorianLeapYear(civil.year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maximumDay = monthDays[civil.month - 1];
  if (civil.day < 1 || civil.day > maximumDay) {
    throw invalidCalendar(`公历 ${civil.month} 月只有 ${maximumDay} 天，不能填写 ${civil.day} 日`);
  }
}

function resolveLunarDate(civil, data, options) {
  if (civil.month < 1 || civil.month > 13) throw invalidCalendar('农历月份须在 1～13 之间');
  if (civil.day < 1 || civil.day > 30) throw invalidCalendar('农历日期须在初一至三十之间');
  const identity = lunarMonthIdentity(String(data.get('lunarMonthKind')));
  if (identity.fixedMonth && civil.month !== identity.fixedMonth) {
    throw invalidCalendar(`${lunarMonthLabel({ ...civil, ...identity })}的月份数字必须填写 ${identity.fixedMonth}`);
  }
  const calendarOptions = options.toFourPillarsOptions();
  const lunar = { ...civil, ...identity };
  try {
    return lunarToSolar(lunar, calendarOptions);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('outside the month')) {
      try {
        const firstSolar = lunarToSolar({ ...lunar, day:1 }, calendarOptions);
        const resolved = solarToLunar(firstSolar, calendarOptions);
        throw invalidCalendar(`农历${lunarMonthLabel(lunar)}只有 ${resolved.monthDays} 天，不能填写 ${civil.day} 日`);
      } catch (detailError) {
        if (detailError instanceof RangeError && detailError.message.startsWith('日历不合法：')) throw detailError;
      }
    }
    throw invalidCalendar(`${formatYear(civil.year)}不存在所填写的${lunarMonthLabel(lunar)}`);
  }
}

function readContext() {
  const data = new FormData(form);
  const options = optionValues(data);
  const civil = {
    year:intValue(data,'year'), month:intValue(data,'month'), day:intValue(data,'day'),
    hour:intValue(data,'hour'), minute:intValue(data,'minute'), second:intValue(data,'second'),
  };
  validateClockInput(civil);
  let solarDate = { year:civil.year, month:civil.month, day:civil.day };
  if (data.get('inputCalendar') === 'lunar') {
    solarDate = resolveLunarDate(civil, data, options);
  } else {
    validateSolarDate(civil);
  }
  const source = new ZonedTime({
    ...solarDate,
    hour:civil.hour, minute:civil.minute, second:civil.second,
    offsetMinutes: options.utcOffsetMinutes,
  });
  return {
    data, options, source, solarDate,
    name: String(data.get('name') || '').trim() || '未命名命盘',
    location: String(data.get('location') || '').trim() || '未填写地点',
    longitude: Number(data.get('longitude')),
  };
}

function captureBirthInput() {
  return Object.freeze({
    inputCalendar:form.elements.inputCalendar.value,
    lunarMonthKind:form.elements.lunarMonthKind.value,
    year:form.elements.year.value,
    month:form.elements.month.value,
    day:form.elements.day.value,
    hour:form.elements.hour.value,
    minute:form.elements.minute.value,
    second:form.elements.second.value,
  });
}

function restoreBirthInput(value) {
  form.elements.inputCalendar.value = value.inputCalendar;
  form.elements.lunarMonthKind.value = value.lunarMonthKind ?? 'normal';
  for (const name of ['year','month','day','hour','minute','second']) form.elements[name].value = value[name];
  document.querySelector('#lunar-leap-row').hidden = value.inputCalendar !== 'lunar';
  if (value.inputCalendar === 'lunar') syncLunarMonthControls();
}

function setInputCollapsed(collapsed) {
  const wasOpen = document.documentElement.classList.contains('birth-panel-open');
  if (!collapsed && !wasOpen) {
    birthPanelScrollY = window.scrollY;
    document.documentElement.style.setProperty('--birth-panel-scroll-offset',`${-birthPanelScrollY}px`);
  }
  workspace.classList.toggle('input-collapsed',collapsed);
  document.documentElement.classList.toggle('birth-panel-open',!collapsed);
  if (collapsed && wasOpen) {
    document.documentElement.style.removeProperty('--birth-panel-scroll-offset');
    window.scrollTo(0,birthPanelScrollY);
  }
  inputToggle.setAttribute('aria-expanded',String(!collapsed));
  inputToggle.querySelector('span').textContent = collapsed ? '出生与排盘' : '收起设置';
  inputToggle.querySelector('b').textContent = collapsed ? '›' : '‹';
}

function syncBirthToolbar() {
  birthReset.disabled = birthOffsetMinutes === 0;
  birthReset.textContent = birthOffsetMinutes === 0 ? '定盘' : '复原';
}

function shiftedBirthCivil(minutes) {
  const source = lastContext.source;
  const unwrappedMinutes = source.hour * 60 + source.minute + minutes;
  const dayShift = Math.floor(unwrappedMinutes / 1440);
  const minuteOfDay = ((unwrappedMinutes % 1440) + 1440) % 1440;
  // Carry only the date through JD, as Ziwei does. Keep clock fields exact so
  // 23:00 -> 00:00 cannot round down to 23:59:59 and miss the early Zi hour.
  const date = calendarDateFromJulianDay(julianDay({
    year:source.year, month:source.month, day:source.day,
    hour:12, minute:0, second:0,
  }) + dayShift);
  return { year:date.year, month:date.month, day:date.day,
    hour:Math.floor(minuteOfDay / 60), minute:minuteOfDay % 60, second:source.second };
}

function hourShiftMinutes(direction) {
  return birthHourShiftMinutes(direction, lastChart?.birthCivilTime.hour, form.elements.ratHourMode.value);
}

function shiftBirth(minutes) {
  if (!lastContext) return;
  const shifted = shiftedBirthCivil(minutes);
  if (form.elements.inputCalendar.value === 'lunar') {
    const source = new ZonedTime({ ...shifted, offsetMinutes:lastContext.options.utcOffsetMinutes });
    const lunar = instantToLunar(source.toJulianTime(),lastContext.options.toFourPillarsOptions());
    form.elements.year.value = String(lunar.year);
    form.elements.month.value = String(lunar.month);
    form.elements.day.value = String(lunar.day);
    form.elements.lunarMonthKind.value = lunarMonthKind(lunar);
    syncLunarMonthControls();
  } else {
    form.elements.year.value = String(shifted.year);
    form.elements.month.value = String(shifted.month);
    form.elements.day.value = String(shifted.day);
  }
  form.elements.hour.value = String(shifted.hour);
  form.elements.minute.value = String(shifted.minute);
  form.elements.second.value = String(shifted.second);
  birthOffsetMinutes += minutes;
  calculateAndRender(true);
}

function analyzePacked(chart, packed, label, shenSha = []) {
  const decoded = unpackPillar(packed);
  const hiddenStems = getHiddenStems(decoded.branch);
  return {
    ...decoded, value: packed, label,
    visibleTenGod: getTenGod(chart.dayMaster, decoded.stem),
    hiddenStems,
    hiddenTenGods: hiddenStems.map((stem) => getTenGod(chart.dayMaster, stem)),
    lifeStage: getLifeStage(chart.dayMaster, decoded.branch, chart.options.earthPalaceMode),
    selfStage: getLifeStage(decoded.stem, decoded.branch, chart.options.earthPalaceMode),
    nayinId: getNayinId(packed), shenSha,
  };
}

function renderPillar(column, { dayMaster = false, variant = 'natal' } = {}) {
  const article = element('article', `bazi-pillar ${variant}`);
  article.append(element('span','pillar-label',column.label));
  article.append(element('strong','main-ten-god',dayMaster ? '日主' : TEN_GOD_NAMES[column.visibleTenGod]));
  const ganzhi = element('div','pillar-ganzhi');
  ganzhi.append(element('strong',`stem ${elementClass(column.stemName)}`,column.stemName));
  ganzhi.append(element('strong',`branch ${elementClass(column.branchName)}`,column.branchName));
  article.append(ganzhi);

  const hidden = element('div','hidden-stems');
  for (let index = 0; index < 3; index += 1) {
    const stem = column.hiddenStems[index];
    const slot = element('div',`hidden-stem${stem === undefined ? ' empty' : ''}`);
    if (stem === undefined) {
      slot.append(element('span','','—'));
    } else {
      slot.append(element('strong',elementClass(HEAVENLY_STEMS[stem]),HEAVENLY_STEMS[stem]));
      const tenGod = column.hiddenTenGods?.[index] ?? getTenGod(lastChart.dayMaster, stem);
      slot.append(element('span','hidden-ten-god',TEN_GOD_NAMES[tenGod]));
    }
    hidden.append(slot);
  }
  article.append(hidden);

  const details = element('dl','professional-only pillar-details');
  [
    LIFE_STAGE_NAMES[column.lifeStage],
    LIFE_STAGE_NAMES[column.selfStage],
    getKongWang(column.value).map((branch) => EARTHLY_BRANCHES[branch]).join(''),
    NAYIN_NAMES[column.nayinId] ?? '—',
  ].forEach((value) => {
    const row = element('div');
    row.append(element('dd','',value));
    details.append(row);
  });
  article.append(details);

  const shensha = element('div','professional-only shensha-list');
  (column.shenSha?.length ? column.shenSha : ['—']).forEach((name) => shensha.append(element('span','',name)));
  article.append(shensha);
  return article;
}

function selectedFlowColumns() {
  const values = [];
  if (selected.hour) values.push(selected.hour);
  if (selected.day) values.push(selected.day);
  if (selected.month) values.push(selected.month);
  if (selected.year) values.push(selected.year);
  if (selected.decade) values.push(selected.decade);
  return values.slice(0, 5);
}

function alignProfessionalLegend() {
  if (!app.classList.contains('bazi-professional')) return;
  const legend = document.querySelector('.professional-legend');
  const pillar = [...document.querySelectorAll('#pillar-board .bazi-pillar')].find((item) => item.offsetParent !== null);
  if (!legend || !pillar) return;
  const firstRow = pillar.querySelector('.pillar-details > div');
  if (!firstRow) return;
  legend.style.paddingTop = `${firstRow.getBoundingClientRect().top - legend.getBoundingClientRect().top}px`;
}

function scheduleProfessionalLegendAlignment() {
  window.requestAnimationFrame(() => window.requestAnimationFrame(alignProfessionalLegend));
}

function updatePillarBoard() {
  if (!lastChart) return;
  const flowRoot = document.querySelector('#flow-pillars');
  const extraRoot = document.querySelector('#extra-pillars');
  const natalRoot = document.querySelector('#natal-pillars');
  const flowColumns = activeTab === 'luck' ? selectedFlowColumns() : [];
  flowRoot.hidden = activeTab !== 'luck';
  extraRoot.hidden = activeTab !== 'extra';
  flowRoot.replaceChildren(...flowColumns.map((item) => renderPillar(analyzePacked(
    lastChart, item.packed, item.label,
    shenShaNames(lastChart.getTargetShenSha(item.packed, item.target)),
  ), { variant: 'flow' })));
  const leftCount = activeTab === 'extra' ? 4 : flowColumns.length;
  pillarBoard.style.setProperty('--pillar-count', String(leftCount + 4));
  natalRoot.firstElementChild?.classList.toggle('first-natal', leftCount > 0);
  scheduleProfessionalLegendAlignment();
}

function renderPillars(chart) {
  const natal = document.querySelector('#natal-pillars');
  const shensha = chart.getShenSha();
  natal.replaceChildren(...chart.columns.map((column) => renderPillar({
    ...column,
    label: PILLAR_LABELS[column.key],
    hiddenTenGods: column.hiddenStems.map((stem) => getTenGod(chart.dayMaster,stem)),
    selfStage: getLifeStage(column.stem,column.branch,chart.options.earthPalaceMode),
    shenSha: shenShaNames(shensha[column.key]),
  }, { dayMaster: column.key === 'day' })));
  const extra = document.querySelector('#extra-pillars');
  extra.replaceChildren(...EXTRA_DEFINITIONS.map(([key,label,target]) => {
    const value = chart.extraPillars[key];
    return renderPillar(analyzePacked(chart,value,label,shenShaNames(chart.getTargetShenSha(value,target))), { variant: 'extra' });
  }));
  updatePillarBoard();
}

function makeFortuneCard(chart, packed, { top, bottom, current = false } = {}) {
  const decoded = unpackPillar(packed);
  const button = element('button',`fortune-card${current ? ' current' : ''}`);
  button.type = 'button';
  button.append(element('span','fortune-ten-god',TEN_GOD_NAMES[getTenGod(chart.dayMaster,decoded.stem)]));
  button.append(element('strong',elementClass(decoded.stemName),decoded.stemName));
  button.append(element('strong',elementClass(decoded.branchName),decoded.branchName));
  button.append(element('span','fortune-top',top));
  button.append(element('small','',bottom));
  return button;
}

function selectCard(container, card) {
  container.querySelectorAll('.fortune-card').forEach((item) => item.classList.toggle('selected', item === card));
}

function hideLevels(...ids) {
  ids.forEach((id) => { document.querySelector(`#${id}`).hidden = true; });
}

function clearFlowFrom(level) {
  const levels = ['year','month','day','hour'];
  const start = levels.indexOf(level);
  levels.slice(start).forEach((name) => {
    document.querySelector(`#flow-${name}-level`).hidden = true;
    document.querySelector(`#flow-${name}-row`).replaceChildren();
  });
}

function renderFlowYears(chart, qiyun, entry, selectedButton) {
  const container = document.querySelector('#dayun-row');
  if (selectedButton.classList.contains('selected')) {
    selectCard(container,null);
    selected = freshSelection();
    clearFlowFrom('year');
    updatePillarBoard();
    document.querySelector('#fortune-empty').hidden = false;
    return;
  }
  selectCard(container, selectedButton);
  selected = { decade: { packed: entry.pillar, label: '大运', target: SHEN_SHA_TARGET.DA_YUN }, year: null, month: null, day: null, hour: null };
  updatePillarBoard();
  hideLevels('flow-month-level','flow-day-level','flow-hour-level');
  const row = document.querySelector('#flow-year-row');
  const cards = [];
  for (let offset = 0; offset < 10; offset += 1) {
    const year = entry.startCivilTime.year + offset;
    const age = entry.startVirtualAge + offset;
    const packed = calculateFlowYear(year);
    const xiaoYun = calculateXiaoYun(chart,qiyun.direction,age);
    const card = makeFortuneCard(chart,packed,{ top:String(year), bottom:`${age}岁 · ${unpackPillar(xiaoYun).name}`, current:packed === currentTemporal?.pillars.year });
    card.addEventListener('click',() => renderFlowMonths(chart,{ packed, year, age },card));
    cards.push(card);
  }
  row.replaceChildren(...cards);
  document.querySelector('#flow-year-level').hidden = false;
  document.querySelector('#fortune-empty').hidden = true;
}

function renderFlowMonths(chart, yearEntry, selectedButton) {
  const container = document.querySelector('#flow-year-row');
  if (selectedButton.classList.contains('selected')) {
    selectCard(container,null);
    selected.year = selected.month = selected.day = selected.hour = null;
    clearFlowFrom('month');
    updatePillarBoard();
    return;
  }
  selectCard(container,selectedButton);
  selected.year = { packed:yearEntry.packed,label:'流年',target:SHEN_SHA_TARGET.FLOW_YEAR };
  selected.month = selected.day = selected.hour = null;
  updatePillarBoard();
  hideLevels('flow-day-level','flow-hour-level');
  const row = document.querySelector('#flow-month-row');
  const cards = [];
  for (let index = 0; index < 12; index += 1) {
    const branch = (index + 2) % 12;
    const packed = calculateFlowMonth(yearEntry.packed,branch);
    const card = makeFortuneCard(chart,packed,{
      top:`${EARTHLY_BRANCHES[branch]}月`, bottom:`第${index + 1}月`,
      current:yearEntry.packed === currentTemporal?.pillars.year && packed === currentTemporal?.pillars.month,
    });
    card.addEventListener('click',() => renderFlowDays(chart,{ packed,index,year:yearEntry.year },card));
    cards.push(card);
  }
  row.replaceChildren(...cards);
  document.querySelector('#flow-month-level').hidden = false;
}

function monthCivilDates(year, monthIndex, options) {
  const startCivilYear = year + (monthIndex === 11 ? 1 : 0);
  const start = getSpecificSolarTerm(startCivilYear,MONTH_JIE_INDICES[monthIndex],options.toFourPillarsOptions()).time.jdUT1;
  const nextIndex = (monthIndex + 1) % 12;
  const endCivilYear = year + (monthIndex >= 10 ? 1 : 0);
  const end = getSpecificSolarTerm(endCivilYear,MONTH_JIE_INDICES[nextIndex],options.toFourPillarsOptions()).time.jdUT1;
  const firstDay = Math.floor(start + options.utcOffsetMinutes / 1440 + .5);
  const lastDay = Math.floor(end + options.utcOffsetMinutes / 1440 + .5);
  return Array.from({ length: Math.max(0,lastDay - firstDay) },(_,index) => {
    const date = calendarDateFromJulianDay(firstDay + index - .5);
    return { year:date.year, month:date.month, day:date.day };
  });
}

function renderFlowDays(chart, monthEntry, selectedButton) {
  const container = document.querySelector('#flow-month-row');
  if (selectedButton.classList.contains('selected')) {
    selectCard(container,null);
    selected.month = selected.day = selected.hour = null;
    clearFlowFrom('day');
    updatePillarBoard();
    return;
  }
  selectCard(container,selectedButton);
  selected.month = { packed:monthEntry.packed,label:'流月',target:SHEN_SHA_TARGET.FLOW_MONTH };
  selected.day = selected.hour = null;
  updatePillarBoard();
  hideLevels('flow-hour-level');
  const row = document.querySelector('#flow-day-row');
  const cards = monthCivilDates(monthEntry.year,monthEntry.index,lastContext.options).map((date) => {
    const packed = calculateFlowDay(date);
    const card = makeFortuneCard(chart,packed,{
      top:`${date.month}/${date.day}`, bottom:'流日',
      current:date.year === currentTemporal?.civil.year && date.month === currentTemporal?.civil.month && date.day === currentTemporal?.civil.day,
    });
    card.addEventListener('click',() => renderFlowHours(chart,{ packed,date },card));
    return card;
  });
  row.replaceChildren(...cards);
  document.querySelector('#flow-day-level').hidden = false;
}

function renderFlowHours(chart, dayEntry, selectedButton) {
  const container = document.querySelector('#flow-day-row');
  if (selectedButton.classList.contains('selected')) {
    selectCard(container,null);
    selected.day = selected.hour = null;
    clearFlowFrom('hour');
    updatePillarBoard();
    return;
  }
  selectCard(container,selectedButton);
  selected.day = { packed:dayEntry.packed,label:'流日',target:SHEN_SHA_TARGET.FLOW_DAY };
  selected.hour = null;
  updatePillarBoard();
  const row = document.querySelector('#flow-hour-row');
  const cards = Array.from({ length:12 },(_,index) => {
    const packed = calculateFlowHour(dayEntry.packed,index);
    const card = makeFortuneCard(chart,packed,{
      top:HOUR_NAMES[index], bottom:`${pad((index * 2 + 23) % 24)}时起`,
      current:dayEntry.date.year === currentTemporal?.civil.year
        && dayEntry.date.month === currentTemporal?.civil.month
        && dayEntry.date.day === currentTemporal?.civil.day
        && packed === currentTemporal?.pillars.hour,
    });
    card.addEventListener('click',() => {
      if (card.classList.contains('selected')) {
        selectCard(row,null);
        selected.hour = null;
        updatePillarBoard();
        return;
      }
      selectCard(row,card);
      selected.hour = { packed,label:'流时',target:SHEN_SHA_TARGET.FLOW_HOUR };
      updatePillarBoard();
    });
    return card;
  });
  row.replaceChildren(...cards);
  document.querySelector('#flow-hour-level').hidden = false;
}

function renderFortune(chart) {
  const qiyun = chart.getQiYun();
  const table = chart.getDaYunTable();
  const row = document.querySelector('#dayun-row');
  const nowJd = JulianTime.fromDate(new Date()).jdUT1;
  const cards = table.map((entry) => {
    const current = nowJd >= entry.startJdUT1 && nowJd < entry.endJdUT1;
    const card = makeFortuneCard(chart,entry.pillar,{ top:String(entry.startCivilTime.year),bottom:`${entry.startVirtualAge}岁`,current });
    card.addEventListener('click',() => renderFlowYears(chart,qiyun,entry,card));
    return card;
  });
  row.replaceChildren(...cards);
  hideLevels('flow-year-level','flow-month-level','flow-day-level','flow-hour-level');
  document.querySelector('#fortune-empty').hidden = false;
  const currentIndex = table.findIndex((entry) => nowJd >= entry.startJdUT1 && nowJd < entry.endJdUT1);
  const initialIndex = currentIndex >= 0 ? currentIndex : 0;
  if (cards[initialIndex]) renderFlowYears(chart,qiyun,table[initialIndex],cards[initialIndex]);
  return qiyun;
}

function renderFacts(chart, context, qiyun) {
  const { source,options,data } = context;
  const lunar = instantToLunar(source.toJulianTime(),options.toFourPillarsOptions());
  document.querySelector('#chart-gender').textContent = options.gender === GENDER.MALE ? '乾造' : '坤造';
  { const name=document.querySelector('#chart-name'); name.toggleAttribute('data-no-i18n',Boolean(String(data.get('name') || '').trim())); name.textContent=context.name; }
  { const location=document.querySelector('#chart-location'); const entered=String(data.get('location') || '').trim(); if(entered){const place=document.createElement('span');place.dataset.noI18n='';place.textContent=context.location;location.replaceChildren(place,document.createTextNode(` · ${offsetLabel(options.utcOffsetMinutes)} · ${context.longitude.toFixed(4)}°`));}else location.textContent=`${context.location} · ${offsetLabel(options.utcOffsetMinutes)} · ${context.longitude.toFixed(4)}°`; }
  document.querySelector('#fact-solar').textContent = formatDateTime(source);
  document.querySelector('#fact-lunar').textContent = formatLunar(lunar);
  const clockRow = document.querySelector('#fact-clock-row');
  clockRow.hidden = options.clockMode === BAZI_CLOCK_MODE.CIVIL;
  if (!clockRow.hidden) {
    document.querySelector('#fact-clock-label').textContent = options.clockMode === BAZI_CLOCK_MODE.TRUE_SOLAR ? '真太阳时' : '平太阳时';
    document.querySelector('#fact-clock').textContent = formatDateTime(chart.birthCivilTime);
  }
  const offset = qiyun.traditionalOffset;
  document.querySelector('#qiyun-summary').textContent = `出生后 ${offset.years}年 ${offset.months}个月 ${offset.days}天 ${offset.hours}小时 ${offset.minutes}分钟交运 · ${formatDateTime(qiyun.startCivilTime,false)}`;
  try {
    const previousJie = getPreviousJie(chart.birthJdUT1,options.toFourPillarsOptions());
    const daysSinceJie = Math.max(0,chart.birthJdUT1 - previousJie.time.jdUT1);
    const segment = selectRenyuanSiling(chart.columns[1].branch,daysSinceJie,options.renyuanSilingTable);
    const origin = segment.origin === RENYUAN_SILING_ORIGIN.GEN_EARTH ? '艮土' : segment.origin === RENYUAN_SILING_ORIGIN.KUN_EARTH ? '坤土' : HEAVENLY_STEMS[segment.stem];
    document.querySelector('#siling-summary').textContent = `人元司令：${origin} · 入节后 ${daysSinceJie.toFixed(2)} 日`;
  } catch {
    document.querySelector('#siling-summary').textContent = '人元司令：当前年代无法判定';
  }
  const calendarNames = { historical:'历史历法','china-astronomical':'中国天文历法','local-astronomical':'当地经度定气定朔' };
  app.dataset.summary = `${options.gender === GENDER.MALE ? '乾造' : '坤造'} ${context.name}\n公历：${formatDateTime(source)}\n农历：${formatLunar(lunar)}\n口径：${calendarNames[options.mode]} / ${data.get('clockMode')}\n四柱：${chart.columns.map((column) => column.name).join(' ')}`;
}

function calculateAndRender(preserveBirthBase = false) {
  exportButton.disabled = true;
  errorBox.hidden = true;
  try {
    const context = readContext();
    const chart = BaziChart.fromZonedTime(context.source,context.options);
    if (!preserveBirthBase) {
      baseBirthInput = captureBirthInput();
      birthOffsetMinutes = 0;
    }
    selected = freshSelection();
    lastChart = chart;
    lastContext = context;
    currentTemporal = getCurrentTemporal(context.options);
    renderPillars(chart);
    const qiyun = renderFortune(chart);
    renderFacts(chart,context,qiyun);
    syncBirthToolbar();
    exportProfile = captureChartProfile(form);
    exportButton.disabled = false;
    return true;
  } catch (error) {
    errorBox.textContent = error instanceof Error ? error.message : String(error);
    errorBox.hidden = false;
    return false;
  }
}

form.addEventListener('submit',(event) => {
  event.preventDefault();
  if (calculateAndRender()) setInputCollapsed(true);
});
form.addEventListener('change',(event) => {
  if (event.target?.name === 'inputCalendar') {
    document.querySelector('#lunar-leap-row').hidden = event.target.value !== 'lunar';
    if (event.target.value === 'lunar') syncLunarMonthControls();
  }
  if (['lunarLeapToggle','lunarSpecialToggle','lunarSpecialName'].includes(event.target?.name)) syncLunarMonthControls(event);
  if (event.target?.name === 'pillarHistoricalMode') syncHistoricalTermOffset();
});

function syncHistoricalTermOffset() { syncHistoricalUtcOffset(); }

function useCurrentTimeAndZone() {
  const now = new Date();
  const offsetMinutes = -now.getTimezoneOffset();
  delete form.querySelector('.offset-picker').dataset.savedOffset;
  form.elements.inputCalendar.value = 'solar';
  document.querySelector('#lunar-leap-row').hidden = true;
  form.elements.pillarHistoricalMode.value = PILLAR_HISTORICAL_MODE.OFF;
  form.elements.clockMode.value = BAZI_CLOCK_MODE.CIVIL;
  const values = {
    year:now.getFullYear(), month:now.getMonth() + 1, day:now.getDate(),
    hour:now.getHours(), minute:now.getMinutes(), second:now.getSeconds(),
  };
  for (const [key, value] of Object.entries(values)) form.elements[key].value = String(value);
  form.elements.offsetSign.value = offsetMinutes >= 0 ? '1' : '-1';
  form.elements.offsetHour.value = pad(Math.floor(Math.abs(offsetMinutes) / 60));
  form.elements.offsetMinute.value = pad(Math.abs(offsetMinutes) % 60);
  syncHistoricalUtcOffset();
}
document.querySelectorAll('input[name="offsetHour"], input[name="offsetMinute"]').forEach((input) => {
  input.addEventListener('blur',() => {
    const value = Number(input.value);
    if (Number.isInteger(value) && value >= 0) input.value = pad(value);
  });
});
document.querySelectorAll('[data-chart-tab]').forEach((button) => {
  button.addEventListener('click',() => {
    activeTab = button.dataset.chartTab;
    document.querySelectorAll('[data-chart-tab]').forEach((item) => item.classList.toggle('active',item === button));
    updatePillarBoard();
  });
});
document.querySelector('#professional-toggle').addEventListener('change',(event) => {
  app.classList.toggle('bazi-professional',event.target.checked);
  scheduleProfessionalLegendAlignment();
});
window.addEventListener('resize',scheduleProfessionalLegendAlignment);
document.querySelector('#copy-chart').addEventListener('click',async (event) => {
  const button = event.currentTarget;
  try { await navigator.clipboard.writeText(app.dataset.summary || ''); button.textContent = '已复制'; }
  catch { button.textContent = '复制失败'; }
  window.setTimeout(() => { button.textContent = '复制'; },1300);
});

inputToggle.addEventListener('click',() => setInputCollapsed(!workspace.classList.contains('input-collapsed')));
for (const button of document.querySelectorAll('[data-bazi-birth-shift]')) {
  button.addEventListener('click',() => {
    const requested = Number(button.dataset.baziBirthShift);
    const delta = Math.abs(requested) === 120 ? hourShiftMinutes(Math.sign(requested)) : requested;
    shiftBirth(delta);
  });
}
birthReset.addEventListener('click',() => {
  if (!baseBirthInput) return;
  restoreBirthInput(baseBirthInput);
  birthOffsetMinutes = 0;
  calculateAndRender(true);
});

useCurrentTimeAndZone();
syncHistoricalTermOffset();
calculateAndRender();
document.querySelector('#bazi-use-current-time')?.addEventListener('click', useCurrentTimeAndZone);
setupBaziReverseLookup({
  trigger: document.querySelector('#bazi-reverse-lookup'),
  getOptions: () => optionValues(new FormData(form)),
  getInitialPillars: () => lastChart && Object.fromEntries(
    Object.entries(lastChart.pillars).map(([key, value]) => {
      const decoded = unpackPillar(value);
      return [key, { stem:decoded.stem, branch:decoded.branch }];
    }),
  ),
  apply: (candidate) => {
    form.elements.inputCalendar.value = 'solar';
    document.querySelector('#lunar-leap-row').hidden = true;
    for (const key of ['year','month','day','hour','minute','second']) {
      form.elements[key].value = String(candidate.civil[key]);
    }
    if (calculateAndRender()) setInputCollapsed(true);
  },
});

restoreChart(form,()=>calculateAndRender(),'bazi');
window.parent.postMessage({type:'tool-ready'},location.origin);
setupChartWorkspace(form,'bazi',()=>calculateAndRender());
import {setupChartWorkspace} from '/shared/chart-workspace.js';
import {restoreChart} from '/shared/chart-bridge.js';
import {resolveCalendarBoundary,setupHistoricalUtcLock,setupLocalCalendarBoundary} from '/shared/calendar-boundary.js';
await (window.redsc1LocaleReady ?? Promise.resolve());
import * as BaziCore from '/vendor/opendestiny-bazi.js?v=20260831-vendor-clean-v1';
import { captureChartProfile, setupChartJsonExport } from '/scripts/chart-json-export.js?v=1';
import { birthHourShiftMinutes } from '/scripts/birth-time-step.js?v=1';
import { setupLocationPicker } from '/scripts/location-picker.js';
import { setupBaziReverseLookup, setupZiweiReverseLookup } from '/scripts/reverse-lookup-ui.js?v=20260831-vendor-clean-v1';

import {
  findStarId,
  CALENDAR_MODE,
  EARTHLY_BRANCHES,
  FLOW_LEVEL,
  FLOW_MONTH_PALACE_STRATEGY,
  HEAVENLY_STEMS,
  LEAP_MONTH_STRATEGY,
  MONTH_NAME,
  PALACE_NAMES,
  PILLAR_BOUNDARY,
  PILLAR_HISTORICAL_MODE,
  RAT_HOUR_MODE,
  RAT_HOUR_SEGMENT,
  STAR_TRANSFORM_MARK,
  ZIWEI_CHART_MODE,
  ZIWEI_CLOCK_MODE,
  ZIWEI_GENDER,
  ZiweiChart,
  ZiweiOptions,
  ZonedTime,
  bureauNumber,
  calculateDayPillar,
  ganzhiBranch,
  ganzhiStem,
  getStar,
  lunarToSolar,
  makeFlowDay,
  makeFlowHour,
  solarToLunar,
} from '/vendor/opendestiny-ziwei-cpp-boundary-v15.js?v=20260831-vendor-clean-v1';

const BOARD = Object.freeze({ width: 360, height: 427.2, margin: 12, cellWidth: 84, cellHeight: 100.8 });
const PALACE_SCALE = 0.89;
const PALACE_METRICS = Object.freeze({
  paddingX: 4 * PALACE_SCALE,
  paddingY: 4 * PALACE_SCALE,
  sectionGap: 1 * PALACE_SCALE,
  topFlex: 7,
  bottomFlex: 3,
  baseStarSize: 11.5 * PALACE_SCALE,
  minSecondarySize: 7.2 * PALACE_SCALE,
  starSpacing: 0.5 * PALACE_SCALE,
});
const POSITIONS = Object.freeze({
  5: [0, 0], 6: [1, 0], 7: [2, 0], 8: [3, 0],
  4: [0, 1], 9: [3, 1], 3: [0, 2], 10: [3, 2],
  2: [0, 3], 1: [1, 3], 0: [2, 3], 11: [3, 3],
});
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const LUNAR_MONTHS = ['正','二','三','四','五','六','七','八','九','十','冬','腊','十三'];
const WATERMARK_MONTHS = ['正','二','三','四','五','六','七','八','九','十','十一','十二'];
const LUNAR_DAYS = [
  '初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十',
];
const BUREAU_NAMES = ['水二局','木三局','金四局','土五局','火六局'];
const BAZI_ELEMENT_NAMES = ['wood','fire','earth','metal','water'];
const STEM_ELEMENTS = [0,0,1,1,2,2,3,3,4,4];
const BRANCH_ELEMENTS = [4,2,0,0,2,1,1,2,3,3,2,4];
const BRANCH_MAIN_STEMS = [9,5,0,1,4,2,3,5,6,7,4,8];
const TRANSFORMS = [
  [STAR_TRANSFORM_MARK.BIRTH_YEAR_LU, '禄', 'lu'],
  [STAR_TRANSFORM_MARK.BIRTH_YEAR_QUAN, '权', 'quan'],
  [STAR_TRANSFORM_MARK.BIRTH_YEAR_KE, '科', 'ke'],
  [STAR_TRANSFORM_MARK.BIRTH_YEAR_JI, '忌', 'ji'],
];
const FLOW_SCOPE = [
  [FLOW_LEVEL.DECADE, '大', 'decade'],
  [FLOW_LEVEL.YEAR, '年', 'year'],
  [FLOW_LEVEL.MONTH, '月', 'month'],
  [FLOW_LEVEL.DAY, '日', 'day'],
  [FLOW_LEVEL.HOUR, '时', 'hour'],
];
const TRANSFORM_FIELDS = Object.freeze([
  ['lu', '禄'], ['quan', '权'], ['ke', '科'], ['ji', '忌'],
]);
const SIHUA_LETTERS = Object.freeze({ lu:'A', quan:'B', ke:'C', ji:'D' });
const PALACE_STAMP_FIELDS = Object.freeze({
  sanhe: Object.freeze({ body:'showBodySanhe', laiyin:'showLaiYinSanhe' }),
  sihua: Object.freeze({ body:'showBodySihua', laiyin:'showLaiYinSihua' }),
  flying: Object.freeze({ body:'showBodyFlying', laiyin:'showLaiYinFlying' }),
});
const SIHUA_ARROW_KINDS = Object.freeze([
  { kind: 'lu', outward: STAR_TRANSFORM_MARK.CENTRIFUGAL_LU, inward: STAR_TRANSFORM_MARK.CENTRIPETAL_LU },
  { kind: 'quan', outward: STAR_TRANSFORM_MARK.CENTRIFUGAL_QUAN, inward: STAR_TRANSFORM_MARK.CENTRIPETAL_QUAN },
  { kind: 'ke', outward: STAR_TRANSFORM_MARK.CENTRIFUGAL_KE, inward: STAR_TRANSFORM_MARK.CENTRIPETAL_KE },
  { kind: 'ji', outward: STAR_TRANSFORM_MARK.CENTRIFUGAL_JI, inward: STAR_TRANSFORM_MARK.CENTRIPETAL_JI },
]);
const COMPACT_MINOR_STAR_KEYS = new Set(['hongluan', 'tianxi', 'tianyao', 'tianxing']);
const FLYING_TARGET_FRAME_EXTRA = 4.4 * PALACE_SCALE;
const FLYING_TARGET_FRAME_GAP = 0.7 * PALACE_SCALE;
const FLYING_TARGET_FRAME_VERTICAL_EXTRA = 5.1 * PALACE_SCALE;
const SIHUA_RULE_OPTIONS = Object.freeze([
  { option1:{ lu:5, quan:13, ke:3, ji:2 } },
  { option1:{ lu:1, quan:11, ke:0, ji:7 } },
  { option1:{ lu:4, quan:1, ke:16, ji:5 } },
  { option1:{ lu:7, quan:4, ke:1, ji:9 } },
  { option1:{ lu:8, quan:7, ke:15, ji:1 }, option2:{ lu:8, quan:7, ke:2, ji:1 } },
  { option1:{ lu:3, quan:8, ke:11, ji:17 } },
  { option1:{ lu:2, quan:3, ke:7, ji:4 }, option2:{ lu:2, quan:3, ke:4, ji:7 }, option3:{ lu:2, quan:3, ke:6, ji:4 }, option4:{ lu:2, quan:3, ke:4, ji:10 } },
  { option1:{ lu:9, quan:2, ke:17, ji:16 } },
  { option1:{ lu:11, quan:0, ke:14, ji:3 }, option2:{ lu:11, quan:0, ke:6, ji:3 } },
  { option1:{ lu:13, quan:9, ke:7, ji:8 }, option2:{ lu:13, quan:9, ke:2, ji:8 } },
]);

const STAR_NAMES = Object.freeze({
  ziwei:'紫微',tianji:'天机',taiyang:'太阳',wuqu:'武曲',tiantong:'天同',lianzhen:'廉贞',tianfu:'天府',taiyin:'太阴',tanlang:'贪狼',jumen:'巨门',tianxiang:'天相',tianliang:'天梁',qisha:'七杀',pojun:'破军',
  zuofu:'左辅',youbi:'右弼',wenchang:'文昌',wenqu:'文曲',tiankui:'天魁',tianyue:'天钺',lucun:'禄存',tianma:'天马',qingyang:'擎羊',tuoluo:'陀罗',huoxing:'火星',lingxing:'铃星',dikong:'地空',dijie:'地劫',
  hongluan:'红鸾',tianxi:'天喜',tianyao:'天姚',tianxing:'天刑',xianchi:'咸池',santai:'三台',bazuo:'八座',enguang:'恩光',tiangui:'天贵',taifu:'台辅',fenggao:'封诰',tiancai:'天才',tianshou:'天寿',longchi:'龙池',fengge:'凤阁',guchen:'孤辰',guasu:'寡宿',xunkong:'旬空',fuxun:'副旬',jiekong:'截空',fujie:'副截',tiankong:'天空',tianshang:'天伤',tianshi:'天使',tianku:'天哭',tianxu:'天虚',tianguan:'天官',tianfu_minor:'天福',yinsha:'阴煞',tianwu:'天巫',tianyue_minor:'天月',posui:'破碎',feilian:'蜚廉',tianchu:'天厨',jieshen:'解神',nianjie:'年解',tiande:'天德',yuede:'月德',dahao:'大耗',
  changsheng:'长生',muyu:'沐浴',guandai:'冠带',linguan:'临官',diwang:'帝旺',shuai:'衰',bing:'病',si:'死',mu:'墓',jue:'绝',tai:'胎',yang:'养',
  boshi_boshi12:'博士',lishi_boshi12:'力士',qinglong_boshi12:'青龙',xiaohao_boshi12:'小耗',jiangjun_boshi12:'将军',zoushu_boshi12:'奏书',feilian_boshi12:'飞廉',xishen_boshi12:'喜神',bingfu_boshi12:'病符',dahao_boshi12:'大耗',fubing_boshi12:'伏兵',guanfu_boshi12:'官府',
  jiangxing_jiangqian12:'将星',panan_jiangqian12:'攀鞍',suiyi_jiangqian12:'岁驿',xishen_jiangqian12:'息神',huagai_jiangqian12:'华盖',jiesha_jiangqian12:'劫煞',zaisha_jiangqian12:'灾煞',tiansha_jiangqian12:'天煞',zhibei_jiangqian12:'指背',xianchi_jiangqian12:'咸池',yuesha_jiangqian12:'月煞',wangshen_jiangqian12:'亡神',
  suijian_suijian12:'岁建',huiqi_suijian12:'晦气',sangmen_suijian12:'丧门',guansuo_suijian12:'贯索',guanfu_suijian12:'官符',xiaohao_suijian12:'小耗',suipo_suijian12:'岁破',longde_suijian12:'龙德',baihu_suijian12:'白虎',tiande_suijian12:'天德',diaoke_suijian12:'吊客',bingfu_suijian12:'病符',
  flow_lucun:'禄',flow_tiankui:'魁',flow_tianyue:'钺',flow_wenchang:'昌',flow_wenqu:'曲',flow_qingyang:'羊',flow_tuoluo:'陀',flow_tianma:'马',
});

const form = document.querySelector('#ziwei-form');
setupLocalCalendarBoundary(form);
const syncHistoricalUtcOffset=setupHistoricalUtcLock(form);
setupLocationPicker({ form, trigger: document.querySelector('[data-location-picker]') });
const app = document.querySelector('#ziwei-app');
const boardShell = document.querySelector('#ziwei-board-shell');
const board = document.querySelector('#ziwei-board');
const boardSvg = document.querySelector('#ziwei-board-svg');
const sihuaSvg = document.querySelector('#ziwei-sihua-svg');
const center = document.querySelector('#ziwei-center');
const errorBox = document.querySelector('#ziwei-error');
const timeline = document.querySelector('#ziwei-timeline');
const workspace = document.querySelector('.ziwei-workspace');
const inputToggle = document.querySelector('#ziwei-input-toggle');
const plateMode = document.querySelector('#ziwei-plate-mode');
const birthReset = document.querySelector('#ziwei-birth-reset');
const displayMode = document.querySelector('#ziwei-display-mode');
let chart = null;
let exportProfile = null;
const exportButton = document.querySelector('#ziwei-export-json');
setupChartJsonExport({ trigger: exportButton, getSnapshot: () => {
  if (!chart || !exportProfile || exportButton.disabled) return null;
  const snapshot = chart.toJSON();
  return {
    ...snapshot, profile: exportProfile,
    summary: { bureau: BUREAU_NAMES[chart.anchors.bureau],
      lifeMaster: starName(chart.getStarInfo(chart.lifeMaster).key),
      bodyMaster: starName(chart.getStarInfo(chart.bodyMaster).key) },
    palaces: snapshot.palaces.map((palace) => ({ ...palace,
      stars: palace.stars.map((star) => ({ ...star, name: starName(star.key) })),
    })),
  };
} });
let manager = null;
let selectedPalace = null;
let baseBirthInput = null;
let birthOffsetMinutes = 0;
let decadeWatermarkNodes = [];
let resizeObserver = null;
let viewportResizeHandler = null;
let viewportScrollHandler = null;
let timelineScrollCleanups = [];
let chartDisplayMode = displayMode?.value ?? 'sanhe';
let flyingTargetMap = new Map();
let timelineManifest = null;
let birthPanelScrollY = 0;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function integer(data, name) {
  const value = Number(data.get(name));
  if (!Number.isInteger(value)) throw new RangeError(`${name} 必须为整数`);
  return value;
}

function readOffset(data) {
  const sign = data.get('offsetSign') === '-1' ? -1 : 1;
  const hour = integer(data, 'offsetHour');
  const minute = integer(data, 'offsetMinute');
  if (hour < 0 || hour > 14 || minute < 0 || minute > 59) throw new RangeError('UTC 偏移格式无效');
  const value = sign * (hour * 60 + minute);
  if (value < -720 || value > 840) throw new RangeError('UTC 偏移须在 UTC−12:00～UTC+14:00 之间');
  return value;
}

function formatOffset(minutes) {
  const sign = minutes >= 0 ? '+' : '−';
  const value = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(value / 60)).padStart(2,'0')}:${String(value % 60).padStart(2,'0')}`;
}

function formatYear(year) { return year > 0 ? `${year}年` : `公元前${1 - year}年`; }
function pad(value) { return String(Math.trunc(Math.abs(value))).padStart(2, '0'); }
function formatCivil(value) {
  return `${formatYear(value.year)}${value.month}月${value.day}日 ${pad(value.hour)}:${pad(value.minute)}`;
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

function starName(key) {
  const base = key.replace(/^flow_/, '');
  const clean = base.replace(/_(boshi12|jiangqian12|suijian12)$/, '');
  const name = STAR_NAMES[key] ?? STAR_NAMES[base] ?? STAR_NAMES[clean] ?? clean;
  return window.redsc1I18n?.translate(name) ?? name;
}

function flowShortName(key) {
  return starName(key).replace(/^(流|大限)/, '');
}

function isChangsheng(key) {
  return ['changsheng','muyu','guandai','linguan','diwang','shuai','bing','si','mu','jue','tai','yang'].includes(key);
}
function isBottomCycle(key) { return /_(boshi12|jiangqian12|suijian12)$/.test(key); }

function categoryColor(category) {
  if (category === 'major') return 'major';
  if (category === 'lucky') return 'lucky';
  if (category === 'malefic') return 'malefic';
  return 'minor';
}

function readOptions(data) {
  const clockMode = String(data.get('clockMode'));
  const longitudeDeg = Number(data.get('longitude'));
  const historicalTerms = data.get('pillarHistoricalMode') === 'on';
  const calendarMode = String(data.get('calendarMode'));
  const calendarBoundary = resolveCalendarBoundary(calendarMode,String(data.get('calendarDayBoundary')),data.get('longitude'));
  const utcOffsetMinutes = calendarMode === 'historical' || historicalTerms ? 480 : readOffset(data);
  return new ZiweiOptions({
    gender: data.get('gender') === 'female' ? ZIWEI_GENDER.FEMALE : ZIWEI_GENDER.MALE,
    mode: {
      historical: CALENDAR_MODE.HISTORICAL,
      'china-astronomical': CALENDAR_MODE.CHINA_ASTRONOMICAL,
      'local-astronomical': CALENDAR_MODE.LOCAL_ASTRONOMICAL,
    }[calendarMode],
    utcOffsetMinutes,
    ...calendarBoundary,
    pillarHistoricalMode: historicalTerms ? PILLAR_HISTORICAL_MODE.ON : PILLAR_HISTORICAL_MODE.OFF,
    ratHourMode: {
      'next-day': RAT_HOUR_MODE.NEXT_DAY,
      'current-day': RAT_HOUR_MODE.CURRENT_DAY,
      'current-day-tomorrow-stem': RAT_HOUR_MODE.CURRENT_DAY_TOMORROW_STEM,
    }[String(data.get('ratHourMode'))],
    clockMode: {
      civil: ZIWEI_CLOCK_MODE.CIVIL,
      'mean-solar': ZIWEI_CLOCK_MODE.MEAN_SOLAR,
      'true-solar': ZIWEI_CLOCK_MODE.TRUE_SOLAR,
    }[clockMode],
    longitudeDeg: clockMode === 'civil' ? undefined : longitudeDeg,
    leapMonthStrategy: {
      previous: LEAP_MONTH_STRATEGY.AS_PREVIOUS,
      next: LEAP_MONTH_STRATEGY.AS_NEXT,
      split: LEAP_MONTH_STRATEGY.SPLIT_AFTER_FIFTEENTH,
    }[String(data.get('leapMonth'))],
    flowMonthPalaceStrategy: data.get('flowMonthPalace') === 'effective'
      ? FLOW_MONTH_PALACE_STRATEGY.EFFECTIVE_MONTH
      : FLOW_MONTH_PALACE_STRATEGY.PHYSICAL_SEQUENCE,
    chartMode: {
      tian: ZIWEI_CHART_MODE.TIAN_PAN,
      di: ZIWEI_CHART_MODE.DI_PAN,
      ren: ZIWEI_CHART_MODE.REN_PAN,
    }[String(data.get('chartMode'))],
    flowLimitBoundary: data.get('flowBoundary') === 'solar-term' ? PILLAR_BOUNDARY.SOLAR_TERM : PILLAR_BOUNDARY.LUNAR,
    rules: {
      longevity: String(data.get('longevity')),
      masters: String(data.get('masters')),
      placement: {
        tianshang: String(data.get('tianshangTianshi')),
        tianshi: String(data.get('tianshangTianshi')),
      },
      sihua: {
        wu: String(data.get('sihuaWu')),
        geng: String(data.get('sihuaGeng')),
        ren: String(data.get('sihuaRen')),
        gui: String(data.get('sihuaGui')),
      },
    },
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
  const calendarOptions = options.toCalendarOptions();
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

function createChart(data, options) {
  const civil = {
    year: integer(data, 'year'), month: integer(data, 'month'), day: integer(data, 'day'),
    hour: integer(data, 'hour'), minute: integer(data, 'minute'), second: integer(data, 'second'),
  };
  const inputCalendar = String(data.get('inputCalendar'));
  validateClockInput(civil);
  if (inputCalendar === 'lunar') {
    const solar = resolveLunarDate(civil, data, options);
    return ZiweiChart.fromZonedTime(new ZonedTime({
      ...solar,
      hour:civil.hour,
      minute:civil.minute,
      second:civil.second,
      offsetMinutes:options.utcOffsetMinutes,
    }), options);
  }
  validateSolarDate(civil);
  return ZiweiChart.fromZonedTime(new ZonedTime({ ...civil, offsetMinutes: options.utcOffsetMinutes }), options);
}

function captureBirthInput() {
  return Object.freeze({
    inputCalendar: form.elements.inputCalendar.value,
    lunarMonthKind: form.elements.lunarMonthKind.value,
    year: form.elements.year.value,
    month: form.elements.month.value,
    day: form.elements.day.value,
    hour: form.elements.hour.value,
    minute: form.elements.minute.value,
    second: form.elements.second.value,
  });
}

function restoreBirthInput(value) {
  form.elements.inputCalendar.value = value.inputCalendar;
  form.elements.lunarMonthKind.value = value.lunarMonthKind ?? 'normal';
  for (const name of ['year', 'month', 'day', 'hour', 'minute', 'second']) {
    form.elements[name].value = value[name];
  }
  syncForm();
}

function syncChartToolbar() {
  plateMode.value = form.elements.chartMode.value;
  birthReset.disabled = birthOffsetMinutes === 0;
  birthReset.textContent = birthOffsetMinutes === 0 ? '定盘' : '复原';
}

function setBirthFormFromShift(deltaMinutes) {
  const source = {
    year: Number(form.elements.year.value),
    month: Number(form.elements.month.value),
    day: Number(form.elements.day.value),
    hour: Number(form.elements.hour.value),
    minute: Number(form.elements.minute.value),
    second: Number(form.elements.second.value),
  };
  const inputIsLunar = form.elements.inputCalendar.value === 'lunar';
  const inputLunarIdentity = lunarMonthIdentity(form.elements.lunarMonthKind.value);
  const solarDate = inputIsLunar
    ? lunarToSolar(
      { year: source.year, month: source.month, day: source.day, ...inputLunarIdentity },
      chart.options.toCalendarOptions(),
    )
    : source;

  const unwrappedMinutes = source.hour * 60 + source.minute + deltaMinutes;
  const dayShift = Math.floor(unwrappedMinutes / 1440);
  const minuteOfDay = ((unwrappedMinutes % 1440) + 1440) % 1440;
  // As in the C++ flow stepper, JD carries only the date. Noon keeps that
  // extraction away from a midnight boundary; clock fields remain exact.
  const sourceNoon = new ZonedTime({
    year: solarDate.year,
    month: solarDate.month,
    day: solarDate.day,
    hour: 12,
    minute: 0,
    second: 0,
    offsetMinutes: chart.options.utcOffsetMinutes,
  });
  const carriedDate = ZonedTime.fromJulianTime(
    sourceNoon.toJulianTime().jdUT1 + dayShift,
    chart.options.utcOffsetMinutes,
  );
  const shiftedSolar = {
    year: carriedDate.year,
    month: carriedDate.month,
    day: carriedDate.day,
    hour: Math.floor(minuteOfDay / 60),
    minute: minuteOfDay % 60,
    second: source.second,
  };
  const date = inputIsLunar
    ? solarToLunar(shiftedSolar, chart.options.toCalendarOptions())
    : shiftedSolar;
  if (inputIsLunar) form.elements.lunarMonthKind.value = lunarMonthKind(date);
  form.elements.year.value = String(date.year);
  form.elements.month.value = String(date.month);
  form.elements.day.value = String(date.day);
  form.elements.hour.value = String(shiftedSolar.hour);
  form.elements.minute.value = String(shiftedSolar.minute);
  form.elements.second.value = String(shiftedSolar.second);
  syncForm();
}

function shiftBirthTime(deltaMinutes) {
  if (!chart) return;
  const previous = captureBirthInput();
  const previousOffset = birthOffsetMinutes;
  setBirthFormFromShift(deltaMinutes);
  birthOffsetMinutes += deltaMinutes;
  if (!generate(null, true)) {
    restoreBirthInput(previous);
    birthOffsetMinutes = previousOffset;
    syncChartToolbar();
  }
}

function hourShiftMinutes(direction) {
  return birthHourShiftMinutes(direction, chart?.facts.virtualTime.hour, form.elements.ratHourMode.value);
}

function restoreBirthTime() {
  if (!baseBirthInput || birthOffsetMinutes === 0) return;
  restoreBirthInput(baseBirthInput);
  birthOffsetMinutes = 0;
  generate(null, true);
}

function currentDepth() {
  const context = manager?.context ?? {};
  if (context.hour) return FLOW_LEVEL.HOUR;
  if (context.day) return FLOW_LEVEL.DAY;
  if (context.month) return FLOW_LEVEL.MONTH;
  if (context.year) return FLOW_LEVEL.YEAR;
  if (context.decade) return FLOW_LEVEL.DECADE;
  return null;
}

function currentLifeBranch() {
  if (!manager) return chart?.anchors.palacePositions[0] ?? 0;
  const depth = currentDepth();
  return depth === null ? chart.anchors.palacePositions[0] : manager.dynamicChart.layer(depth)?.lifePalace ?? chart.anchors.palacePositions[0];
}

function resetSelectionToLife() { selectedPalace = currentLifeBranch(); }

function levelLimit(name, maximum) {
  const value = Number(form.elements[name]?.value ?? maximum);
  return Math.max(1, Math.min(maximum, Number.isFinite(value) ? Math.trunc(value) : maximum));
}

function activeFlowScopes() {
  const context = manager?.context ?? {};
  return FLOW_SCOPE
    .map(([, , scope]) => scope)
    .filter((scope) => Boolean(context[scope]));
}

function visibleTransformScopes() {
  const limit = levelLimit('transformLevelLimit', 6);
  const hierarchy = ['origin', ...activeFlowScopes()];
  return { visible:new Set(hierarchy.slice(-limit)), limit };
}

function visibleFlowStarScopes() {
  const limit = levelLimit('flowStarLevelLimit', 5);
  return new Set(activeFlowScopes().slice(-limit));
}

function transformBadges(starId, originOnly = false) {
  const badges = [];
  const selection = visibleTransformScopes();
  const visible = originOnly ? new Set(['origin']) : selection.visible;
  const limit = originOnly ? 1 : selection.limit;
  const natalMask = chart.transformationMasks[starId] ?? 0;
  if (visible.has('origin')) {
    for (const [bit, label, kind] of TRANSFORMS) {
      if (((natalMask >>> bit) & 1) === 1) badges.push({ label, kind, scope: 'origin' });
    }
  }
  const dynamic = originOnly ? null : manager?.dynamicChart;
  if (dynamic) {
    const appendLayer = (layer, scope, visibilityScope = scope) => {
      if (!layer || !visible.has(visibilityScope)) return;
      for (const [kind, label] of TRANSFORM_FIELDS) {
        if (layer.transforms[kind] === starId) badges.push({ label, kind, scope });
      }
    };
    appendLayer(dynamic.layer(FLOW_LEVEL.DECADE), 'decade');
    appendLayer(dynamic.smallLimitLayer, 'small-limit', 'year');
    for (const [level, , scope] of FLOW_SCOPE.slice(1)) {
      const layer = dynamic.layer(level);
      appendLayer(layer, scope);
    }
  }
  while (badges.length > limit) {
    const smallLimitIndex = badges.findIndex((badge) => badge.scope === 'small-limit');
    badges.splice(smallLimitIndex >= 0 ? smallLimitIndex : 1, 1);
  }
  return badges;
}

function transformationBadgeLayout(count, fontSize) {
  if (!count) return { shouldStack:false, height:0 };
  const gap = 0.25 * PALACE_SCALE;
  const unstackedHeight = count * fontSize + Math.max(0, count - 1) * gap;
  const shouldStack = count > 3;
  return {
    shouldStack,
    height:shouldStack ? fontSize + (count - 1) * fontSize * 0.55 : unstackedHeight,
  };
}

function starLineSlotHeight(fontSize) {
  return fontSize * 1.18 + 0.3 * PALACE_SCALE;
}

function starCharGap(baseFontSize, fontSize) {
  const baseGap = baseFontSize * 0.06;
  if (fontSize >= baseFontSize) return Math.max(0.1 * PALACE_SCALE, Math.min(0.8 * PALACE_SCALE, baseGap));
  const ratio = Math.max(0.1, Math.min(1, fontSize / baseFontSize));
  return Math.max(0.05 * PALACE_SCALE, Math.min(0.8 * PALACE_SCALE, baseGap * ratio * ratio));
}

function brightnessFontSize(fontSize) {
  return Math.max(6.6 * PALACE_SCALE, Math.min(10 * PALACE_SCALE, fontSize * 0.86));
}

function makeStarColumn(star, fontSize, baseFontSize, maxHeight, { compact = false, sihua = false, flyingKind = null } = {}) {
  const column = el('div', `zw-star-column ${categoryColor(star.category)}`);
  column.dataset.starId = String(star.id);
  column.style.width = `${fontSize + (flyingKind ? FLYING_TARGET_FRAME_EXTRA : 0)}px`;
  column.style.fontSize = `${fontSize}px`;
  column.style.paddingTop = '0px';
  const name = el('div', 'zw-star-name');
  name.style.width = `${fontSize}px`;
  if (flyingKind) {
    column.classList.add('zw-flying-target');
    column.style.setProperty('--zw-flying-type-color', `var(--zw-sihua-${flyingKind})`);
    name.style.marginBottom = `${FLYING_TARGET_FRAME_GAP}px`;
  }
  const characters = [...starName(star.key)];
  const lineSlotHeight = starLineSlotHeight(fontSize);
  const charGap = starCharGap(baseFontSize, fontSize);
  const topInset = 0;
  name.style.paddingTop = `${1 * PALACE_SCALE}px`;
  for (const [index, character] of characters.entries()) {
    // Keep the full-width flex line separate from its intrinsic glyph box.
    // A Range around a text node that is itself an anonymous flex item reports
    // the whole flex line in WebKit/Chromium, not the text advance box.  The
    // explicit glyph wrapper gives the alignment pass a real text origin from
    // which Canvas ink bearings can be applied without a visual offset.
    const characterNode = el('span');
    characterNode.append(el('bdi', 'zw-star-glyph', character));
    characterNode.style.height = `${lineSlotHeight}px`;
    characterNode.style.paddingTop = `${topInset}px`;
    if (index < characters.length - 1) characterNode.style.marginBottom = `${charGap}px`;
    name.append(characterNode);
  }
  column.append(name);
  const brightness = chart.getBrightnessLabel(star.brightness);
  const brightnessSize = brightnessFontSize(fontSize);
  if (!compact && brightness) {
    const brightnessNode = el('span', `zw-brightness b${star.brightness}`, brightness);
    brightnessNode.style.fontSize = `${brightnessSize}px`;
    column.append(brightnessNode);
  }
  const badges = transformBadges(star.id, compact);
  if (badges.length) {
    const badgeSlot = el('span', 'zw-transform-slot');
    badgeSlot.style.width = `${fontSize}px`;
    const badgeGap = 0.25 * PALACE_SCALE;
    const badgeLayout = transformationBadgeLayout(badges.length, fontSize);
    const shouldStack = badgeLayout.shouldStack;
    badgeSlot.style.height = `${badgeLayout.height}px`;
    const stack = el('span', `zw-transform-stack${shouldStack ? ' stacked' : ''}`);
    stack.style.width = `${fontSize}px`;
    stack.style.height = `${badgeLayout.height}px`;
    for (const [index, badge] of badges.entries()) {
      const badgeNode = el('i', `zw-transform ${badge.scope} ${badge.kind}`);
      badgeNode.dataset.kind = badge.kind;
      badgeNode.style.setProperty('--zw-transform-type-color', `var(--zw-sihua-${badge.kind})`);
      badgeNode.append(el('span', 'zw-transform-label', sihua ? SIHUA_LETTERS[badge.kind] : badge.label));
      badgeNode.style.width = `${fontSize}px`;
      badgeNode.style.height = `${fontSize}px`;
      badgeNode.style.fontSize = `${fontSize * (sihua ? 1 : 0.72)}px`;
      if (shouldStack) badgeNode.style.top = `${index * fontSize * 0.55}px`;
      else if (index < badges.length - 1) badgeNode.style.marginBottom = `${badgeGap}px`;
      stack.append(badgeNode);
    }
    badgeSlot.append(stack);
    column.append(badgeSlot);
  }
  return column;
}

function flowStarsAtBranch(branch) {
  const result = [];
  const dynamic = manager?.dynamicChart;
  if (!dynamic) return result;
  const visibleScopes = visibleFlowStarScopes();
  for (const [level, prefix, scope] of FLOW_SCOPE) {
    if (!visibleScopes.has(scope)) continue;
    const layer = dynamic.layer(level);
    if (!layer) continue;
    for (let id = 0; id < layer.starPositions.length; id += 1) {
      if (layer.starPositions[id] !== branch) continue;
      const star = getStar(id);
      if (isBottomCycle(star.key)) continue;
      result.push({ name: `${prefix}${flowShortName(star.key)}`, scope });
    }
  }
  return result;
}

function deepestFlowLayers() {
  const dynamic = manager?.dynamicChart;
  if (!dynamic) return [];
  return [...FLOW_SCOPE].reverse().flatMap(([level, , scope]) => {
    const layer = dynamic.layer(level);
    return layer ? [{ layer, scope }] : [];
  });
}

function activeCycleOverlay(branch, groupSuffix) {
  for (const { layer, scope } of deepestFlowLayers()) {
    for (let id = 0; id < layer.starPositions.length; id += 1) {
      if (layer.starPositions[id] !== branch) continue;
      const star = getStar(id);
      if (star.key.endsWith(groupSuffix)) return { name: flowShortName(star.key), scope };
    }
  }
  return null;
}

function cycleOverlayEnabled(groupSuffix) {
  const fieldName = {
    _boshi12: 'flowBoshi12Overlay',
    _suijian12: 'flowSuijian12Overlay',
    _jiangqian12: 'flowJiangqian12Overlay',
  }[groupSuffix];
  return fieldName ? Boolean(form.elements[fieldName]?.checked) : false;
}

function resolvedBottomCycles(branch, natalCycles) {
  return natalCycles.map((star) => {
    const suffix = star.key.match(/_(boshi12|jiangqian12|suijian12)$/)?.[0];
    const overlay = suffix && cycleOverlayEnabled(suffix)
      ? activeCycleOverlay(branch, suffix)
      : null;
    return overlay ?? { name: starName(star.key), scope: '' };
  });
}

function hourWatermarkLabel(hour) {
  if (hour.ratHourSegment === RAT_HOUR_SEGMENT.EARLY) return '早子时';
  if (hour.ratHourSegment === RAT_HOUR_SEGMENT.LATE) return '晚子时';
  return `${BRANCHES[hour.hourIndex]}时`;
}

function sameMonth(left, right) {
  return Boolean(left && right
    && left.sequence === right.sequence
    && left.isLeap === right.isLeap
    && left.effectiveMonth === right.effectiveMonth
    && left.effectiveYear === right.effectiveYear);
}

function watermarkItems(branch) {
  const context = manager?.context ?? {};
  const manifest = timelineManifest;

  if (context.hour && manifest?.currentDayHours?.length) {
    return manifest.currentDayHours.flatMap((node) => {
      const flow = makeFlowHour(chart, context.day, node.branchIndex);
      if (flow.limit.coordinate.branch !== branch) return [];
      return [{
        text: `${node.label}${node.label.endsWith('时') ? '' : '时'}`,
        scope: 'hour',
        fontSize: 17.4,
        active: isHourNodeActive(context.hour, node),
      }];
    });
  }

  // 选中某一流日后仍保留整月的同层水印；只有继续选到流时，
  // 才把整组切换为时辰水印。这样同宫的另外两天不会被删掉。
  if (context.month && manifest?.currentMonthDays?.length) {
    return manifest.currentMonthDays.flatMap((node) => {
      const flow = makeFlowDay(chart, context.month, node.day, node.stem);
      if (flow.limit.coordinate.branch !== branch) return [];
      return [{
        text: LUNAR_DAYS[node.day - 1] ?? String(node.day),
        scope: 'day',
        fontSize: 18.2,
        active: context.day?.day === node.day,
      }];
    });
  }

  if (context.year && manifest?.currentYearMonths?.length) {
    return manifest.currentYearMonths
      .filter((node) => node.branch === branch)
      .map((node) => ({
        text: node.displayLabel,
        scope: 'month',
        fontSize: 19.2,
        active: sameMonth(context.month, node),
      }));
  }

  if (context.decade && manifest?.currentDecadeYears?.length) {
    return (context.decade.index === 0 ? manifest.childhoods : manifest.currentDecadeYears)
      .filter((node) => node.branch === branch)
      .map((node) => ({
        text: context.decade.index === 0 ? `${node.age}岁` : String(node.year),
        scope: 'year',
        fontSize: 20.4,
        active: context.year?.year === node.year,
      }));
  }

  return decadeWatermarkNodes
    .filter((node) => node.branch === branch)
    .map((node) => ({
      text: `${node.startAge}~${node.endAge}`,
      scope: 'default',
      fontSize: 24.9,
      active: false,
    }));
}

function makeDynamicWatermarks(branch) {
  const items = watermarkItems(branch);
  if (!items.length) return null;
  const box = el('div', 'zw-dynamic-watermarks');
  box.dataset.count = String(items.length);
  const perItemHeight = Math.max(10.8, (42 - Math.max(0, items.length - 1)) / items.length);
  for (const info of items) {
    const node = el('span', `zw-dynamic-watermark ${info.scope}${info.active ? ' active' : ''}`, info.text);
    node.dataset.scope = info.scope;
    node.dataset.active = String(info.active);
    const estimatedEm = [...info.text].reduce((width, character) => {
      if (/\d/.test(character)) return width + 0.58;
      if (character === '~') return width + 0.65;
      return width + 1;
    }, 0);
    node.style.fontSize = `${Math.min(info.fontSize, perItemHeight, 68 / Math.max(estimatedEm, 1))}px`;
    node.style.opacity = info.active ? '0.32' : '0.12';
    box.append(node);
  }
  return box;
}

function rectanglesOverlap(left, right, padding = 0.6) {
  return left.left < right.right + padding
    && left.right > right.left - padding
    && left.top < right.bottom + padding
    && left.bottom > right.top - padding;
}

function makeFlowRow(level = 0) {
  const row = el('div', `zw-flow-row${level === 0 ? ' base' : ' upper'}`);
  row.dataset.level = String(level);
  return row;
}

function stackTransformationBadges(stack, lowerBoundary) {
  const badges = [...stack.children];
  if (badges.length < 2) return;
  const badgeSize = Number.parseFloat(stack.style.width) || badges[0].getBoundingClientRect().width;
  const renderedBadgeSize = stack.getBoundingClientRect().width;
  const renderedScale = renderedBadgeSize / badgeSize || 1;
  const renderedLength = Math.max(
    renderedBadgeSize,
    lowerBoundary.getBoundingClientRect().top - stack.getBoundingClientRect().top,
  );
  const availableLength = renderedLength / renderedScale;
  const step = Math.max(0, (availableLength - badgeSize) / (badges.length - 1));
  const stackHeight = badgeSize + (badges.length - 1) * step;
  stack.classList.add('stacked');
  stack.style.height = `${stackHeight}px`;
  if (stack.parentElement) stack.parentElement.style.height = stack.style.height;
  for (const [index, badge] of badges.entries()) {
    badge.style.marginBottom = '0px';
    badge.style.top = `${index * step}px`;
  }
}

function applyTransformationStackingRules() {
  for (const cell of board.querySelectorAll('.zw-palace')) {
    const threshold = cell.querySelector('.zw-small-limit-stamp') ? 2 : 3;
    const lowerBoundary = cell.querySelector('.zw-cycle-stars > span:first-child');
    if (!lowerBoundary) continue;
    for (const stack of cell.querySelectorAll('.zw-transform-stack')) {
      if (stack.children.length > threshold) stackTransformationBadges(stack, lowerBoundary);
    }
  }
}

/**
 * Keep previously placed flow stars on their row. A newly added item alone moves
 * upward when its real rendered rectangle intersects a transformation badge.
 */
function resolveFlowStarCollisions() {
  for (const flowBox of board.querySelectorAll('.zw-flow-stars')) {
    const cell = flowBox.closest('.zw-palace');
    const badges = [...cell.querySelectorAll('.zw-transform')];
    const items = [...flowBox.querySelectorAll('.zw-flow-item')]
      .sort((left, right) => Number(left.dataset.sequence) - Number(right.dataset.sequence));
    flowBox.replaceChildren();
    const rows = [makeFlowRow(0)];
    flowBox.append(rows[0]);

    for (const [sequence, item] of items.entries()) {
      let level = 0;
      while (true) {
        if (!rows[level]) {
          rows[level] = makeFlowRow(level);
          flowBox.prepend(rows[level]);
        }
        rows[level].append(item);
        const collides = sequence > 0 && badges.some((badge) => (
          rectanglesOverlap(item.getBoundingClientRect(), badge.getBoundingClientRect())
        ));
        if (!collides || level >= 4) break;
        item.remove();
        level += 1;
      }
    }
  }
}

function roleLabels(branch) {
  const dynamic = manager?.dynamicChart;
  const labels = { origin: PALACE_NAMES[chart.palaces[branch].palaceId] };
  if (!dynamic) return labels;
  for (const [level, , scope] of FLOW_SCOPE) {
    if (!dynamic.layer(level)) continue;
    labels[scope] = PALACE_NAMES[dynamic.getRoleAtBranch(branch, level)];
  }
  return labels;
}

function roleShortName(name) {
  if (!name) return '';
  if (name === '交友' || name === '交友宫') return '友';
  return [...name][0] ?? '';
}

function fixedRoleLabel(scope, prefix, name) {
  const node = el('span', `zw-role-label ${scope}${name ? '' : ' placeholder'}`, name ? `${prefix}${roleShortName(name)}` : '');
  return node;
}

function flowPreviewNode(scope, labels, fontSize) {
  if (!labels.length) return null;
  const box = el('div', `zw-flow-preview ${scope}`);
  box.style.fontSize = `${fontSize}px`;
  for (const label of labels) box.append(el('span', '', label));
  return box;
}

function compactFlowPreview(branch) {
  const context = manager?.context ?? {};
  const manifest = timelineManifest;
  if (!manifest) return null;

  if (context.day && manifest.currentDayHours?.length) {
    const labels = manifest.currentDayHours.flatMap((node) => {
      const flow = makeFlowHour(chart, context.day, node.branchIndex);
      if (flow.limit.coordinate.branch !== branch) return [];
      const hourLabel = `${node.label}${node.label.endsWith('时') ? '' : '时'}`;
      return [`${hourLabel} ${STEMS[node.stem]}${BRANCHES[node.branch]}`];
    });
    if (labels.length) return flowPreviewNode('hour', labels, 8.7 * PALACE_SCALE);
  }

  if (context.month && !context.day && manifest.currentMonthDays?.length) {
    const labels = manifest.currentMonthDays.flatMap((node) => {
      const flow = makeFlowDay(chart, context.month, node.day, node.stem);
      if (flow.limit.coordinate.branch !== branch) return [];
      return [`${LUNAR_DAYS[node.day - 1] ?? node.day} ${STEMS[node.stem]}${BRANCHES[node.branch]}`];
    });
    if (labels.length) return flowPreviewNode('day', labels, 8.8 * PALACE_SCALE);
  }

  if (context.year && !context.month && manifest.currentYearMonths?.length) {
    const labels = manifest.currentYearMonths
      .filter((node) => node.branch === branch)
      .map((node) => `${node.displayLabel} ${STEMS[node.stem]}${BRANCHES[node.displayBranch]}`);
    if (labels.length) return flowPreviewNode('month', labels, 8.9 * PALACE_SCALE);
  }

  if (context.decade && !context.year) {
    const effectiveBirthYear = chart.facts.effectiveLunarYear;
    const source = context.decade.index === 0 ? manifest.childhoods : manifest.currentDecadeYears ?? [];
    const labels = source
      .filter((node) => node.branch === branch)
      .map((node) => `${formatYear(node.year)}${node.age ?? node.year - effectiveBirthYear + 1}岁`);
    if (labels.length) return flowPreviewNode('year', labels, 10.6 * PALACE_SCALE);
  }
  return null;
}

function compactBottomSection(roleMap) {
  const roles = el('div', 'zw-compact-role-layout');
  const left = el('div', 'zw-role-column left');
  left.append(fixedRoleLabel('month', '月', roleMap.month));
  left.append(fixedRoleLabel('day', '日', roleMap.day));
  left.append(fixedRoleLabel('hour', '时', roleMap.hour));
  const name = el('span', `zw-role-name${roleMap.origin === '命宫' ? ' life' : ''}`, roleMap.origin);
  const right = el('div', 'zw-role-column right');
  right.append(fixedRoleLabel('year', '年', roleMap.year));
  right.append(fixedRoleLabel('decade', manager?.context.decade?.index === 0 ? '童' : '大', roleMap.decade));
  roles.append(left, name, right);
  return roles;
}

function verticalText(className, text, tag = 'span') {
  const node = el(tag, className);
  for (const character of [...text]) node.append(el('i', '', character));
  return node;
}

function palaceStampEnabled(kind) {
  const field = PALACE_STAMP_FIELDS[chartDisplayMode]?.[kind];
  return Boolean(field && form.elements[field]?.checked);
}

function renderPalace(branch) {
  const compact = chartDisplayMode !== 'sanhe';
  const sihua = chartDisplayMode === 'sihua';
  const palace = chart.palaces[branch];
  const [x, y] = POSITIONS[branch];
  const cell = el('div', 'zw-palace');
  cell.setAttribute('role', 'button');
  cell.tabIndex = 0;
  cell.dataset.branch = String(branch);
  cell.style.left = `${BOARD.margin + x * BOARD.cellWidth}px`;
  cell.style.top = `${BOARD.margin + y * BOARD.cellHeight}px`;
  if (selectedPalace === branch) cell.classList.add('selected');
  if (!compact && selectedPalace !== null && [4, 6, 8].some((offset) => (selectedPalace + offset) % 12 === branch)) cell.classList.add('related');

  const watermark = makeDynamicWatermarks(branch);
  if (watermark) cell.append(watermark);

  const stars = chart.getStarsAtBranch(branch);
  const topStars = stars.filter((star) => {
    if (isChangsheng(star.key) || isBottomCycle(star.key)) return false;
    if (!compact) return true;
    return star.category === 'major' || star.category === 'lucky' || star.category === 'malefic' || COMPACT_MINOR_STAR_KEYS.has(star.key);
  });
  const primaryStars = topStars.filter((star) => star.category === 'major' || star.category === 'lucky' || star.category === 'malefic');
  const secondaryStars = topStars.filter((star) => !primaryStars.includes(star));
  const flyingFrameExtra = (star) => flyingTargetMap.has(star.id) ? FLYING_TARGET_FRAME_EXTRA : 0;
  const contentHeight = BOARD.cellHeight - PALACE_METRICS.paddingY * 2;
  const topHeight = (contentHeight - PALACE_METRICS.sectionGap) * PALACE_METRICS.topFlex / (PALACE_METRICS.topFlex + PALACE_METRICS.bottomFlex);
  const innerWidth = BOARD.cellWidth - PALACE_METRICS.paddingX * 2;
  const baseStarSize = compact ? 13.8 * PALACE_SCALE : PALACE_METRICS.baseStarSize;
  const minSecondarySize = compact ? 8.8 * PALACE_SCALE : PALACE_METRICS.minSecondarySize;
  const primaryWidth = primaryStars.reduce((width, star) => width + baseStarSize + PALACE_METRICS.starSpacing + flyingFrameExtra(star), 0);
  const secondaryFrameWidth = secondaryStars.reduce((width, star) => width + flyingFrameExtra(star), 0);
  const remainingWidth = innerWidth - primaryWidth - secondaryFrameWidth;
  const secondarySize = secondaryStars.length
    ? Math.max(minSecondarySize, Math.min(baseStarSize, remainingWidth / secondaryStars.length - PALACE_METRICS.starSpacing))
    : baseStarSize;
  const starGrid = el('div', 'zw-star-grid');
  starGrid.style.width = `${innerWidth}px`;
  starGrid.style.height = `${topHeight}px`;
  const starGridInner = el('div', 'zw-star-grid-inner');
  const orderedStars = [
    ...primaryStars.map((star) => ({ star, size: baseStarSize, flyingKind:flyingTargetMap.get(star.id) ?? null })),
    ...secondaryStars.map((star) => ({ star, size: secondarySize, flyingKind:flyingTargetMap.get(star.id) ?? null })),
  ];
  let rowWidth = 0;
  let rowHeight = 0;
  for (const { star, size, flyingKind } of orderedStars) {
    starGridInner.append(makeStarColumn(star, size, baseStarSize, topHeight, { compact, sihua, flyingKind }));
    rowWidth += size + PALACE_METRICS.starSpacing + (flyingKind ? FLYING_TARGET_FRAME_EXTRA : 0);
    const charCount = [...starName(star.key)].length;
    const nameHeight = 1 * PALACE_SCALE + charCount * starLineSlotHeight(size) + Math.max(0, charCount - 1) * starCharGap(baseStarSize, size);
    const brightness = chart.getBrightnessLabel(star.brightness);
    const occupiedHeight = nameHeight
      + (flyingKind ? FLYING_TARGET_FRAME_VERTICAL_EXTRA : 0)
      + (!compact && brightness ? brightnessFontSize(size) * 1.1 : 0);
    const badgeCount = transformBadges(star.id, compact).length;
    const badgeLayout = transformationBadgeLayout(badgeCount, size);
    const intrinsicHeight = occupiedHeight + (badgeCount ? 0.5 * PALACE_SCALE + badgeLayout.height : 0);
    rowHeight = Math.max(rowHeight, intrinsicHeight);
  }
  const gridScale = Math.min(1, innerWidth / Math.max(1, rowWidth), topHeight / Math.max(1, rowHeight));
  starGridInner.style.transform = `scale(${gridScale})`;
  starGrid.append(starGridInner);
  cell.append(starGrid);

  const bottom = el('div', 'zw-bottom-section');
  const roleMap = roleLabels(branch);
  if (compact) {
    bottom.append(compactBottomSection(roleMap));
  } else {
    const cycles = resolvedBottomCycles(branch, stars.filter((star) => isBottomCycle(star.key)));
    const cycleBox = el('div', 'zw-cycle-stars');
    if (manager?.dynamicChart.smallLimitLayer?.lifePalace === branch) cycleBox.append(el('span', 'zw-small-limit-stamp', '小限'));
    for (const item of cycles) cycleBox.append(el('span', item.scope, item.name));
    bottom.append(cycleBox);
    const roles = el('div', 'zw-role-layout');
    const leftRoles = el('div', 'zw-role-column left');
    leftRoles.append(fixedRoleLabel('month', '月', roleMap.month));
    leftRoles.append(fixedRoleLabel('day', '日', roleMap.day));
    leftRoles.append(fixedRoleLabel('hour', '时', roleMap.hour));
    const rightRoles = el('div', 'zw-role-column right');
    rightRoles.append(fixedRoleLabel('year', '年', roleMap.year));
    rightRoles.append(fixedRoleLabel('decade', manager?.context.decade?.index === 0 ? '童' : '大', roleMap.decade));
    rightRoles.append(el('span', `zw-role-label origin${roleMap.origin === '命宫' ? ' life' : ''}`, roleMap.origin));
    roles.append(leftRoles, rightRoles);
    bottom.append(roles);
  }
  cell.append(bottom);

  const right = el('div', 'zw-right-info');
  const effectiveYearStem = ((chart.facts.effectiveLunarYear - 4) % 10 + 10) % 10;
  const isLaiYin = palace.stem === effectiveYearStem && branch > 1;
  const isBody = chart.bodyPalace === branch;
  // 来因宫、身宫章与流曜共用右侧空间。流运从大运开始逐层建立，
  // 因此只要存在大运上下文，就为大运及其下属流年/月/日/时统一让位。
  const hasSelectedFlow = Boolean(manager?.context.decade);
  const showLaiYin = !hasSelectedFlow && isLaiYin && palaceStampEnabled('laiyin');
  const showBody = !hasSelectedFlow && isBody && palaceStampEnabled('body');
  if (showLaiYin || showBody) {
    const stampRow = el('div', 'zw-special-stamps');
    if (showLaiYin) stampRow.append(el('span', 'zw-vertical-stamp laiyin', '来\n因'));
    if (showBody) stampRow.append(el('span', 'zw-vertical-stamp body', '身\n宫'));
    right.append(stampRow);
  }

  const flow = compact ? [] : flowStarsAtBranch(branch);
  if (flow.length) {
    const flowBox = el('div', 'zw-flow-stars');
    const baseRow = makeFlowRow(0);
    for (const [sequence, item] of flow.entries()) {
      const column = el('span', `zw-flow-item ${item.scope}`);
      column.dataset.sequence = String(sequence);
      for (const character of [...item.name]) column.append(el('i', '', character));
      baseRow.append(column);
    }
    flowBox.append(baseRow);
    right.append(flowBox);
  }

  const changsheng = compact ? null : stars.find((star) => isChangsheng(star.key));
  if (changsheng) {
    if (flow.length) right.append(el('span', 'zw-flow-changsheng-gap'));
    right.append(verticalText('zw-changsheng', starName(changsheng.key)));
  }
  if (compact) {
    const preview = compactFlowPreview(branch);
    if (preview) right.append(preview);
  }
  right.append(el('span', 'zw-ganzhi-gap'));
  right.append(verticalText('zw-palace-stem', STEMS[palace.stem], 'b'));
  right.append(verticalText('zw-palace-branch', BRANCHES[branch], 'b'));
  cell.append(right);
  const togglePalace = () => {
    selectedPalace = selectedPalace === branch ? null : branch;
    renderBoard({ refreshCenter:false });
  };
  cell.addEventListener('click', togglePalace);
  cell.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    togglePalace();
  });
  return cell;
}

function renderCenter() {
  const facts = chart.facts;
  const name = String(new FormData(form).get('name') || '').trim() || '匿名';
  const yearStem = Math.floor(facts.effectiveLunarYear % 10 + 10) % 10;
  const yinYang = yearStem % 2 === 0 ? '阳' : '阴';
  const gender = facts.gender === ZIWEI_GENDER.MALE ? '男' : '女';
  const hourBranch = ganzhiBranch(facts.lunarPillars.hour);
  const douJun = (-(facts.effectiveLunarMonth - 1) + hourBranch + 12) % 12;
  center.replaceChildren();
  const clockTime = ZonedTime.fromJulianTime(facts.jdUT1, chart.options.utcOffsetMinutes);
  { const identity=el('strong','zw-center-identity'); const person=el('span','',name); person.dataset.noI18n=''; identity.append(person,document.createTextNode(`　${yinYang}${gender}　${BUREAU_NAMES[chart.anchors.bureau] ?? `${bureauNumber(chart.anchors.bureau)}局`}`)); center.append(identity); }
  center.append(el('span', 'zw-center-time clock', `钟表：${formatCivil(clockTime)}`));
  center.append(el('span', '', `农历：${formatLunar(facts.lunarDate)} ${BRANCHES[hourBranch]}时`));
  if (chart.options.clockMode !== ZIWEI_CLOCK_MODE.CIVIL) {
    const clockLabel = chart.options.clockMode === ZIWEI_CLOCK_MODE.TRUE_SOLAR ? '真太阳时' : '平太阳时';
    center.append(el('span', 'zw-center-time virtual', `${clockLabel}：${formatCivil(facts.virtualTime)}`));
  }
  center.append(el('b', 'zw-center-masters', `命主 ${starName(getStar(chart.lifeMaster).key)} · 身主 ${starName(getStar(chart.bodyMaster).key)} · 子年斗君 ${BRANCHES[douJun]}`));
  const legend = el('div', 'zw-sihua-legend');
  for (const [, label, kind] of TRANSFORMS) legend.append(el('i', kind, label));
  center.append(legend);
  const active = makeCenterFlow();
  if (centerBaziVisible()) center.append(makeCenterBazi(facts.solarTermPillars, active));
  else if (active.childElementCount) center.append(active);
}

function makeCenterFlow() {
  const context = manager?.context ?? {};
  const active = el('div', 'zw-center-flow');
  if (context.decade) active.append(el('span', 'decade', `${context.decade.index === 0 ? '童限' : '大限'} ${STEMS[context.decade.limit.coordinate.stem]}${BRANCHES[context.decade.limit.coordinate.branch]}`));
  if (context.year) active.append(el('span', 'year', `流年 ${context.year.year}`));
  if (context.month) {
    const monthLabel = context.month.displayLabel
      ?? `${context.month.isLeap ? '闰' : ''}${WATERMARK_MONTHS[context.month.month - 1] ?? context.month.month}月`;
    active.append(el('span', 'month', monthLabel));
  }
  if (context.day) active.append(el('span', 'day', LUNAR_DAYS[context.day.day - 1] ?? String(context.day.day)));
  if (context.hour) active.append(el('span', 'hour', `${BRANCHES[context.hour.limit.coordinate.branch]}时`));
  return active;
}

function centerBaziVisible() {
  const field = {
    sanhe:'centerBaziSanhe',
    sihua:'centerBaziSihua',
    flying:'centerBaziFlying',
  }[chartDisplayMode];
  return Boolean(field && form.elements[field]?.checked);
}

function baziElementClassFromStem(stem) {
  return BAZI_ELEMENT_NAMES[STEM_ELEMENTS[stem]];
}

function tenGod(dayStem, targetStem) {
  const dayElement = STEM_ELEMENTS[dayStem];
  const targetElement = STEM_ELEMENTS[targetStem];
  const samePolarity = dayStem % 2 === targetStem % 2;
  if (targetElement === dayElement) return samePolarity ? '比肩' : '劫财';
  if (targetElement === (dayElement + 1) % 5) return samePolarity ? '食神' : '伤官';
  if (targetElement === (dayElement + 2) % 5) return samePolarity ? '偏财' : '正财';
  if (targetElement === (dayElement + 3) % 5) return samePolarity ? '七杀' : '正官';
  return samePolarity ? '偏印' : '正印';
}

function centerBaziFortunes() {
  const facts = chart.facts;
  try {
    const baziOptions = new BaziCore.BaziOptions({
      mode:chart.options.mode,
      dayBoundaryMode:chart.options.dayBoundaryMode,
      utcOffsetMinutes:chart.options.utcOffsetMinutes,
      meridianDeg:chart.options.meridianDeg,
      pillarHistoricalMode:chart.options.pillarHistoricalMode,
      ratHourMode:chart.options.ratHourMode,
      gender:facts.gender === ZIWEI_GENDER.FEMALE ? BaziCore.GENDER.FEMALE : BaziCore.GENDER.MALE,
      clockMode:BaziCore.BAZI_CLOCK_MODE.CIVIL,
      daYunCount:8,
    });
    const baziChart = BaziCore.BaziChart.fromInstant(facts.jdUT1, facts.virtualTime, baziOptions);
    return baziChart.getDaYunTable();
  } catch (error) {
    console.warn('中宫八字大运计算失败，保留四柱显示。', error);
    return [];
  }
}

function makeCenterBazi(pillars, flowNode = null) {
  const values = [pillars.year, pillars.month, pillars.day, pillars.hour];
  const dayStem = ganzhiStem(pillars.day);
  const section = el('div', 'zw-center-bazi');
  const viewport = el('div', 'zw-center-bazi-viewport');
  const content = el('div', 'zw-center-bazi-content');
  const row = el('div', 'zw-bazi-pillars');
  for (const [index, value] of values.entries()) {
    const stem = ganzhiStem(value);
    const branch = ganzhiBranch(value);
    const mainStem = BRANCH_MAIN_STEMS[branch];
    const pillar = el('div', 'zw-bazi-pillar');
    const top = el('span', `zw-bazi-relation ${index === 2 ? 'day-master' : baziElementClassFromStem(stem)}`, index === 2 ? '日主' : tenGod(dayStem, stem));
    const stemNode = el('b', `zw-bazi-char ${baziElementClassFromStem(stem)}`, STEMS[stem]);
    const branchNode = el('b', `zw-bazi-char ${BAZI_ELEMENT_NAMES[BRANCH_ELEMENTS[branch]]}`, BRANCHES[branch]);
    const bottom = el('span', `zw-bazi-relation ${baziElementClassFromStem(mainStem)}`, tenGod(dayStem, mainStem));
    pillar.append(top, stemNode, branchNode, bottom);
    row.append(pillar);
  }
  const decades = el('div', 'zw-bazi-decades');
  for (const entry of centerBaziFortunes()) {
    const stem = ganzhiStem(entry.pillar);
    const branch = ganzhiBranch(entry.pillar);
    const decade = el('div', 'zw-bazi-decade');
    const startYear = entry.startCivilTime.year;
    const yearNode = el(
      'span',
      `zw-bazi-decade-year${startYear <= 0 ? ' bce' : ''}`,
      startYear > 0 ? String(startYear) : `前${1 - startYear}`,
    );
    decade.append(
      el('span', 'zw-bazi-decade-age', String(entry.startVirtualAge)),
      el('b', `zw-bazi-decade-char ${baziElementClassFromStem(stem)}`, STEMS[stem]),
      el('b', `zw-bazi-decade-char ${BAZI_ELEMENT_NAMES[BRANCH_ELEMENTS[branch]]}`, BRANCHES[branch]),
      yearNode,
    );
    decades.append(decade);
  }
  content.append(row);
  if (decades.childElementCount) content.append(decades);
  viewport.append(content);
  section.append(viewport);
  if (flowNode) section.append(flowNode);
  section.append(el('small', 'zw-center-author', 'Authored by RedSC1'));
  return section;
}

function centerAnchor(branch) {
  const left = BOARD.margin + BOARD.cellWidth;
  const top = BOARD.margin + BOARD.cellHeight;
  const width = BOARD.cellWidth * 2;
  const height = BOARD.cellHeight * 2;
  return {
    5:[left,top],6:[left+width*.25,top],7:[left+width*.75,top],8:[left+width,top],
    9:[left+width,top+height*.25],10:[left+width,top+height*.75],11:[left+width,top+height],
    0:[left+width*.75,top+height],1:[left+width*.25,top+height],2:[left,top+height],
    3:[left,top+height*.75],4:[left,top+height*.25],
  }[branch];
}

function insetConnectionNode(branch, point, inset = 3) {
  const [x, y] = POSITIONS[branch];
  return [
    point[0] + (x === 0 ? inset : x === 3 ? -inset : 0),
    point[1] + (y === 0 ? inset : y === 3 ? -inset : 0),
  ];
}

function palaceArrowBoundary(branch) {
  const [x, y] = POSITIONS[branch];
  const left = BOARD.margin + x * BOARD.cellWidth;
  const top = BOARD.margin + y * BOARD.cellHeight;
  const right = left + BOARD.cellWidth;
  const bottom = top + BOARD.cellHeight;
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  const diagonal = Math.SQRT1_2;
  switch (branch) {
    case 5: return { outer:[left,top], inner:[right,bottom], tangent:[diagonal,-diagonal], route:'top' };
    case 6:
    case 7: return { outer:[centerX,top], inner:[centerX,bottom], tangent:[1,0], route:'top' };
    case 8: return { outer:[right,top], inner:[left,bottom], tangent:[diagonal,diagonal], route:'top' };
    case 9:
    case 10: return { outer:[right,centerY], inner:[left,centerY], tangent:[0,1], route:'right' };
    case 11: return { outer:[right,bottom], inner:[left,top], tangent:[-diagonal,diagonal], route:'bottom' };
    case 0:
    case 1: return { outer:[centerX,bottom], inner:[centerX,top], tangent:[1,0], route:'bottom' };
    case 2: return { outer:[left,bottom], inner:[right,top], tangent:[-diagonal,-diagonal], route:'bottom' };
    case 3:
    case 4: return { outer:[left,centerY], inner:[right,centerY], tangent:[0,1], route:'left' };
    default: throw new RangeError(`unknown branch: ${branch}`);
  }
}

function normalizedDirection(from, to) {
  const dx = from[0] - to[0];
  const dy = from[1] - to[1];
  const length = Math.hypot(dx, dy);
  return length ? [dx / length, dy / length] : [0, 0];
}

function arrowShift(index, step) {
  if (index === 0) return 0;
  const factor = Math.ceil(index / 2);
  return (index % 2 === 0 ? -factor : factor) * step;
}

function svgPoint(value) {
  return String(Number(value.toFixed(3)));
}

function styleSihuaArrowShape(node, kind) {
  node.setAttribute('class', 'zw-sihua-arrow');
  node.setAttribute('fill', 'none');
  node.setAttribute('stroke', `var(--zw-sihua-${kind})`);
  node.setAttribute('stroke-width', String(1.5 * PALACE_SCALE));
  node.setAttribute('stroke-linecap', 'butt');
  node.setAttribute('stroke-linejoin', 'miter');
}

function appendSihuaArrow(branch, task, offsetIndex) {
  const ns = 'http://www.w3.org/2000/svg';
  const boundary = palaceArrowBoundary(branch);
  const oppositeBranch = (branch + 6) % 12;
  const direction = normalizedDirection(centerAnchor(branch), centerAnchor(oppositeBranch));
  const [gridX, gridY] = POSITIONS[branch];
  const isCorner = (gridX === 0 || gridX === 3) && (gridY === 0 || gridY === 3);
  const shift = arrowShift(offsetIndex, (isCorner ? 6 : 8) * PALACE_SCALE);
  const anchorBase = task.isCentrifugal ? boundary.outer : boundary.inner;
  const anchor = [
    anchorBase[0] + boundary.tangent[0] * shift,
    anchorBase[1] + boundary.tangent[1] * shift,
  ];
  const arrowDirection = task.isCentrifugal ? direction : [-direction[0], -direction[1]];
  const start = [anchor[0] - arrowDirection[0] * 2, anchor[1] - arrowDirection[1] * 2];
  const end = [
    anchor[0] + arrowDirection[0] * 10 * PALACE_SCALE,
    anchor[1] + arrowDirection[1] * 10 * PALACE_SCALE,
  ];
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
  const headLength = 4.5 * PALACE_SCALE;
  const headAngle = Math.PI / 6;
  const leftTip = [
    end[0] - headLength * Math.cos(angle - headAngle),
    end[1] - headLength * Math.sin(angle - headAngle),
  ];
  const rightTip = [
    end[0] - headLength * Math.cos(angle + headAngle),
    end[1] - headLength * Math.sin(angle + headAngle),
  ];
  const group = document.createElementNS(ns, 'g');
  group.setAttribute('class', `zw-sihua-task ${task.kind}`);
  group.dataset.branch = String(branch);
  group.dataset.direction = task.isCentrifugal ? 'outward' : 'inward';
  group.dataset.kind = task.kind;
  const shaft = document.createElementNS(ns, 'line');
  styleSihuaArrowShape(shaft, task.kind);
  shaft.setAttribute('x1', svgPoint(start[0]));
  shaft.setAttribute('y1', svgPoint(start[1]));
  shaft.setAttribute('x2', svgPoint(end[0]));
  shaft.setAttribute('y2', svgPoint(end[1]));
  const head = document.createElementNS(ns, 'path');
  styleSihuaArrowShape(head, task.kind);
  head.setAttribute('d', `M ${svgPoint(leftTip[0])} ${svgPoint(leftTip[1])} L ${svgPoint(end[0])} ${svgPoint(end[1])} L ${svgPoint(rightTip[0])} ${svgPoint(rightTip[1])}`);
  group.append(shaft, head);
  sihuaSvg.append(group);
}

function renderSihuaArrows() {
  sihuaSvg.replaceChildren();
  if (!chart) return;
  const tasks = Array.from({ length: 12 }, () => []);
  for (let branch = 0; branch < 12; branch += 1) {
    for (const star of chart.getStarsAtBranch(branch)) {
      for (const kind of SIHUA_ARROW_KINDS) {
        if (chart.hasTransform(star.id, kind.outward)) {
          tasks[branch].push({ ...kind, isCentrifugal:true });
        }
        if (chart.hasTransform(star.id, kind.inward)) {
          tasks[(branch + 6) % 12].push({ ...kind, isCentrifugal:false });
        }
      }
    }
  }
  for (let branch = 0; branch < 12; branch += 1) {
    let outwardCount = 0;
    let inwardCount = 0;
    for (const task of tasks[branch]) {
      const offsetIndex = task.isCentrifugal ? outwardCount++ : inwardCount++;
      appendSihuaArrow(branch, task, offsetIndex);
    }
  }
}

function sihuaRuleForStem(stem) {
  const field = { 4:'sihuaWu', 6:'sihuaGeng', 8:'sihuaRen', 9:'sihuaGui' }[stem];
  const option = field ? String(form.elements[field]?.value || 'option1') : 'option1';
  return SIHUA_RULE_OPTIONS[stem]?.[option] ?? SIHUA_RULE_OPTIONS[stem]?.option1 ?? null;
}

function selectedFlyingTargets() {
  if (selectedPalace === null || !chart) return new Map();
  const rule = sihuaRuleForStem(chart.palaces[selectedPalace].stem);
  if (!rule) return new Map();
  return new Map(TRANSFORM_FIELDS.map(([kind]) => [rule[kind], kind]));
}

function flyingArrowEnabled() {
  return Boolean(form.elements.flyingStarArrow?.checked);
}

function elementRectInBoard(node) {
  const rootRect = board.getBoundingClientRect();
  const rect = node.getBoundingClientRect();
  const scaleX = rootRect.width / BOARD.width || 1;
  const scaleY = rootRect.height / BOARD.height || 1;
  return {
    left:(rect.left - rootRect.left) / scaleX,
    top:(rect.top - rootRect.top) / scaleY,
    right:(rect.right - rootRect.left) / scaleX,
    bottom:(rect.bottom - rootRect.top) / scaleY,
    width:rect.width / scaleX,
    height:rect.height / scaleY,
    center:[(rect.left + rect.right - rootRect.left * 2) / (2 * scaleX), (rect.top + rect.bottom - rootRect.top * 2) / (2 * scaleY)],
  };
}

function appendSvgArrow(start, end, { className = 'zw-flying-arrow', color = 'rgba(95,103,112,.69)', label = '', labelColor = color } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const group = document.createElementNS(ns, 'g');
  const line = document.createElementNS(ns, 'line');
  line.setAttribute('class', className);
  line.setAttribute('stroke', color);
  line.setAttribute('x1', svgPoint(start[0])); line.setAttribute('y1', svgPoint(start[1]));
  line.setAttribute('x2', svgPoint(end[0])); line.setAttribute('y2', svgPoint(end[1]));
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
  const headLength = 5 * PALACE_SCALE;
  const headAngle = Math.PI / 6;
  const left = [end[0] - headLength * Math.cos(angle - headAngle), end[1] - headLength * Math.sin(angle - headAngle)];
  const right = [end[0] - headLength * Math.cos(angle + headAngle), end[1] - headLength * Math.sin(angle + headAngle)];
  const head = document.createElementNS(ns, 'path');
  head.setAttribute('class', className);
  head.setAttribute('stroke', color);
  head.setAttribute('d', `M ${svgPoint(left[0])} ${svgPoint(left[1])} L ${svgPoint(end[0])} ${svgPoint(end[1])} L ${svgPoint(right[0])} ${svgPoint(right[1])}`);
  group.append(line, head);
  if (label) {
    const textNode = document.createElementNS(ns, 'text');
    textNode.setAttribute('class', 'zw-mode-label');
    textNode.setAttribute('fill', labelColor);
    textNode.setAttribute('x', svgPoint(end[0]));
    textNode.setAttribute('y', svgPoint(end[1] + (end[1] < BOARD.height / 2 ? -5 : 6)));
    textNode.textContent = label;
    group.append(textNode);
  }
  sihuaSvg.append(group);
}

function targetEdgeAnchor(rect, from) {
  const [cx, cy] = rect.center;
  const dx = from[0] - cx;
  const dy = from[1] - cy;
  const tx = dx === 0 ? Infinity : (rect.width / 2) / Math.abs(dx);
  const ty = dy === 0 ? Infinity : (rect.height / 2) / Math.abs(dy);
  const t = Math.min(tx, ty);
  return [cx + dx * t, cy + dy * t];
}

function renderSelectedFlyingArrows() {
  const targets = selectedFlyingTargets();
  if (!targets.size || selectedPalace === null) return;
  const sourceNode = board.querySelector(`.zw-palace[data-branch="${selectedPalace}"] .zw-palace-stem`);
  if (!sourceNode) return;
  const sourceRect = elementRectInBoard(sourceNode);
  for (const [starId, kind] of targets) {
    const column = board.querySelector(`.zw-star-column[data-star-id="${starId}"]`);
    const targetNode = column?.querySelector('.zw-star-name');
    if (!targetNode) continue;
    const targetRect = elementRectInBoard(targetNode);
    const dx = targetRect.center[0] - sourceRect.center[0];
    const dy = targetRect.center[1] - sourceRect.center[1];
    const length = Math.hypot(dx, dy);
    if (!length) continue;
    const unit = [dx / length, dy / length];
    const hidden = Math.max(sourceRect.width, sourceRect.height) / 2 + 2;
    const start = [sourceRect.center[0] + unit[0] * hidden, sourceRect.center[1] + unit[1] * hidden];
    const end = targetEdgeAnchor(targetRect, sourceRect.center);
    appendSvgArrow(start, end, { color:`var(--zw-sihua-${kind})` });
  }
}

function modeDirection(start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy);
  return length ? [dx / length, dy / length] : [0, 0];
}

function appendModeShaft(points) {
  const ns = 'http://www.w3.org/2000/svg';
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('class', 'zw-mode-line');
  path.setAttribute('d', points.map((point, index) => `${index ? 'L' : 'M'} ${svgPoint(point[0])} ${svgPoint(point[1])}`).join(' '));
  sihuaSvg.append(path);
}

function appendModeArrowHead(start, end) {
  const ns = 'http://www.w3.org/2000/svg';
  const headLength = 5 * PALACE_SCALE;
  const headAngle = Math.PI / 6;
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
  const left = [end[0] - headLength * Math.cos(angle - headAngle), end[1] - headLength * Math.sin(angle - headAngle)];
  const right = [end[0] - headLength * Math.cos(angle + headAngle), end[1] - headLength * Math.sin(angle + headAngle)];
  const head = document.createElementNS(ns, 'path');
  head.setAttribute('class', 'zw-mode-line');
  head.setAttribute('d', `M ${svgPoint(left[0])} ${svgPoint(left[1])} L ${svgPoint(end[0])} ${svgPoint(end[1])} L ${svgPoint(right[0])} ${svgPoint(right[1])}`);
  sihuaSvg.append(head);
}

function modeCornerLabelInset(endPoint, branch) {
  if (branch === undefined || branch === null) return [0, 0];
  const [gridX, gridY] = POSITIONS[branch];
  if ((gridX !== 0 && gridX !== 3) || (gridY !== 0 && gridY !== 3)) return [0, 0];
  const inner = palaceArrowBoundary(branch).inner;
  if (Math.hypot(endPoint[0] - inner[0], endPoint[1] - inner[1]) > 16 * PALACE_SCALE) return [0, 0];
  const boardCenter = [BOARD.width / 2, BOARD.height / 2];
  const inward = modeDirection(inner, boardCenter);
  return [inward[0] * 9 * PALACE_SCALE, inward[1] * 9 * PALACE_SCALE];
}

function appendModeLabelList(endPoint, direction, kinds, laneIndex = 0, branch = null) {
  if (!kinds.length) return;
  const ns = 'http://www.w3.org/2000/svg';
  const dir = modeDirection([0, 0], direction);
  const normal = [-dir[1], dir[0]];
  const alongOffset = (3 + laneIndex * 1.2) * PALACE_SCALE;
  const isHorizontal = Math.abs(dir[0]) > 0.9 && Math.abs(dir[1]) < 0.1;
  const sideOffset = (isHorizontal ? 18 : 7) * PALACE_SCALE;
  const cornerInset = modeCornerLabelInset(endPoint, branch);
  const anchor = [
    endPoint[0] - dir[0] * alongOffset + normal[0] * sideOffset + cornerInset[0],
    endPoint[1] - dir[1] * alongOffset + normal[1] * sideOffset + cornerInset[1],
  ];
  const fontSize = Math.max(10, Math.min(20, 12 * PALACE_SCALE));
  const spacing = 2 * PALACE_SCALE;
  const shadowBlur = Math.max(1, Math.min(4, 2 * PALACE_SCALE));
  const labels = [];
  for (const kind of kinds) {
    const textNode = document.createElementNS(ns, 'text');
    textNode.setAttribute('class', 'zw-mode-label');
    textNode.setAttribute('fill', `var(--zw-sihua-${kind})`);
    textNode.setAttribute('x', '0');
    textNode.setAttribute('y', svgPoint(anchor[1]));
    textNode.style.fontSize = `${fontSize}px`;
    textNode.style.filter = `drop-shadow(0 0 ${shadowBlur}px white)`;
    textNode.textContent = SIHUA_LETTERS[kind];
    sihuaSvg.append(textNode);
    const width = textNode.getComputedTextLength() || textNode.getBBox().width || fontSize * 0.72;
    labels.push({ textNode, width });
  }
  const totalWidth = labels.reduce((sum, label) => sum + label.width, 0) + Math.max(0, labels.length - 1) * spacing;
  if (branch !== null) {
    const [gridX, gridY] = POSITIONS[branch];
    const inner = palaceArrowBoundary(branch).inner;
    const isCornerEndpoint = (gridX === 0 || gridX === 3)
      && (gridY === 0 || gridY === 3)
      && Math.hypot(endPoint[0] - inner[0], endPoint[1] - inner[1]) <= 16 * PALACE_SCALE;
    if (isCornerEndpoint) {
      const centerLeft = BOARD.margin + BOARD.cellWidth;
      const centerTop = BOARD.margin + BOARD.cellHeight;
      const centerRight = centerLeft + BOARD.cellWidth * 2;
      const centerBottom = centerTop + BOARD.cellHeight * 2;
      const inset = 3 * PALACE_SCALE;
      anchor[0] = gridX === 0
        ? Math.max(anchor[0], centerLeft + inset + totalWidth / 2)
        : Math.min(anchor[0], centerRight - inset - totalWidth / 2);
      anchor[1] = gridY === 0
        ? Math.max(anchor[1], centerTop + inset + fontSize / 2)
        : Math.min(anchor[1], centerBottom - inset - fontSize / 2);
      for (const label of labels) label.textNode.setAttribute('y', svgPoint(anchor[1]));
    }
  }
  let left = anchor[0] - totalWidth / 2;
  for (const label of labels) {
    label.textNode.setAttribute('x', svgPoint(left + label.width / 2));
    left += label.width + spacing;
  }
}

function modeCellRect(branch) {
  const [x, y] = POSITIONS[branch];
  const left = BOARD.margin + x * BOARD.cellWidth;
  const top = BOARD.margin + y * BOARD.cellHeight;
  return { left, top, right:left + BOARD.cellWidth, bottom:top + BOARD.cellHeight };
}

function sihuaOutwardAnchor(branch, starId, kind, laneIndex) {
  const cellRect = modeCellRect(branch);
  const column = board.querySelector(`.zw-palace[data-branch="${branch}"] .zw-star-column[data-star-id="${starId}"]`);
  const badge = column?.querySelector(`.zw-transform[data-kind="${kind}"]`);
  const targetRect = badge ? elementRectInBoard(badge) : column ? elementRectInBoard(column) : null;
  if (targetRect) {
    return [targetRect.center[0], Math.max(cellRect.top, Math.min(cellRect.bottom, targetRect.bottom + 2))];
  }
  const boundary = palaceArrowBoundary(branch);
  const shift = arrowShift(laneIndex, 7);
  return [boundary.outer[0] + boundary.tangent[0] * shift, boundary.outer[1] + boundary.tangent[1] * shift];
}

function sihuaPalaceObstacleBottom(branch) {
  const cellRect = modeCellRect(branch);
  let bottom = cellRect.top;
  for (const node of board.querySelectorAll(`.zw-palace[data-branch="${branch}"] .zw-star-column, .zw-palace[data-branch="${branch}"] .zw-transform`)) {
    bottom = Math.max(bottom, elementRectInBoard(node).bottom);
  }
  return Math.max(cellRect.top, Math.min(cellRect.bottom, bottom));
}

function orderedSihuaKinds(values) {
  const set = values instanceof Set ? values : new Set(values);
  return SIHUA_ARROW_KINDS.map((item) => item.kind).filter((kind) => set.has(kind));
}

function renderSihuaModeArrows() {
  const inwardBuckets = new Map();
  const outwardTasks = [];
  const outwardSeen = new Set();
  const laneCounts = Array(12).fill(0);

  for (let target = 0; target < 12; target += 1) {
    const source = (target + 6) % 12;
    for (const star of chart.getStarsAtBranch(target)) {
      for (const transform of SIHUA_ARROW_KINDS) {
        if (chart.hasTransform(star.id, transform.inward)) {
          const a = Math.min(source, target);
          const b = Math.max(source, target);
          const key = `${a}:${b}`;
          if (!inwardBuckets.has(key)) inwardBuckets.set(key, { a, b, aToB:new Set(), bToA:new Set() });
          const bucket = inwardBuckets.get(key);
          (source === a ? bucket.aToB : bucket.bToA).add(transform.kind);
        }
        if (chart.hasTransform(star.id, transform.outward)) {
          const key = `${target}:${transform.kind}`;
          if (outwardSeen.has(key)) continue;
          outwardSeen.add(key);
          const laneIndex = laneCounts[target]++;
          outwardTasks.push({ branch:target, starId:star.id, kind:transform.kind, laneIndex });
        }
      }
    }
  }

  for (const bucket of [...inwardBuckets.values()].sort((left, right) => left.a - right.a)) {
    const startAnchor = palaceArrowBoundary(bucket.a).inner;
    const endAnchor = palaceArrowBoundary(bucket.b).inner;
    const direction = modeDirection(startAnchor, endAnchor);
    if (!direction[0] && !direction[1]) continue;
    const start = [startAnchor[0] + direction[0] * 3 * PALACE_SCALE, startAnchor[1] + direction[1] * 3 * PALACE_SCALE];
    const end = [endAnchor[0] - direction[0] * 3 * PALACE_SCALE, endAnchor[1] - direction[1] * 3 * PALACE_SCALE];
    appendModeShaft([start, end]);
    const aToB = orderedSihuaKinds(bucket.aToB);
    const bToA = orderedSihuaKinds(bucket.bToA);
    if (aToB.length) {
      appendModeArrowHead(start, end);
      appendModeLabelList(end, direction, aToB, 0, bucket.b);
    }
    if (bToA.length) {
      appendModeArrowHead(end, start);
      appendModeLabelList(start, [-direction[0], -direction[1]], bToA, 0, bucket.a);
    }
  }

  const guide = {
    left:BOARD.margin - 10,
    top:BOARD.margin - 10,
    right:BOARD.width - BOARD.margin + 10,
    bottom:BOARD.height - BOARD.margin + 10,
  };
  for (const task of outwardTasks) {
    const boundary = palaceArrowBoundary(task.branch);
    const anchor = sihuaOutwardAnchor(task.branch, task.starId, task.kind, task.laneIndex);
    if (boundary.route === 'top' || boundary.route === 'bottom') {
      const end = [anchor[0], boundary.route === 'top' ? guide.top : guide.bottom];
      appendModeShaft([anchor, end]);
      const direction = modeDirection(anchor, end);
      appendModeArrowHead(anchor, end);
      appendModeLabelList(end, direction, [task.kind]);
      continue;
    }
    const safeBottom = sihuaPalaceObstacleBottom(task.branch);
    const bendY = Math.max(anchor[1] + 10 * PALACE_SCALE, safeBottom + 6 * PALACE_SCALE + task.laneIndex * 12 * PALACE_SCALE);
    const firstBend = [anchor[0], bendY];
    const end = [boundary.route === 'left' ? guide.left : guide.right, bendY];
    appendModeShaft([anchor, firstBend, end]);
    const direction = modeDirection(firstBend, end);
    appendModeArrowHead(firstBend, end);
    appendModeLabelList(end, direction, [task.kind], task.laneIndex);
  }
}

function renderModeArrows() {
  sihuaSvg.replaceChildren();
  if (!chart) return;
  if (chartDisplayMode === 'sihua') renderSihuaModeArrows();
  else renderSihuaArrows();
  if (flyingArrowEnabled()) renderSelectedFlyingArrows();
}

function renderConnections() {
  boardSvg.replaceChildren();
  if (chartDisplayMode !== 'sanhe' || selectedPalace === null) return;
  const ns = 'http://www.w3.org/2000/svg';
  const oppositeBranch = (selectedPalace + 6) % 12;
  const trine1Branch = (selectedPalace + 4) % 12;
  const trine2Branch = (selectedPalace + 8) % 12;
  // Every visible part of the guide shares these inset nodes. Keeping the
  // path, opposite line, and dots on one coordinate source prevents their
  // endpoints from separating when a node is moved off a grid boundary.
  const start = insetConnectionNode(selectedPalace, centerAnchor(selectedPalace));
  const opposite = insetConnectionNode(oppositeBranch, centerAnchor(oppositeBranch));
  const trine1 = insetConnectionNode(trine1Branch, centerAnchor(trine1Branch));
  const trine2 = insetConnectionNode(trine2Branch, centerAnchor(trine2Branch));
  const triangle = document.createElementNS(ns, 'path');
  triangle.setAttribute('d', `M ${start[0]} ${start[1]} L ${trine1[0]} ${trine1[1]} L ${trine2[0]} ${trine2[1]} Z`);
  triangle.setAttribute('class', 'trine');
  boardSvg.append(triangle);
  const oppositeLine = document.createElementNS(ns, 'line');
  oppositeLine.setAttribute('x1', start[0]); oppositeLine.setAttribute('y1', start[1]);
  oppositeLine.setAttribute('x2', opposite[0]); oppositeLine.setAttribute('y2', opposite[1]);
  boardSvg.append(oppositeLine);
  for (const node of [start, opposite, trine1, trine2]) {
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', node[0]); circle.setAttribute('cy', node[1]); circle.setAttribute('r', '1.4');
    boardSvg.append(circle);
  }
}

function renderBoard({ refreshCenter = true } = {}) {
  if (!chart) return;
  flyingTargetMap = selectedFlyingTargets();
  timelineManifest = manager?.manifest ?? null;
  board.classList.remove('mode-sanhe', 'mode-sihua', 'mode-flying');
  board.classList.add(`mode-${chartDisplayMode}`);
  board.querySelectorAll('.zw-palace').forEach((node) => node.remove());
  for (const branch of Object.keys(POSITIONS).map(Number)) board.append(renderPalace(branch));
  if (refreshCenter) renderCenter();
  renderConnections();
  renderModeArrows();
  applyTransformationStackingRules();
  resolveFlowStarCollisions();
  scheduleFlyingTargetTextAlignment();
}

let flyingTargetAlignmentFrame = 0;
const flyingTextMeasureCanvas = document.createElement('canvas');
const flyingTextMeasureContext = flyingTextMeasureCanvas.getContext('2d', { willReadFrequently:true });
const flyingGlyphCentroidCache = new Map();

function canvasFont(style) {
  return [style.fontStyle, style.fontVariant, style.fontWeight, style.fontSize, style.fontFamily]
    .filter((part) => part && part !== 'normal')
    .join(' ');
}

function flyingGlyphInkGeometry(style, text, layoutScale, lineLeft) {
  const font = canvasFont(style);
  // The board is enlarged with a CSS transform. Chromium/WebKit rasterise the
  // glyph at its source font size and transform that layer afterwards, so the
  // measurement canvas must use source device pixels rather than multiplying
  // the font raster by the board scale a second time.
  const rasterScale = Math.max(1, window.devicePixelRatio || 1);
  const sourceLineLeft = lineLeft / Math.max(layoutScale, Number.EPSILON);
  const originPhase = ((sourceLineLeft * rasterScale) % 1 + 1) % 1;
  const key = `${font}\u0000${text}\u0000${rasterScale.toFixed(4)}\u0000${originPhase.toFixed(4)}`;
  const cached = flyingGlyphCentroidCache.get(key);
  if (cached !== undefined) return cached;

  // TextMetrics describes the outline envelope, whose midpoint is not the
  // visual centre for asymmetric CJK glyphs such as 阴/阳.  Rasterise at the
  // board's effective device-pixel scale and use the alpha-weighted ink
  // centroid instead.  Matching the text origin's subpixel phase also keeps
  // the result stable when the whole board is responsively scaled.
  // This derives the offset from the active font itself; it is not a per-font
  // or per-device compensation constant.
  const fontSize = Number.parseFloat(style.fontSize) || 1;
  const cssWidth = fontSize * 4 + 8;
  const cssHeight = fontSize * 3 + 8;
  flyingTextMeasureCanvas.width = Math.ceil(cssWidth * rasterScale);
  flyingTextMeasureCanvas.height = Math.ceil(cssHeight * rasterScale);
  flyingTextMeasureContext.setTransform(rasterScale, 0, 0, rasterScale, 0, 0);
  flyingTextMeasureContext.font = font;
  flyingTextMeasureContext.textAlign = 'left';
  flyingTextMeasureContext.textBaseline = 'alphabetic';
  flyingTextMeasureContext.fillStyle = '#000';
  const originPixels = Math.ceil((fontSize * 1.5 + 4) * rasterScale) + originPhase;
  const originX = originPixels / rasterScale;
  const baselineY = fontSize * 1.7 + 4;
  flyingTextMeasureContext.fillText(text, originX, baselineY);

  const pixels = flyingTextMeasureContext.getImageData(
    0, 0, flyingTextMeasureCanvas.width, flyingTextMeasureCanvas.height,
  ).data;
  let alphaTotal = 0;
  let weightedX = 0;
  let firstInkPixel = Number.POSITIVE_INFINITY;
  let lastInkPixel = Number.NEGATIVE_INFINITY;
  for (let pixel = 0, offset = 3; offset < pixels.length; pixel += 1, offset += 4) {
    const alpha = pixels[offset];
    if (!alpha) continue;
    const pixelX = pixel % flyingTextMeasureCanvas.width;
    alphaTotal += alpha;
    weightedX += (pixelX + 0.5) * alpha;
    firstInkPixel = Math.min(firstInkPixel, pixelX);
    lastInkPixel = Math.max(lastInkPixel, pixelX);
  }
  const fallbackCenter = flyingTextMeasureContext.measureText(text).width / 2;
  const geometry = alphaTotal ? {
    centroid:weightedX / alphaTotal / rasterScale - originX,
    left:firstInkPixel / rasterScale - originX,
    right:(lastInkPixel + 1) / rasterScale - originX,
  } : { centroid:fallbackCenter, left:0, right:fallbackCenter * 2 };
  if (flyingGlyphCentroidCache.size >= 256) flyingGlyphCentroidCache.clear();
  flyingGlyphCentroidCache.set(key, geometry);
  return geometry;
}

function flyingTargetInkRect(span, fallbackScaleX, fallbackScaleY, sampleText = null) {
  const glyph = span.querySelector(':scope > .zw-star-glyph') ?? span;
  const range = document.createRange();
  range.selectNodeContents(glyph);
  const lineRect = range.getBoundingClientRect();
  const style = getComputedStyle(glyph);
  flyingTextMeasureContext.font = canvasFont(style);
  const metrics = flyingTextMeasureContext.measureText(sampleText ?? glyph.textContent ?? '');
  const fontSize = Number.parseFloat(style.fontSize) || 1;
  const lineHeight = Number.parseFloat(style.lineHeight) || fontSize;
  const scaleX = metrics.width > 0 ? lineRect.width / metrics.width : fallbackScaleX;
  const scaleY = lineHeight > 0 ? lineRect.height / lineHeight : fallbackScaleY;
  const fontAscent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent ?? fontSize * 0.8;
  const fontDescent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent ?? fontSize * 0.2;
  const baseline = lineRect.top + ((lineHeight - fontAscent - fontDescent) / 2 + fontAscent) * scaleY;
  const inkGeometry = flyingGlyphInkGeometry(
    style, sampleText ?? glyph.textContent ?? '', scaleX, lineRect.left,
  );
  return {
    left:lineRect.left - (metrics.actualBoundingBoxLeft ?? 0) * scaleX,
    right:lineRect.left + (metrics.actualBoundingBoxRight ?? metrics.width) * scaleX,
    centerX:lineRect.left + inkGeometry.centroid * scaleX,
    top:baseline - (metrics.actualBoundingBoxAscent ?? fontAscent) * scaleY,
    bottom:baseline + (metrics.actualBoundingBoxDescent ?? fontDescent) * scaleY,
    scaleX,
    scaleY,
  };
}

function alignStarColumnTops() {
  const names = [...board.querySelectorAll('.zw-star-column:not(.zw-flying-target) .zw-star-name')];
  for (const name of names) {
    for (const span of name.querySelectorAll(':scope > span')) span.style.top = '0px';
  }
  const boardRect = board.getBoundingClientRect();
  const scaleX = boardRect.width / BOARD.width || 1;
  const scaleY = boardRect.height / BOARD.height || 1;
  for (const grid of board.querySelectorAll('.zw-star-grid-inner')) {
    const entries = [...grid.querySelectorAll('.zw-star-column:not(.zw-flying-target)')]
      .map((column) => ({
        column,
        spans:[...column.querySelectorAll('.zw-star-name > span')],
        fontSize:Number.parseFloat(getComputedStyle(column).fontSize) || 0,
      }))
      .filter(({ spans }) => spans.length);
    if (entries.length < 2) continue;
    const maxFontSize = Math.max(...entries.map(({ fontSize }) => fontSize));
    const reference = entries.find(({ column, fontSize }) => (
      column.classList.contains('major') && Math.abs(fontSize - maxFontSize) < 0.01
    )) ?? entries.find(({ fontSize }) => Math.abs(fontSize - maxFontSize) < 0.01);
    if (!reference) continue;
    // Measure one stable CJK sample instead of the star's actual character, so
    // different glyph shapes do not get mistaken for a font-size misalignment.
    const referenceTop = flyingTargetInkRect(reference.spans[0], scaleX, scaleY, '田').top;
    for (const { spans } of entries) {
      const ink = flyingTargetInkRect(spans[0], scaleX, scaleY, '田');
      const dy = (referenceTop - ink.top) / (ink.scaleY || scaleY);
      for (const span of spans) span.style.top = `${dy}px`;
    }
  }
}

function alignFlyingTargetText() {
  flyingTargetAlignmentFrame = 0;
  const targets = [...board.querySelectorAll('.zw-flying-target .zw-star-name')]
    .map((frame) => ({ frame, spans:[...frame.querySelectorAll(':scope > span')] }))
    .filter(({ spans }) => spans.length);
  for (const { spans } of targets) for (const span of spans) span.style.transform = 'none';
  const boardRect = board.getBoundingClientRect();
  const scaleX = boardRect.width / BOARD.width || 1;
  const scaleY = boardRect.height / BOARD.height || 1;
  for (const { frame, spans } of targets) {
    const frameRect = frame.getBoundingClientRect();
    const inkRects = spans.map((span) => flyingTargetInkRect(span, scaleX, scaleY));
    const inkTop = Math.min(...inkRects.map((rect) => rect.top));
    const inkBottom = Math.max(...inkRects.map((rect) => rect.bottom));
    const textScaleY = inkRects.reduce((sum, rect) => sum + rect.scaleY, 0) / inkRects.length || scaleY;
    const dy = ((frameRect.top + frameRect.bottom - inkTop - inkBottom) / 2) / textScaleY;
    const frameCenterX = (frameRect.left + frameRect.right) / 2;
    const offsetsX = inkRects.map((ink) => (
      (frameCenterX - ink.centerX) / (ink.scaleX || scaleX)
    ));
    frame.dataset.textAlignDx = offsetsX.map((dx) => dx.toFixed(3)).join(',');
    frame.dataset.textAlignDy = dy.toFixed(3);
    for (const [index, span] of spans.entries()) {
      span.style.transform = `translate(${offsetsX[index]}px, ${dy}px)`;
    }
  }
}

function scheduleFlyingTargetTextAlignment() {
  if (flyingTargetAlignmentFrame) cancelAnimationFrame(flyingTargetAlignmentFrame);
  flyingTargetAlignmentFrame = requestAnimationFrame(() => {
    alignStarColumnTops();
    alignFlyingTargetText();
  });
}

function card(label, sub, active, current, handler) {
  const button = el('button', `zw-time-card${active ? ' active' : ''}${current ? ' current' : ''}`);
  button.type = 'button';
  button.append(el('span', 'zw-time-label', label));
  if (sub) button.append(el('small', '', sub));
  button.addEventListener('click', handler);
  return button;
}

function installTimelineScrollbar(scroller, track, thumb) {
  let drag = null;
  const sync = () => {
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    if (maxScroll <= 0) {
      track.hidden = true;
      return;
    }
    track.hidden = false;
    const trackWidth = track.clientWidth;
    const thumbWidth = Math.max(28, trackWidth * scroller.clientWidth / scroller.scrollWidth);
    const travel = Math.max(0, trackWidth - thumbWidth);
    thumb.style.width = `${thumbWidth}px`;
    thumb.style.transform = `translateX(${travel * scroller.scrollLeft / maxScroll}px)`;
  };
  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    drag = { pointerId:event.pointerId, startX:event.clientX, startScroll:scroller.scrollLeft };
    thumb.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const onPointerMove = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    const travel = track.clientWidth - thumb.getBoundingClientRect().width;
    if (travel > 0) scroller.scrollLeft = drag.startScroll + (event.clientX - drag.startX) * maxScroll / travel;
  };
  const onPointerUp = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag = null;
    thumb.releasePointerCapture(event.pointerId);
  };
  const onTrackPointerDown = (event) => {
    if (event.target === thumb || event.button !== 0) return;
    const rect = track.getBoundingClientRect();
    const thumbWidth = thumb.getBoundingClientRect().width;
    const travel = rect.width - thumbWidth;
    const ratio = travel > 0 ? Math.max(0, Math.min(1, (event.clientX - rect.left - thumbWidth / 2) / travel)) : 0;
    scroller.scrollTo({ left:ratio * (scroller.scrollWidth - scroller.clientWidth), behavior:'smooth' });
  };
  const observer = new ResizeObserver(sync);
  observer.observe(scroller);
  observer.observe(track);
  scroller.addEventListener('scroll', sync, { passive:true });
  thumb.addEventListener('pointerdown', onPointerDown);
  thumb.addEventListener('pointermove', onPointerMove);
  thumb.addEventListener('pointerup', onPointerUp);
  thumb.addEventListener('pointercancel', onPointerUp);
  track.addEventListener('pointerdown', onTrackPointerDown);
  requestAnimationFrame(sync);
  return () => {
    observer.disconnect();
    scroller.removeEventListener('scroll', sync);
    thumb.removeEventListener('pointerdown', onPointerDown);
    thumb.removeEventListener('pointermove', onPointerMove);
    thumb.removeEventListener('pointerup', onPointerUp);
    thumb.removeEventListener('pointercancel', onPointerUp);
    track.removeEventListener('pointerdown', onTrackPointerDown);
  };
}

function renderRow(label, className, items) {
  if (!items.length) return;
  const row = el('div', `zw-time-row ${className}`);
  row.append(el('strong', 'zw-time-row-label', label));
  const shell = el('div', 'zw-time-scroll-shell');
  const scroller = el('div', 'zw-time-scroll');
  for (const item of items) scroller.append(item);
  const track = el('div', 'zw-time-scrollbar');
  const thumb = el('div', 'zw-time-scroll-thumb');
  track.append(thumb);
  shell.append(scroller, track);
  row.append(shell);
  timeline.append(row);
  timelineScrollCleanups.push(installTimelineScrollbar(scroller, track, thumb));
}

function afterFlowChange() {
  resetSelectionToLife();
  renderBoard();
  renderTimeline();
}

function isHourNodeActive(limit, node) {
  if (!limit) return false;
  if (node.isEarlyRat) return limit.ratHourSegment === RAT_HOUR_SEGMENT.EARLY;
  if (node.isLateRat) return limit.ratHourSegment === RAT_HOUR_SEGMENT.LATE;
  if (node.branchIndex === 0) return limit.ratHourSegment === RAT_HOUR_SEGMENT.UNIFIED;
  return limit.hourIndex === node.hourIndex;
}

function renderTimeline() {
  const savedScroll = new Map([...timeline.querySelectorAll('.zw-time-row')].map((row) => {
    const level = ['decade', 'year', 'month', 'day', 'hour'].find((name) => row.classList.contains(name));
    return [level, row.querySelector('.zw-time-scroll')?.scrollLeft ?? 0];
  }).filter(([level]) => level));
  for (const cleanup of timelineScrollCleanups) cleanup();
  timelineScrollCleanups = [];
  timeline.replaceChildren();
  if (!manager) return;
  const context = manager.context;
  const timelineProvider = manager.timeline;
  const decadeItems = [];
  const childhood = timelineProvider.getChildhood();
  if (childhood.length) {
    const first = childhood[0];
    decadeItems.push(card('童限', '起运前', context.decade?.index === 0, false, () => {
      if (context.decade?.index === 0) manager.reset(); else manager.setDecadeIndex(0, first.year);
      afterFlowChange();
    }));
  }
  for (const node of timelineProvider.getDecades(12)) {
    decadeItems.push(card(`${node.startAge}~${node.endAge}`, `${STEMS[node.stem]}${BRANCHES[node.branch]}`, context.decade?.index === node.index, false, () => {
      if (manager.context.decade?.index === node.index) manager.reset(); else manager.setDecadeIndex(node.index);
      afterFlowChange();
    }));
  }
  renderRow('大限', 'decade', decadeItems);

  if (context.decade) {
    const years = context.decade.index === 0 ? timelineProvider.getChildhood() : timelineProvider.getYears(context.decade.index);
    const items = years.map((node) => card(context.decade.index === 0 ? `${node.age}岁` : `${node.year}`, `${STEMS[node.stem]}${BRANCHES[node.branch]}`, context.year?.year === node.year, false, () => {
      if (manager.context.year?.year === node.year) manager.clearYear(); else manager.setYear(node.year);
      afterFlowChange();
    }));
    renderRow('流年', 'year', items);
  }

  if (context.year) {
    const months = timelineProvider.getMonths(context.year.year);
    const items = months.map((node) => card(node.displayLabel, `${STEMS[node.stem]}${BRANCHES[node.displayBranch]}`, context.month?.sequence === node.sequence && context.month?.isLeap === node.isLeap && context.month?.effectiveMonth === node.effectiveMonth && context.month?.effectiveYear === node.effectiveYear, false, () => {
      if (manager.context.month?.sequence === node.sequence && manager.context.month?.isLeap === node.isLeap && manager.context.month?.effectiveMonth === node.effectiveMonth && manager.context.month?.effectiveYear === node.effectiveYear) manager.clearMonth(); else manager.selectMonth(node);
      afterFlowChange();
    }));
    renderRow('流月', 'month', items);
  }

  if (context.year && context.month) {
    const days = timelineProvider.getDays(context.year.year, context.month.month, context.month.isLeap, context.month.effectiveMonth, context.month.effectiveYear);
    const items = days.map((node) => {
      const active = context.day?.day === node.day;
      const dayCard = card(LUNAR_DAYS[node.day - 1] ?? String(node.day), `${STEMS[node.stem]}${BRANCHES[node.branch]}`, active, false, () => {
        if (manager.context.day?.day === node.day) manager.clearDay(); else manager.selectDay(node);
        afterFlowChange();
      });
      if (active) dayCard.append(el('small', 'zw-time-solar', `${pad(node.solarDate.month)}-${pad(node.solarDate.day)}`));
      return dayCard;
    });
    renderRow('流日', 'day', items);
  }

  if (context.day) {
    const days = timelineProvider.getDays(context.year.year, context.month.month, context.month.isLeap, context.month.effectiveMonth, context.month.effectiveYear);
    const selectedDay = days.find((node) => node.day === context.day.day);
    const dayPillar = calculateDayPillar(selectedDay.solarDate);
    const hours = timelineProvider.getHours(dayPillar);
    const items = hours.map((node) => card(`${node.label}时`, `${STEMS[node.stem]}${BRANCHES[node.branch]}`, isHourNodeActive(context.hour, node), false, () => {
      if (isHourNodeActive(manager.context.hour, node)) manager.clearHour(); else manager.selectHour(node);
      afterFlowChange();
    }));
    renderRow('流时', 'hour', items);
  }
  for (const [level, scrollLeft] of savedScroll) {
    const scroller = timeline.querySelector(`.zw-time-row.${level} .zw-time-scroll`);
    if (scroller) scroller.scrollLeft = Math.min(scrollLeft, scroller.scrollWidth - scroller.clientWidth);
  }
}

function pixelAlignedBoardScale(targetScale, availableWidth) {
  const deviceScale = Math.max(1, window.devicePixelRatio || 1);
  const physicalCellWidth = BOARD.cellWidth * targetScale * deviceScale;
  // cellHeight / cellWidth is 6 / 5, so a width divisible by five also
  // gives every palace an integer physical-pixel height.
  const nearestWidth = Math.max(5, Math.round(physicalCellWidth / 5) * 5);
  const lowerWidth = Math.max(5, Math.floor(physicalCellWidth / 5) * 5);
  const nearestScale = nearestWidth / (BOARD.cellWidth * deviceScale);
  const snappedWidth = BOARD.width * nearestScale <= availableWidth + 0.5
    ? nearestWidth
    : lowerWidth;
  return snappedWidth / (BOARD.cellWidth * deviceScale);
}

function installBoardScaling() {
  resizeObserver?.disconnect();
  if (viewportResizeHandler) window.removeEventListener('resize', viewportResizeHandler);
  if (viewportScrollHandler) window.removeEventListener('scroll', viewportScrollHandler);
  const stage = boardShell.parentElement;
  let lastAvailableWidth = Number.NaN;
  let lastViewportWidth = window.innerWidth;
  let lastBottomScrollY = 0;
  viewportScrollHandler = () => {
    if (document.documentElement.classList.contains('birth-panel-open')) return;
    const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (maxScrollY > 32 && window.scrollY >= maxScrollY - 8) {
      lastBottomScrollY = window.scrollY;
    } else if (window.scrollY > 8) {
      // 正常向上离开底部时立即作废；只有底部瞬间跳到 0 的异常不作废。
      lastBottomScrollY = 0;
    }
  };
  window.addEventListener('scroll', viewportScrollHandler, { passive:true });
  const syncScale = () => {
    const available = stage.getBoundingClientRect().width
      - Number.parseFloat(getComputedStyle(stage).paddingLeft)
      - Number.parseFloat(getComputedStyle(stage).paddingRight);
    if (!Number.isFinite(available) || available <= 1) return;
    const chartPanel = stage.closest('.chart-panel');
    const timelinePanel = document.querySelector('.timeline-panel');
    const isBeside = Math.abs(chartPanel.offsetTop - timelinePanel.offsetTop) < 2;
    const widthChanged = !Number.isFinite(lastAvailableWidth) || Math.abs(available - lastAvailableWidth) > 0.5;
    const viewportWidthChanged = Math.abs(window.innerWidth - lastViewportWidth) > 0.5;
    // iOS/iPadOS Safari 收放地址栏时只改变可视高度，也会连续触发 resize。
    // 并排或移动布局的命盘比例只由宽度决定，此时不要反复改 shell 高度，
    // 否则滚动到页面底部时 Safari 会做滚动锚点校正，表现为突然跳回上方。
    if (!widthChanged && (window.innerWidth <= 900 || isBeside)) {
      if (!viewportWidthChanged && lastBottomScrollY > 32) {
        // WebKit 有时先发 resize、下一帧才把 scrollY 错误归零，
        // 因此必须在下一帧再判断，不能只看 resize 回调当下的值。
        requestAnimationFrame(() => {
          if (window.scrollY >= 4) return;
          const restoredY = Math.min(
            lastBottomScrollY,
            Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
          );
          window.scrollTo(0, restoredY);
        });
      }
      lastViewportWidth = window.innerWidth;
      return;
    }
    lastAvailableWidth = available;
    lastViewportWidth = window.innerWidth;
    let heightScale = Number.POSITIVE_INFINITY;
    if (window.innerWidth > 900 && !isBeside) {
      const stageStyle = getComputedStyle(stage);
      const stageDocumentTop = stage.getBoundingClientRect().top + window.scrollY;
      const resultGap = Number.parseFloat(getComputedStyle(chartPanel.parentElement).gap) || 0;
      const timelineRowHeight = timelinePanel.querySelector('.zw-time-row')?.getBoundingClientRect().height ?? 68;
      const reservedTimelineHeight = timelineRowHeight * 2 + resultGap + 16;
      const availableStageHeight = window.innerHeight - stageDocumentTop - reservedTimelineHeight;
      const verticalPadding = Number.parseFloat(stageStyle.paddingTop) + Number.parseFloat(stageStyle.paddingBottom);
      heightScale = (availableStageHeight - verticalPadding) / BOARD.height;
    }
    const targetScale = Math.min(
      1.45,
      Math.max(0.52, available / BOARD.width),
      Math.max(0.52, heightScale),
    );
    const scale = pixelAlignedBoardScale(targetScale, available);
    boardShell.style.setProperty('--zw-scale', String(scale));
    boardShell.style.height = `${BOARD.height * scale}px`;
    boardShell.style.width = `${BOARD.width * scale}px`;
    scheduleFlyingTargetTextAlignment();
  };
  resizeObserver = new ResizeObserver(syncScale);
  resizeObserver.observe(stage);
  viewportResizeHandler = syncScale;
  window.addEventListener('resize', viewportResizeHandler, { passive:true });
  syncScale();
}

function generate(event, preserveBirthBase = false) {
  event?.preventDefault();
  exportButton.disabled = true;
  errorBox.hidden = true;
  try {
    const data = new FormData(form);
    const options = readOptions(data);
    chart = createChart(data, options);
    manager = chart.createLimitManager();
    decadeWatermarkNodes = [...manager.timeline.getDecades(12)];
    if (!preserveBirthBase) {
      baseBirthInput = captureBirthInput();
      birthOffsetMinutes = 0;
    }
    selectedPalace = chart.anchors.palacePositions[0];
    app.dataset.ready = 'true';
    { const title=document.querySelector('#ziwei-chart-title'); const name=document.createElement('span'); name.dataset.noI18n=''; name.textContent=String(data.get('name') || '').trim() || '匿名'; title.replaceChildren(name,document.createTextNode('命盘')); }
    document.querySelector('#ziwei-chart-subtitle').textContent = `${formatCivil(chart.facts.virtualTime)} · ${formatOffset(options.utcOffsetMinutes)}`;
    syncChartToolbar();
    renderBoard();
    renderTimeline();
    exportProfile = captureChartProfile(form);
    exportButton.disabled = false;
    if (event) setInputCollapsed(true);
    return true;
  } catch (error) {
    errorBox.textContent = error instanceof Error ? error.message : String(error);
    errorBox.hidden = false;
    return false;
  }
}

function setInputCollapsed(collapsed) {
  const wasOpen = document.documentElement.classList.contains('birth-panel-open');
  if (!collapsed && !wasOpen) {
    birthPanelScrollY = window.scrollY;
    document.documentElement.style.setProperty('--birth-panel-scroll-offset', `${-birthPanelScrollY}px`);
  }
  workspace.classList.toggle('input-collapsed', collapsed);
  document.documentElement.classList.toggle('birth-panel-open', !collapsed);
  if (collapsed && wasOpen) {
    document.documentElement.style.removeProperty('--birth-panel-scroll-offset');
    window.scrollTo(0, birthPanelScrollY);
  }
  inputToggle.setAttribute('aria-expanded', String(!collapsed));
  inputToggle.querySelector('span').textContent = collapsed ? '出生与排盘' : '收起设置';
  inputToggle.querySelector('b').textContent = collapsed ? '›' : '‹';
}

function syncForm(event) {
  const inputCalendar = form.elements.inputCalendar.value;
  document.querySelector('#ziwei-leap-row').hidden = inputCalendar !== 'lunar';
  if (inputCalendar === 'lunar') syncLunarMonthControls(event);
  syncHistoricalUtcOffset();
}

function useCurrentTimeAndZone() {
  const now = new Date();
  const offsetMinutes = -now.getTimezoneOffset();
  delete form.querySelector('.offset-picker').dataset.savedOffset;
  form.elements.inputCalendar.value = 'solar';
  document.querySelector('#ziwei-leap-row').hidden = true;
  form.elements.pillarHistoricalMode.value = 'off';
  form.elements.clockMode.value = ZIWEI_CLOCK_MODE.CIVIL;
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

form.addEventListener('submit', generate);
form.addEventListener('change', syncForm);
inputToggle.addEventListener('click', () => setInputCollapsed(!workspace.classList.contains('input-collapsed')));
plateMode.addEventListener('change', () => {
  form.elements.chartMode.value = plateMode.value;
  generate(null, true);
});
displayMode?.addEventListener('change', () => {
  chartDisplayMode = displayMode.value;
  if (chart) renderBoard();
});
for (const button of document.querySelectorAll('[data-birth-shift]')) {
  button.addEventListener('click', () => {
    const requested = Number(button.dataset.birthShift);
    const delta = Math.abs(requested) === 120
      ? hourShiftMinutes(Math.sign(requested))
      : requested;
    shiftBirthTime(delta);
  });
}
for (const toggle of document.querySelectorAll('[data-flow-cycle-overlay]')) {
  toggle.addEventListener('change', () => {
    if (manager) renderBoard();
  });
}
document.querySelector('[data-flying-arrow-toggle]')?.addEventListener('change', () => {
  if (chart) renderBoard();
});
for (const select of document.querySelectorAll('[data-transform-level-limit], [data-flow-star-level-limit]')) {
  select.addEventListener('change', () => {
    if (chart) renderBoard();
  });
}
for (const toggle of document.querySelectorAll('[data-center-bazi]')) {
  toggle.addEventListener('change', () => {
    if (chart) renderCenter();
  });
}
for (const toggle of document.querySelectorAll('[data-palace-stamp]')) {
  toggle.addEventListener('change', () => {
    if (chart) renderBoard();
  });
}
birthReset.addEventListener('click', restoreBirthTime);
useCurrentTimeAndZone();
syncForm();
installBoardScaling();
generate();
document.querySelector('#ziwei-use-current-time')?.addEventListener('click', useCurrentTimeAndZone);
setupBaziReverseLookup({
  trigger: document.querySelector('#ziwei-bazi-reverse-lookup'),
  getOptions: () => {
    const options = readOptions(new FormData(form));
    return new BaziCore.BaziOptions({
      mode: options.mode,
      dayBoundaryMode: options.dayBoundaryMode,
      utcOffsetMinutes: options.utcOffsetMinutes,
      meridianDeg: options.meridianDeg,
      pillarHistoricalMode: options.pillarHistoricalMode,
      ratHourMode: options.ratHourMode,
      gender: options.gender === ZIWEI_GENDER.FEMALE ? BaziCore.GENDER.FEMALE : BaziCore.GENDER.MALE,
      clockMode: options.clockMode,
      longitudeDeg: options.longitudeDeg,
      daYunCount: 8,
    });
  },
  getInitialPillars: () => chart && Object.fromEntries(
    Object.entries(chart.facts.solarTermPillars).map(([key, value]) => {
      const decoded = BaziCore.unpackPillar(value);
      return [key, { stem:decoded.stem, branch:decoded.branch }];
    }),
  ),
  apply: (candidate) => {
    form.elements.inputCalendar.value = 'solar';
    document.querySelector('#ziwei-leap-row').hidden = true;
    for (const key of ['year','month','day','hour','minute','second']) {
      form.elements[key].value = String(candidate.civil[key]);
    }
    if (generate(null)) setInputCollapsed(true);
  },
});
setupZiweiReverseLookup({
  trigger: document.querySelector('#ziwei-reverse-lookup'),
  getOptions: () => readOptions(new FormData(form)),
  getInitialBranches: () => {
    if (!chart) return null;
    const fields = {
      lucunBranch:'lucun', hongluanBranch:'hongluan', zuofuBranch:'zuofu',
      wenchangBranch:'wenchang', santaiBranch:'santai', ziweiBranch:'ziwei',
    };
    return Object.fromEntries(Object.entries(fields).map(([field, key]) => [field, chart.starPositions[findStarId(key)]]));
  },
  apply: (candidate) => {
    form.elements.inputCalendar.value = 'solar';
    document.querySelector('#ziwei-leap-row').hidden = true;
    for (const key of ['year','month','day','hour','minute','second']) {
      form.elements[key].value = String(candidate.civil[key]);
    }
    if (generate(null)) setInputCollapsed(true);
  },
});
document.fonts?.ready.then(scheduleFlyingTargetTextAlignment);

restoreChart(form,()=>generate(),'ziwei');
document.documentElement.dataset.toolReady='true';
window.parent.postMessage({type:'tool-ready'},location.origin);
setupChartWorkspace(form,'ziwei',()=>generate());
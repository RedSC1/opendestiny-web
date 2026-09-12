import {
  HuangliCalendar, ACTIVITY_MASKS, ZonedTime, julianDay, calendarDateFromJulianDay,
  apparentBodyPosition, bodyRiseSetForDay, moonIllumination,
} from '../vendor/opendestiny-calendar-v1.js?v=20260831-vendor-clean-v1';
import { dateKey } from './calendar-display.js';

const PHASE_NAMES = ['新月', '蛾眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月'];
const ZODIAC_NAMES = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const ZODIAC_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const pad = value => String(value).padStart(2, '0');

function clockText(time, offsetMinutes) {
  if (!time) return null;
  const value = time.toZonedTime(offsetMinutes);
  return `${pad(value.hour)}:${pad(value.minute)}`;
}

function durationText(start, end) {
  if (!start || !end || end.jdUT1 < start.jdUT1) return null;
  const minutes = Math.round((end.jdUT1 - start.jdUT1) * 1440);
  return `${Math.floor(minutes / 60)}小时${pad(minutes % 60)}分`;
}

function zodiac(longitudeDeg) {
  const index = Math.floor(((longitudeDeg % 360) + 360) % 360 / 30);
  return { name: ZODIAC_NAMES[index], symbol: ZODIAC_SYMBOLS[index], longitudeDeg };
}

export function createModel(options = {}) {
  const {
    activityScope = 'common', eventAccuracy = 'mid', hour = 12,
    longitudeDeg = 116.4074, latitudeDeg = 39.9042, heightMeters = 0,
    ...calendarOptions
  } = options;
  const calendar = new HuangliCalendar({
    mode: 'historical', utcOffsetMinutes: 480, ...calendarOptions, eventAccuracy,
  });
  const offsetMinutes = calendarOptions.utcOffsetMinutes ?? 480;
  const observer = { longitudeDeg, latitudeDeg, heightMeters };
  const queryOptions = { hour, ...(activityScope === 'common' ? { activityMask: ACTIVITY_MASKS.civilian37 } : {}) };
  return {
    day: date => calendar.getDay(date.year, date.month, date.day, queryOptions),
    month(year, month) {
      const days = calendar.getMonth(year, month, queryOptions);
      const leading = days[0].weekday - 1;
      const start = julianDay({ year, month, day: 1, hour: 12 }) - leading;
      const index = new Map(days.map(day => [dateKey(day.solarDate), day]));
      const cells = Array.from({ length: 42 }, (_, i) => {
        const d = calendarDateFromJulianDay(start + i);
        if (d.year < -5999 || d.year > 9999) return null;
        return index.get(dateKey(d)) ?? calendar.getDay(d.year, d.month, d.day, queryOptions);
      });
      const phases = days.flatMap(day => day.moonPhases.map(phase => {
        const localTime = phase.time.toZonedTime(offsetMinutes).toJSON();
        return { name: phase.name, localTime };
      }));
      return { year, month, days, cells, terms: days.filter(day => day.solarTerm), phases };
    },
    sky(date) {
      const midnight = new ZonedTime({ ...date, hour: 0, minute: 0, second: 0, offsetMinutes });
      const noon = new ZonedTime({ ...date, hour: 12, minute: 0, second: 0, offsetMinutes }).toJulianTime();
      const dayStartUT1 = midnight.toJulianTime().jdUT1;
      const sunEvents = bodyRiseSetForDay('sun', dayStartUT1, observer);
      const moonEvents = bodyRiseSetForDay('moon', dayStartUT1, observer);
      const phase = moonIllumination(noon.jdTT);
      const sunPosition = apparentBodyPosition('sun', noon.jdTT, { frame: 'true-of-date' });
      const moonPosition = apparentBodyPosition('moon', noon.jdTT, { frame: 'true-of-date' });
      const phaseIndex = Math.floor((phase.phaseCycle + 1 / 16) * 8) % 8;
      const sunRise = sunEvents.rises[0] ?? null, sunSet = sunEvents.sets[0] ?? null;
      return {
        observer: { ...observer },
        sun: {
          rise: clockText(sunRise, offsetMinutes),
          set: clockText(sunSet, offsetMinutes),
          transit: clockText(sunEvents.upperTransits[0] ?? null, offsetMinutes),
          daylight: durationText(sunRise, sunSet),
          altitudeState: sunEvents.altitudeState,
          zodiac: zodiac(sunPosition.longitudeDeg),
        },
        moon: {
          rise: clockText(moonEvents.rises[0] ?? null, offsetMinutes),
          set: clockText(moonEvents.sets[0] ?? null, offsetMinutes),
          transit: clockText(moonEvents.upperTransits[0] ?? null, offsetMinutes),
          altitudeState: moonEvents.altitudeState,
          zodiac: zodiac(moonPosition.longitudeDeg),
          phaseName: PHASE_NAMES[phaseIndex],
          phaseCycle: phase.phaseCycle,
          waxing: phase.waxing,
          illuminatedPercent: phase.illuminatedFraction * 100,
          ageDays: phase.phaseCycle * 29.530588,
          elongationDeg: phase.solarElongationDeg,
        },
      };
    },
  };
}

export const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊', '十三'];
const NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
export const dateKey = d => `${d.year}/${d.month}/${d.day}`;
export function lunarDayName(day) {
  if (day === 10) return '初十';
  if (day === 20) return '二十';
  if (day === 30) return '三十';
  return ['初', '十', '廿'][Math.floor(day / 10)] + NUMBERS[(day - 1) % 10];
}
export const lunarMonthName = lunar => `${lunar.isLeap ? '闰' : ''}${MONTH_NAMES[lunar.month - 1]}月`;
export const lunarDateName = lunar => lunarMonthName(lunar) + lunarDayName(lunar.day);
const pad = value => String(value).padStart(2, '0');

export function monthTermLabel(day) {
  const term = day.solarTerm;
  if (!term) return '';
  const assigned = term.assignedDate ?? day.solarDate;
  const local = term.localTime;
  const assignedDate = `${pad(assigned.month)}.${pad(assigned.day)}`;
  if (!local) return `${term.name} ${assignedDate}`;
  const clock = `${pad(local.hour)}:${pad(local.minute)}`;
  if (assigned.year === local.year && assigned.month === local.month && assigned.day === local.day)
    return `${term.name} ${assignedDate} ${clock}`;
  const astronomicalDate = `${pad(local.month)}.${pad(local.day)}`;
  return `${term.name} 定日 ${assignedDate} · 天文 ${astronomicalDate} ${clock}`;
}

const FESTIVAL_DISPLAY_PRIORITY = { primary: 0, secondary: 1, detail: 2 };

export function calendarCellLabel(day) {
  const festival = [...(day.festivalDetails ?? [])]
    .filter(item => item.calendarDisplay !== 'detail')
    .sort((a, b) => (FESTIVAL_DISPLAY_PRIORITY[a.calendarDisplay] ?? 2) - (FESTIVAL_DISPLAY_PRIORITY[b.calendarDisplay] ?? 2))[0];
  const festivalPriority = festival ? FESTIVAL_DISPLAY_PRIORITY[festival.calendarDisplay] ?? 2 : Infinity;
  // Ordinary solar terms have sxwnl's B priority. Primary festivals remain first.
  if (day.solarTerm && festivalPriority > 0) return { text: day.solarTerm.name, kind: 'term' };
  if (festival) return { text: festival.shortName, kind: 'festival' };
  if (day.solarTerm) return { text: day.solarTerm.name, kind: 'term' };
  return {
    text: day.lunarDate.day === 1 ? lunarMonthName(day.lunarDate) : lunarDayName(day.lunarDate.day),
    kind: '',
  };
}
export function todayAtOffset(offset = 480, date = new Date()) {
  const z = new Date(date.getTime() + offset * 60_000);
  return { year: z.getUTCFullYear(), month: z.getUTCMonth() + 1, day: z.getUTCDate() };
}
export function shiftedMonth(year, month, delta) {
  const n = year * 12 + month - 1 + delta;
  const y = Math.floor(n / 12);
  if (y < -5999 || y > 9999) return null;
  return { year: y, month: ((n % 12) + 12) % 12 + 1 };
}

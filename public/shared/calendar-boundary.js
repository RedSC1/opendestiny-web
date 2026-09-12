export const FIXED_UTC_OFFSET = 'fixed-utc-offset';
export const MEAN_SOLAR_MERIDIAN = 'mean-solar-meridian';

export function hasValidLongitude(value) {
  const raw = String(value ?? '').trim();
  return raw !== '' && Number.isFinite(Number(raw)) && Math.abs(Number(raw)) <= 180;
}

export function resolveCalendarBoundary(calendarMode, boundaryMode, longitude) {
  if (calendarMode !== 'local-astronomical') {
    return {dayBoundaryMode:FIXED_UTC_OFFSET,meridianDeg:undefined};
  }
  if (boundaryMode === MEAN_SOLAR_MERIDIAN) {
    if (!hasValidLongitude(longitude)) {
      throw new Error('按出生地经度定气定朔前，请先填写有效的出生地经度。');
    }
    return {dayBoundaryMode:MEAN_SOLAR_MERIDIAN,meridianDeg:Number(longitude)};
  }
  return {dayBoundaryMode:FIXED_UTC_OFFSET,meridianDeg:undefined};
}

export function setupLocalCalendarBoundary(form) {
  const fields = form.querySelectorAll('[data-calendar-boundary]');
  const select = form.elements.calendarDayBoundary;
  if (!fields.length || !select) return () => {};
  const longitudeOption = Array.from(select.options).find(option => option.value === MEAN_SOLAR_MERIDIAN);
  const sync = () => {
    const local = form.elements.calendarMode.value === 'local-astronomical';
    const longitudeReady = hasValidLongitude(form.elements.longitude.value);
    for (const field of fields) field.hidden = !local;
    select.disabled = !local;
    if (longitudeOption) longitudeOption.disabled = !longitudeReady;
    if (local && !longitudeReady && select.value === MEAN_SOLAR_MERIDIAN) select.value = FIXED_UTC_OFFSET;
  };
  form.addEventListener('change', event => {
    if (['calendarMode','location','longitude'].includes(event.target?.name)) sync();
  });
  form.addEventListener('input', event => {
    if (['location','longitude'].includes(event.target?.name)) sync();
  });
  sync();
  return sync;
}

export function setupHistoricalUtcLock(form) {
  const picker = form.querySelector('.offset-picker');
  const note = form.querySelector('#offset-mode-note, #ziwei-offset-note');
  if (!picker || !note) return () => {};
  const sign = form.elements.offsetSign;
  const hour = form.elements.offsetHour;
  const minute = form.elements.offsetMinute;
  const controls = [sign,hour,minute];
  const sync = () => {
    const historicalCalendar = form.elements.calendarMode.value === 'historical';
    const historicalTerms = form.elements.pillarHistoricalMode?.value === 'on';
    const locked = historicalCalendar || historicalTerms;
    if (locked) {
      if (!picker.dataset.savedOffset) picker.dataset.savedOffset = JSON.stringify(controls.map(control => control.value));
      sign.value = '1';hour.value = '08';minute.value = '00';
    } else if (picker.dataset.savedOffset) {
      const saved = JSON.parse(picker.dataset.savedOffset);
      controls.forEach((control,index) => { control.value = saved[index]; });
      delete picker.dataset.savedOffset;
    }
    controls.forEach(control => { control.disabled = locked; });
    picker.classList.toggle('locked',locked);
    note.classList.toggle('locked',locked);
    note.textContent = historicalCalendar
      ? '中国历史历法仅按 UTC+8 生效，时区已锁定'
      : historicalTerms
        ? '历史定气仅按 UTC+8 生效，时区已锁定'
        : '不自动处理夏令时';
  };
  form.addEventListener('change', event => {
    if (['calendarMode','pillarHistoricalMode'].includes(event.target?.name)) sync();
  });
  return sync;
}

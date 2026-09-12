// The same birth fields are understood by both chart engines.
const BIRTH_FIELDS = new Set(['name','gender','inputCalendar','year','month','day','hour','minute','second','location','latitude','longitude','offsetSign','offsetHour','offsetMinute','lunarLeapToggle','lunarMonthKind','lunarSpecialName','lunarSpecialToggle']);
export function sharedBirthFields(record) {
  const fields = record.form ?? record.snapshot?.profile?._form;
  if (!Array.isArray(fields)) throw new Error('这份旧命例没有保存出生资料，无法填入。');
  const lunar = fields.some(f => f.name === 'inputCalendar' && f.value === 'lunar' && (f.type !== 'radio' || f.checked));
  // A lunar date needs its calendar convention to retain the same meaning.
  return fields.filter(f => BIRTH_FIELDS.has(f.name) || (lunar && ['calendarMode','calendarDayBoundary'].includes(f.name)));
}
export function applyBirthFields(form, record) {
  const fields = sharedBirthFields(record);
  const apply = () => { for (const saved of fields) for (const e of form.elements) {
    if (e.name !== saved.name) continue;
    if (e.type === 'radio') { if (e.value === saved.value) e.checked = saved.checked; }
    else if (e.type === 'checkbox') e.checked = saved.checked;
    else e.value = saved.value;
  }};
  const dispatch = name => {
    const e = form.querySelector(`[name="${name}"]:checked`) || form.querySelector(`[name="${name}"]`);
    e?.dispatchEvent(new Event('change', {bubbles:true}));
  };
  const offsetPicker = form.querySelector('.offset-picker');
  if (offsetPicker) delete offsetPicker.dataset.savedOffset;
  apply();
  for (const name of ['calendarMode','calendarDayBoundary','inputCalendar','lunarLeapToggle','lunarSpecialToggle']) {
    dispatch(name);
  }
  apply();
  dispatch('calendarMode');
  dispatch('calendarDayBoundary');
}

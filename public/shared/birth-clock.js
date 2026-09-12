export const LOCATION_REQUIRED = '请先在「出生资料」中选择出生城市，或填写出生地点及经度，再启用平太阳时／真太阳时修正。';
export function hasBirthLocation(form) {
  const place = form.elements.location.value.trim();
  const raw = form.elements.longitude.value.trim();
  return Boolean(place && raw && Number.isFinite(Number(raw)) && Math.abs(Number(raw)) <= 180);
}
export function setupBirthClock(form) {
  const section = form.querySelector('[name="clockMode"]').closest('.form-section');
  const note = document.createElement('p');
  note.className = 'field-help'; note.setAttribute('role','status'); section.append(note);
  const setMode = value => {
    const radio = form.querySelector(`[name="clockMode"][value="${value}"]`);
    radio.checked = true;
    radio.dispatchEvent(new Event('change',{bubbles:true}));
  };
  const availability = () => {
    const enabled=hasBirthLocation(form);
    for(const radio of form.querySelectorAll('[name="clockMode"]')) if(radio.value!=='civil') radio.disabled=!enabled;
  };
  let lastPlace = '';
  const fingerprint = () => `${form.elements.location.value}|${form.elements.longitude.value}`;
  const sync = () => {
    lastPlace = fingerprint();
    const located = hasBirthLocation(form);
    availability();
    setMode(located ? 'true-solar' : 'civil');
    note.textContent = located ? '已根据出生地点默认开启真太阳时修正，可在此调整。' : LOCATION_REQUIRED;
  };
  // Capture before the legacy form handler sees an unavailable correction mode.
  form.addEventListener('change', event => {
    if (event.target?.name === 'clockMode' && event.target.value !== 'civil' && !hasBirthLocation(form)) {
      setMode('civil'); note.textContent = LOCATION_REQUIRED;
    }
  }, true);
  form.addEventListener('change', () => { if (fingerprint() !== lastPlace) sync(); });
  form.addEventListener('birth-selected', sync);
  form.addEventListener('input',()=>{if(!hasBirthLocation(form)){availability();setMode('civil');note.textContent=LOCATION_REQUIRED;}});
  availability();
  lastPlace = fingerprint();
  if (!hasBirthLocation(form)) setMode('civil');
  note.textContent = hasBirthLocation(form) ? '出生时间请填写当地钟表时间，修正由排盘自动计算。' : LOCATION_REQUIRED;
}

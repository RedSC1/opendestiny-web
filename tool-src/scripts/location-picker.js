import { loadLocationDatabase } from '/scripts/location-data.js';

function makeOption(value, label) {
  const option = document.createElement('option');
  option.value = String(value);
  option.textContent = label;
  return option;
}

function setOptions(select, items, promptLabel, emptyLabel = promptLabel) {
  select.replaceChildren(makeOption('', items.length ? promptLabel : emptyLabel), ...items.map((item) => makeOption(item.id, item.name)));
  select.disabled = items.length === 0;
  select.value = '';
}

function createDialog(title = '选择国内出生地') {
  const dialog = document.createElement('dialog');
  dialog.className = 'location-dialog';
  dialog.innerHTML = `
    <div class="location-dialog-card">
      <header class="location-dialog-header">
        <div><strong>选择国内出生地</strong><small>省、市、区数据仅在打开时加载</small></div>
        <button type="button" class="location-dialog-close" aria-label="关闭">×</button>
      </header>
      <div class="location-dialog-columns">
        <label><span>省／自治区</span><select data-location-province size="10" aria-label="省或自治区"></select></label>
        <label><span>市／地区</span><select data-location-city size="10" aria-label="市或地区"></select></label>
        <label><span>区／县</span><select data-location-district size="10" aria-label="区或县"></select></label>
      </div>
      <div class="location-dialog-selection" aria-live="polite">正在载入地点数据…</div>
      <footer class="location-dialog-actions">
        <button type="button" class="location-dialog-cancel">取消</button>
        <button type="button" class="location-dialog-confirm" disabled>使用此地点</button>
      </footer>
    </div>`;
  document.body.append(dialog);
  dialog.querySelector('.location-dialog-header strong').textContent = title;
  return dialog;
}

function uniquePath(items) {
  return items.filter((item, index) => item && item.name !== items[index - 1]?.name);
}

function setOffset(form, minutes) {
  const absolute = Math.abs(minutes);
  if (form.elements.offsetSign) form.elements.offsetSign.value = minutes < 0 ? '-1' : '1';
  if (form.elements.offsetHour) form.elements.offsetHour.value = String(Math.floor(absolute / 60)).padStart(2, '0');
  if (form.elements.offsetMinute) form.elements.offsetMinute.value = String(absolute % 60).padStart(2, '0');
  if (form.elements.timezone) form.elements.timezone.value = String(minutes);
}

export function setupLocationPicker({ form, trigger, title, onSelect }) {
  if (!form || !trigger) return;
  const dialog = createDialog(title);
  const provinceSelect = dialog.querySelector('[data-location-province]');
  const citySelect = dialog.querySelector('[data-location-city]');
  const districtSelect = dialog.querySelector('[data-location-district]');
  const selection = dialog.querySelector('.location-dialog-selection');
  const confirm = dialog.querySelector('.location-dialog-confirm');
  let database;
  let selectedProvince;
  let selectedCity;
  let selectedDistrict;

  const selectedPlace = () => selectedDistrict ?? selectedCity ?? selectedProvince;

  function renderSelection() {
    const path = uniquePath([selectedProvince, selectedCity, selectedDistrict]);
    const place = selectedPlace();
    selection.textContent = place
      ? `${path.map((item) => item.name).join(' · ')}　${place.longitude.toFixed(3)}°E，${place.latitude.toFixed(3)}°N`
      : '请选择省份';
    confirm.disabled = !place;
  }

  function selectProvince(id) {
    selectedProvince = database.getById(id);
    selectedCity = undefined;
    selectedDistrict = undefined;
    setOptions(citySelect, selectedProvince ? database.getChildren(selectedProvince.id) : [], '请选择城市', '无下级城市');
    setOptions(districtSelect, [], '请选择区县', '请先选择城市');
    renderSelection();
  }

  function selectCity(id) {
    selectedCity = database.getById(id);
    selectedDistrict = undefined;
    setOptions(districtSelect, selectedCity ? database.getChildren(selectedCity.id) : [], '请选择区县', '无下级区县');
    renderSelection();
  }

  function selectDistrict(id) {
    selectedDistrict = database.getById(id);
    renderSelection();
  }

  function restoreCurrentLocation() {
    const query = form.elements.location?.value.trim();
    const candidates = query ? database.search(query, 100) : [];
    let current = candidates
      .filter((item) => item.name.includes(query) || query.includes(item.name))
      .sort((a, b) => b.depth - a.depth)[0];
    if (!current) current = database.getById(1101);
    const path = [];
    while (current) {
      path.unshift(current);
      current = current.parentId ? database.getById(current.parentId) : undefined;
    }
    const province = path.find((item) => item.depth === 0) ?? database.provinces[0];
    provinceSelect.value = String(province.id);
    selectProvince(province.id);
    const city = path.find((item) => item.depth === 1);
    if (city) {
      citySelect.value = String(city.id);
      selectCity(city.id);
    }
    const district = path.find((item) => item.depth === 2);
    if (district) {
      districtSelect.value = String(district.id);
      selectDistrict(district.id);
    }
  }

  trigger.addEventListener('click', async () => {
    trigger.disabled = true;
    const label = trigger.querySelector('b');
    const originalText = label?.textContent;
    if (label) label.textContent = '加载中…';
    try {
      database ??= await loadLocationDatabase();
      setOptions(provinceSelect, database.provinces, '请选择省份');
      restoreCurrentLocation();
      dialog.showModal();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    } finally {
      trigger.disabled = false;
      if (label) label.textContent = originalText;
    }
  });

  provinceSelect.addEventListener('change', () => selectProvince(provinceSelect.value));
  citySelect.addEventListener('change', () => selectCity(citySelect.value));
  districtSelect.addEventListener('change', () => selectDistrict(districtSelect.value));
  dialog.querySelector('.location-dialog-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.location-dialog-cancel').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  confirm.addEventListener('click', () => {
    const place = selectedPlace();
    if (!place) return;
    if (form.elements.location) form.elements.location.value = place.name;
    if (form.elements.longitude) form.elements.longitude.value = place.longitude.toFixed(4);
    if (form.elements.latitude) form.elements.latitude.value = place.latitude.toFixed(4);
    setOffset(form, place.utcOffsetMinutes);
    onSelect?.(place, uniquePath([selectedProvince, selectedCity, selectedDistrict]));
    form.dispatchEvent(new Event('change', { bubbles: true }));
    dialog.close();
  });
}

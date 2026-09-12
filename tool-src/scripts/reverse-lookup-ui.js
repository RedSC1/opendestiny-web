const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const LUNAR_MONTHS = ['正','二','三','四','五','六','七','八','九','十','冬','腊','十三'];
const HISTORICAL_MONTHS = ['正','二','三','四','五','六','七','八','九','十','十一','十二','十三'];
const LUNAR_DAYS = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
const WORKER_URL = new URL('../../scripts/reverse-lookup-worker.js',import.meta.url).href;

function options(values, placeholder = '') {
  return `${placeholder ? `<option value="">${placeholder}</option>` : ''}${values.map((value, index) => `<option value="${index}">${value}</option>`).join('')}`;
}

function formatYear(year) { return year > 0 ? `${year}年` : `公元前${1 - year}年`; }
function pad(value) { return String(Math.trunc(Math.abs(value))).padStart(2, '0'); }
function formatCivil(value) { return `${formatYear(value.year)}${value.month}月${value.day}日 ${pad(value.hour)}:${pad(value.minute)}`; }
function formatLunar(value) {
  const special = {
    1:'十三月', 2:'后九月', 3:'拾贰月', 4:'一月',
    5:`${HISTORICAL_MONTHS[value.month - 1] ?? value.month}月`,
  }[value.monthName];
  const name = special ?? `${value.isLeap ? '闰' : ''}${LUNAR_MONTHS[value.month - 1] ?? value.month}月`;
  return `${formatYear(value.year)} ${name}${LUNAR_DAYS[value.day - 1] ?? value.day}`;
}

function plainOptions(value) {
  const raw = typeof value?.toJSON === 'function' ? value.toJSON() : value;
  if (!raw?.rules) return raw;
  const { ruleset: _ruleset, ...rules } = raw.rules;
  return { ...raw, rules };
}

function createDialog(title, note, content) {
  const dialog = document.createElement('dialog');
  dialog.className = 'reverse-lookup-dialog';
  dialog.innerHTML = `<div class="reverse-lookup-card">
    <header class="reverse-lookup-header"><span class="reverse-lookup-emblem" aria-hidden="true">${title.includes('八字') ? '柱' : '星'}</span><div><h2>${title}</h2><p>${note}</p></div><button class="reverse-lookup-close" type="button" aria-label="关闭">×</button></header>
    <div class="reverse-lookup-body">${content}<p class="reverse-lookup-status" role="status"></p><div class="reverse-lookup-results"></div></div>
  </div>`;
  document.body.append(dialog);
  dialog.querySelector('.reverse-lookup-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  return dialog;
}

function makeRunner(dialog) {
  let worker = null;
  let requestId = 0;
  dialog.addEventListener('close', () => { worker?.terminate(); worker = null; });
  return (kind, payload) => new Promise((resolve, reject) => {
    worker?.terminate();
    worker = new Worker(WORKER_URL, { type: 'module' });
    const id = ++requestId;
    worker.addEventListener('message', (event) => {
      if (event.data?.id !== id) return;
      worker?.terminate(); worker = null;
      event.data.ok ? resolve(event.data) : reject(new Error(event.data.error));
    });
    worker.addEventListener('error', (event) => {
      worker?.terminate(); worker = null;
      reject(new Error(event.message || '反查 Worker 加载失败'));
    });
    worker.postMessage({ id, kind, payload });
  });
}

function yearRange(form) {
  const startYear = Number(form.elements.startYear.value);
  const endYear = Number(form.elements.endYear.value);
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) throw new RangeError('起止年份必须是整数');
  if (startYear < -6000 || endYear > 10000) throw new RangeError('年份须在天文学纪年 −6000～10000 之间');
  if (startYear > endYear) throw new RangeError('起始年份不能晚于结束年份');
  return { startYear, endYear };
}

function pillarValue(form, key) {
  const stem = Number(form.elements[`${key}Stem`].value);
  const branch = Number(form.elements[`${key}Branch`].value);
  if (!Number.isInteger(stem) || !Number.isInteger(branch)) throw new RangeError('请完整选择四柱');
  if ((stem & 1) !== (branch & 1)) throw new RangeError(`${form.elements[`${key}Stem`].selectedOptions[0].text}${form.elements[`${key}Branch`].selectedOptions[0].text} 不是有效干支组合`);
  return { stem, branch };
}

function renderResults(dialog, results, elapsedMs, describe, apply) {
  const status = dialog.querySelector('.reverse-lookup-status');
  const list = dialog.querySelector('.reverse-lookup-results');
  list.replaceChildren();
  status.classList.remove('error');
  status.textContent = results.length
    ? `找到 ${results.length} 个候选 · ${elapsedMs < 1000 ? `${Math.round(elapsedMs)} ms` : `${(elapsedMs / 1000).toFixed(2)} s`}`
    : '没有找到符合条件的时间，请调整条件或年份范围。';
  results.forEach((result, index) => {
    const card = document.createElement('article');
    card.className = 'reverse-lookup-result';
    const copy = document.createElement('div');
    const description = describe(result);
    copy.innerHTML = `<strong>${description.title}</strong><p>${description.detail}</p>`;
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = '应用到命盘';
    button.addEventListener('click', () => { apply(result); dialog.close(); });
    card.append(copy, button);
    list.append(card);
    card.dataset.index = String(index);
  });
}

function showError(dialog, error) {
  const status = dialog.querySelector('.reverse-lookup-status');
  status.classList.add('error');
  status.textContent = error instanceof Error ? error.message : String(error);
}

function pillarFields(key, label, optional = false) {
  const toggle = optional
    ? '<label class="reverse-lookup-hour-toggle"><input type="checkbox" name="includeHour" checked /><span>限定</span></label>'
    : '';
  return `<div class="reverse-lookup-pillar" data-pillar="${key}"><div class="reverse-lookup-pillar-heading"><span>${label}</span>${toggle}</div><select name="${key}Stem" aria-label="${label}天干">${options(STEMS)}</select><select name="${key}Branch" aria-label="${label}地支">${options(BRANCHES)}</select></div>`;
}

export function setupBaziReverseLookup({ trigger, getOptions, getInitialPillars, apply }) {
  if (!trigger) return;
  const now = new Date().getFullYear();
  const dialog = createDialog('八字反查', '输入三柱或四柱；沿用当前排盘的历法、时区、钟表与早晚子时设置。', `<form class="reverse-lookup-search-form bazi-reverse-form">
    <div class="reverse-lookup-pillars">${pillarFields('year','年柱')}${pillarFields('month','月柱')}${pillarFields('day','日柱')}${pillarFields('hour','时柱',true)}</div>
    <fieldset class="reverse-lookup-range"><legend>可能的出生年份范围</legend><div class="reverse-lookup-fields"><label class="reverse-lookup-field"><span>最早出生年</span><input name="startYear" type="number" value="${now - 50}" min="-6000" max="10000" /></label><i aria-hidden="true">→</i><label class="reverse-lookup-field"><span>最晚出生年</span><input name="endYear" type="number" value="${now + 50}" min="-6000" max="10000" /></label></div><p>包含起止年份；例如结束年填 2012，会查到 2012 年末。公元前 1 年写作 0。</p></fieldset>
    <div class="reverse-lookup-actions"><button class="reverse-lookup-cancel" type="button">取消</button><button class="reverse-lookup-submit" type="submit">开始反查</button></div>
  </form>`);
  const searchForm = dialog.querySelector('form');
  const runner = makeRunner(dialog);
  const syncHour = () => { for (const select of searchForm.querySelectorAll('[data-pillar="hour"] select')) select.disabled = !searchForm.elements.includeHour.checked; };
  searchForm.elements.includeHour.addEventListener('change', syncHour); syncHour();
  searchForm.querySelector('.reverse-lookup-cancel').addEventListener('click', () => dialog.close());
  trigger.addEventListener('click', () => {
    const initial = getInitialPillars?.();
    if (initial) for (const key of ['year','month','day','hour']) {
      searchForm.elements[`${key}Stem`].value = String(initial[key].stem);
      searchForm.elements[`${key}Branch`].value = String(initial[key].branch);
    }
    dialog.showModal();
  });
  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = dialog.querySelector('.reverse-lookup-status');
    status.classList.remove('error'); status.textContent = '正在反查，请稍候…';
    dialog.querySelector('.reverse-lookup-results').replaceChildren();
    try {
      const range = yearRange(searchForm);
      const pillars = { year:pillarValue(searchForm,'year'), month:pillarValue(searchForm,'month'), day:pillarValue(searchForm,'day') };
      if (searchForm.elements.includeHour.checked) pillars.hour = pillarValue(searchForm,'hour');
      const response = await runner('bazi', { ...range, pillars, options:plainOptions(getOptions()) });
      renderResults(dialog, response.results, response.elapsedMs, (result) => ({
        title: `${formatCivil(result.civil)} · ${result.pillars.join(' ')}`,
        detail: `${formatLunar(result.lunar)} · ${result.label}${result.isLateZi ? ' · 晚子时' : ''}`,
      }), apply);
    } catch (error) { showError(dialog, error); }
  });
}

function palaceField(key, label, optional = false) {
  return `<label class="reverse-lookup-field"><span>${label}${optional ? '（可选）' : ''}</span><select name="${key}" ${optional ? '' : 'required'}>${options(BRANCHES, optional ? '不限' : '请选择宫位')}</select></label>`;
}

export function setupZiweiReverseLookup({ trigger, getOptions, getInitialBranches, apply }) {
  if (!trigger) return;
  const now = new Date().getFullYear();
  const dialog = createDialog('星曜反查', '按星曜落宫反推；沿用当前排盘的历法、时区、钟表与早晚子时设置。', `<form class="reverse-lookup-search-form ziwei-reverse-form">
    <div class="reverse-lookup-fields reverse-lookup-star-fields">${palaceField('lucunBranch','禄存')}${palaceField('hongluanBranch','红鸾')}${palaceField('zuofuBranch','左辅')}${palaceField('wenchangBranch','文昌')}${palaceField('santaiBranch','三台')}${palaceField('ziweiBranch','紫微',true)}</div>
    <fieldset class="reverse-lookup-range"><legend>可能的出生年份范围</legend><div class="reverse-lookup-fields"><label class="reverse-lookup-field"><span>最早出生年</span><input name="startYear" type="number" value="${now - 50}" min="-6000" max="10000" /></label><i aria-hidden="true">→</i><label class="reverse-lookup-field"><span>最晚出生年</span><input name="endYear" type="number" value="${now + 50}" min="-6000" max="10000" /></label></div><p>包含起止年份；例如结束年填 2012，会查到 2012 年末。公元前 1 年写作 0。</p></fieldset>
    <div class="reverse-lookup-actions"><button class="reverse-lookup-cancel" type="button">取消</button><button class="reverse-lookup-submit" type="submit">开始反查</button></div>
  </form>`);
  const searchForm = dialog.querySelector('form');
  const runner = makeRunner(dialog);
  searchForm.querySelector('.reverse-lookup-cancel').addEventListener('click', () => dialog.close());
  trigger.addEventListener('click', () => {
    const initial = getInitialBranches?.();
    if (initial) for (const [key, value] of Object.entries(initial)) if (searchForm.elements[key]) searchForm.elements[key].value = String(value);
    dialog.showModal();
  });
  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = dialog.querySelector('.reverse-lookup-status');
    status.classList.remove('error'); status.textContent = '正在反查，请稍候…';
    dialog.querySelector('.reverse-lookup-results').replaceChildren();
    try {
      const range = yearRange(searchForm);
      const query = {};
      for (const key of ['lucunBranch','hongluanBranch','zuofuBranch','wenchangBranch','santaiBranch','ziweiBranch']) {
        if (searchForm.elements[key].value !== '') query[key] = Number(searchForm.elements[key].value);
      }
      const response = await runner('ziwei', { ...range, query, options:plainOptions(getOptions()) });
      renderResults(dialog, response.results, response.elapsedMs, (result) => ({
        title: `${formatCivil(result.civil)} · ${result.pillars.join(' ')}`,
        detail: `${formatLunar(result.lunar)} · ${BRANCHES[result.hourBranch]}时`,
      }), apply);
    } catch (error) { showError(dialog, error); }
  });
}

import {saveRecord} from '../../shared/storage.js';
let historyId=crypto.randomUUID();
await (window.redsc1LocaleReady ?? Promise.resolve());
import { TableSpread } from './table-spread.js';
import { TarotDeck, buildCanonicalDeck } from './tarot.js';
import { SPREADS } from './spreads.js';
import { ASSET_BASE, DETAIL_ASSET_BASE, CARD_BY_ID } from './card-assets.js';

const $ = (id) => document.getElementById(id);
const getMode = () => document.querySelector('[name="reveal-mode"]:checked').value;
const setMode = value => document.querySelectorAll('[name="reveal-mode"]').forEach(input => { input.checked = input.value === value; });
const transitions = {
  idle: ['deckCreated'], deckCreated: ['spreading'], spreading: ['deckSpread'],
  deckSpread: ['drawing'], drawing: ['deckSpread', 'drawComplete', 'revealing'],
  drawComplete: ['revealing'], revealing: ['deckSpread', 'drawComplete', 'revealed'], revealed: [],
};
let reading;
let layoutChanging = false;
let record;
let deckIds = buildCanonicalDeck().map(card => card.id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const speedFactors = { relaxed: 1.4, standard: 1, fast: .65 };
let animationSpeed = 'standard';
try {
  const saved = localStorage.getItem('quiet-table-animation-speed');
  if (Object.hasOwn(speedFactors, saved)) animationSpeed = saved;
} catch { /* Storage may be unavailable; the session setting still works. */ }
const duration = (ms) => reducedMotion ? 1 : ms * speedFactors[animationSpeed];
function applyAnimationSpeed(value) {
  if (!Object.hasOwn(speedFactors, value)) return;
  animationSpeed = value;
  for (const input of document.querySelectorAll('[name="animation-speed"]')) input.checked = input.value === value;
  for (const [name, ms] of Object.entries({ spread:650, preview:200, flip:750 })) document.documentElement.style.setProperty(`--motion-${name}`, `${ms * speedFactors[value]}ms`);
}
applyAnimationSpeed(animationSpeed);
$('animation-settings').onchange = event => {
  applyAnimationSpeed(event.target.value);
  try { localStorage.setItem('quiet-table-animation-speed', animationSpeed); } catch { /* Keep session preference. */ }
};
const delay = (ms) => new Promise(resolve => setTimeout(resolve, duration(ms)));
const busy = () => layoutChanging || ['spreading', 'drawing', 'revealing'].includes(reading.phase);
const spread = () => SPREADS.find(s => s.id === reading.spreadId);

const spreadLabels = { one: '此刻的指引', two: '现状与前路', 'past-present-future': '时间之流', 'situation-advice-outcome': '解开困局', relationship: '关系之镜', five: '深入探索', 'celtic-cross': '凯尔特十字', custom: '自由抽牌' };
const spreadNotes = {one:'给当下的自己一句提示',two:'看清现状，寻找下一步','past-present-future':'连接过去、现在与未来','situation-advice-outcome':'理解问题、建议和可能的走向',relationship:'看见彼此与关系的模样',five:'探索表象之下的影响与选择','celtic-cross':'从十个视角展开完整解读'};

for (const s of SPREADS) $('spread').add(new Option(spreadLabels[s.id] || s.name, s.id));
$('spread').value = 'past-present-future';

function transition(next) {
  if (!transitions[reading.phase].includes(next)) throw new Error(`Invalid reading transition: ${reading.phase} → ${next}`);
  reading.phase = next;
  sync();
}
function sync() {
  const s = spread();
  const count = reading.cards.length;
  document.querySelector('.reading').classList.toggle('awaiting-start', ['deckCreated', 'spreading'].includes(reading.phase));
  $('table').classList.toggle('empty-reading', count === 0);
  $('progress').textContent = `已选 ${count} / ${s.cardCount} 张`;
  $('remaining').textContent = `剩余 ${reading.deck.remainingCount} 张`;
  const messages = {
    deckCreated: '',
    spreading: '正在摊开牌堆…', deckSpread: `请选择第 ${count + 1} 张牌 · ${s.positions[count]?.label ?? ''}`,
    drawing: '正在将牌放入牌阵…', drawComplete: '牌已选齐。点击牌背逐张翻开，或使用下方按钮。',
    revealing: '正在翻牌，请稍候…', revealed: '点击牌面可放大查看',
  };
  $('status').textContent = messages[reading.phase] || '';
  for (const id of ['spread', 'mode', 'new-reading', 'shuffle', 'deck-settings', 'restart-reading', 'spread-picker']) $(id).disabled = busy();
  $('spread-deck').disabled = busy();
  $('spread-deck').hidden = reading.phase !== 'deckCreated';
  $('reveal-all').hidden = reading.phase !== 'drawComplete';
  $('interpret').hidden = reading.phase !== 'revealed';
  $('restart-reading').hidden = !['drawComplete', 'revealed'].includes(reading.phase);
  tableSpread.setEnabled(reading.phase === 'deckSpread');
  $('deck-hint').textContent = reading.phase === 'deckCreated' ? '' : reading.cards.length === s.cardCount ? '本轮选牌已完成' : '轻触牌背，将它从牌堆中抽出';
  updateBrowse();
  for (const [i, card] of reading.cards.entries()) {
    const button = $('table').children[i].querySelector('.card');
    if (button) button.disabled = !card.revealed && reading.phase !== 'drawComplete';
  }
}
function cardBack() {
  const back = document.createElement('span');
  back.className = 'face back';
  back.setAttribute('aria-hidden', 'true');
  return back;
}
function slotCard(index) {
  const button = document.createElement('button');
  button.className = 'card';
  button.setAttribute('aria-label', `Reveal card ${index + 1}: ${spread().positions[index].label}`);
  const inner = document.createElement('span');
  inner.className = 'card-inner';
  inner.append(cardBack());
  button.append(inner);
  button.addEventListener('click', () => {
    if (reading.cards[index].revealed) { showCardDetail(index); return; }
    if (reading.phase === 'drawComplete' && !reading.cards[index].revealed) revealOne(index);
  });
  return button;
}
function buildTable() {
  const s = spread();
  $('spread-title').textContent = spreadLabels[s.id] || s.name;
  $('spread-current').textContent = spreadLabels[s.id] || s.name;
  document.querySelector('main').classList.toggle('cross-reading', s.layout === 'cross' || s.layout === 'many');
  document.querySelector('.table-viewport').classList.toggle('scrolling-spread', s.layout === 'many');
  $('table').className = s.layout || '';
  $('table').dataset.count = s.cardCount;
  $('table').replaceChildren();
  s.positions.forEach((p, i) => {
    const slot = document.createElement('div');
    slot.className = `slot${p.angle ? ' crossing' : ''}`;
    slot.style.setProperty('--x', p.x);
    slot.style.setProperty('--y', p.y);
    const target = document.createElement('div');
    target.className = 'slot-target';
    const number = document.createElement('span');
    number.textContent = String(i + 1).padStart(2, '0');
    target.append(number);
    const label = document.createElement('div');
    label.className = 'slot-label';
    const prefix = document.createElement('b');
    prefix.textContent = String(i + 1).padStart(2, '0');
    label.append(prefix, p.label);
    slot.append(target, label);
    $('table').append(slot);
  });
  requestAnimationFrame(fitTable);
}
const tableSpread = new TableSpread($('deck-window'), $('card-spread'), {
  onDraw: button => chooseCard(button),
  onBrowse: updateBrowse,
});
function updateBrowse() {
  const viewport = $('deck-window');
  const max = viewport.scrollWidth - viewport.clientWidth;
  const shell = viewport.parentElement;
  shell.classList.toggle('clipped-left', viewport.scrollLeft > 2);
  shell.classList.toggle('clipped-right', viewport.scrollLeft < max - 2);
  document.querySelector('.browse').hidden = !reading || reading.phase === 'deckCreated' || max < 2;
  $('left').disabled = reading?.phase !== 'deckSpread' || viewport.scrollLeft < 2;
  $('right').disabled = reading?.phase !== 'deckSpread' || viewport.scrollLeft >= max - 2;
}

function startReading() {
 historyId=crypto.randomUUID();
 $('tarot-save-status').textContent='';$('tarot-save-retry').hidden=true;
  reading = { phase: 'idle', deck: new TarotDeck({ cardIds: deckIds }), spreadId: $('spread').value, mode: getMode(), question: $('question').value, cards: [] };
  record = null;
  $('interpretation').close();
  $('record-cards').replaceChildren();
  $('json').textContent = '';
  $('copy').textContent = '复制 JSON';
  $('deck-settings').textContent = `设置 · ${deckIds.length} 张`;
  buildTable();
  $('card-spread').replaceChildren();
  for (let i = 0; i < reading.deck.remainingCount; i++) {
    const button = document.createElement('button');
    button.className = 'deck-card';
    button.append(cardBack());
    button.addEventListener('click', event => {
      if (reading.phase === 'deckCreated') { spreadDeck(); return; }
      if (reading.phase !== 'deckSpread') return;
      tableSpread.activate(button);
    });
    $('card-spread').append(button);
  }
  tableSpread.reset([...$('card-spread').children]);
  transition('deckCreated');
}
async function requestReset(change = {}) {
  if (busy() || $('confirm').open) return;
  const nextSpread = change.customSpread || SPREADS.find(s => s.id === (change.spreadId || reading.spreadId));
  if ((change.cardIds || deckIds).length < nextSpread.cardCount) {
    $('status').textContent = `This spread needs ${nextSpread.cardCount} cards. Add more cards in Deck Settings first.`;
    return;
  }
  if (reading.cards.length) {
    $('confirm').returnValue = 'cancel';
    $('confirm').showModal();
    const result = await new Promise(resolve => $('confirm').addEventListener('close', () => resolve($('confirm').returnValue), { once: true }));
    if (result !== 'reset') return;
  }
  const switching = change.spreadId || change.customSpread;
  if (switching) {
    layoutChanging = true; sync();
    await document.querySelector('.reading').animate([{opacity:1},{opacity:0}], {duration:duration(140),fill:'forwards'}).finished;
  }
  if (change.customSpread) {
    const index = SPREADS.findIndex(s => s.id === 'custom');
    if (index < 0) { SPREADS.push(change.customSpread); $('spread').add(new Option('自由抽牌', 'custom')); }
    else SPREADS[index] = change.customSpread;
    change.spreadId = 'custom';
  }
  if (change.cardIds) deckIds = [...change.cardIds];
  if (change.spreadId) $('spread').value = change.spreadId;
  if (change.mode) setMode(change.mode);
  startReading();
  if (switching) {
    const area = document.querySelector('.reading');
    area.getAnimations().forEach(a => a.cancel());
    await area.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}], {duration:duration(220),easing:'ease-out'}).finished;
    layoutChanging = false; sync();
  }
}
$('new-reading').onclick = () => requestReset();
$('restart-reading').onclick = () => requestReset();
document.querySelector('.wordmark').onclick = event => { event.preventDefault(); requestReset(); };
$('shuffle').onclick = () => requestReset();
$('spread').onchange = () => {
  const selected = $('spread').value;
  $('spread').value = reading.spreadId;
  requestReset({ spreadId: selected });
};
$('mode').onchange = () => {
  const selected = getMode();
  if (!reading.cards.length) { reading.mode = selected; return; }
  setMode(reading.mode);
  requestReset({ mode: selected });
};
$('question').oninput = () => { reading.question = $('question').value; if (record) showRecord(); };
async function spreadDeck() {
  if (reading.phase !== 'deckCreated') return;
  transition('spreading');
  await tableSpread.expand();
  transition('deckSpread');
}
$('spread-deck').onclick = spreadDeck;
async function chooseCard(button) {
  const index = [...$('card-spread').children].indexOf(button);
  if (index < 0) return;
  const bounds = button.getBoundingClientRect();
  const sourceWidth = Number.parseFloat(getComputedStyle(button).width);
  const sourceHeight = button.offsetHeight;
  const sourceAngle = button.style.getPropertyValue('--angle') || '0deg';
  const sourceScale = new DOMMatrix(getComputedStyle(button).transform).a;
  const slotIndex = reading.cards.length;
  const card = reading.deck.drawAt(index);
  reading.cards.push({ card, revealed: false });
  transition('drawing');
  const target = $('table').children[slotIndex].querySelector('.slot-target');
  if (spread().layout === 'many') document.querySelector('.table-viewport').scrollTop = Math.max(0, target.parentElement.offsetTop - 16);
  const dest = target.getBoundingClientRect();
  const angle = spread().positions[slotIndex].angle || 0;
  const tableScale = Number($('table').dataset.scale || 1);
  const targetWidth = Number.parseFloat(getComputedStyle(target).width);
  const targetHeight = Number.parseFloat(getComputedStyle(target).height);
  const movingCard = slotCard(slotIndex);
  movingCard.disabled = true;
  // Decode before movement: the card never swaps to a different back or unloaded front.
  if (reading.mode === 'immediate') await prepareFront(movingCard, card);
  const flight = document.createElement('div');
  flight.className = 'flight';
  Object.assign(flight.style, { left: `${bounds.left + bounds.width / 2 - targetWidth / 2}px`, top: `${bounds.top + bounds.height / 2 - targetHeight / 2}px`, width: `${targetWidth}px`, height: `${targetHeight}px` });
  flight.append(movingCard);
  document.body.append(flight);
  button.style.visibility = 'hidden';
  const dx = dest.left + dest.width / 2 - bounds.left - bounds.width / 2;
  const dy = dest.top + dest.height / 2 - bounds.top - bounds.height / 2;
  const initialAngle = Number.parseFloat(sourceAngle);
  const initialScale = sourceWidth * sourceScale / targetWidth;
  // One continuous cubic path, with a gentle outward pull and a soft landing.
  // Spatial path samples, not rendered frames: WAAPI interpolates at browser cadence.
  const pathKeyframes = Array.from({length:61}, (_, i) => {
    const t = i / 60, u = 1 - t;
    const x = 3 * u * t * t * dx * .72 + t * t * t * dx;
    const y = 3 * u * u * t * 48 + 3 * u * t * t * (dy + 26) + t * t * t * dy;
    const scale = initialScale + (tableScale - initialScale) * t + Math.sin(Math.PI * t) * .035;
    return {offset:t, transform:`translate(${x}px,${y}px) rotate(${initialAngle + (angle-initialAngle)*t}deg) scale(${scale})`};
  });
  const animation = flight.animate(pathKeyframes, {duration:duration(1050), easing:'cubic-bezier(.25,.1,.25,1)', fill:'forwards'});
  let flip;
  if (reading.mode === 'immediate') {
    transition('revealing');
    const inner = movingCard.querySelector('.card-inner');
    inner.style.transition = 'none';
    flip = inner.animate([
      {transform:'rotateY(0deg)'}, {transform:'rotateY(180deg)'}
    ], {delay:duration(200), duration:duration(680), easing:'cubic-bezier(.4,0,.2,1)', fill:'forwards'});
  }
  await delay(260);
  tableSpread.remove(button);
  await animation.finished;
  if (flip) {
    await flip.finished;
    movingCard.classList.add('flipped');
    flip.cancel();
  }
  target.replaceChildren(movingCard);
  flight.remove();
  if (flip) { finishReveal(slotIndex, movingCard); afterReveal(); }
  else transition(reading.cards.length === spread().cardCount ? 'drawComplete' : 'deckSpread');
}
async function prepareFront(button, card) {
  const front = document.createElement('span');
  front.className = 'face front';
  const img = document.createElement('img');
  img.decoding = 'async';
  img.width = 560;
  img.height = 960;
  img.src = `${ASSET_BASE}/${CARD_BY_ID[card.id]}`;
  img.alt = card.name;
  if (card.reversed) img.className = 'reversed';
  front.append(img);
  button.querySelector('.card-inner').append(front);
  try { await img.decode(); } catch { img.remove(); front.textContent = card.name; }
}
function finishReveal(index, button) {
  const entry = reading.cards[index];
  entry.revealed = true;
  button.setAttribute('aria-label', `${entry.card.name}, ${entry.card.reversed ? 'reversed' : 'upright'}`);
  const caption = document.createElement('div');
  caption.className = 'card-name';
  const orientation = document.createElement('small');
  orientation.textContent = entry.card.reversed ? '逆位' : '正位';
  caption.append(entry.card.name, orientation);
  $('table').children[index].append(caption);
}

async function turnCard(index, { prepared = false, flipMs = 750 } = {}) {
  const entry = reading.cards[index];
  if (entry.revealed) return;
  const button = $('table').children[index].querySelector('.card');
  if (!prepared) await prepareFront(button, entry.card);
  const inner = button.querySelector('.card-inner');
  inner.style.transition = 'none';
  const flip = inner.animate([
    { transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }
  ], { duration: duration(flipMs), easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  await flip.finished;
  button.classList.add('flipped');
  flip.cancel();
  finishReveal(index, button);
}

function afterReveal() {
  transition(reading.cards.length < spread().cardCount ? 'deckSpread' : reading.cards.every(c => c.revealed) ? 'revealed' : 'drawComplete');
 if(reading.phase==='revealed')saveHistory();
}
async function revealOne(index) {
  transition('revealing');
  await turnCard(index);
  afterReveal();
}
$('reveal-all').onclick = async () => {
  if (reading.phase !== 'drawComplete') return;
  transition('revealing');
  const pending = reading.cards.flatMap((entry, index) => entry.revealed ? [] : [index]);
  // Decode together so network/image timing cannot scramble the reveal order.
  await Promise.all(pending.map(index => prepareFront($('table').children[index].querySelector('.card'), reading.cards[index].card)));
  await Promise.all(pending.map(async (index, order) => {
    if (order) await delay(order * 70);
    await turnCard(index, { prepared: true, flipMs: 520 });
  }));
  afterReveal();
};
function showRecord() {
  if (reading.phase !== 'revealed') return;
  const s = spread();
  record = { question: reading.question, spread: { id: s.id, name: s.name }, cards: reading.cards.map(({ card }, i) => ({ position: s.positions[i].label, cardId: card.id, name: card.name, reversed: card.reversed })) };
  $('record-question').textContent = record.question || 'An open reading';
  $('record-cards').replaceChildren();
  for (const c of record.cards) {
    const block = document.createElement('div');
    block.className = 'record-card';
    const position = document.createElement('span'); position.textContent = c.position;
    const name = document.createElement('strong'); name.textContent = c.name;
    const orientation = document.createElement('small'); orientation.textContent = c.reversed ? 'Reversed' : 'Upright';
    block.append(position, name, orientation);
    $('record-cards').append(block);
  }
  $('json').textContent = JSON.stringify(record, null, 2);
  $('interpretation').showModal();
}
$('interpret').onclick = () => { showRecord();  };
$('record-close').onclick = () => $('interpretation').close();
$('copy').onclick = async () => {
  try { await navigator.clipboard.writeText(JSON.stringify(record, null, 2)); $('copy').textContent = '已复制'; }
  catch { $('copy').textContent = '请在下方选中 JSON 复制'; $('json').parentElement.open = true; }
};

let detailRequest = 0;
function showCardDetail(index) {
  const card = reading.cards[index].card;
  const request = ++detailRequest;
  $('detail-title').textContent = card.name;
  $('detail-orientation').textContent = `${spread().positions[index].label} · ${card.reversed ? '逆位' : '正位'}`;
  const image = $('detail-image');
  // Reuse the already-loaded table image while fetching just this card's detail.
  image.src = `${ASSET_BASE}/${CARD_BY_ID[card.id]}`;
  image.alt = card.name;
  image.decoding = 'async';
  image.classList.toggle('reversed', card.reversed);
  image.setAttribute('aria-busy', 'true');
  $('detail-status').textContent = '正在加载清晰牌面…';
  $('detail-retry').hidden = true;
  $('detail-retry').onclick = () => showCardDetail(index);
  if (!$('card-detail').open) $('card-detail').showModal();
  const full = new Image();
  full.decoding = 'async';
  full.src = `${DETAIL_ASSET_BASE}/${CARD_BY_ID[card.id]}`;
  full.decode().then(() => {
    if (request !== detailRequest) return;
    image.src = full.src;
    image.setAttribute('aria-busy', 'false');
    $('detail-status').textContent = '';
  }).catch(() => {
    if (request !== detailRequest) return;
    image.setAttribute('aria-busy', 'false');
    $('detail-status').textContent = '清晰牌面加载失败，仍可查看预览图。';
    $('detail-retry').hidden = false;
  });
}
$('card-detail').addEventListener('close', () => { detailRequest++; });
$('detail-close').onclick = () => $('card-detail').close();

$('left').onclick = () => $('deck-window').scrollBy({left:-320, behavior: reducedMotion ? 'instant' : 'smooth'});
$('right').onclick = () => $('deck-window').scrollBy({left:320, behavior: reducedMotion ? 'instant' : 'smooth'});
// Deck composition is explicit metadata, separate from the hidden shuffled positions.
const catalog = buildCanonicalDeck();
const categories = [
  ['major', '大阿卡纳 · Major Arcana', c => c.arcana === 'major'],
  ['Wands', '权杖 · Wands', c => c.suit === 'Wands'],
  ['Cups', '圣杯 · Cups', c => c.suit === 'Cups'],
  ['Swords', '宝剑 · Swords', c => c.suit === 'Swords'],
  ['Pentacles', '星币 · Pentacles', c => c.suit === 'Pentacles'],
];
let draftIds = new Set();
function updateSettings() {
  for (const input of $('card-catalog').querySelectorAll('input[data-card]')) input.checked = draftIds.has(Number(input.dataset.card));
  for (const input of $('card-catalog').querySelectorAll('input[data-group]')) {
    const members = catalog.filter(categories.find(g => g[0] === input.dataset.group)[2]);
    const chosen = members.filter(c => draftIds.has(c.id)).length;
    input.checked = chosen === members.length;
    input.indeterminate = chosen > 0 && chosen < members.length;
  }
  const required = spread().cardCount;
  $('settings-count').textContent = `${draftIds.size} cards selected · 当前牌阵需要 ${required} 张`;
  $('settings-apply').disabled = draftIds.size < required;
  $('settings-error').textContent = draftIds.size < required ? `请至少选择 ${required} 张牌。` : '';
}
for (const [key, title, predicate] of categories) {
  const group = document.createElement('details');
  group.open = key === 'major';
  const summary = document.createElement('summary');
  summary.textContent = `${title} · ${catalog.filter(predicate).length}`;
  const groupLabel = document.createElement('label');
  groupLabel.className = 'group-toggle';
  const groupInput = document.createElement('input');
  groupInput.type = 'checkbox'; groupInput.dataset.group = key;
  groupInput.onchange = () => { catalog.filter(predicate).forEach(c => groupInput.checked ? draftIds.add(c.id) : draftIds.delete(c.id)); updateSettings(); };
  groupLabel.append(groupInput, '选择此分类 / Select category');
  const cards = document.createElement('div'); cards.className = 'catalog-grid';
  for (const c of catalog.filter(predicate)) {
    const label = document.createElement('label');
    const input = document.createElement('input'); input.type = 'checkbox'; input.dataset.card = c.id;
    input.onchange = () => { input.checked ? draftIds.add(c.id) : draftIds.delete(c.id); updateSettings(); };
    label.append(input, c.name); cards.append(label);
  }
  group.append(summary, groupLabel, cards); $('card-catalog').append(group);
}
$('deck-settings').onclick = () => { draftIds = new Set(deckIds); updateSettings(); $('settings').showModal(); };
$('settings-close').onclick = () => $('settings').close();
for (const button of document.querySelectorAll('[data-preset]')) button.onclick = () => {
  draftIds = new Set(catalog.filter(c => button.dataset.preset === 'all' || c.arcana === button.dataset.preset).map(c => c.id));
  updateSettings();
};
$('settings-form').onsubmit = event => {
  event.preventDefault();
  if (draftIds.size < spread().cardCount) return;
  const selected = [...draftIds];
  $('settings').close();
  if (selected.length === deckIds.length && selected.every(id => deckIds.includes(id))) return;
  requestReset({ cardIds: selected });
};
startReading();

// Fit the physical table into the available stage, never outside the viewport.
function fitTable() {
  const stage = document.querySelector('.table-viewport');
  const table = $('table');
  if (!reading) return;
  if (spread().layout === 'cross') {
    const scale = Math.min(stage.clientWidth / 1120, stage.clientHeight / 800, 1.15);
    table.dataset.scale = scale;
    table.style.transform = `translate(-50%, -50%) scale(${scale})`;
    table.style.removeProperty('--cw');
  } else if (spread().layout === 'many') {
    table.dataset.scale = 1; table.style.transform = '';
    const columns = Math.max(1, Math.min(6, Math.floor(stage.clientWidth / 170)));
    table.style.setProperty('--columns', columns);
    table.style.setProperty('--cw', `${Math.min(145, (stage.clientWidth - 40 - (columns - 1) * 32) / columns)}px`);
  } else {
    table.dataset.scale = 1; table.style.transform = '';
    const count = spread().cardCount;
    const gap = matchMedia("(max-width: 760px)").matches ? 16 : 44;
    const width = Math.min(count <= 2 ? 235 : 185, (document.querySelector('.reading').clientHeight - 164) * 7 / 12, (stage.clientWidth - (count - 1) * gap) / count);
    table.style.setProperty('--cw', `${Math.max(50, width)}px`);
  }
}
new ResizeObserver(fitTable).observe(document.querySelector('.table-viewport'));

// Purpose-led picker: previews show the arrangement, while names describe intent.
for (const s of SPREADS.filter(s => s.id !== 'custom')) {
  const option = document.createElement('button');
  option.type = 'button'; option.className = 'spread-option'; option.dataset.spread = s.id;
  const preview = document.createElement('div'); preview.className = `spread-preview preview-${s.id}`; preview.setAttribute('aria-hidden','true');
  s.positions.forEach((p,i) => {
    const card = document.createElement('i');
    const positions = s.layout === 'cross' ? [[42,34],[42,34],[42,64],[12,34],[42,4],[70,34],[94,70],[94,48],[94,26],[94,4]][i] : s.id === 'relationship' ? [[18,28],[50,8],[82,28]][i] : s.id === 'five' ? [[10,26],[30,14],[50,4],[70,14],[90,26]][i] : s.id === 'situation-advice-outcome' ? [[20,6],[50,22],[80,38]][i] : [50 + (i-(s.cardCount-1)/2)*28,20];
    card.style.left = `${positions[0]}%`; card.style.top = `${positions[1]}px`; card.style.transform = `translateX(-50%) rotate(${p.angle || 0}deg)`; preview.append(card);
  });
  const name = document.createElement('strong'); name.textContent = spreadLabels[s.id];
  const note = document.createElement('span'); note.textContent = spreadNotes[s.id];
  const meta = document.createElement('small'); meta.textContent = `${s.cardCount} 张牌`;
  option.append(preview,name,note,meta);
  option.onclick = () => { $('spread-dialog').close(); if(s.id !== reading.spreadId) requestReset({spreadId:s.id}); };
  $('spread-options').append(option);
}
$('spread-picker').onclick = () => {
  $('free-count').max = deckIds.length;
  $('free-limit').textContent = `可选 1–${deckIds.length} 张 · 大牌阵放在侧边选牌，超出区域的牌可在牌阵内滚动查看`;
  for (const button of $('spread-options').children) {
    button.setAttribute('aria-pressed', String(button.dataset.spread === reading.spreadId));
    button.disabled = SPREADS.find(s => s.id === button.dataset.spread).cardCount > deckIds.length;
  }
  $('spread-dialog').showModal();
};
$('spread-close').onclick = () => $('spread-dialog').close();
$('free-spread-form').onsubmit = event => {
  event.preventDefault();
  const count = Number($('free-count').value);
  if (!Number.isInteger(count) || count < 1 || count > deckIds.length) return;
  $('spread-dialog').close();
  requestReset({customSpread:{id:'custom',name:'自由抽牌',cardCount:count,layout:count>5?'many':'',positions:Array.from({length:count},(_,i)=>({key:`card-${i+1}`,label:`第 ${i+1} 张`,x:i,y:0}))}});
};


function saveHistory(){try{saveRecord({id:historyId,kind:'tarot',title:reading.question||'无题的探索',createdAt:Date.now(),snapshot:{question:reading.question,spread:{...spread(),name:spreadLabels[spread().id]||spread().name},cards:reading.cards.map(({card},i)=>({...card,position:spread().positions[i].label}))}});$('tarot-save-status').textContent='本次抽牌已保存到历史记录';$('tarot-save-retry').hidden=true;}catch(e){$('tarot-save-status').textContent='记录保存失败：'+e.message;$('tarot-save-retry').hidden=false;}}
$('tarot-save-retry').onclick=saveHistory;
window.parent.postMessage({type:'tool-ready'},location.origin);
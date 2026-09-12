import {birthRecord} from './birth-record.js';
import {captureForm} from './chart-bridge.js';
import {setupBirthClock} from './birth-clock.js';
import {listRecords,saveRecord,readRecord} from './storage.js';
import {applyBirthFields} from './case-library.js';
// Keep birth information and calculation preferences distinct without duplicating forms.
export function setupChartWorkspace(form, kind, _calculate) {
  setupBirthClock(form);
  const panel = form.closest('.input-panel');
  const dialog = document.createElement('dialog');
  dialog.className = 'chart-editor';
  dialog.setAttribute('aria-labelledby', 'chart-editor-title');
  dialog.innerHTML = '<div class="editor-heading"><div><h2 id="chart-editor-title">出生资料</h2><p id="chart-editor-help"></p></div><button type="button" class="editor-close" aria-label="关闭">×</button></div>';
  document.getElementById(`${kind}-app`).append(dialog);
  dialog.append(panel);
  panel.querySelector('.panel-heading').hidden = true;
  for (const child of form.children) {
    const rules = child.matches('.advanced') || Boolean(child.querySelector('[name="clockMode"]'));
    if (!child.matches('button[type="submit"], .error-message')) child.dataset.editorGroup = rules ? 'rules' : 'birth';
  }
  const submit = form.querySelector('button[type="submit"]');
  const error = form.querySelector('.error-message');
  submit.setAttribute('form', form.id);
  submit.classList.add('editor-submit');
  if (error) dialog.append(error);
  dialog.append(submit);
  const library = document.createElement('div');
  library.className = 'birth-library';
  library.innerHTML = '<div class="birth-library-actions"><button type="button" class="outline" data-pick>从命例库选择</button><button type="button" class="primary" data-save>保存到命例库</button></div><label class="field" hidden>八字与紫微共用命例库<select aria-label="选择命例"><option value="">请选择命例</option></select></label><p role="status"></p>';
  panel.before(library);
  const feedback = library.querySelector('[role="status"]');
  const selector = library.querySelector('select');
  let records = [];
  library.querySelector('[data-pick]').onclick = () => {
    try {
      records = listRecords('cases');
      selector.replaceChildren(new Option('请选择命例', ''));
      for (const record of records) {
        const fields = record.form || [];
        const value = name => fields.find(f => f.name === name)?.value || '';
        const option=new Option(`${record.title} · ${value('year')}-${value('month')}-${value('day')}`, record.id);
        option.dataset.noI18n='';
        selector.add(option);
      }
      selector.parentElement.hidden = false;
      feedback.textContent = records.length ? '选择后填入出生资料，点击生成命盘查看结果。' : '命例库还没有记录，可以先填写并保存一份。';
    } catch (e) { feedback.textContent = e.message; }
  };
  selector.onchange = () => {
    const record = records.find(r => r.id === selector.value);
    if (!record) return;
    try {
      applyBirthFields(form, record);
      form.dispatchEvent(new Event('birth-selected'));
      // Never replace the other engine's saved chart with this engine's output.
      history.replaceState(null, '', '?record=' + encodeURIComponent(record.id));
      feedback.textContent = '已填入出生资料；排盘后可保存当前命盘。';
    } catch (e) { feedback.textContent = e.message; }
  };
  library.querySelector('[data-save]').onclick = () => {
    if (!form.reportValidity()) return;
    try {
      const fields=captureForm(form), birth=birthRecord(fields);
      const id=new URLSearchParams(location.search).get('record');
      const old=id?readRecord(id):null;
      const record={...old,id:old?.id,kind:'case',title:birth.name||'未命名命例',createdAt:old?.createdAt||Date.now(),updatedAt:Date.now(),birth,form:fields,settings:{...old?.settings,[kind]:fields},snapshot:old?.snapshot||{}};
      const saved=saveRecord(record);history.replaceState(null,'','?record='+encodeURIComponent(saved.id));
      feedback.textContent='出生资料已保存到命例库';
    } catch(e){feedback.textContent='保存失败：'+e.message;}

  };
  const open = mode => {
    dialog.dataset.mode = mode;
    library.hidden = mode !== 'birth';
    dialog.querySelector('h2').textContent = mode === 'birth' ? '出生资料' : '排盘规则';
    dialog.querySelector('#chart-editor-help').textContent = mode === 'birth'
      ? '请填写出生时当地的钟表时间；选择出生城市后，默认开启真太阳时修正。'
      : '调整历法与计算口径，应用后重新排盘。';
    for (const child of form.querySelectorAll(':scope > [data-editor-group]')) child.hidden = child.dataset.editorGroup !== mode;
    for (const details of form.querySelectorAll('details.advanced')) details.open = true;
    dialog.showModal();
  };
  if(new URLSearchParams(location.search).has('newCase')) {document.body.classList.add('case-entry-only');open('birth');}
  document.getElementById('edit-birth').onclick = () => open('birth');
  document.getElementById('edit-rules').onclick = () => open('rules');
  dialog.querySelector('.editor-close').onclick = () => dialog.close();
  form.addEventListener('submit', () => {
    // Existing calculation listener runs first and leaves failures in its error box.
    if (document.getElementById(`${kind}-error`).hidden) dialog.close();
  });
}

import {birthRecord} from './birth-record.js';
import {hasBirthLocation} from './birth-clock.js';
import {sharedBirthFields} from './case-library.js';
import {saveRecord,readRecord} from './storage.js';
export function captureForm(form){return Array.from(form.elements).filter(e=>e.name).map(e=>({name:e.name,type:e.type,value:e.value,checked:Boolean(e.checked)}));}
export function connectChart(kind,getSnapshot){
 const button=document.getElementById('save-case');const status=document.getElementById('case-status');
 button.onclick=()=>{
  try{const snapshot=getSnapshot();if(!snapshot)throw new Error('请先完成排盘，再保存命例。');
   const existing=new URLSearchParams(location.search).get('record');const old=existing?readRecord(existing):null;
   const record={id:old?.kind==='case'?old.id:undefined,kind:'case',birth:birthRecord(snapshot.profile._form),charts:{...old?.charts,[kind]:{snapshot,form:snapshot.profile._form}},title:snapshot.profile?.name||'未命名命例',createdAt:old?.createdAt||Date.now(),updatedAt:Date.now(),snapshot,form:snapshot.profile._form};
   const saved=saveRecord(record);history.replaceState(null,'','?record='+encodeURIComponent(saved.id));status.textContent='命例已保存在当前浏览器';
  }catch(e){status.textContent='保存失败：'+e.message;}
 };
}
export function restoreChart(form,calculate,kind){
 const id=new URLSearchParams(location.search).get('record');if(!id)return;
 try{const record=readRecord(id);if(!record||!Array.isArray(record.form))throw new Error('找不到这份命例');
  const savedFields=kind?((record.settings?.[kind]||record.charts?.[kind]) ? [...(record.settings?.[kind]||record.charts[kind].form||[]).filter(f=>!sharedBirthFields(record).some(b=>b.name===f.name)),...sharedBirthFields(record)] : sharedBirthFields(record)):record.form;
  const apply=()=>{for(const saved of savedFields){for(const e of form.elements){if(e.name!==saved.name)continue;if(e.type==='radio'){if(e.value===saved.value)e.checked=saved.checked;}else if(e.type==='checkbox'){e.checked=saved.checked;}else e.value=saved.value;}}};
  const dispatch=name=>{const el=form.querySelector(`[name="${name}"]:checked`)||form.querySelector(`[name="${name}"]`);el?.dispatchEvent(new Event('change',{bubbles:true}));};
  const offsetPicker=form.querySelector('.offset-picker');if(offsetPicker)delete offsetPicker.dataset.savedOffset;
  apply();for(const name of ['inputCalendar','clockMode','lunarLeapToggle','lunarSpecialToggle','calendarMode','calendarDayBoundary','pillarHistoricalMode'])dispatch(name);apply();
  // Re-apply dependent locks after the second value pass. Otherwise an imported
  // foreign UTC offset can visually overwrite the disabled UTC+8 controls.
  for(const name of ['calendarMode','pillarHistoricalMode','calendarDayBoundary'])dispatch(name);
  if(kind&&(!hasBirthLocation(form)||(!record.charts?.[kind]&&!record.settings?.[kind]))){const radio=form.querySelector(`[name="clockMode"][value="${hasBirthLocation(form)?'true-solar':'civil'}"]`);if(radio){radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));}}
  if(!calculate())throw new Error('当前内核无法重新排出这份命例，原始保存结果仍在命例簿中');
  document.getElementById('case-status').textContent='已恢复命例的出生信息与排盘设置';
 }catch(e){document.getElementById('case-status').textContent=e.message;}
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {sharedBirthFields,applyBirthFields} from '../public/shared/case-library.js';
import {setupHistoricalUtcLock} from '../public/shared/calendar-boundary.js';
test('cross-tool import shares birth data without replacing chart rules',()=>{
 const record={form:[{name:'year',value:'2000'},{name:'gender',type:'radio',value:'female',checked:true},{name:'clockMode',value:'true-solar'},{name:'calendarMode',value:'historical'},{name:'sihuaGeng',value:'custom'}]};
 const elements=[{name:'year',value:'1990'},{name:'gender',type:'radio',value:'female',checked:false},{name:'clockMode',value:'civil'}];
 applyBirthFields({elements,querySelector(){return null}},record);
 assert.equal(elements[0].value,'2000');assert.equal(elements[1].checked,true);assert.equal(elements[2].value,'civil');
 assert.deepEqual(sharedBirthFields(record).map(f=>f.name),['year','gender']);
});
test('lunar birth imports retain their calendar convention, day boundary and leap-month fields',()=>{
 const form=[{name:'inputCalendar',type:'radio',value:'lunar',checked:true},{name:'calendarMode',value:'local-astronomical'},{name:'calendarDayBoundary',value:'mean-solar-meridian'},{name:'lunarMonthKind',value:'leap'},{name:'ratHourMode',value:'split'}];
 assert.deepEqual(sharedBirthFields({form}).map(f=>f.name),['inputCalendar','calendarMode','calendarDayBoundary','lunarMonthKind']);
 assert.throws(()=>sharedBirthFields({}),/没有保存出生资料/);
});

test('solar correction requires an explicit place and valid longitude, including zero', async()=>{
 const {hasBirthLocation}=await import('../public/shared/birth-clock.js');
 const form={elements:{location:{value:''},longitude:{value:''}}};
 assert.equal(hasBirthLocation(form),false);
 form.elements.location.value='伦敦';assert.equal(hasBirthLocation(form),false);
 form.elements.longitude.value='0';assert.equal(hasBirthLocation(form),true);
 form.elements.longitude.value='181';assert.equal(hasBirthLocation(form),false);
});

test('loading a foreign-zone historical lunar case finishes with visible UTC+8 locked controls',()=>{
 const listeners={change:[]},picker={dataset:{},classList:{toggle(){}}},note={classList:{toggle(){}},textContent:''};
 const controls=[
  {name:'inputCalendar',type:'radio',value:'lunar',checked:true},
  {name:'calendarMode',type:'select-one',value:'local-astronomical'},
  {name:'calendarDayBoundary',type:'select-one',value:'fixed-utc-offset'},
  {name:'offsetSign',type:'select-one',value:'-1'},
  {name:'offsetHour',type:'text',value:'05'},
  {name:'offsetMinute',type:'text',value:'30'},
 ];
 const elements=Object.assign(controls,Object.fromEntries(controls.map(control=>[control.name,control])));
 const form={elements,addEventListener(name,fn){(listeners[name]??=[]).push(fn)},querySelector(selector){if(selector==='.offset-picker')return picker;if(selector.includes('#offset-mode-note'))return note;const name=selector.match(/name="([^"]+)/)?.[1];return controls.find(control=>control.name===name)??null}};
 for(const control of controls)control.dispatchEvent=event=>{for(const listener of listeners.change)listener({...event,target:control})};
 setupHistoricalUtcLock(form);
 applyBirthFields(form,{form:[
  {name:'inputCalendar',type:'radio',value:'lunar',checked:true},
  {name:'calendarMode',value:'historical'},
  {name:'calendarDayBoundary',value:'fixed-utc-offset'},
  {name:'offsetSign',value:'-1'},{name:'offsetHour',value:'05'},{name:'offsetMinute',value:'30'},
 ]});
 assert.deepEqual([elements.offsetSign.value,elements.offsetHour.value,elements.offsetMinute.value],['1','08','00']);
 assert.ok(elements.offsetSign.disabled&&elements.offsetHour.disabled&&elements.offsetMinute.disabled);
 assert.match(note.textContent,/中国历史历法.*UTC\+8/);
 elements.calendarMode.value='local-astronomical';elements.calendarMode.dispatchEvent(new Event('change'));
 assert.deepEqual([elements.offsetSign.value,elements.offsetHour.value,elements.offsetMinute.value],['-1','05','30']);
 assert.equal(elements.offsetHour.disabled,false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {sharedBirthFields,applyBirthFields} from '../public/shared/case-library.js';
test('cross-tool import shares birth data without replacing chart rules',()=>{
 const record={form:[{name:'year',value:'2000'},{name:'gender',type:'radio',value:'female',checked:true},{name:'clockMode',value:'true-solar'},{name:'calendarMode',value:'historical'},{name:'sihuaGeng',value:'custom'}]};
 const elements=[{name:'year',value:'1990'},{name:'gender',type:'radio',value:'female',checked:false},{name:'clockMode',value:'civil'}];
 applyBirthFields({elements,querySelector(){return null}},record);
 assert.equal(elements[0].value,'2000');assert.equal(elements[1].checked,true);assert.equal(elements[2].value,'civil');
 assert.deepEqual(sharedBirthFields(record).map(f=>f.name),['year','gender']);
});
test('lunar birth imports retain their calendar convention and leap-month fields',()=>{
 const form=[{name:'inputCalendar',type:'radio',value:'lunar',checked:true},{name:'calendarMode',value:'historical'},{name:'lunarMonthKind',value:'leap'},{name:'ratHourMode',value:'split'}];
 assert.deepEqual(sharedBirthFields({form}).map(f=>f.name),['inputCalendar','calendarMode','lunarMonthKind']);
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

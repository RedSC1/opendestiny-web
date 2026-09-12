import test from 'node:test';
import assert from 'node:assert/strict';
import {birthRecord} from '../public/shared/birth-record.js';
import {setupBirthClock} from '../public/shared/birth-clock.js';
test('original lunar date, clock and signed UTC offset round trip without JD',()=>{
 const fields=Object.entries({inputCalendar:'lunar',year:'-12',month:'6',day:'3',lunarMonthKind:'leap',hour:'23',minute:'59',second:'7',offsetSign:'-1',offsetHour:'5',offsetMinute:'30',location:'',longitude:'',latitude:''}).map(([name,value])=>({name,value}));
 const saved=JSON.parse(JSON.stringify(birthRecord(fields)));
 assert.deepEqual(saved.lunarDay,{year:-12,month:6,day:3,monthKind:'leap'});
 assert.equal(saved.utcOffsetMinutes,-330);assert.equal(saved.hour,23);assert.equal(saved.second,7);
 assert.equal(saved.longitude,null);assert.equal('solarDay' in saved,false);assert.equal('jd' in saved,false);
 fields[0].value='solar';assert.deepEqual(birthRecord(fields).solarDay,{year:-12,month:6,day:3});
});
test('missing city disables correction; selecting city enables it; clearing resets clock',()=>{
 const events={};const note={setAttribute(){}};globalThis.document={createElement(){return note}};
 const form={elements:{location:{value:''},longitude:{value:''}},addEventListener(name,fn){(events[name]??=[]).push(fn)},querySelectorAll(){return radios},querySelector(query){return query.includes('value=')?radios.find(r=>query.includes(`"${r.value}"`)):radios[0]}};
 const radios=['civil','mean-solar','true-solar'].map(value=>({name:'clockMode',value,closest(){return {append(){}}},dispatchEvent(){for(const fn of events.change||[])fn({target:this})}}));
 setupBirthClock(form);assert.ok(radios[1].disabled);assert.ok(radios[2].disabled);
 form.elements.location.value='北京';form.elements.longitude.value='116.4';for(const fn of events.change)fn({target:form});
 assert.equal(radios[2].disabled,false);assert.equal(radios[2].checked,true);
 form.elements.location.value='';for(const fn of events.input)fn({target:form});
 assert.equal(radios[1].disabled,true);assert.equal(radios[2].disabled,true);assert.equal(radios[0].checked,true);
});

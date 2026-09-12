import test from 'node:test';
import assert from 'node:assert/strict';
import {FIXED_UTC_OFFSET,MEAN_SOLAR_MERIDIAN,hasValidLongitude,resolveCalendarBoundary,setupLocalCalendarBoundary} from '../public/shared/calendar-boundary.js';

test('local astronomical calendars support standard-time and longitude day boundaries',()=>{
 assert.deepEqual(resolveCalendarBoundary('local-astronomical',FIXED_UTC_OFFSET,''),{dayBoundaryMode:FIXED_UTC_OFFSET,meridianDeg:undefined});
 assert.deepEqual(resolveCalendarBoundary('local-astronomical',MEAN_SOLAR_MERIDIAN,'116.4'),{dayBoundaryMode:MEAN_SOLAR_MERIDIAN,meridianDeg:116.4});
});

test('longitude day boundaries require an explicit valid longitude',()=>{
 assert.equal(hasValidLongitude('0'),true);
 assert.equal(hasValidLongitude(''),false);
 assert.equal(hasValidLongitude('181'),false);
 assert.throws(()=>resolveCalendarBoundary('local-astronomical',MEAN_SOLAR_MERIDIAN,''),/有效的出生地经度/);
 assert.deepEqual(resolveCalendarBoundary('historical',MEAN_SOLAR_MERIDIAN,''),{dayBoundaryMode:FIXED_UTC_OFFSET,meridianDeg:undefined});
});

test('local boundary controls appear together and disable longitude mode until longitude exists',()=>{
 const events={},fields=[{hidden:false},{hidden:false}],longitudeOption={value:MEAN_SOLAR_MERIDIAN,disabled:false};
 const select={value:MEAN_SOLAR_MERIDIAN,disabled:false,options:[{value:FIXED_UTC_OFFSET},longitudeOption]};
 const form={elements:{calendarMode:{value:'historical'},calendarDayBoundary:select,longitude:{value:''}},querySelectorAll(){return fields},addEventListener(name,fn){(events[name]??=[]).push(fn)}};
 setupLocalCalendarBoundary(form);
 assert.deepEqual(fields.map(field=>field.hidden),[true,true]);
 form.elements.calendarMode.value='local-astronomical';for(const fn of events.change)fn({target:{name:'calendarMode'}});
 assert.deepEqual(fields.map(field=>field.hidden),[false,false]);assert.equal(select.value,FIXED_UTC_OFFSET);assert.equal(longitudeOption.disabled,true);
 form.elements.longitude.value='0';for(const fn of events.input)fn({target:{name:'longitude'}});
 assert.equal(longitudeOption.disabled,false);
});

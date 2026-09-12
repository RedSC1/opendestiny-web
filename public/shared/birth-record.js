export function birthRecord(fields) {
 const value=name=>fields.find(f=>f.name===name&&(f.type!=='radio'||f.checked))?.value;
 const date={year:Number(value('year')),month:Number(value('month')),day:Number(value('day'))};
 const lunar=value('inputCalendar')==='lunar';
 return {name:value('name')||'',gender:value('gender'),...(lunar?{lunarDay:{...date,monthKind:value('lunarMonthKind')||'normal',specialName:value('lunarSpecialName')}}:{solarDay:date}),hour:Number(value('hour')),minute:Number(value('minute')),second:Number(value('second')),utcOffsetMinutes:Number(value('offsetSign')||1)*(Number(value('offsetHour')||0)*60+Number(value('offsetMinute')||0)),city:value('location')||'',longitude:value('longitude')===''?null:Number(value('longitude')),latitude:value('latitude')===''?null:Number(value('latitude'))};
}

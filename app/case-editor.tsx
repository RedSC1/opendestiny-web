'use client';
import {useState} from 'react';
import {saveRecord} from '../public/shared/storage.js';

export default function CaseEditor({onSaved}:{onSaved:()=>void}) {
 const [calendar,setCalendar]=useState('solar'),[city,setCity]=useState(''),[longitude,setLongitude]=useState(''),[correction,setCorrection]=useState('civil'),[error,setError]=useState('');
 const located=city.trim()!==''&&longitude.trim()!==''&&Number.isFinite(Number(longitude))&&Math.abs(Number(longitude))<=180;
 const updatePlace=(c:string,l:string)=>{setCity(c);setLongitude(l);setCorrection(c.trim()&&l.trim()&&Math.abs(Number(l))<=180?'true-solar':'civil')};
 const submit=(event:React.SyntheticEvent<HTMLFormElement>)=>{
  event.preventDefault();const data=new FormData(event.currentTarget);
  const values=Object.fromEntries(data.entries()) as Record<string,string>;
  const date={year:Number(values.year),month:Number(values.month),day:Number(values.day)};
  if(calendar==='solar') {const d=new Date(0);d.setUTCFullYear(date.year,date.month-1,date.day);if(d.getUTCMonth()!==date.month-1||d.getUTCDate()!==date.day){setError('请检查出生日期，这个月没有这一天。');return;}}
  const birth={name:values.name,gender:values.gender,...(calendar==='solar'?{solarDay:date}:{lunarDay:{...date,monthKind:values.lunarMonthKind||'normal'}}),hour:Number(values.hour),minute:Number(values.minute),second:Number(values.second),utcOffsetMinutes:Number(values.offsetSign)*(Number(values.offsetHour)*60+Number(values.offsetMinute)),city,longitude:longitude===''?null:Number(longitude),latitude:values.latitude===''?null:Number(values.latitude)};
  const fields=Object.entries({...values,inputCalendar:calendar,location:city,longitude,clockMode:located?correction:'civil'}).map(([name,value])=>({name,type:['inputCalendar','gender','clockMode'].includes(name)?'radio':'text',value,checked:true}));
  try{saveRecord({kind:'case',title:values.name.trim()||'未命名命例',createdAt:Date.now(),birth,form:fields,settings:{bazi:fields,ziwei:fields},snapshot:{}});onSaved()}catch(e){setError('保存失败：'+(e as Error).message)}
 };
 return <form className="standalone-case-editor" onSubmit={submit}>
 <div className="case-form-grid"><label>姓名<input name="name" placeholder="未命名命例"/></label><label>性别<select name="gender"><option value="male">男</option><option value="female">女</option></select></label></div>
 <div className="case-form-grid"><label>出生日期类型<select value={calendar} onChange={e=>setCalendar(e.target.value)}><option value="solar">公历</option><option value="lunar">农历</option></select></label><label>历法口径<select name="calendarMode"><option value="historical">中国历史历法</option><option value="china-astronomical">现代中国天文历法</option></select></label></div>
 <div className="case-form-grid three">{['year','month','day'].map((name,i)=><label key={name}>{['年','月','日'][i]}<input type="number" name={name} defaultValue={[2000,1,1][i]} min={i===0?-6000:1} max={i===0?10000:i===1?(calendar==='solar'?12:13):(calendar==='solar'?31:30)} required/></label>)}</div>
 {calendar==='lunar'&&<label>农历月份<select name="lunarMonthKind"><option value="normal">普通月</option><option value="leap">闰月</option><option value="later-nine">后九月</option><option value="thirteen">十三月</option></select></label>}
 <p>出生时间 · 当地钟表时间</p><div className="case-form-grid three">{['hour','minute','second'].map((name,i)=><label key={name}>{['时','分','秒'][i]}<input type="number" name={name} defaultValue={0} min={0} max={i===0?23:59} required/></label>)}</div>
 <p>出生时的 UTC 偏移</p><div className="case-form-grid three"><label>正负<select name="offsetSign"><option value="1">＋</option><option value="-1">−</option></select></label><label>小时<input name="offsetHour" type="number" min="0" max="14" defaultValue="8" required/></label><label>分钟<input name="offsetMinute" type="number" min="0" max="59" defaultValue="0" required/></label></div>
 <label>出生城市<input name="location" value={city} onChange={e=>updatePlace(e.target.value,longitude)} placeholder="可不填；填写城市及经度后启用修正"/></label>
 <div className="case-form-grid"><label>经度<input name="longitude" type="number" min="-180" max="180" step="any" value={longitude} onChange={e=>updatePlace(city,e.target.value)}/></label><label>纬度<input name="latitude" type="number" min="-90" max="90" step="any"/></label></div>
 <label>时间修正<select name="clockMode" value={located?correction:'civil'} onChange={e=>setCorrection(e.target.value)}><option value="civil">钟表时间</option><option value="mean-solar" disabled={!located}>平太阳时修正</option><option value="true-solar" disabled={!located}>真太阳时修正</option></select></label>
 {!located&&<p>请填写出生城市及经度，再启用太阳时修正。</p>}
 {error&&<p role="alert" className="error-text">{error}</p>}<button type="submit" className="case-save-primary">保存命例</button>
 </form>;
}

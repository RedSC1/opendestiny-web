// Device-local data only. Records use compact numeric ids; exported indexes are file-local.
export const TOOL_IDS=['tarot','bazi','ziwei','calendar','qishuo'];
const PREFIX='redsc-tools:v1:';
const RECORD_PREFIX=PREFIX+'record:';
const LAST_RECORD_ID_KEY=PREFIX+'last-record-id';
const MAX_RECORD_ID=2147483647;
export const CASE_ARCHIVE_FORMAT='redsc1-tools-cases';
export const CASE_ARCHIVE_VERSION=2;

export function signalChange(){window.dispatchEvent(new Event('tools-data'));if(window.parent!==window)window.parent.postMessage({type:'tools-data'},location.origin);}

function recordKeys(){
 const keys=[];
 for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(RECORD_PREFIX))keys.push(key);}
 return keys;
}
function storageError(error){
 const message=`${String(error?.name||'')} ${String(error?.message||error)}`.trim();
 if(/quota|exceed/i.test(message))return new Error('当前浏览器的本地存储空间已满。请先导出命例备份，再删除部分记录后重试。');
 return error instanceof Error?error:new Error(message);
}
function numericId(value){
 if(typeof value!=='string'||!/^\d+$/.test(value))return 0;
 const id=Number(value);
 return Number.isSafeInteger(id)&&id>0&&id<=MAX_RECORD_ID?id:0;
}
function currentLastRecordId(){
 let last=numericId(localStorage.getItem(LAST_RECORD_ID_KEY));
 for(const key of recordKeys())last=Math.max(last,numericId(key.slice(RECORD_PREFIX.length)));
 return last;
}
function restoreValue(key,value){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}
function compactRecordIds(){
 const entries=recordKeys().map(key=>({key,raw:localStorage.getItem(key)}));
 if(entries.length>=MAX_RECORD_ID)throw new Error(`当前浏览器最多可保存 ${MAX_RECORD_ID} 条记录，请先导出备份并删除部分记录。`);
 entries.sort((left,right)=>{
  const a=JSON.parse(left.raw),b=JSON.parse(right.raw);
  return (Number(a.createdAt)||0)-(Number(b.createdAt)||0)||left.key.localeCompare(right.key);
 });
 const previousLast=localStorage.getItem(LAST_RECORD_ID_KEY);
 for(const entry of entries)localStorage.removeItem(entry.key);
 try{
  entries.forEach((entry,index)=>{
   const record={...JSON.parse(entry.raw),id:String(index+1)};
   localStorage.setItem(RECORD_PREFIX+record.id,JSON.stringify(record));
  });
  localStorage.setItem(LAST_RECORD_ID_KEY,String(entries.length));
 }catch(error){
  for(const key of recordKeys())localStorage.removeItem(key);
  for(const entry of entries)restoreValue(entry.key,entry.raw);
  restoreValue(LAST_RECORD_ID_KEY,previousLast);
  throw storageError(error);
 }
}
function reserveRecordIds(count){
 let last=currentLastRecordId();
 if(last+count>MAX_RECORD_ID){compactRecordIds();last=currentLastRecordId();}
 if(last+count>MAX_RECORD_ID)throw new Error(`当前浏览器最多可保存 ${MAX_RECORD_ID} 条记录，请先导出备份并删除部分记录。`);
 const previousLast=localStorage.getItem(LAST_RECORD_ID_KEY);
 try{localStorage.setItem(LAST_RECORD_ID_KEY,String(last+count));}catch(error){throw storageError(error);}
 return {first:last+1,previousLast};
}
function migrateLegacyRecordIds(){
 const legacy=recordKeys().filter(key=>!numericId(key.slice(RECORD_PREFIX.length))).map(key=>({key,raw:localStorage.getItem(key)}));
 if(!legacy.length)return;
 const allocation=reserveRecordIds(legacy.length),written=[];
 try{
  legacy.forEach((entry,index)=>{
   const id=String(allocation.first+index),record={...JSON.parse(entry.raw),id};
   localStorage.setItem(RECORD_PREFIX+id,JSON.stringify(record));written.push(id);
  });
  for(const entry of legacy)localStorage.removeItem(entry.key);
 }catch(error){
  for(const id of written)localStorage.removeItem(RECORD_PREFIX+id);
  restoreValue(LAST_RECORD_ID_KEY,allocation.previousLast);
  throw storageError(error);
 }
}

export function normalizeCase(record){if(record&&['bazi','ziwei'].includes(record.kind))return {...record,kind:'case',charts:{[record.kind]:{snapshot:record.snapshot,form:record.form}}};return record;}
export function listRecords(kind){
 migrateLegacyRecordIds();
 const records=[];
 for(const key of recordKeys()){
  const record=normalizeCase(JSON.parse(localStorage.getItem(key)));
  if(!record||typeof record.id!=='string'||!['tarot','bazi','ziwei','case'].includes(record.kind)||typeof record.createdAt!=='number')throw new Error('记录格式异常，原始数据已保留。');
  if(!kind||record.kind===kind||(kind==='cases'&&record.kind!=='tarot'))records.push(record);
 }
 return records.sort((a,b)=>b.createdAt-a.createdAt);
}
export function readRecord(id){const raw=localStorage.getItem(RECORD_PREFIX+id);if(!raw)return null;const record=JSON.parse(raw);return normalizeCase(numericId(id)?record:saveRecord(record));}
export function saveRecord(record){
 if(!record||!['tarot','bazi','ziwei','case'].includes(record.kind)||!record.createdAt)throw new Error('无法保存无效记录');
 const requestedId=typeof record.id==='string'?record.id:'';
 const oldKey=requestedId?RECORD_PREFIX+requestedId:'';
 const existing=oldKey&&localStorage.getItem(oldKey)!==null;
 const canKeepId=existing&&Boolean(numericId(requestedId));
 let allocation=null;
 let id=requestedId;
 if(!canKeepId){allocation=reserveRecordIds(1);id=String(allocation.first);}
 const saved={...record,id};
 try{
  localStorage.setItem(RECORD_PREFIX+id,JSON.stringify(saved));
  if(existing&&oldKey!==RECORD_PREFIX+id)localStorage.removeItem(oldKey);
 }catch(error){
  if(allocation){localStorage.removeItem(RECORD_PREFIX+id);restoreValue(LAST_RECORD_ID_KEY,allocation.previousLast);}
  throw storageError(error);
 }
 signalChange();
 return saved;
}
export function deleteRecord(id){localStorage.removeItem(RECORD_PREFIX+id);if(recordKeys().length===0)localStorage.removeItem(LAST_RECORD_ID_KEY);signalChange();}
export function clearRecords(kind){for(const record of listRecords(kind))localStorage.removeItem(RECORD_PREFIX+record.id);if(recordKeys().length===0)localStorage.removeItem(LAST_RECORD_ID_KEY);signalChange();}
export function getPreferences(){const raw=localStorage.getItem(PREFIX+'preferences');const p=raw?JSON.parse(raw):{};return {featured:TOOL_IDS.includes(p.featured)?p.featured:'auto',motion:p.motion!==false,locale:p.locale==='zh-TW'?'zh-TW':'zh-CN'};}
export function setPreferences(patch){const p={...getPreferences(),...patch};localStorage.setItem(PREFIX+'preferences',JSON.stringify(p));signalChange();return p;}
export function recordUsage(tool,now=Date.now()){
 if(!TOOL_IDS.includes(tool))return;
 const day=Math.floor(now/86400000),key=PREFIX+'usage:'+day+':'+tool;
 localStorage.setItem(key,String((Number(localStorage.getItem(key))||0)+1));signalChange();
}
export function chooseFeatured(preferences,counts){if(TOOL_IDS.includes(preferences.featured))return preferences.featured;return TOOL_IDS.reduce((best,id)=>(counts[id]||0)>(counts[best]||0)?id:best,'tarot');}
export function getFeatured(now=Date.now()){
 const day=Math.floor(now/86400000),counts={};
 for(const id of TOOL_IDS){counts[id]=0;for(let d=day-29;d<=day;d++)counts[id]+=Number(localStorage.getItem(PREFIX+'usage:'+d+':'+id))||0;}
 return chooseFeatured(getPreferences(),counts);
}

function stableValue(value){
 if(Array.isArray(value))return value.map(stableValue);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stableValue(value[key])]));
 return value;
}
function stableStringify(value){return JSON.stringify(stableValue(value));}
function caseContent(record){
 const content={...record};
 delete content.id;delete content.index;delete content.createdAt;delete content.updatedAt;
 return content;
}
function isDuplicate(left,right){return stableStringify(caseContent(left))===stableStringify(caseContent(right));}
function validateCaseRecord(value,index,version){
 const record=normalizeCase(value);
 if(!record||typeof record!=='object'||Array.isArray(record))throw new Error(`第 ${index+1} 条命例格式不正确。`);
 if(record.kind!=='case')throw new Error(`第 ${index+1} 条记录不是命例。`);
 if(version===2&&record.index!==index+1)throw new Error(`第 ${index+1} 条命例的文件内序号无效。`);
 if(version===1&&(typeof record.id!=='string'||!/^[A-Za-z0-9._:-]{1,200}$/.test(record.id)))throw new Error(`第 ${index+1} 条命例编号无效。`);
 if(typeof record.title!=='string'||!record.title.trim()||record.title.length>200)throw new Error(`第 ${index+1} 条命例名称无效。`);
 if(!Number.isFinite(record.createdAt)||record.createdAt<=0)throw new Error(`第 ${index+1} 条命例时间无效。`);
 if(!record.birth&&!Array.isArray(record.form)&&!record.snapshot)throw new Error(`第 ${index+1} 条命例缺少出生资料。`);
 const copy=JSON.parse(JSON.stringify(record));
 delete copy.id;delete copy.index;
 return copy;
}
export function createCaseArchive(){
 const records=listRecords('cases').map((record,index)=>{const content={...record};delete content.id;return {index:index+1,...content};});
 return {format:CASE_ARCHIVE_FORMAT,version:CASE_ARCHIVE_VERSION,exportedAt:new Date().toISOString(),records};
}
export function parseCaseArchive(input){
 let value=input;
 if(typeof input==='string'){
  try{value=JSON.parse(input);}catch{throw new Error('无法读取这个文件，请选择由本工具导出的 JSON 命例备份。');}
 }
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('命例备份格式不正确。');
 if(value.format!==CASE_ARCHIVE_FORMAT)throw new Error('这不是本工具导出的命例备份。');
 if(![1,CASE_ARCHIVE_VERSION].includes(value.version))throw new Error(`暂不支持版本 ${String(value.version)} 的命例备份。`);
 if(!Array.isArray(value.records))throw new Error('命例备份中没有可读取的记录。');
 if(value.records.length>10000)throw new Error('单次最多导入 10000 条命例。');
 return value.records.map((record,index)=>validateCaseRecord(record,index,value.version));
}
export function previewCaseImport(input){
 const incoming=parseCaseArchive(input),working=listRecords('cases').slice();
 let newCount=0,duplicateCount=0;
 for(const record of incoming){
  if(working.some(item=>isDuplicate(item,record))){duplicateCount++;continue;}
  working.push(record);newCount++;
 }
 return {total:incoming.length,newCount,duplicateCount};
}
export function importCaseArchive(input){
 const incoming=parseCaseArchive(input),working=listRecords('cases').slice(),accepted=[];
 let duplicateCount=0;
 for(const record of incoming){
  if(working.some(item=>isDuplicate(item,record))){duplicateCount++;continue;}
  working.push(record);accepted.push(record);
 }
 if(!accepted.length)return {added:0,duplicateCount};
 const allocation=reserveRecordIds(accepted.length),written=[];
 try{
  accepted.forEach((record,index)=>{
   const id=String(allocation.first+index),saved={...record,id};
   localStorage.setItem(RECORD_PREFIX+id,JSON.stringify(saved));written.push(id);
  });
 }catch(error){
  for(const id of written)localStorage.removeItem(RECORD_PREFIX+id);
  restoreValue(LAST_RECORD_ID_KEY,allocation.previousLast);
  throw storageError(error);
 }
 signalChange();
 return {added:accepted.length,duplicateCount};
}

import test from 'node:test';
import assert from 'node:assert/strict';
import * as store from '../public/shared/storage.js';

class MemoryStorage{map=new Map();get length(){return this.map.size}key(i){return [...this.map.keys()][i]??null}getItem(k){return this.map.get(k)??null}setItem(k,v){this.map.set(k,String(v))}removeItem(k){this.map.delete(k)}}
function reset(){globalThis.localStorage=new MemoryStorage();globalThis.window={dispatchEvent(){}};window.parent=window;}
const record=(kind,extra={})=>({kind,title:'test',createdAt:1,snapshot:{cards:[]},...extra});

test('new records use a persistent increasing local id',()=>{
 reset();
 assert.equal(store.saveRecord(record('tarot')).id,'1');
 assert.equal(store.saveRecord(record('case',{birth:{year:2000}})).id,'2');
 store.deleteRecord('2');
 assert.equal(store.saveRecord(record('case',{birth:{year:2001}})).id,'3');
 assert.equal(localStorage.getItem('redsc-tools:v1:last-record-id'),'3');
});

test('records survive re-reading and clearing tarot preserves both chart kinds',()=>{
 reset();localStorage.setItem('unrelated','keep');
 const ids=['tarot','bazi','ziwei'].map(kind=>store.saveRecord(record(kind)).id);
 assert.equal(store.listRecords().length,3);store.clearRecords('tarot');
 assert.equal(store.listRecords('cases').length,2);assert.equal(localStorage.getItem('unrelated'),'keep');
 assert.ok(store.listRecords('cases').every(item=>item.kind==='case'));assert.ok(store.readRecord(ids[2]).charts.ziwei);
 store.clearRecords('cases');assert.equal(store.listRecords().length,0);assert.equal(localStorage.getItem('redsc-tools:v1:last-record-id'),null);
});

test('resaving a reading updates its numeric id rather than duplicating it',()=>{
 reset();const saved=store.saveRecord(record('tarot'));
 store.saveRecord({...saved,title:'updated'});
 assert.equal(store.listRecords().length,1);assert.equal(store.readRecord(saved.id).title,'updated');
});

test('a legacy id is migrated when its record is next saved',()=>{
 reset();const legacy={id:'old-uuid',...record('case',{birth:{year:2000}})};
 localStorage.setItem('redsc-tools:v1:record:old-uuid',JSON.stringify(legacy));
 const saved=store.saveRecord({...legacy,title:'updated'});
 assert.equal(saved.id,'1');assert.equal(store.readRecord('old-uuid'),null);assert.equal(store.readRecord('1').title,'updated');
});

test('listing records migrates existing legacy ids to the numeric sequence',()=>{
 reset();const legacy={id:'old-uuid',...record('case',{birth:{year:2000}})};
 localStorage.setItem('redsc-tools:v1:record:old-uuid',JSON.stringify(legacy));
 assert.deepEqual(store.listRecords().map(item=>item.id),['1']);assert.equal(localStorage.getItem('redsc-tools:v1:record:old-uuid'),null);
});

test('storage failures use a helpful message and retain existing records',()=>{
 reset();store.saveRecord(record('bazi'));
 const originalSet=localStorage.setItem.bind(localStorage);localStorage.setItem=(key,value)=>{if(key.endsWith('last-record-id'))throw new Error('QuotaExceededError');originalSet(key,value)};
 assert.throws(()=>store.saveRecord(record('tarot')),/本地存储空间已满/);assert.equal(store.listRecords().length,1);
});

test('corrupt data is reported without silent deletion',()=>{reset();localStorage.setItem('redsc-tools:v1:record:broken','broken');assert.throws(()=>store.listRecords());assert.equal(localStorage.length,1);});
test('recommendations use only last 30 calendar days and honor a fixed tool',()=>{reset();const now=100*86400000;store.recordUsage('ziwei',now-29*86400000);for(let i=0;i<5;i++)store.recordUsage('bazi',now-30*86400000);assert.equal(store.getFeatured(now),'ziwei');store.recordUsage('tarot',now);assert.equal(store.getFeatured(now),'tarot');store.setPreferences({featured:'bazi'});assert.equal(store.getFeatured(now),'bazi');store.clearRecords('cases');assert.equal(store.getFeatured(now),'bazi');});

test('language preference defaults to simplified and persists traditional Chinese',()=>{
 reset();assert.equal(store.getPreferences().locale,'zh-CN');
 assert.equal(store.setPreferences({locale:'zh-TW'}).locale,'zh-TW');
 assert.equal(store.getPreferences().locale,'zh-TW');
 localStorage.setItem('redsc-tools:v1:preferences',JSON.stringify({locale:'unknown'}));
 assert.equal(store.getPreferences().locale,'zh-CN');
});

test('case archive excludes local ids and tarot history, then assigns a new id on import',()=>{
 reset();store.saveRecord(record('case',{birth:{year:2000,month:1,day:1}}));store.saveRecord(record('tarot'));
 const archive=store.createCaseArchive();
 assert.equal(archive.format,'redsc1-tools-cases');assert.equal(archive.version,2);
 assert.deepEqual(archive.records.map(item=>item.index),[1]);assert.equal('id' in archive.records[0],false);
 store.clearRecords('cases');
 const result=store.importCaseArchive(JSON.stringify(archive));
 assert.deepEqual(result,{added:1,duplicateCount:0});assert.equal(store.listRecords('cases')[0].id,'3');assert.equal(store.listRecords('tarot')[0].id,'2');
});

test('tarot archive backs up readings separately and reallocates local ids',()=>{
 reset();
 const reading=record('tarot',{snapshot:{question:'today',spread:{id:'one',name:'此刻的指引',cardCount:1,positions:[{key:'focus',label:'此刻'}]},cards:[{id:0,name:'The Fool',reversed:false,position:'此刻'}]}});
 store.saveRecord(reading);store.saveRecord(record('case',{birth:{year:2000}}));
 const archive=store.createTarotArchive();
 assert.equal(archive.format,'redsc1-tools-tarot-history');assert.equal(archive.version,1);assert.deepEqual(archive.records.map(item=>item.index),[1]);assert.equal('id' in archive.records[0],false);
 assert.deepEqual(store.previewTarotImport(archive),{total:1,newCount:0,duplicateCount:1});
 store.clearRecords('tarot');
 assert.deepEqual(store.importTarotArchive(JSON.stringify(archive)),{added:1,duplicateCount:0});
 assert.equal(store.listRecords('tarot')[0].id,'3');assert.equal(store.listRecords('cases')[0].id,'2');
});

test('tarot import skips exact readings and rejects case archives',()=>{
 reset();
 const reading={index:1,...record('tarot',{snapshot:{question:'today',spread:{id:'one',name:'此刻的指引'},cards:[{id:0,name:'The Fool',reversed:false,position:'此刻'}]}})};
 const archive={format:'redsc1-tools-tarot-history',version:1,records:[reading,{...reading,index:2,createdAt:99}]};
 assert.deepEqual(store.previewTarotImport(archive),{total:2,newCount:1,duplicateCount:1});
 assert.deepEqual(store.importTarotArchive(archive),{added:1,duplicateCount:1});
 assert.throws(()=>store.importTarotArchive(store.createCaseArchive()),/抽牌历史备份/);
});

test('different content imports as another record while exact content is skipped',()=>{
 reset();const original=store.saveRecord(record('case',{birth:{year:2000,month:1,day:1}}));
 const same={...original,id:'from-another-browser',createdAt:999};
 const changed={...same,id:'another-id',title:'changed'};
 const archive={format:'redsc1-tools-cases',version:1,records:[same,changed]};
 assert.deepEqual(store.previewCaseImport(archive),{total:2,newCount:1,duplicateCount:1});
 assert.deepEqual(store.importCaseArchive(archive),{added:1,duplicateCount:1});
 assert.deepEqual(store.listRecords('cases').map(item=>item.id).sort(),['1','2']);
 assert.ok(store.listRecords('cases').some(item=>item.title==='changed'));
});

test('duplicates within the imported file are skipped too',()=>{
 reset();const archived={index:1,...record('case',{birth:{year:2000}})};
 const archive={format:'redsc1-tools-cases',version:2,records:[archived,{...archived,index:2,createdAt:99}]};
 assert.deepEqual(store.previewCaseImport(archive),{total:2,newCount:1,duplicateCount:1});
 assert.deepEqual(store.importCaseArchive(archive),{added:1,duplicateCount:1});
});

test('version 2 archive indexes must match file order',()=>{
 reset();const archive={format:'redsc1-tools-cases',version:2,records:[{index:2,...record('case',{birth:{year:2000}})}]};
 assert.throws(()=>store.importCaseArchive(archive),/文件内序号无效/);assert.equal(store.listRecords().length,0);
});

test('an exhausted id range compacts gaps before assigning the next id',()=>{
 reset();
 localStorage.setItem('redsc-tools:v1:record:4',JSON.stringify({id:'4',...record('tarot',{createdAt:4})}));
 localStorage.setItem('redsc-tools:v1:record:9',JSON.stringify({id:'9',...record('case',{createdAt:9,birth:{year:2000}})}));
 localStorage.setItem('redsc-tools:v1:last-record-id','2147483647');
 const saved=store.saveRecord(record('case',{createdAt:10,birth:{year:2001}}));
 assert.equal(saved.id,'3');assert.deepEqual(store.listRecords().map(item=>item.id).sort(),['1','2','3']);assert.equal(localStorage.getItem('redsc-tools:v1:last-record-id'),'3');
});

test('invalid archive is rejected without changing local records',()=>{
 reset();const saved=store.saveRecord(record('case',{birth:{year:2000}}));
 assert.throws(()=>store.importCaseArchive('{bad json'),/无法读取这个文件/);assert.deepEqual(store.listRecords('cases').map(item=>item.id),[saved.id]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {captureForm,connectChart,restoreChart} from '../public/shared/chart-bridge.js';
import {listRecords,saveRecord} from '../public/shared/storage.js';
function setup(){const data=new Map();globalThis.localStorage={get length(){return data.size},key:i=>[...data.keys()][i],getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};globalThis.location={origin:'https://example.com',search:''};globalThis.window={dispatchEvent(){}};window.parent=window;globalThis.history={replaceState(a,b,q){location.search=q}};const nodes={'save-case':{},'case-status':{textContent:''}};globalThis.document={getElementById:id=>nodes[id]};return nodes;}
test('case saves the last successful input and updates an opened case in place',()=>{const nodes=setup();const lastInput=[{name:'year',type:'number',value:'2001',checked:false}];const snapshot={profile:{name:'测试',_form:lastInput}};connectChart('bazi',()=>snapshot);nodes['save-case'].onclick();assert.equal(listRecords().length,1);assert.deepEqual(listRecords()[0].form,lastInput);nodes['save-case'].onclick();assert.equal(listRecords().length,1);});
test('restore preserves radio selection, checkbox state and numeric fields',()=>{setup();const elements=[{name:'year',type:'number',value:'1990'},{name:'gender',type:'radio',value:'male',checked:true},{name:'gender',type:'radio',value:'female',checked:false},{name:'leap',type:'checkbox',value:'on',checked:false}];const fields=[{name:'year',type:'number',value:'2001',checked:false},{name:'gender',type:'radio',value:'male',checked:false},{name:'gender',type:'radio',value:'female',checked:true},{name:'leap',type:'checkbox',value:'on',checked:true}];const saved=saveRecord({kind:'ziwei',title:'test',createdAt:1,snapshot:{},form:fields});location.search='?record='+saved.id;let calculated=false;restoreChart({elements,querySelector(){return null}},()=>{calculated=true;return true});assert.equal(calculated,true);assert.equal(elements[0].value,'2001');assert.equal(elements[1].checked,false);assert.equal(elements[2].checked,true);assert.equal(elements[3].checked,true);assert.equal(captureForm({elements}).length,4);});
test('failed calculation does not allow saving a stale or missing chart',()=>{const nodes=setup();connectChart('ziwei',()=>null);nodes['save-case'].onclick();assert.equal(listRecords().length,0);assert.match(nodes['case-status'].textContent,/保存失败/)});
test('one case retains both engine results when saved from the other tool',()=>{
 const nodes=setup();
 const form=[{name:'year',type:'number',value:'2000',checked:false}];
 connectChart('bazi',()=>({engine:'bazi',profile:{name:'共用命例',_form:form}}));nodes['save-case'].onclick();
 const id=listRecords('cases')[0].id;
 connectChart('ziwei',()=>({engine:'ziwei',profile:{name:'共用命例',_form:form}}));nodes['save-case'].onclick();
 const records=listRecords('cases');assert.equal(records.length,1);assert.equal(records[0].id,id);assert.equal(records[0].kind,'case');
 assert.equal(records[0].charts.bazi.snapshot.engine,'bazi');assert.equal(records[0].charts.ziwei.snapshot.engine,'ziwei');
});

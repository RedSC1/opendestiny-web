import {getPreferences,setPreferences,listRecords,TOOL_IDS} from './storage.js';
export function registerPersonalTools(context){
 if(!context?.registerTool)return()=>{};
 const lifecycle=new AbortController();
 const definitions=[{
  name:'get_local_collection_summary',title:'查看本机记录数量',description:'Read counts of tarot readings and saved charts in this browser; does not reveal birth data or questions.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(){const records=listRecords();return {tarot:records.filter(r=>r.kind==='tarot').length,bazi:records.filter(r=>r.kind==='bazi').length,ziwei:records.filter(r=>r.kind==='ziwei').length,preferences:getPreferences()};}
 },{
  name:'set_home_featured_tool',title:'设置首页主工具',description:'Set the same device-local homepage preference as the settings panel. auto uses recent 30-day usage.',inputSchema:{type:'object',properties:{tool:{type:'string',enum:['auto',...TOOL_IDS]}},required:['tool'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!['auto',...TOOL_IDS].includes(input.tool)||Object.keys(input).some(k=>k!=='tool'))throw new Error('Invalid tool');return setPreferences({featured:input.tool});}
 }];
 for(const definition of definitions){try{Promise.resolve(context.registerTool(definition,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
 return ()=>lifecycle.abort();
}

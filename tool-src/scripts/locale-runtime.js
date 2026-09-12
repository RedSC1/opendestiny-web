import {createMessageTranslator} from './message-translator.js';
const PREFERENCES_KEY='redsc-tools:v1:preferences';
const textState=new WeakMap();
const attributeState=new WeakMap();
const translatedAttributes=['aria-label','alt','placeholder','title'];
const localeLoaders={
 'zh-CN':()=>import('./locales/zh-CN.js'),
 'zh-TW':()=>import('./locales/zh-TW.js'),
};
const translators=new Map();
let locale=readLocale(),translate=value=>value,scheduled=false;
window.redsc1I18n={get locale(){return locale},translate:value=>translate(String(value))};

function readLocale(){
 try{return JSON.parse(localStorage.getItem(PREFERENCES_KEY)||'{}').locale==='zh-TW'?'zh-TW':'zh-CN'}catch{return 'zh-CN'}
}

function excluded(node){
 const element=node.nodeType===Node.ELEMENT_NODE?node:node.parentElement;
 return Boolean(element?.closest('script,style,code,pre,textarea,[contenteditable],[data-no-translate],[data-no-i18n]'));
}

function updateText(node){
 if(excluded(node))return;
 const value=node.nodeValue||'';
 let state=textState.get(node);
 if(!state||value!==state.source&&value!==state.output)state={source:value,output:value};
 const output=translate(state.source);
 state.output=output;textState.set(node,state);
 if(value!==output)node.nodeValue=output;
}

function updateAttributes(element){
 if(excluded(element))return;
 let states=attributeState.get(element);
 if(!states){states=new Map();attributeState.set(element,states)}
 for(const name of translatedAttributes){
  if(!element.hasAttribute(name))continue;
  const value=element.getAttribute(name)||'';
  let state=states.get(name);
  if(!state||value!==state.source&&value!==state.output)state={source:value,output:value};
  const output=translate(state.source);
  state.output=output;states.set(name,state);
  if(value!==output)element.setAttribute(name,output);
 }
}

function updateTree(root=document.documentElement){
 if(root.nodeType===Node.TEXT_NODE){updateText(root);return}
 if(root.nodeType!==Node.ELEMENT_NODE)return;
 updateAttributes(root);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
 while(walker.nextNode())walker.currentNode.nodeType===Node.TEXT_NODE?updateText(walker.currentNode):updateAttributes(walker.currentNode);
}

async function applyLocale(next=readLocale()){
 locale=next==='zh-TW'?'zh-TW':'zh-CN';
 document.documentElement.lang=locale;
 document.documentElement.dataset.locale=locale;
 if(!translators.has(locale))translators.set(locale,createMessageTranslator((await localeLoaders[locale]()).messages));
 translate=translators.get(locale);
 updateTree();
 document.dispatchEvent(new CustomEvent('redsc1-locale-ready',{detail:{locale}}));
 return locale;
}

function schedule(){
 if(scheduled)return;scheduled=true;
 queueMicrotask(()=>{scheduled=false;updateTree()});
}

new MutationObserver(records=>{
 for(const record of records){
  if(record.type==='characterData')updateText(record.target);
  else if(record.type==='attributes')updateAttributes(record.target);
  else for(const node of record.addedNodes)updateTree(node);
 }
}).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:translatedAttributes});

addEventListener('storage',event=>{if(event.key===PREFERENCES_KEY){const next=readLocale();if(next!==locale)location.reload();else window.redsc1LocaleReady=applyLocale(next)}});
addEventListener('tools-data',()=>{const next=readLocale();if(next!==locale)window.redsc1LocaleReady=applyLocale(next);else schedule()});
window.redsc1LocaleReady=applyLocale(locale);

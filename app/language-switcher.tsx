'use client';
import {useEffect,useState} from 'react';
import {Languages} from 'lucide-react';
import {getPreferences,setPreferences,type Preferences} from '../public/shared/storage.js';

export default function LanguageSwitcher(){
 const [locale,setLocale]=useState<Preferences['locale']>('zh-CN');
 useEffect(()=>{const refresh=()=>{try{setLocale(getPreferences().locale)}catch{}};refresh();window.addEventListener('tools-data',refresh);return()=>window.removeEventListener('tools-data',refresh)},[]);
 const choose=(next:Preferences['locale'])=>{if(next===locale)return;try{setPreferences({locale:next});setLocale(next);location.reload()}catch{}};
 return <div className="language-switcher" data-no-translate><span><Languages size={15}/>{locale==='zh-TW'?'語言':'语言'}</span><fieldset aria-label={locale==='zh-TW'?'切換語言':'切换语言'}><button type="button" aria-pressed={locale==='zh-CN'} onClick={()=>choose('zh-CN')}>简体</button><button type="button" aria-pressed={locale==='zh-TW'} onClick={()=>choose('zh-TW')}>繁體</button></fieldset></div>;
}

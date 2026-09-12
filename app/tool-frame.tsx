'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,RotateCw} from 'lucide-react';
import {Skeleton} from '@/components/ui/skeleton';
import {nameOf,type ToolId} from './tool-catalog';
export default function ToolFrame({tool,record,onBack}:{tool:ToolId;record?:string;onBack:()=>void}){
 const frame=useRef<HTMLIFrameElement>(null),onBackRef=useRef(onBack),[attempt,setAttempt]=useState(0),key=`${tool}-${record}-${attempt}`,[load,setLoad]=useState({key:'',ready:false,failed:false});
 useEffect(()=>{onBackRef.current=onBack},[onBack]);
 const ready=load.key===key&&load.ready,failed=load.key===key&&load.failed;
 useEffect(()=>{const timer=setTimeout(()=>setLoad({key,ready:false,failed:true}),25000);const handler=(e:MessageEvent)=>{if(e.origin===location.origin&&e.source===frame.current?.contentWindow&&e.data?.type==='tool-back'){onBackRef.current();return;}if(e.origin===location.origin&&e.source===frame.current?.contentWindow&&e.data?.type==='tool-ready'){clearTimeout(timer);setLoad({key,ready:true,failed:false});}};window.addEventListener('message',handler);return()=>{clearTimeout(timer);window.removeEventListener('message',handler)}},[key]);
 return <section className="tool-workspace" data-tool={tool}>{!['tarot','bazi','ziwei','calendar','qishuo'].includes(tool)&&<div className="workbench-bar"><button onClick={onBack}><ArrowLeft size={16}/>全部工具</button><h1>{nameOf(tool)}</h1><span>本机工作空间</span></div>}{!ready&&<output className="tool-loading">{failed?<><p>工具暂时未能载入，请检查网络后重试。</p><button onClick={()=>setAttempt(a=>a+1)}><RotateCw size={16}/>重新加载</button></>:<><Skeleton className="h-6 w-48"/><Skeleton className="h-40 w-full"/><p>正在载入{nameOf(tool)}，首次打开需要下载计算资源…</p></>}</output>}<iframe key={key} ref={frame} title={nameOf(tool)} src={`/tools/${tool}/index.html?v=placeholder-cleanup-1${record?'&record='+encodeURIComponent(record):''}`} className={ready?'ready':''}/></section>;
}

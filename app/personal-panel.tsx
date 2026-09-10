'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { BookOpen, History, Sparkles } from 'lucide-react';
export default function PersonalPanel({kind,onClose}:{kind:string;onClose:()=>void}){
 const [motion,setMotion]=useState(true); const [storageError,setStorageError]=useState(false);
 useEffect(()=>{try{setMotion(localStorage.getItem('tools-motion')!=='off')}catch{setStorageError(true)}},[]);
 const title=kind==='settings'?'偏好设置':kind==='cases'?'命例簿':kind==='history'?'抽牌历史':'塔罗牌桌';
 const Icon=kind==='cases'?BookOpen:kind==='history'?History:Sparkles;
 return <Dialog open onOpenChange={open=>{if(!open)onClose()}}><DialogContent className="personal-dialog"><DialogTitle>{title}</DialogTitle><DialogDescription>{kind==='settings'?'让这个空间，更适合你的节奏。':'你的个人工作空间'}</DialogDescription>{kind==='settings'?<div><div className="setting-row"><label htmlFor="motion">界面动效<small>牌面悬停与轻微过渡</small></label><Switch id="motion" checked={motion} onCheckedChange={v=>{setMotion(v);document.documentElement.dataset.motion=v?'on':'off';try{localStorage.setItem('tools-motion',v?'on':'off')}catch{setStorageError(true)}}}/></div><p className="setting-note">{storageError?'浏览器未允许保存设置，本次访问仍然生效。':'设置仅保存在当前浏览器。'}</p></div>:<div className="empty-space"><Icon size={38} strokeWidth={1}/><h3>{kind==='tarot'?'牌桌，即将搬进来。':'这里，留给下一次探索。'}</h3><p>{kind==='tarot'?'这版先确认工具站首页。原有塔罗牌桌将在下一步迁入，保留抽牌体验。':kind==='cases'?'命例保存将在排盘工具迁入后接通；当前没有已保存的命例。':'塔罗牌桌迁入后，这里会收纳你的抽牌记录。'}</p><button className="pill-link" onClick={onClose}>回到工具间</button></div>}</DialogContent></Dialog>
}

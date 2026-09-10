'use client';
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { ArrowUpRight, Grid2X2, Layers, CalendarDays, Orbit, Compass, BookOpen, History, Settings2, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import { Sidebar, SidebarProvider, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
const PersonalPanel = lazy(() => import('./personal-panel'));
const tools = [
  {id:'bazi', name:'八字排盘', en:'FOUR PILLARS', description:'四柱之间，读懂时间的纹理。', icon:Layers},
  {id:'ziwei', name:'紫微斗数', en:'PURPLE STAR', description:'十二宫位，铺开人生的星图。', icon:Compass},
  {id:'calendar', name:'万年历', en:'CALENDAR', description:'公历与农历，节气与日常。', icon:CalendarDays},
  {id:'qishuo', name:'气朔推算', en:'SOLAR & LUNAR', description:'循着日月，探索历法的刻度。', icon:Orbit},
];
class LoadBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false}; static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed ? <div role="alert" className="panel-loading">暂时没能载入，请检查网络。<button onClick={()=>location.reload()}>重新加载</button></div> : this.props.children;}
}
export default function Workspace(){
 const [panel,setPanel]=useState<string|null>(null);
 useEffect(()=>{try{document.documentElement.dataset.motion=localStorage.getItem('tools-motion')==='off'?'off':'on'}catch{}},[]);
 return <SidebarProvider style={{'--sidebar-width':'232px'} as React.CSSProperties}>
 <Sidebar className="workspace-sidebar"><SidebarHeader><a className="brand" href="/"><span className="brand-mark">r.</span><span>RED.SC<small>工具间 / TOOLS</small></span></a></SidebarHeader>
 <SidebarContent><div className="nav-label">工作空间</div><SidebarMenu><SidebarMenuItem><SidebarMenuButton isActive={!panel} onClick={()=>setPanel(null)}><Grid2X2/><span>全部工具</span><span className="nav-count">05</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
 <div className="nav-label">探索</div><SidebarMenu><SidebarMenuItem><SidebarMenuButton onClick={()=>setPanel('tarot')}><Sparkles/><span>塔罗牌桌</span></SidebarMenuButton></SidebarMenuItem>{tools.map(t=><SidebarMenuItem key={t.id}><SidebarMenuButton render={<a href={`https://redsc1.com/${t.id}`}/> }><t.icon/><span>{t.name}</span><ExternalLink className="external"/></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
 <div className="nav-label">我的空间</div><SidebarMenu>{([['cases','命例簿',BookOpen],['history','抽牌历史',History]] as const).map(([id,name,Icon])=><SidebarMenuItem key={id as string}><SidebarMenuButton isActive={panel===id} onClick={()=>setPanel(id as string)}><Icon/><span>{name as string}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
 </SidebarContent><SidebarFooter><SidebarMenu><SidebarMenuItem><SidebarMenuButton onClick={()=>setPanel('settings')}><Settings2/><span>偏好设置</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu><a className="back-home" href="https://redsc1.com">redsc1.com <ArrowUpRight size={14}/></a></SidebarFooter></Sidebar>
 <div className="main-shell"><header className="topbar"><div><SidebarTrigger/><span>工作空间</span><span className="breadcrumb">/</span><b>全部工具</b></div><span className="edition"><span/> 独立工具站 · 预览版</span></header>
 <main className="desk"><div className="page-heading"><div><p className="eyebrow">A LITTLE SPACE FOR DISCOVERY</p><h1>留一点时间，<span>探索。</span></h1><p className="intro">你的工具、灵感与记录，在这里慢慢展开。</p></div><span className="heading-note">随时出发<br/><span>不必匆忙 ↘</span></span></div>
 <div className="section-heading"><h2>所有工具 <span>05</span></h2><span>选一个，开始今天的探索</span></div>
 <section className="tool-grid" aria-label="所有工具"><button className="tarot-card" onClick={()=>setPanel('tarot')}><div className="tarot-copy"><span className="eyebrow">THE QUIET TABLE</span><h2>塔罗牌桌<span>给此刻，一个新视角。</span></h2><p>从一个问题开始，<br/>让直觉带你找到那张牌。</p><span className="pill-link">坐下来，抽一张 <ArrowUpRight size={18}/></span></div><div className="card-fan" aria-hidden="true">{['18-moon','17-star','19-sun'].map((n,i)=><img key={n} src={`/cards/${n}.jpg`} alt="" width="240" height="410" className={`playing-card card-${i}`} decoding="async"/>)}</div><span className="tarot-foot">RIDER–WAITE–SMITH <span>✦</span> 78 张牌，无限种可能</span></button>
 {tools.map((t,i)=><a key={t.id} href={`https://redsc1.com/${t.id}`} className={`tool-card tool-${t.id}`}><div className="tool-top"><span className="eyebrow">{t.en}</span><ArrowUpRight size={20}/></div><div className="tool-visual" aria-hidden="true">{i===0 ? <div className="pillars">{['甲','丙','戊','壬'].map((x,n)=><div key={x}><small>{['年','月','日','时'][n]}</small><b>{x}</b><b>{['辰','寅','午','子'][n]}</b></div>)}</div> : i===1 ? <div className="ziwei-diagram">{['巳','午','未','申','辰','紫微','酉','卯','斗数','戌','寅','丑','子','亥'].map((x,n)=><span key={n}>{x}</span>)}</div> : i===2 ? <div className="calendar-art"><span>日 一 二 三 四 五 六</span><div>{Array.from({length:14},(_,n)=><b key={n} className={n===9?'selected':''}>{n+1}</b>)}</div></div> : <div className="orbit-art"><Orbit size={94} strokeWidth={0.7}/><span>朔 <span>望</span> 晦</span></div>}</div><div className="tool-bottom"><h3>{t.name}</h3><p>{t.description}</p></div></a>)}
 </section><section className="personal-strip"><div><span className="small-icon"><BookOpen size={22}/></span><div><h3>每一次探索，都值得留下。</h3><p>给命例和抽牌记录，留一个自己的位置。</p></div></div><button onClick={()=>setPanel('cases')}>我的空间 <ArrowRight size={17}/></button></section>
 <footer className="desk-footer"><span>RED.SC TOOLS</span><span>一点好奇，一方天地。</span></footer></main></div>
 {panel && <LoadBoundary><Suspense fallback={<div role="status" className="panel-loading"><Skeleton className="h-5 w-48"/><p>正在打开工作空间…</p><button onClick={()=>setPanel(null)}>取消</button></div>}><PersonalPanel kind={panel} onClose={()=>setPanel(null)}/></Suspense></LoadBoundary>}
 </SidebarProvider>
}

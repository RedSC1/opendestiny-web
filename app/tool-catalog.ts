import {Sparkles,Layers,Compass,CalendarDays,Orbit} from 'lucide-react';
export const tools=[
 {id:'tarot',name:'塔罗牌桌',en:'THE QUIET TABLE',line:'给此刻，一个新视角。',description:'从一个问题开始，让直觉带你找到那张牌。',icon:Sparkles},
 {id:'bazi',name:'八字排盘',en:'FOUR PILLARS',line:'四柱之间，时间有迹可循。',description:'查看四柱、神煞与大运，保存值得回看的命例。',icon:Layers},
 {id:'ziwei',name:'紫微斗数',en:'PURPLE STAR',line:'十二宫位，展开你的星图。',description:'从本命到流运，把每一次推演留在命例簿中。',icon:Compass},
 {id:'calendar',name:'万年历',en:'CALENDAR',line:'日月往来，都有时序。',description:'公历与农历，节气与日常。',icon:CalendarDays},
 {id:'qishuo',name:'气朔推算',en:'SOLAR & LUNAR',line:'循着日月，寻找历法的刻度。',description:'探索节气、朔望与天文历法。',icon:Orbit},
] as const;
export type ToolId=typeof tools[number]['id'];
export const nameOf=(id:string)=>tools.find(t=>t.id===id)?.name||id;

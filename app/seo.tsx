import type {Metadata} from 'next';
import type {ToolId} from './tool-catalog';

export const SITE_URL='https://tools.redsc1.com';
export const SITE_NAME='OpenDestiny Web';
export const HOME_TITLE='在线排盘工具：八字、紫微斗数、塔罗、万年历与气朔｜OpenDestiny Web';
export const HOME_DESCRIPTION='OpenDestiny Web 提供在线八字、紫微斗数、塔罗牌、万年历与气朔推算。计算与记录保存在当前浏览器，可导出命例备份。';
export const OG_IMAGE='/og-tools.png';

export const TOOL_SEO={
 tarot:{path:'/tarot',title:'在线塔罗牌抽牌｜78 张牌与多种牌阵',description:'使用完整 78 张 Rider–Waite–Smith 塔罗牌在线抽牌，支持多种牌阵、正逆位、牌面放大与本地抽牌历史。',keywords:['在线塔罗牌','塔罗牌抽牌','塔罗牌阵','Rider Waite Smith']},
 bazi:{path:'/bazi',title:'在线八字排盘｜四柱、大运、流年与真太阳时',description:'在线八字排盘，查看四柱、十神、神煞、大运与流年，支持出生城市、时区和真太阳时修正，并可保存命例。',keywords:['八字排盘','在线八字','四柱排盘','大运流年','真太阳时']},
 ziwei:{path:'/ziwei',title:'在线紫微斗数排盘｜十二宫、四化与流运',description:'在线紫微斗数排盘，查看十二宫、主星、四化与流运，支持出生地点和排盘规则，并与八字共用命例簿。',keywords:['紫微斗数','紫微排盘','在线紫微斗数','十二宫','四化']},
 calendar:{path:'/calendar',title:'在线万年历｜公历、农历、节气与黄历',description:'在线万年历，查询公历、农历、干支、节气、节日与黄历信息，支持历史日期和不同历法口径。',keywords:['万年历','农历查询','黄历','二十四节气','干支历']},
 qishuo:{path:'/qishuo',title:'气朔推算｜节气、朔望与天文历法计算',description:'在线计算节气、朔、望等日月事件时刻，查看历法归日与计算精度，适合天文历法研究和日期核对。',keywords:['气朔','节气计算','朔望计算','天文历法','定朔定气']},
} as const satisfies Record<ToolId,{path:string;title:string;description:string;keywords:readonly string[]}>;

const social=(title:string,description:string,path:string)=>({
 openGraph:{title:`${title}｜${SITE_NAME}`,description,url:path,siteName:SITE_NAME,locale:'zh_CN',type:'website' as const,images:[{url:OG_IMAGE,width:1200,height:630,alt:`${SITE_NAME}：八字、紫微、塔罗、万年历与气朔工具`}]},
 twitter:{card:'summary_large_image' as const,title:`${title}｜${SITE_NAME}`,description,images:[OG_IMAGE]},
});

export const homeMetadata:Metadata={
 title:{absolute:HOME_TITLE},description:HOME_DESCRIPTION,
 keywords:['八字排盘','紫微斗数','在线塔罗牌','万年历','气朔推算','历法工具','OpenDestiny','RedSC1'],
 alternates:{canonical:'/'},...social('在线排盘与历法工具',HOME_DESCRIPTION,'/'),
};

export function metadataForTool(tool:ToolId):Metadata{
 const seo=TOOL_SEO[tool];
 return {title:seo.title,description:seo.description,keywords:[...seo.keywords,'RedSC1'],alternates:{canonical:seo.path},...social(seo.title,seo.description,seo.path)};
}

export function metadataForPage(title:string,description:string,path:string,index=true):Metadata{
 return {title,description,alternates:{canonical:path},robots:index?undefined:{index:false,follow:false,noarchive:true},...social(title,description,path)};
}

export function JsonLd({data}:{data:unknown}){
 return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replaceAll('<','\\u003c')}}/>;
}

export function ToolJsonLd({tool}:{tool:ToolId}){
 const seo=TOOL_SEO[tool];
 return <JsonLd data={{'@context':'https://schema.org','@type':'WebApplication',name:seo.title.split('｜')[0],url:new URL(seo.path,SITE_URL).href,description:seo.description,applicationCategory:'UtilitiesApplication',operatingSystem:'Any',browserRequirements:'Requires JavaScript and a modern web browser',isAccessibleForFree:true,inLanguage:'zh-CN',author:{'@type':'Person',name:'RedSC1',url:'https://redsc1.com'},offers:{'@type':'Offer',price:'0',priceCurrency:'CNY'}}}/>;
}

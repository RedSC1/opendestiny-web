import Workspace from './workspace';
import {homeMetadata,JsonLd,SITE_URL,TOOL_SEO} from './seo';
export const metadata=homeMetadata;
export default function Home() { return <><JsonLd data={{'@context':'https://schema.org','@type':'ItemList',name:'RedSC1 在线工具',itemListElement:Object.values(TOOL_SEO).map((tool,index)=>({'@type':'ListItem',position:index+1,name:tool.title.split('｜')[0],url:new URL(tool.path,SITE_URL).href}))}}/><Workspace /></>; }

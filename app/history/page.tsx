export const dynamic = 'force-static';
import Workspace from '../workspace';
import {metadataForPage} from '../seo';
export const metadata=metadataForPage('抽牌历史','保存在当前浏览器中的塔罗抽牌记录。','/history',false);
export default function Page(){return <Workspace initialView='history'/>;}

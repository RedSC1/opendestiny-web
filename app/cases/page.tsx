export const dynamic = 'force-static';
import Workspace from '../workspace';
import {metadataForPage} from '../seo';
export const metadata=metadataForPage('命例簿','保存在当前浏览器中的出生资料与八字、紫微排盘记录。','/cases',false);
export default function Page(){return <Workspace initialView='cases'/>;}

export const dynamic = 'force-static';
import Workspace from '../workspace';
import {metadataForTool,ToolJsonLd} from '../seo';
export const metadata=metadataForTool('bazi');
export default function Page(){return <><ToolJsonLd tool="bazi"/><Workspace initialView='bazi'/></>;}

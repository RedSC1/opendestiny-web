export const dynamic = 'force-static';
import Workspace from '../workspace';
import {metadataForTool,ToolJsonLd} from '../seo';
export const metadata=metadataForTool('tarot');
export default function Page(){return <><ToolJsonLd tool="tarot"/><Workspace initialView='tarot'/></>;}

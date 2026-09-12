export const dynamic='force-static';
import Workspace from '../workspace';
import {metadataForTool,ToolJsonLd} from '../seo';
export const metadata=metadataForTool('qishuo');
export default function Page(){return <><ToolJsonLd tool="qishuo"/><Workspace initialView='qishuo'/></>;}

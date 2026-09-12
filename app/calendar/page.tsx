export const dynamic='force-static';
import Workspace from '../workspace';
import {metadataForTool,ToolJsonLd} from '../seo';
export const metadata=metadataForTool('calendar');
export default function Page(){return <><ToolJsonLd tool="calendar"/><Workspace initialView='calendar'/></>;}

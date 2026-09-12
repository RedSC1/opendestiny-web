export const dynamic = 'force-static';
import Workspace from '../workspace';
import {metadataForTool,ToolJsonLd} from '../seo';
export const metadata=metadataForTool('ziwei');
export default function Page(){return <><ToolJsonLd tool="ziwei"/><Workspace initialView='ziwei'/></>;}

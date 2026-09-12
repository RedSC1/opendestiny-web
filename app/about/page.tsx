export const dynamic='force-static';
import Workspace from '../workspace';
import {metadataForPage} from '../seo';
export const metadata=metadataForPage('关于 OpenDestiny Web','了解 OpenDestiny Web 的历算与排盘工具、数据来源、隐私方式和开源许可证。','/about');
export default function Page(){return <Workspace initialView="about"/>;}

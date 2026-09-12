import {ArrowUpRight,BookOpen,Code2,Database,Globe2,Mail,ShieldCheck,Scale} from 'lucide-react';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';

const sources=[
 {index:'01',title:'行星与月球模型',body:'行星模型以 VSOP2013 和 TOP2013 为理论来源，月球模型以 ELP/MPP02 为理论来源，并按 JPL DE441 校准。',links:[['VSOP2013','https://ftp.imcce.fr/pub/ephem/planets/vsop2013/solution/'],['TOP2013','https://ftp.imcce.fr/pub/ephem/planets/top2013/'],['ELP/MPP02','https://doi.org/10.1051/0004-6361:20030529'],['DE441','https://doi.org/10.3847/1538-3881/abd414']]},
 {index:'02',title:'历史朔气与历书归日',body:'历史历法模式下的朔气归日资料，来源于许剑伟先生的寿星天文历／寿星万年历所收古历资料与规则，并在 OpenDestiny 中重新编码。',links:[['项目镜像','https://github.com/sxwnl/sxwnl'],['原作版权说明','https://sxwnl.github.io/src/sm1.htm#copyright']]},
 {index:'03',title:'黄历、节日与每日宜忌',body:'节日资料参考《寿星天文历》并重新整理名称与显示顺序；传统神煞、每日宜忌及基础规则主要参考 cnlunar。节日标记不代表法定放假安排。',links:[['cnlunar','https://github.com/OPN48/cnlunar']]},
 {index:'04',title:'塔罗牌面',body:'Rider–Waite–Smith 牌面由 Pamela Colman Smith 创作并于 1909 年出版。本站使用 Wikimedia Commons 所收录扫描图的 WebP 衍生版本。',links:[['逐张来源清单','/tools/tarot/assets/tarot/web/sources.json'],['第三方说明','/tools/tarot/THIRD_PARTY_NOTICES.md']]},
] as const;

export default function AboutPanel(){
 return <main className="about-page">
  <header className="about-hero">
   <div><p className="eyebrow">ABOUT OPENDESTINY WEB</p><h1>关于 OpenDestiny Web</h1><p>由 RedSC1 开发，专注于天文历法与开源项目。这里收纳 OpenDestiny 的历算与排盘工具，也留了一张安静的塔罗牌桌。</p></div>
   <div className="about-links" aria-label="作者链接"><a href="https://redsc1.com" target="_blank" rel="noopener"><Globe2/>个人主页<ArrowUpRight/></a><a href="https://github.com/RedSC1" target="_blank" rel="noopener"><Code2/>GitHub<ArrowUpRight/></a><a href="mailto:redsockers777@gmail.com"><Mail/>联系我<ArrowUpRight/></a></div>
  </header>

  <section className="about-principles" aria-label="OpenDestiny Web 原则">
   <Card><CardHeader><ShieldCheck/><CardTitle>留在你的浏览器</CardTitle></CardHeader><CardContent>排盘和历算在浏览器本地完成。命例、抽牌历史与偏好也只保存在当前浏览器，不会自动上传或跨设备同步。</CardContent></Card>
   <Card><CardHeader><Database/><CardTitle>保留原始输入</CardTitle></CardHeader><CardContent>命例保存出生日期、当地钟表时间、时区、地点和排盘设置。重要资料可以从命例簿导出备份。</CardContent></Card>
   <Card><CardHeader><BookOpen/><CardTitle>来源可以查回去</CardTitle></CardHeader><CardContent>科学模型、历史资料、传统规则与牌面图像分别注明来源，不把第三方资料重新声称为本站原创。</CardContent></Card>
  </section>

  <section className="about-notice" aria-labelledby="about-accuracy-title"><span aria-hidden="true">i</span><div><p className="about-kicker">ACCURACY</p><h2 id="about-accuracy-title">使用边界</h2><p>历史历法与纪年由多份资料经程序合并，并包含有限范围的补录、名称规范化与个案校正。不同史料对改元、在位与历日边界可能存在异说；用于论文、出版或考据前，请回查原始史料与专业历表。</p><p>命理排盘与塔罗内容适合个人研究和整理思路，不应替代医疗、法律、财务等专业意见或现实判断。</p></div></section>

  <section className="about-source-section" aria-labelledby="about-sources-title"><div className="about-section-heading"><div><p className="about-kicker">DATA SOURCES</p><h2 id="about-sources-title">数据与图像来源</h2></div><p>从个人主页的说明整理到这里，方便在使用工具时随时查阅。</p></div><div className="about-source-grid">{sources.map(source=><Card className="about-source-card" key={source.index}><CardHeader><span className="about-source-index">{source.index}</span><CardTitle>{source.title}</CardTitle></CardHeader><CardContent><p>{source.body}</p><div className="about-source-links">{source.links.map(([label,href])=><a key={href} href={href} target="_blank" rel="noopener">{label}<ArrowUpRight/></a>)}</div></CardContent></Card>)}</div></section>

  <section className="about-license" aria-labelledby="about-license-title"><Scale aria-hidden="true"/><div><p className="about-kicker">LICENSE & COPYRIGHT</p><h2 id="about-license-title">许可与版权</h2><p>OpenDestiny 底层原创实现及本站内置的 tarot-lite 软件按 MPL-2.0 提供。第三方历史资料、科学数据与牌面图像保留各自的来源和权利状态，不因被本站使用而改变许可。</p><p className="about-warranty">本站与软件按现状提供，不对历史数据的完整性、无误性或特定用途适用性作保证。</p></div></section>
 </main>;
}

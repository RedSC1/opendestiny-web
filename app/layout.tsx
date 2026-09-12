import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import {HOME_DESCRIPTION,HOME_TITLE,JsonLd,OG_IMAGE,SITE_NAME,SITE_URL} from './seo';
export const metadata: Metadata = {
 metadataBase:new URL(SITE_URL),
 title:{default:HOME_TITLE,template:`%s｜${SITE_NAME}`},
 description:HOME_DESCRIPTION,
 applicationName:SITE_NAME,
 authors:[{name:'RedSC1',url:'https://redsc1.com'}],creator:'RedSC1',publisher:'RedSC1',
 category:'utilities',
 robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},
 icons:{icon:'/favicon.png',apple:'/opendestiny-icon.png'},
 openGraph:{title:HOME_TITLE,description:HOME_DESCRIPTION,url:'/',siteName:SITE_NAME,locale:'zh_CN',type:'website',images:[{url:OG_IMAGE,width:1200,height:630,alt:`${SITE_NAME}：在线排盘与历法工具`}]},
 twitter:{card:'summary_large_image',title:HOME_TITLE,description:HOME_DESCRIPTION,images:[OG_IMAGE]},
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="zh-CN"><body><JsonLd data={{'@context':'https://schema.org','@type':'WebSite',name:SITE_NAME,alternateName:'OpenDestiny',url:SITE_URL,description:HOME_DESCRIPTION,inLanguage:'zh-CN',creator:{'@type':'Person',name:'RedSC1',url:'https://redsc1.com'}}}/>{children}<Script type="module" src="/shared/i18n/locale-runtime.js" strategy="afterInteractive"/></body></html>; }

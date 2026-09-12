import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
const require=createRequire(import.meta.url);
const packageRoot=name=>resolve(dirname(require.resolve(name)),'..');
const root=process.cwd(),core=packageRoot('js-ephemeris-lite'),huangli=packageRoot('huangli-lite');
const coreEntry=require.resolve('js-ephemeris-lite'),huangliEntry=require.resolve('huangli-lite');
const version=Date.now().toString(36);
const cleanTrailingWhitespace=value=>value.replace(/[ \t]+$/gm,'');
const toolBootStyle='<style data-tool-boot>body{visibility:hidden}html[data-tool-ready="true"] body{visibility:visible}</style>';
const embeddedSeo={
 calendar:{title:'在线万年历｜公历、农历、节气与黄历',description:'在线万年历，查询公历、农历、干支、节气、节日与黄历信息，支持历史日期和不同历法口径。',canonical:'https://tools.redsc1.com/calendar'},
 qishuo:{title:'气朔推算｜节气、朔望与天文历法计算',description:'在线计算节气、朔、望等日月事件时刻，查看历法归日与计算精度，适合天文历法研究和日期核对。',canonical:'https://tools.redsc1.com/qishuo'},
};
for(const kind of ['calendar','qishuo']){
 const astro=await readFile(resolve(`../webpage/src/pages/${kind}.astro`),'utf8');
 let markup=astro.slice(astro.indexOf('  <link'),astro.indexOf('</Layout>')).replace(/<script[^]*?<\/script>/g,'').replaceAll('href="/styles/','href="../../styles/')
  .replace(/\s+title="[^"]*"/g,'');
 let css=[...astro.matchAll(/<style[^>]*>([^]*?)<\/style>/g)].map(m=>m[1]).join('\n').replace(/:global\(([^)]+)\)/g,'$1');
 if(kind==='qishuo') {
   css=await readFile('tool-src/qishuo-theme.css','utf8');
   markup=markup.replace(/<link[^>]*qishuo-form[^>]*>/g,'')
    .replace(/<header class="page-heading">[^]*?<\/header>/,'')
    .replace(/<div class="panel-heading">[^]*?(?=\n\n        <div class="qishuo-form-grid">)/,'<div class="panel-heading"><h2>计算参数</h2><p>选择年份与天象，查看对应时刻与历法归日。</p></div>')
    .replace('<div id="qishuo-empty" class="empty-state"><span>☼</span><p>','<div id="qishuo-empty" class="empty-state"><p>')
    .replace('<section class="glass-panel benchmark-panel">','<details class="benchmark-disclosure"><summary>计算性能测试</summary><section class="glass-panel benchmark-panel">')
    .replace(/(<div class="benchmark-results"[^]*?<\/section>)/,'$1</details>');
 }
 await mkdir(`public/tools/${kind}`,{recursive:true});
 const seo=embeddedSeo[kind];
 const toolbarTitle=kind==='calendar'?'<span>万年历</span>':'<h1>气朔推算</h1>';
 await writeFile(`public/tools/${kind}/index.html`,cleanTrailingWhitespace(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${toolBootStyle}<title>${seo.title}</title><meta name="description" content="${seo.description}"><link rel="canonical" href="${seo.canonical}"><style>${css}</style><script type="module" src="../../shared/i18n/locale-runtime.js"></script></head><body class="almanac-tool"><div class="tool-toolbar"><a class="tool-home-link" href="/" target="_top">← 全部工具</a>${toolbarTitle}</div>${markup}<link rel="stylesheet" href="../tool-theme.css?v=${version}"><link rel="stylesheet" href="../almanac-theme.css?v=${version}"><script type="module" src="../almanac-engines/${kind}-page.js?v=${version}"></script></body></html>`));
 let js=await readFile(`tool-src/scripts/${kind}-page.js`,'utf8');
 js=`await (window.redsc1LocaleReady ?? Promise.resolve());\n`+js;
 if(kind==='calendar') js=js.replace(/\s+title="\$\{escape\(aria\)\}"/,'').replace('\nrefresh();','\nawait refresh();');
 js=js.replace("'/scripts/qishuo-worker.js?v=20260831-vendor-clean-v1'", "new URL('./qishuo-worker.js',import.meta.url)");
 js+='\ndocument.documentElement.dataset.toolReady="true";\nwindow.parent.postMessage({type:"tool-ready"},location.origin);';
 await writeFile(`tool-src/scripts/${kind}-page.js`,cleanTrailingWhitespace(js));
}
await rm('public/tools/almanac-engines',{recursive:true,force:true});
await build({entryPoints:['calendar-page','calendar-worker','qishuo-page','qishuo-worker'].map(n=>`tool-src/scripts/${n}.js`),outdir:'public/tools/almanac-engines',bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'linked',define:{'process.argv':'[]'},plugins:[{name:'almanac-local',setup(b){
 b.onResolve({filter:/^\/scripts\//},a=>({path:resolve(root,'tool-src',a.path.slice(1).split('?')[0])}));
 b.onResolve({filter:/opendestiny-(calendar|qishuo).*\.js/},a=>({path:a.path.includes('calendar')?'calendar':'qishuo',namespace:'local-core'}));
 b.onLoad({filter:/.*/,namespace:'local-core'},a=>({contents:`export * from ${JSON.stringify(coreEntry)};`+(a.path==='calendar'?`export {HuangliCalendar,ACTIVITY_MASKS} from ${JSON.stringify(huangliEntry)};`:''),resolveDir:root}));
 b.onResolve({filter:/^node:url$/},()=>({path:'url',namespace:'stub'}));
 b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:"export function pathToFileURL(){throw Error('External ephemeris files unavailable in browser')}"}));
}}]});
const coreVersion=`npm package ${JSON.parse(await readFile(resolve(core,'package.json'),'utf8')).version}`;
await cp(resolve(core,'LICENSE'),'public/tools/almanac-engines/LICENSE');
await cp(resolve(huangli,'LICENSE'),'public/tools/almanac-engines/LICENSE.MIT');
await cp(resolve(core,'THIRD_PARTY_NOTICES.md'),'public/tools/almanac-engines/THIRD_PARTY_NOTICES.md');
await cp(resolve(core,'THIRD_PARTY_NOTICES.zh-CN.md'),'public/tools/almanac-engines/THIRD_PARTY_NOTICES.zh-CN.md');
await cp(resolve(huangli,'THIRD_PARTY_NOTICES.md'),'public/tools/almanac-engines/THIRD_PARTY_NOTICES.huangli.md');
await cp(resolve(huangli,'THIRD_PARTY_NOTICES.zh-CN.md'),'public/tools/almanac-engines/THIRD_PARTY_NOTICES.huangli.zh-CN.md');
await writeFile('public/tools/almanac-engines/SOURCE.md',`# Source code\n\nThese browser bundles contain MPL-2.0 js-ephemeris-lite code and MIT-licensed huangli-lite code.\n\nCorresponding source: https://github.com/RedSC1/js-ephemeris-lite\n\nRevision used for this build: \`${coreVersion}\`\n`);
await writeFile('public/tools/almanac-theme.css',await readFile('tool-src/almanac-theme.css'));

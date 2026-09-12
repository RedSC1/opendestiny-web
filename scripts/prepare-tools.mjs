import { readFile,writeFile,cp,mkdir,rm,readdir } from 'node:fs/promises';
import { dirname,resolve } from 'node:path';
import { withoutEraMarkup, withoutEraScript } from './chart-without-eras.mjs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const assetVersion=Date.now().toString(36);
const {build}=require('esbuild');
const packageRoot=name=>resolve(dirname(require.resolve(name)),'..');
const root=process.cwd(),legacy=resolve(root,'../webpage'),tarot=resolve(root,'../OpenDestiny/tarot');
const core=packageRoot('js-ephemeris-lite'),bazi=packageRoot('bazi-lite'),ziwei=packageRoot('ziwei-lite');
const coreEntry=require.resolve('js-ephemeris-lite'),baziEntry=require.resolve('bazi-lite'),ziweiEntry=require.resolve('ziwei-lite');
const read=p=>readFile(p,'utf8');
const cleanTrailingWhitespace=value=>value.replace(/[ \t]+$/gm,'');
const toolBootStyle='<style data-tool-boot>body{visibility:hidden}html[data-tool-ready="true"] body{visibility:visible}</style>';
const embeddedSeo={
 bazi:{title:'在线八字排盘｜四柱、大运、流年与真太阳时',description:'在线八字排盘，查看四柱、十神、神煞、大运与流年，支持出生城市、时区和真太阳时修正，并可保存命例。',canonical:'https://tools.redsc1.com/bazi'},
 ziwei:{title:'在线紫微斗数排盘｜十二宫、四化与流运',description:'在线紫微斗数排盘，查看十二宫、主星、四化与流运，支持出生地点和排盘规则，并与八字共用命例簿。',canonical:'https://tools.redsc1.com/ziwei'},
 tarot:{title:'在线塔罗牌抽牌｜78 张牌与多种牌阵',description:'使用完整 78 张 Rider–Waite–Smith 塔罗牌在线抽牌，支持多种牌阵、正逆位、牌面放大与本地抽牌历史。',canonical:'https://tools.redsc1.com/tarot'},
};
await mkdir('public/tools',{recursive:true});await mkdir('tool-src/scripts',{recursive:true});
await rm('public/shared/i18n',{recursive:true,force:true});
await build({entryPoints:{'locale-runtime':'tool-src/scripts/locale-runtime.js'},outdir:'public/shared/i18n',bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',minify:true,chunkNames:'chunks/[name]-[hash]',legalComments:'linked'});
// Keep a local source snapshot, so the generated site has no dependency on old hosting.
await cp(resolve(legacy,'public/scripts'),'tool-src/scripts',{recursive:true});
for(const entry of await readdir('tool-src/scripts',{withFileTypes:true})){
 if(entry.isFile()&&entry.name.endsWith('.js')){
  const path=`tool-src/scripts/${entry.name}`;
  await writeFile(path,cleanTrailingWhitespace(await read(path)));
 }
}
// The tools site owns explicit zh-CN/zh-TW message files. Do not ship the old
// character-conversion runtime copied from the personal site.
await rm('tool-src/scripts/site-language.js',{force:true});
await rm('tool-src/scripts/zh-hant-map.js',{force:true});
await rm('tool-src/scripts/traditional-chinese.js',{force:true});
// The legacy directory also contains a compiled browser bundle. We rebuild from
// source below, so retaining it only leaves obsolete logos, era labels and title
// bubbles in the local snapshot.
await rm('tool-src/scripts/ziwei-page.bundle.js',{force:true});
await cp(resolve(legacy,'public/styles'),'public/styles',{recursive:true});
await cp(resolve(legacy,'public/data'),'public/data',{recursive:true});
// Both tools use the same birth form, with only engine-specific DOM hooks adapted.
const birthSource=await read(resolve(legacy,'src/pages/bazi.astro'));
const sharedBirth=birthSource.split('<form id="bazi-form">')[1].split('<details class="advanced">')[0];
for(const kind of ['bazi','ziwei']){
 let astro=withoutEraMarkup(await read(resolve(legacy,`src/pages/${kind}.astro`)))
 .replaceAll('出生日期','出生日期 · 钟表时间').replaceAll('>民用时<','>钟表时间<')
 .replaceAll('选择国内地区','选择出生城市')
 .replace('name="location" type="text" value="北京"','name="location" type="text" value="" placeholder="选择城市，或填写出生地点"')
 .replace('value="116.4"','value=""').replace('value="39.9"','value=""')
 .replace(/(name="longitude"[^>]*?) required/g,'$1');
 if(kind==='ziwei') {
   const birth=sharedBirth.replaceAll('bazi-', 'ziwei-')
    .replace('id="ziwei-reverse-lookup"','id="ziwei-bazi-reverse-lookup"')
    .replace('id="lunar-leap-row"','id="ziwei-leap-row"')
    .replace('id="offset-mode-note"','id="ziwei-offset-note"')
    .replace('class="offset-picker"','class="offset-picker" id="ziwei-offset-picker"')
    .replace('</div>\n          </div>\n\n          <div class="form-section">', '</div>\n          </div>\n\n          <div class="form-section">');
   const ziweiBirth=birth.replace('反查出生时间</span>', '反查出生时间</span><button type="button" class="reverse-lookup-trigger" id="ziwei-reverse-lookup">星曜反查</button>');
   astro=astro.replace(/(<form id="ziwei-form"[^>]*>)[^]*?(?=<details class="advanced">)/, '$1'+ziweiBirth);
 }
 astro=astro.replaceAll('出生日期','出生日期 · 钟表时间').replaceAll(' · 钟表时间 · 钟表时间',' · 钟表时间')
  .replaceAll('>民用时<','>钟表时间<').replaceAll('选择国内地区','选择出生城市')
  .replace('name="location" type="text" value="北京"','name="location" type="text" value="" placeholder="选择城市，或填写出生地点"')
  .replace('value="116.4"','value=""').replace('value="39.9"','value=""').replace(/(name="longitude"[^>]*?) required/g,'$1');
 let markup=astro.slice(astro.indexOf('  <link'),astro.indexOf('</Layout>')).replace(/\s*<link rel="modulepreload"[^>]+>/g,'').replaceAll('href="/styles/','href="../../styles/');
 markup=markup
  .replace(/<i aria-hidden="true">↗<\/i>/g,'')
  .replace('<span>生成命盘</span>','<span>重新排盘并应用</span>')
  // Visible labels and aria-labels already explain these controls. Native title
  // bubbles look like stray placeholder text over the compact chart toolbar.
  .replace(/\s+title="[^"]*"/g,'');
 markup=markup.replace(
  /<label class="field full"><span>历法口径<\/span><select name="calendarMode">[\s\S]*?<\/select><\/label>\s*<p class="field-help calendar-help">历史历法先按中国历书规则排月，再映射到上方所选的出生时区。<\/p>/,
  `<label class="field full"><span>历法口径</span><select name="calendarMode">
    <option value="historical" selected>中国历史历法</option>
    <option value="china-astronomical">现代中国天文历法</option>
    <option value="local-astronomical">当地天文历法</option>
  </select></label>
  <p class="field-help calendar-help">中国历史历法使用历书规则；现代中国天文历法固定按 UTC+8 归日；当地天文历法按下方所选日界重建农历。</p>
  <label class="field full" data-calendar-boundary hidden><span>定气定朔日界</span><select name="calendarDayBoundary" disabled>
    <option value="fixed-utc-offset">按当地标准时间（标准经线）</option>
    <option value="mean-solar-meridian" selected>按出生地经度（地方平太阳时）</option>
  </select></label>
  <p class="field-help calendar-help" data-calendar-boundary hidden>标准时间使用上方 UTC 偏移所对应的标准经线划日；经度模式使用出生地实际经度的地方平太阳日界。这里影响农历结构，不等同于排盘钟表的太阳时修正。</p>`,
 );
 const css=[...astro.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n').replace(/:global\(([^)]+)\)/g,'$1');
 await mkdir(`public/tools/${kind}`,{recursive:true});
 const seo=embeddedSeo[kind];
 await writeFile(`public/tools/${kind}/index.html`,cleanTrailingWhitespace(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${toolBootStyle}<title>${seo.title}</title><meta name="description" content="${seo.description}"><link rel="canonical" href="${seo.canonical}"><style>${css}</style><link rel="stylesheet" href="../tool-theme.css?v=${assetVersion}"><link rel="stylesheet" href="../settings-theme.css?v=${assetVersion}"><link rel="stylesheet" href="../mobile.css?v=${assetVersion}"><script type="module" src="../../shared/i18n/locale-runtime.js"></script></head><body><div class="tool-savebar tool-toolbar"><a id="chart-back" class="tool-home-link" href="/" target="_top">← 全部工具</a><div class="case-actions"><button id="edit-birth" class="quiet-action">出生资料</button><button id="save-case">保存命例</button><button id="edit-rules" class="quiet-action">排盘规则</button></div></div><p id="case-status" class="case-feedback" role="status"></p>${markup}<script type="module" src="../engines/${kind}-page.js?v=${assetVersion}"></script></body></html>`));
 let js=withoutEraScript(await read(`tool-src/scripts/${kind}-page.js`),kind)
  .replace(/^\s*birthReset\.title\s*=.*;\n/m,'')
  .replace(/^\s*pillar\.title\s*=.*;\n/m,'')
  .replace(/^\s*yearNode\.title\s*=.*;\n/m,'');
 js=`await (window.redsc1LocaleReady ?? Promise.resolve());\n`+js;
 // A fresh chart starts from the browser's local clock and UTC offset. Saved
 // records are restored immediately afterwards and therefore keep their own
 // birth time, zone and chart settings.
 if(kind==='bazi') {
  js=js.replace(
   '\nsyncHistoricalTermOffset();\ncalculateAndRender();',
   '\nuseCurrentTimeAndZone();\nsyncHistoricalTermOffset();\ncalculateAndRender();',
  );
  js=js.replace(
   "document.querySelector('#chart-name').textContent = context.name;",
   "{ const name=document.querySelector('#chart-name'); name.toggleAttribute('data-no-i18n',Boolean(String(data.get('name') || '').trim())); name.textContent=context.name; }",
  );
  js=js.replace(
   "document.querySelector('#chart-location').textContent = `${context.location} · ${offsetLabel(options.utcOffsetMinutes)} · ${context.longitude.toFixed(4)}°`;",
   "{ const location=document.querySelector('#chart-location'); const entered=String(data.get('location') || '').trim(); if(entered){const place=document.createElement('span');place.dataset.noI18n='';place.textContent=context.location;location.replaceChildren(place,document.createTextNode(` · ${offsetLabel(options.utcOffsetMinutes)} · ${context.longitude.toFixed(4)}°`));}else location.textContent=`${context.location} · ${offsetLabel(options.utcOffsetMinutes)} · ${context.longitude.toFixed(4)}°`; }",
  );
 }
 else js=js.replace(
  "\nbirthReset.addEventListener('click', restoreBirthTime);\nsyncForm();",
  "\nbirthReset.addEventListener('click', restoreBirthTime);\nuseCurrentTimeAndZone();\nsyncForm();",
 );
 if(kind==='ziwei') js=js.replace(
  "document.querySelector('#ziwei-chart-title').textContent = `${String(data.get('name') || '').trim() || '匿名'}命盘`;",
  "{ const title=document.querySelector('#ziwei-chart-title'); const name=document.createElement('span'); name.dataset.noI18n=''; name.textContent=String(data.get('name') || '').trim() || '匿名'; title.replaceChildren(name,document.createTextNode('命盘')); }",
 );
 if(kind==='ziwei') js=js.replace(
  "    const chartPanel = stage.closest('.chart-panel');",
  "    if (!Number.isFinite(available) || available <= 1) return;\n    const chartPanel = stage.closest('.chart-panel');",
 );
 if(kind==='ziwei') js=js.replace(
  "    const chartRect = chartPanel.getBoundingClientRect();\n    const timelineRect = timelinePanel.getBoundingClientRect();\n    const isBeside = Math.abs(chartRect.top - timelineRect.top) < 2;",
  "    const isBeside = Math.abs(chartPanel.offsetTop - timelinePanel.offsetTop) < 2;",
 );
 if(kind==='ziwei') js=js.replace(
  `function starName(key) {
  if (STAR_NAMES[key]) return STAR_NAMES[key];
  const base = key.replace(/^flow_/, '');
  if (STAR_NAMES[base]) return STAR_NAMES[base];
  const clean = base.replace(/_(boshi12|jiangqian12|suijian12)$/, '');
  return STAR_NAMES[clean] ?? clean;
}`,
  `function starName(key) {
  const base = key.replace(/^flow_/, '');
  const clean = base.replace(/_(boshi12|jiangqian12|suijian12)$/, '');
  const name = STAR_NAMES[key] ?? STAR_NAMES[base] ?? STAR_NAMES[clean] ?? clean;
  return window.redsc1I18n?.translate(name) ?? name;
}`,
 );
 if(kind==='ziwei') js=js.replace(
  "center.append(el('strong', 'zw-center-identity', `${name}　${yinYang}${gender}　${BUREAU_NAMES[chart.anchors.bureau] ?? `${bureauNumber(chart.anchors.bureau)}局`}`));",
  "{ const identity=el('strong','zw-center-identity'); const person=el('span','',name); person.dataset.noI18n=''; identity.append(person,document.createTextNode(`　${yinYang}${gender}　${BUREAU_NAMES[chart.anchors.bureau] ?? `${bureauNumber(chart.anchors.bureau)}局`}`)); center.append(identity); }",
 );
 js=js.replace(
  `const form = document.querySelector('#${kind}-form');`,
  `const form = document.querySelector('#${kind}-form');\nsetupLocalCalendarBoundary(form);\nconst syncHistoricalUtcOffset=setupHistoricalUtcLock(form);`,
 );
 if(kind==='bazi') {
  js=js.replace(
   "  const longitude = Number(data.get('longitude'));",
   "  const longitude = Number(data.get('longitude'));\n  const calendarBoundary = resolveCalendarBoundary(calendarMode,String(data.get('calendarDayBoundary')),data.get('longitude'));",
  );
  js=js.replace(
   "    dayBoundaryMode: calendarMode === CALENDAR_MODE.LOCAL_ASTRONOMICAL ? 'mean-solar-meridian' : 'fixed-utc-offset',\n    meridianDeg: calendarMode === CALENDAR_MODE.LOCAL_ASTRONOMICAL ? longitude : undefined,",
   "    ...calendarBoundary,",
  );
  js=js.replace(
   "  const utcOffsetMinutes = pillarHistoricalMode === PILLAR_HISTORICAL_MODE.ON ? 480 : readUtcOffset(data);",
   "  const utcOffsetMinutes = calendarMode === CALENDAR_MODE.HISTORICAL || pillarHistoricalMode === PILLAR_HISTORICAL_MODE.ON ? 480 : readUtcOffset(data);",
  );
  js=js.replace(
   /function syncHistoricalTermOffset\(\) \{[\s\S]*?\n\}\n\nfunction useCurrentTimeAndZone/,
   `function syncHistoricalTermOffset() { syncHistoricalUtcOffset(); }\n\nfunction useCurrentTimeAndZone`,
  );
  js=js.replace(
   "  form.elements.pillarHistoricalMode.value = PILLAR_HISTORICAL_MODE.OFF;\n  syncHistoricalTermOffset();\n  form.elements.clockMode.value = BAZI_CLOCK_MODE.CIVIL;",
   "  form.elements.pillarHistoricalMode.value = PILLAR_HISTORICAL_MODE.OFF;\n  form.elements.clockMode.value = BAZI_CLOCK_MODE.CIVIL;",
  );
  js=js.replace(
   "  form.elements.offsetMinute.value = pad(Math.abs(offsetMinutes) % 60);\n}",
   "  form.elements.offsetMinute.value = pad(Math.abs(offsetMinutes) % 60);\n  syncHistoricalUtcOffset();\n}",
  );
 }
 if(kind==='ziwei') {
  js=js.replace(
   "  const historicalTerms = data.get('pillarHistoricalMode') === 'on';\n  const utcOffsetMinutes = historicalTerms ? 480 : readOffset(data);\n  const calendarMode = String(data.get('calendarMode'));",
   "  const historicalTerms = data.get('pillarHistoricalMode') === 'on';\n  const calendarMode = String(data.get('calendarMode'));\n  const utcOffsetMinutes = calendarMode === 'historical' || historicalTerms ? 480 : readOffset(data);",
  );
  js=js.replace(
   "  const calendarMode = String(data.get('calendarMode'));",
   "  const calendarMode = String(data.get('calendarMode'));\n  const calendarBoundary = resolveCalendarBoundary(calendarMode,String(data.get('calendarDayBoundary')),data.get('longitude'));",
  );
  js=js.replace(
   "    dayBoundaryMode: calendarMode === 'local-astronomical' ? 'mean-solar-meridian' : 'fixed-utc-offset',\n    meridianDeg: calendarMode === 'local-astronomical' ? longitudeDeg : undefined,",
   "    ...calendarBoundary,",
  );
  js=js.replace(
   `  const historical = form.elements.pillarHistoricalMode.value === 'on';
  const offset = document.querySelector('#ziwei-offset-picker');
  offset.classList.toggle('locked', historical);
  for (const input of offset.querySelectorAll('input, select')) input.disabled = historical;
  document.querySelector('#ziwei-offset-note').textContent = historical ? '历史定气已锁定 UTC+08:00' : '不自动处理夏令时';`,
   "  syncHistoricalUtcOffset();",
  );
  js=js.replace(
   "  form.elements.clockMode.value = ZIWEI_CLOCK_MODE.CIVIL;\n  syncForm();\n  const values = {",
   "  form.elements.clockMode.value = ZIWEI_CLOCK_MODE.CIVIL;\n  const values = {",
  );
  js=js.replace(
   "  form.elements.offsetMinute.value = pad(Math.abs(offsetMinutes) % 60);\n}",
   "  form.elements.offsetMinute.value = pad(Math.abs(offsetMinutes) % 60);\n  syncHistoricalUtcOffset();\n}",
  );
  }
 js=js.replace(
  "  const offsetMinutes = -now.getTimezoneOffset();",
  "  const offsetMinutes = -now.getTimezoneOffset();\n  delete form.querySelector('.offset-picker').dataset.savedOffset;",
 );
 js=`import {setupChartWorkspace} from '/shared/chart-workspace.js';\nimport {restoreChart} from '/shared/chart-bridge.js';\nimport {resolveCalendarBoundary,setupHistoricalUtcLock,setupLocalCalendarBoundary} from '/shared/calendar-boundary.js';\n`+js+`\nrestoreChart(form,()=>${kind==='bazi'?'calculateAndRender()':'generate()'},'${kind}');\ndocument.documentElement.dataset.toolReady='true';\nwindow.parent.postMessage({type:'tool-ready'},location.origin);`;
 js+=`\nsetupChartWorkspace(form,'${kind}',()=>${kind==='bazi'?'calculateAndRender()':'generate()'});`;
 await writeFile(`tool-src/scripts/${kind}-page.js`,js);
}
let exporter=await read('tool-src/scripts/chart-json-export.js');
exporter=`import {captureForm,connectChart} from '/shared/chart-bridge.js';\n`+exporter.replace('export function captureChartProfile(form) {','export function captureChartProfile(form) {\n const _form=captureForm(form);').replace('    name: String(data.get', '    _form,\n    name: String(data.get');
exporter=exporter.replace(/(export function setupChartJsonExport\([^]*?\) \{)/,`$1\n  connectChart(document.querySelector('#bazi-app')?'bazi':'ziwei',getSnapshot);`);
await writeFile('tool-src/scripts/chart-json-export.js',exporter);
for(const [name,from,to] of [
 ['location-data.js',"fetch('/data/china-admin-areas.v1.json')","fetch(new URL('../../data/china-admin-areas.v1.json',import.meta.url))"],
 ['reverse-lookup-ui.js',"'/scripts/reverse-lookup-worker.js?v=20260831-vendor-clean-v1'","new URL('../../scripts/reverse-lookup-worker.js',import.meta.url).href"]
]){const path='tool-src/scripts/'+name;await writeFile(path,(await read(path)).replace(from,to));}
let worker=await read('tool-src/scripts/reverse-lookup-worker.js');
worker=worker.replace(/const (BAZI|ZIWEI)_RUNTIME = ('[^']+');/g, 'import * as $1Core from $2;')
 .replace('const Core = await import(BAZI_RUNTIME);','const Core = BAZICore;')
 .replace('const Core = await import(ZIWEI_RUNTIME);','const Core = ZIWEICore;');
// Avoid an escaping namespace object: the helper only needs these four exports.
worker=worker.replace('function pillarName(Core, value)', 'function pillarName(value)')
 .replace(/Core\.(HEAVENLY_STEMS|EARTHLY_BRANCHES|ganzhiStem|ganzhiBranch)/g,'ZIWEICore.$1')
 .replaceAll('pillarName(Core,', 'pillarName(');
worker=worker.replace('const Core = BAZICore;', '').replace('const Core = ZIWEICore;', '');
const split=worker.indexOf('async function searchZiwei(');
worker=worker.slice(0,split).replace(/\bCore\./g, 'BAZICore.')+worker.slice(split).replace(/\bCore\./g,'ZIWEICore.');
await writeFile('tool-src/scripts/reverse-lookup-worker.js',cleanTrailingWhitespace(worker));
const plugins=[{name:'local-engines',setup(b){
 b.onResolve({filter:/^\/shared\//},a=>({path:'../../'+a.path.slice(1),external:true}));
 b.onResolve({filter:/^\/scripts\//},a=>({path:resolve(root,'tool-src',a.path.slice(1).split('?')[0])}));
 b.onResolve({filter:/^\/vendor\/opendestiny-(bazi|ziwei).*\.js/},a=>({path:a.path.includes('bazi')?'bazi':'ziwei',namespace:'engine'}));
 b.onLoad({filter:/.*/,namespace:'engine'},a=>({contents:`export * from ${JSON.stringify(coreEntry)};export * from ${JSON.stringify(a.path==='bazi'?baziEntry:ziweiEntry)};`,resolveDir:root}));
 b.onResolve({filter:/^node:url$/},()=>({path:'node:url',namespace:'stub'}));
 b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:"export function pathToFileURL(){throw Error('External ephemeris files unavailable in browser')}"}));
}}];
await rm('public/tools/engines',{recursive:true,force:true});
const engineBuild=await build({metafile:true,entryPoints:['tool-src/scripts/bazi-page.js','tool-src/scripts/ziwei-page.js','tool-src/scripts/reverse-lookup-worker.js'],outdir:'public/tools/engines',bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',minify:true,plugins,define:{'process.argv':'[]'},legalComments:'linked'});
const forbidden=Object.values(engineBuild.metafile.outputs).flatMap(output=>Object.entries(output.inputs))
 .filter(([name,info])=>/chinese-era|huangli/.test(name)&&info.bytesInOutput>0);
if(forbidden.length)throw new Error('Chart bundles include era/almanac data: '+JSON.stringify(forbidden));
console.log('Verified: no historical era/almanac modules in chart bundles.');
const coreVersion=`npm package ${JSON.parse(await read(resolve(core,'package.json'))).version}`;
await cp(resolve(core,'LICENSE'),'public/tools/engines/LICENSE');
await cp(resolve(core,'THIRD_PARTY_NOTICES.md'),'public/tools/engines/THIRD_PARTY_NOTICES.md');
await cp(resolve(core,'THIRD_PARTY_NOTICES.zh-CN.md'),'public/tools/engines/THIRD_PARTY_NOTICES.zh-CN.md');
await cp(resolve(bazi,'THIRD_PARTY_NOTICES.zh-CN.md'),'public/tools/engines/THIRD_PARTY_NOTICES.bazi.zh-CN.md');
await cp(resolve(ziwei,'THIRD_PARTY_NOTICES.zh-CN.md'),'public/tools/engines/THIRD_PARTY_NOTICES.ziwei.zh-CN.md');
await writeFile('public/tools/engines/SOURCE.md',`# Source code\n\nThese browser bundles contain code from js-ephemeris-lite, bazi-lite and ziwei-lite under MPL-2.0.\n\nCorresponding source: https://github.com/RedSC1/js-ephemeris-lite\n\nRevision used for this build: \`${coreVersion}\`\n`);
// The worker is lazy: only reverse-lookup requests create it.
await mkdir('public/scripts',{recursive:true});
await writeFile('public/scripts/reverse-lookup-worker.js',"import '../tools/engines/reverse-lookup-worker.js';");
await cp('tool-src/tool-theme.css','public/tools/tool-theme.css');
await cp('tool-src/settings-theme.css','public/tools/settings-theme.css');
await cp('tool-src/mobile.css','public/tools/mobile.css');
await mkdir('public/tools/tarot',{recursive:true});
for(const name of ['app.js','index.html','style.css','spreads.js','table-spread.js','tarot.js','card-assets.js','card-back.svg'])await cp(resolve(tarot,name),`public/tools/tarot/${name}`);
await cp(resolve(tarot,'vendor'),'public/tools/tarot/vendor',{recursive:true});
await cp(resolve(tarot,'assets/tarot/web'),'public/tools/tarot/assets/tarot/web',{recursive:true});
const tarotVendorAssets='public/tools/tarot/vendor/tarot-lite/assets.js';
await writeFile(tarotVendorAssets,(await read(tarotVendorAssets)).replace("new URL('../assets/', import.meta.url)","new URL(/* @vite-ignore */ '../assets/', import.meta.url)"));
await cp(resolve(tarot,'vendor/tarot-lite/LICENSE'),'public/tools/tarot/LICENSE');
const tarotSources=JSON.parse(await read('public/tools/tarot/assets/tarot/web/sources.json')).sort((a,b)=>a.id-b.id);
if(tarotSources.length!==78||new Set(tarotSources.map(card=>card.id)).size!==78)throw new Error('Tarot source manifest must contain 78 unique card ids.');
const tarotSourceRows=tarotSources.map(card=>`| ${String(card.id).padStart(2,'0')} | ${card.slug} | [Commons file page](${card.source}) | ${card.license} |`).join('\n');
await writeFile('public/tools/tarot/THIRD_PARTY_NOTICES.md',`# Third-party artwork / 第三方牌面来源\n\nThe included Rider–Waite–Smith card faces are by Pamela Colman Smith and were originally published in 1909. They are WebP derivatives of the Wikimedia Commons scans listed below. The custom card back and Tarot software are covered by MPL-2.0; that license does not relicense the card faces.\n\n这些 Rider–Waite–Smith 牌面由 Pamela Colman Smith 绘制，最初出版于 1909 年。本站文件是下列 Wikimedia Commons 扫描图的 WebP 衍生文件；自制牌背和塔罗软件使用 MPL-2.0，该软件许可证不改变牌面素材本身的版权状态。\n\n## Verification / 核验结果\n\nOn 2026-09-12, all 78 linked Commons file pages were queried through the Wikimedia Commons API using the current image metadata. Every page returned \`LicenseShortName: Public domain\`, \`UsageTerms: Public domain\`, and \`Copyrighted: False\`. No missing, duplicate, or differently licensed card was found. Commons also notes that copyright terms vary by jurisdiction and that the work may remain protected in a small number of countries with terms longer than life plus 70 years.\n\n2026-09-12 通过 Wikimedia Commons API 逐页核验以下 78 个文件页：全部返回“Public domain”，且 \`Copyrighted\` 均为 \`False\`；未发现缺页、重复来源或不同许可证的牌面。Commons 同时提示，各地保护期限不同，少数采用超过作者终身加 70 年期限的国家或地区仍可能存在版权。网页上的版权标注以后仍可能更新，源页面链接保留在下表供复查。\n\n| ID | Card | Source | Commons status (checked 2026-09-12) |\n| ---: | --- | --- | --- |\n${tarotSourceRows}\n\nOriginal PNG dimensions and SHA-256 hashes are retained in \`assets/tarot/web/sources.json\`. They describe the downloaded PNG scans; the distributed WebP derivatives have different hashes.\n`);
await writeFile('public/tools/tarot/SOURCE.md','# Source code\n\nThe Tarot application code in this directory and the vendored `tarot-lite` library are distributed under MPL-2.0. The readable JavaScript and CSS files in this directory are the corresponding source.\n\nThe Rider–Waite–Smith card faces are public-domain artwork and are documented individually in `assets/tarot/web/sources.json`.\n');
let html=await read('public/tools/tarot/index.html');
const tarotSeo=embeddedSeo.tarot;
html=html.replace('<head>','<head>'+toolBootStyle).replace(/<title>[^<]*<\/title>/,`<title>${tarotSeo.title}</title>`).replace('</head>',`<meta name="description" content="${tarotSeo.description}"><link rel="canonical" href="${tarotSeo.canonical}"><link rel="stylesheet" href="../tool-theme.css?v=${assetVersion}"><link rel="stylesheet" href="../settings-theme.css?v=${assetVersion}"><link rel="stylesheet" href="../mobile.css?v=${assetVersion}"><script type="module" src="../../shared/i18n/locale-runtime.js"></script></head>`).replace('<body>','<body class="tarot-embedded">').replace('<div class="header-actions">','<a id="tool-back" class="tool-home-link" href="/" target="_top">← 全部工具</a><div class="tarot-save-feedback"><p id="tarot-save-status" class="tarot-save-status" role="status"></p><button id="tarot-save-retry" class="outline" hidden>重试保存本次记录</button></div><div class="header-actions">');html=html.replace('<img id="detail-image" alt="">','<div class="detail-card-shadow"><img id="detail-image" alt=""></div>').replace('id="record-question"','id="record-question" data-no-i18n');html=html.replace('<header>', '<header class="tool-toolbar">').replaceAll('${assetVersion}',assetVersion);await writeFile('public/tools/tarot/index.html',html);
let app=await read('public/tools/tarot/app.js');
app=`await (window.redsc1LocaleReady ?? Promise.resolve());\n`+app;
app=app.replace('const width = Math.min(count <= 2 ?', 'const gap = matchMedia("(max-width: 760px)").matches ? 16 : 44;\n    const width = Math.min(count <= 2 ?').replace('(count - 1) * 44', '(count - 1) * gap');app="import {saveRecord} from '../../shared/storage.js';\nlet historyId=crypto.randomUUID();\n"+app;
app=app.replace("const spreadLabels =",`let tableAssetsReady;
function preloadTableAssets() {
  if (tableAssetsReady) return tableAssetsReady;
  const pending = Object.values(CARD_BY_ID).map(file => \`\${ASSET_BASE}/\${file}\`);
  const worker = async () => {
    while (pending.length) {
      const url = pending.shift();
      try {
        const response = await fetch(url, { cache: 'force-cache', priority: 'low' });
        if (response.ok) await response.arrayBuffer();
      } catch { /* A card can still load normally when it is revealed. */ }
    }
  };
  tableAssetsReady = Promise.all(Array.from({ length: 6 }, worker));
  return tableAssetsReady;
}

const spreadLabels =`);
app=app.replace('function startReading(', 'function startReading(').replace(/(function startReading\([^)]*\) \{)/,"$1\n historyId=crypto.randomUUID();\n $('tarot-save-status').textContent='';$('tarot-save-retry').hidden=true;");
app=app.replace("function afterReveal() {","function afterReveal() {").replace("'revealed' : 'drawComplete');\n}","'revealed' : 'drawComplete');\n if(reading.phase==='revealed')saveHistory();\n}");
app+=`\n\nfunction saveHistory(){try{saveRecord({id:historyId,kind:'tarot',title:reading.question||'无题的探索',createdAt:Date.now(),snapshot:{question:reading.question,spread:{...spread(),name:spreadLabels[spread().id]||spread().name},cards:reading.cards.map(({card},i)=>({...card,position:spread().positions[i].label}))}});$('tarot-save-status').textContent='本次抽牌已保存到历史记录';$('tarot-save-retry').hidden=true;}catch(e){$('tarot-save-status').textContent='记录保存失败：'+e.message;$('tarot-save-retry').hidden=false;}}\n$('tarot-save-retry').onclick=saveHistory;\ndocument.documentElement.dataset.toolReady='true';\nwindow.parent.postMessage({type:'tool-ready'},location.origin);`;
app=app.replace('\nstartReading();','\nstartReading();\nawait preloadTableAssets();');
await writeFile('public/tools/tarot/app.js',app);
console.log('Prepared static tarot, bazi, ziwei and shared engine chunks.');
await import('./prepare-calendar-tools.mjs');

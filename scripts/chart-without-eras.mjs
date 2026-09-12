// The legacy calendar keeps era labels; chart pages deliberately omit them.
export function withoutEraMarkup(source) {
  return source
    .replace(/\s*<div id="fact-era-row">[^]*?<\/div>/g, '')
    .replace(/\s*<label[^>]*><input[^>]*name="showCenterEra"[^]*?<\/label>/g, '')
    .replace(/(?:#fact-era[^{}]*|\.zw-center-era[^{}]*)\{[^{}]*\}/g, '');
}

export function withoutEraScript(source, kind) {
  let result = source
    .replace(/\bgetChineseEraNames,\s*/g, '')
    .replace(/const ERA_DYNASTY_LABELS = Object\.freeze\(\{[^]*?\n\}\);\n/, '');
  if (kind === 'bazi') {
    result = result
      .replace(/function chineseCardinal\(value\) \{[^]*?(?=function renderFacts\()/, '')
      .replace(/  const eraEntries = renderHistoricalEras\(chart.birthJdUT1\);\n/, '')
      .replace(/  const eraSummary = eraEntries.length[^]*?: '';\n/, '')
      .replace('${eraSummary}', '');
    // Named imports let esbuild discard unused calendar features and datasets.
    const runtime = result.match(/import \* as Core from ('[^']+');/)[1];
    result = result.replace(/import \* as Core from '[^']+';\n/, '')
      .replace(/const \{([^]*?)\} = Core;/, `import {$1 julianDay, JulianTime } from ${runtime};`)
      .replaceAll('Core.julianDay', 'julianDay').replaceAll('Core.JulianTime', 'JulianTime');
  } else {
    result = result
      .replace(/  let brand = center.querySelector[^]*?(?=  const clockTime =)/, '  center.replaceChildren();\n')
      .replace(/  if \(form.elements.showCenterEra\?\.checked\) \{[^]*?\n  \}\n/, '')
      .replace(/function compactEraText\(entry\) \{[^]*?(?=function makeCenterFlow\()/, '')
      .replace(/document.querySelector\('\[data-center-era\]'\)\?\.addEventListener\('change', \(\) => \{[^]*?\n\}\);\n/, '');
  }
  if (/getChineseEraNames|eraEntries|eraSummary|showCenterEra|compactEraText/.test(result)) {
    throw new Error(`Historical era removal needs updating for ${kind}`);
  }
  return result;
}

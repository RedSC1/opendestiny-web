import {captureForm,connectChart} from '/shared/chart-bridge.js';
// Export the last successfully calculated chart, never unsubmitted form edits.
export function captureChartProfile(form) {
 const _form=captureForm(form);
  const data = new FormData(form);
  const number = (key) => {
    const value = data.get(key);
    return value === null || String(value).trim() === '' || !Number.isFinite(Number(value)) ? null : Number(value);
  };
  return {
    _form,
    name: String(data.get('name') || '').trim(),
    location: { name: String(data.get('location') || '').trim(), longitudeDeg: number('longitude'), latitudeDeg: number('latitude') },
    input: {
      calendar: String(data.get('inputCalendar')),
      year: number('year'), month: number('month'), day: number('day'),
      hour: number('hour'), minute: number('minute'), second: number('second'),
      lunarMonthKind: data.get('inputCalendar') === 'lunar' ? String(data.get('lunarMonthKind') || 'normal') : null,
    },
  };
}

export function setupChartJsonExport({ trigger, getSnapshot }) {
  connectChart(document.querySelector('#bazi-app')?'bazi':'ziwei',getSnapshot);
  const dialog = document.createElement('dialog');
  dialog.className = 'chart-json-dialog';
  dialog.setAttribute('aria-labelledby', 'chart-json-title');
  dialog.innerHTML = `<header><div><h2 id="chart-json-title">导出本命盘 JSON</h2><p>包含出生时间、时区和排盘设置；不包含当前选中的流运。</p></div><button type="button" data-close aria-label="关闭">×</button></header>
    <label class="chart-json-label" for="chart-json-preview">命盘数据预览</label><textarea id="chart-json-preview" readonly spellcheck="false"></textarea>
    <footer><p role="status">含个人出生信息，请谨慎分享。仅在本机生成，不上传。</p><div><button type="button" data-copy>复制 JSON</button><button type="button" data-download>下载 .json</button></div></footer>`;
  document.body.append(dialog);
  const preview = dialog.querySelector('textarea');
  const status = dialog.querySelector('[role="status"]');
  let fileName = 'chart.json';
  trigger.addEventListener('click', () => {
    try {
      const snapshot = getSnapshot();
      if (!snapshot) return;
      preview.value = JSON.stringify(snapshot, null, 2);
      const name = String(snapshot.profile?.name || '匿名').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 80);
      fileName = `${name}-${snapshot.kind}.json`;
      status.textContent = '含个人出生信息，请谨慎分享。仅在本机生成，不上传。';
      if (!dialog.open) dialog.showModal();
    } catch (error) {
      status.textContent = `导出失败：${error instanceof Error ? error.message : String(error)}`;
      preview.value = '';
      if (!dialog.open) dialog.showModal();
    }
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-copy]').addEventListener('click', async () => {
    if (!preview.value) return;
    try {
      await navigator.clipboard.writeText(preview.value);
      status.textContent = '已复制 JSON。';
    } catch {
      preview.focus();
      preview.select();
      status.textContent = '浏览器不允许自动复制，已选中全部内容，请手动复制。';
    }
  });
  dialog.querySelector('[data-download]').addEventListener('click', () => {
    if (!preview.value) return;
    const url = URL.createObjectURL(new Blob([preview.value], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  });
}

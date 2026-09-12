import { createModel } from './calendar-model.js?v=20260831-vendor-clean-v1';

let model, key;
self.addEventListener('message', ({ data }) => {
  const { id, year, month, date, type = 'month', options } = data;
  try {
    const nextKey = JSON.stringify(options);
    if (key !== nextKey) { model = createModel(options); key = nextKey; }
    self.postMessage({ id, result: type === 'sky' ? model.sky(date) : model.month(year, month) });
  } catch (error) { self.postMessage({ id, error: error.message }); }
});

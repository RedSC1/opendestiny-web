let databasePromise;

function decodeRow(row, utcOffsetMinutes) {
  const [id, parentId, depth, name, packedCoordinates] = row;
  return Object.freeze({
    id,
    parentId,
    depth,
    name,
    longitude: (((packedCoordinates >>> 16) & 0xffff) / 1000) + 73,
    latitude: ((packedCoordinates & 0xffff) / 1000) + 16,
    utcOffsetMinutes,
  });
}
export async function loadLocationDatabase() {
  databasePromise ??= fetch(new URL('../../data/china-admin-areas.v1.json',import.meta.url))
    .then((response) => {
      if (!response.ok) throw new Error(`地点数据库加载失败（HTTP ${response.status}）`);
      return response.json();
    })
    .then((payload) => {
      const areas = payload.areas.map((row) => decodeRow(row, payload.defaultUtcOffsetMinutes));
      const byId = new Map(areas.map((item) => [item.id, item]));
      const byParent = new Map();
      for (const item of areas) {
        const siblings = byParent.get(item.parentId) ?? [];
        siblings.push(item);
        byParent.set(item.parentId, siblings);
      }
      return Object.freeze({
        version: payload.version,
        source: payload.source,
        areas,
        provinces: byParent.get(0) ?? [],
        getById: (id) => byId.get(Number(id)),
        getChildren: (parentId) => byParent.get(Number(parentId)) ?? [],
        search: (query, limit = 30) => {
          const term = String(query).trim().toLocaleLowerCase('zh-CN');
          if (!term) return [];
          return areas
            .filter((item) => item.name.toLocaleLowerCase('zh-CN').includes(term))
            .slice(0, limit);
        },
      });
    });
  return databasePromise;
}

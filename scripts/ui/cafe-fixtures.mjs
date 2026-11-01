export const cafeIds = {
  log: "10000000-0000-4000-8000-000000000001",
  store: "10000000-0000-4000-8000-000000000002",
};
export const cafePhoto = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jpVQAAAAASUVORK5CYII=",
  "base64",
);
export function createCafeFixtures() {
  const store = {
    id: cafeIds.store,
    name: "検証用カフェ",
    prefecture: "東京都",
    links: ["https://example.com/cafe"],
  };
  const log = {
    id: cafeIds.log,
    storeId: store.id,
    cafeName: store.name,
    prefecture: store.prefecture,
    origin: "エチオピア",
    region: "シダマ",
    variety: "ゲイシャ",
    farm: "検証用農園",
    producer: "検証用生産者",
    process: "ウォッシュド",
    roast: "浅煎り",
    isBlend: false,
    servingStyle: "hot",
    flavorNotes: ["ベリー", "チョコレート"],
    rating: 3.5,
    price: 650,
    visitDate: "2026-10-31",
    note: "検証用の味のメモ",
    createdAt: "2026-10-31T03:00:00Z",
    links: [{ id: "link-1", url: store.links[0], type: "website" }],
    user: { displayName: "確認用ユーザー", avatarUrl: null },
  };
  let imageBytes = cafePhoto;
  const logs = [log],
    images = new Map([[log.id, []]]);
  let next = 3;
  let uploads = 0;
  const writes = [];
  const id = () => `10000000-0000-4000-8000-${String(next++).padStart(12, "0")}`;
  return {
    store,
    log,
    logs,
    images,
    writes,
    setPhoto(bytes) {
      imageBytes = bytes;
    },
    get uploads() {
      return uploads;
    },
    respond(path, method = "GET", payload = {}) {
      const imageMatch = path.match(/^\/api\/logs\/([^/]+)\/images(?:\/([^/]+))?$/);
      if (imageMatch) {
        const list = images.get(imageMatch[1]) ?? [];
        if (method === "GET") return imageMatch[2] ? imageBytes : list;
        if (method === "POST") {
          uploads++;
          list.push({ id: id(), position: list.length });
          images.set(imageMatch[1], list);
          return { success: true };
        }
      }
      if (path === "/api/stores") return [store];
      if (path === `/api/stores/${store.id}`)
        return {
          store,
          cafeRecords: logs.map((item) => ({
            ...item,
            links: item.links.map((link) => link.url),
            app: "cafelog",
          })),
          brewRecords: [],
        };
      const apply = (target, payload) =>
        Object.assign(target, payload, {
          links: (payload.cafeLinks ?? target.links.map((link) => link.url)).map((url, index) => ({
            id: "link-" + index,
            url,
            type: "website",
          })),
        });
      if (path === "/api/logs") {
        if (method === "GET") return logs;
        const created = apply({ ...log, id: id() }, payload);
        logs.unshift(created);
        images.set(created.id, []);
        writes.push(payload);
        return created;
      }
      const match = path.match(/^\/api\/logs\/([^/]+)$/);
      if (match) {
        const target = logs.find((item) => item.id === match[1]);
        if (method === "DELETE") {
          logs.splice(logs.indexOf(target), 1);
          return target;
        }
        if (method === "GET") return target ?? null;
        writes.push(payload);
        return apply(target, payload);
      }
      return undefined;
    },
  };
}

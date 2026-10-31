export const brewIds = {
  bean: "00000000-0000-4000-8000-000000000001",
  dripper: "00000000-0000-4000-8000-000000000002",
  grinder: "00000000-0000-4000-8000-000000000003",
  log: "00000000-0000-4000-8000-000000000004",
  store: "00000000-0000-4000-8000-000000000005",
};
export function createBrewFixtures() {
  const store = { id: brewIds.store, name: "検証用の店舗", prefecture: "東京都", links: [] };
  const bean = {
    id: brewIds.bean,
    name: "検証用コーヒー豆",
    coffeeType: "specialty",
    origin: "エチオピア",
    region: "シダマ",
    variety: "ゲイシャ",
    farm: "検証用農園",
    producer: "検証用生産者",
    purchaseStore: store.name,
    storeId: store.id,
    store,
    roastLevel: 3,
    roastDate: "2026-10-25",
    purchaseDate: "2026-10-31",
    processMethod: "washed",
    note: "検証用のメモ",
    version: "2026.10.31",
    parentBeanId: null,
    isArchived: false,
    createdAt: "2026-10-31T03:00:00Z",
  };
  const dripper = { id: brewIds.dripper, name: "検証用ドリッパー", isDefault: true };
  const grinder = {
    id: brewIds.grinder,
    name: "検証用ミル",
    isDefault: true,
    fineMax: 6,
    mediumFineMax: 9,
    mediumMax: 15,
    mediumCoarseMax: 22,
  };
  const log = {
    id: brewIds.log,
    beanId: bean.id,
    bean,
    dripperId: dripper.id,
    dripper,
    grinderId: grinder.id,
    grinder,
    brewDate: "2026-10-31",
    createdAt: "2026-10-31T03:00:00Z",
    grindSize: 10,
    waterTemp: 85,
    beanAmount: 10,
    waterAmount: 150,
    yieldAmount: 150,
    rating: 3,
    brewComment: "検証用の抽出コメント",
    note: "検証用のノート",
    tempType: "hot",
    iceAmount: null,
    drawdownTime: 120,
    bloomingTime: 30,
    hasBypass: false,
    pours: [],
    method: null,
    user: { displayName: "確認用ユーザー", avatarUrl: null },
  };
  const beans = [bean],
    logs = [log];
  let next = 6;
  const id = () => `00000000-0000-4000-8000-${String(next++).padStart(12, "0")}`;
  return {
    bean,
    log,
    store,
    dripper,
    grinder,
    respond(path, method = "GET", payload = {}) {
      if (path === "/api/beans") {
        if (method === "GET") return beans;
        const created = { ...bean, ...payload, id: id() };
        beans.unshift(created);
        return created;
      }
      if (path.startsWith("/api/beans/"))
        return method === "GET" ? bean : Object.assign(bean, payload);
      if (path === "/api/logs") {
        if (method === "GET") return logs;
        const created = { ...log, ...payload, id: id() };
        logs.unshift(created);
        return created;
      }
      if (path.startsWith("/api/logs/"))
        return method === "GET" ? log : Object.assign(log, payload);
      if (path === "/api/drippers") return [dripper];
      if (path === "/api/grinders") return [grinder];
      if (path === "/api/stores") return [store];
      return undefined;
    },
  };
}

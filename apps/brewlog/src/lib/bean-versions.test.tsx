import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BeanDetail from "@/pages/Beans/BeanDetail";
import { queryKeys, type Bean } from "./queries";
import { getBeanVersionLabel, getBrewableBeans, groupBeanVersions } from "./bean-versions";

const makeBean = (overrides: Partial<Bean>): Bean => ({
  id: "original",
  parentBeanId: null,
  version: null,
  householdId: "household",
  name: "エチオピア",
  coffeeType: "regular",
  origin: null,
  region: null,
  variety: null,
  farm: null,
  producer: null,
  purchaseStore: null,
  storeId: null,
  store: null,
  roastLevel: null,
  roastDate: null,
  purchaseDate: null,
  imageUrl: null,
  processMethod: null,
  note: null,
  isArchived: false,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const original = makeBean({ isArchived: true });
const latest = makeBean({
  id: "latest",
  parentBeanId: original.id,
  version: "再購入",
  createdAt: "2026-10-21T00:00:00Z",
  purchaseDate: "2025-12-01",
});
const other = makeBean({ id: "other", createdAt: "2026-10-01T00:00:00Z" });

describe("豆のバージョンと登録日順", () => {
  it("初回の登録日や購入日によらず、最新バージョンの登録日順にグループを並べる", () => {
    const source = [original, other, latest];
    const groups = groupBeanVersions(source);
    expect(groups.map((group) => group.latestBean.id)).toEqual(["latest", "other"]);
    expect(groups[0].versions.map((bean) => bean.id)).toEqual(["latest", "original"]);
    expect(groups[0].isArchived).toBe(false);
    expect(source).toEqual([original, other, latest]);
  });

  it("抽出登録には最新の未アーカイブ版を登録日順に表示する", () => {
    expect(getBrewableBeans([original, other, latest], null).map((bean) => bean.id)).toEqual([
      "latest",
      "other",
    ]);
    expect(getBrewableBeans([original, other, { ...latest, isArchived: true }], null)).toEqual([
      other,
    ]);
  });

  it("詳細から指定された旧版を選択肢に保ち、登録日順も維持する", () => {
    const availableOriginal = { ...original, isArchived: false };
    expect(
      getBrewableBeans([latest, other, availableOriginal], original.id).map((bean) => bean.id),
    ).toEqual(["latest", "other", "original"]);
    expect(getBrewableBeans([original, latest], original.id)).toEqual([latest]);
  });

  it("バージョン名のない初回登録にも表示名を付ける", () => {
    expect(getBeanVersionLabel(original)).toBe("初回登録");
    expect(getBeanVersionLabel(latest)).toBe("再購入");
  });
});

describe("豆の詳細と履歴の表示", () => {
  const renderDetail = (bean: Bean) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(queryKeys.bean(bean.id), bean);
    client.setQueryData(queryKeys.beans, [original, other, latest]);
    const html = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/beans/${bean.id}`]}>
          <Routes>
            <Route path="/beans/:id" element={<BeanDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    client.clear();
    return html;
  };

  it("同じ豆の初回・旧版・最新版へ移動でき、現在の版を示す", () => {
    const html = renderDetail(latest);
    expect(html).toContain("バージョン: 再購入");
    expect(html).toContain('href="/beans/original"');
    expect(html).toContain('href="/beans/latest"');
    expect(html).not.toContain('href="/beans/other"');
    expect(html).toContain('aria-current="page"');
    expect(html.indexOf('href="/beans/latest"')).toBeLessThan(
      html.indexOf('href="/beans/original"'),
    );
    expect(html).toContain("初回登録");
    expect(html).toContain("アーカイブ済み");
  });

  it("アーカイブ済みの豆でもバージョン追加が有効で、編集と抽出は無効のまま", () => {
    const html = renderDetail(original);
    const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [];
    expect(buttons.find((button) => button.includes("バージョン追加"))).not.toContain(
      'disabled=""',
    );
    expect(buttons.find((button) => button.includes("編集"))).toContain('disabled=""');
    expect(buttons.find((button) => button.includes("淹れる"))).toContain('disabled=""');
    expect(html).toContain("バージョン: 初回登録");
  });
});

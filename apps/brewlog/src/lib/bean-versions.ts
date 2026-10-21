import type { Bean } from "./queries";

export const getBeanGroupId = (bean: Pick<Bean, "id" | "parentBeanId">) =>
  bean.parentBeanId ?? bean.id;

export const sortBeanVersions = <T extends Pick<Bean, "createdAt">>(beans: readonly T[]): T[] =>
  beans.toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const groupBeanVersions = (beans: readonly Bean[]) => {
  const groups = new Map<string, Bean[]>();
  for (const bean of sortBeanVersions(beans)) {
    const groupId = getBeanGroupId(bean);
    const versions = groups.get(groupId);
    if (versions) versions.push(bean);
    else groups.set(groupId, [bean]);
  }
  return [...groups].map(([groupId, versions]) => ({
    groupId,
    versions,
    latestBean: versions[0],
    isArchived: versions[0].isArchived,
  }));
};

export const getBrewableBeans = (beans: readonly Bean[], selectedId: string | null) => {
  const latest = groupBeanVersions(beans)
    .map((group) => group.latestBean)
    .filter((bean) => !bean.isArchived);
  const selected = beans.find((bean) => bean.id === selectedId);
  if (selected && !selected.isArchived && !latest.some((bean) => bean.id === selectedId)) {
    latest.push(selected);
  }
  return sortBeanVersions(latest);
};

export const getBeanVersionLabel = (bean: Pick<Bean, "version" | "parentBeanId">) =>
  bean.version || (bean.parentBeanId ? "バージョン名未設定" : "初回登録");

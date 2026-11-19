import { useLocation, useSearchParams } from "react-router-dom";
import type {
  LogSortOption,
  LogSortOrder,
  LogTemperatureFilter,
} from "../components/log-list-controls";

export function useListSearchParams<T extends string>(
  sortOptions: readonly [LogSortOption<T>, ...LogSortOption<T>[]],
) {
  const [params, setParams] = useSearchParams();
  const { state } = useLocation();
  const sort = sortOptions.find(({ value }) => value === params.get("sort")) ?? sortOptions[0];
  const order = params.get("order");
  const sortOrder: LogSortOrder = order === "asc" || order === "desc" ? order : sort.initialOrder;
  const temperature = params.get("temperature");
  const filter: LogTemperatureFilter =
    temperature === "iced" || temperature === "hot" ? temperature : "all";

  const update = (values: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [name, value] of Object.entries(values)) {
      if (value === null) next.delete(name);
      else next.set(name, value);
    }
    if (next.toString() !== params.toString()) setParams(next, { replace: true, state });
  };

  return {
    filter,
    showArchived: params.get("archived") === "1",
    sortBy: sort.value,
    sortOrder,
    setFilter: (value: LogTemperatureFilter) =>
      update({ temperature: value === "all" ? null : value }),
    setShowArchived: (value: boolean) => update({ archived: value ? "1" : null }),
    changeSort: (value: T) => {
      const option = sortOptions.find((item) => item.value === value);
      if (!option) return;
      const nextOrder =
        value === sort.value ? (sortOrder === "asc" ? "desc" : "asc") : option.initialOrder;
      update({
        sort: value === sortOptions[0].value ? null : value,
        order: nextOrder === option.initialOrder ? null : nextOrder,
      });
    },
  };
}

export function useStoreListOptions() {
  const [params, setParams] = useSearchParams();
  const state = useLocation().state as { storeSearch?: unknown; storeSearchOpen?: unknown } | null;
  const options = {
    sort: params.get("sort") === "prefecture" ? ("prefecture" as const) : ("name" as const),
    search: typeof state?.storeSearch === "string" ? state.storeSearch : "",
    isSearchOpen: state?.storeSearchOpen === true,
  };
  return {
    options,
    onOptionsChange: ({ sort, search, isSearchOpen }: typeof options) => {
      const next = new URLSearchParams(params);
      if (sort === "prefecture") next.set("sort", sort);
      else next.delete("sort");
      setParams(next, {
        replace: true,
        state: { ...state, storeSearch: search, storeSearchOpen: isSearchOpen },
      });
    },
  };
}

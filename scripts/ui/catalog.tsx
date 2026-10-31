import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Label,
  Segment,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Loading,
  ErrorState,
  EmptyState,
  NoticeProvider,
  notify,
  Field,
  LogListControls,
  type LogTemperatureFilter,
  type LogSortOrder,
} from "@yahatapp/ui";
import "@yahatapp/ui/foundation.css";
import "@yahatapp/ui/themes/brewlog.css";
import "@yahatapp/ui/themes/cafelog.css";
function Catalog() {
  const [value, setValue] = useState<"hot" | "iced" | null>("hot");
  const [filter, setFilter] = useState<LogTemperatureFilter>("all");
  const [sort, setSort] = useState<"date" | "rating">("date");
  const [order, setOrder] = useState<LogSortOrder>("desc");
  return (
    <main>
      <h1>UI部品の確認</h1>
      <section aria-label="基本部品">
        {(["primary", "secondary", "outline", "ghost"] as const).map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
        <Button asChild loading>
          <a href="#blocked">保存中のリンク</a>
        </Button>
        {(["sm", "md", "lg", "icon"] as const).map((size) => (
          <Button key={size} size={size}>{`サイズ ${size}`}</Button>
        ))}
        <Button disabled>利用不可</Button>
        <Button loading>保存中</Button>
      </section>
      <section aria-label="入力部品">
        <Card>
          <CardHeader>
            <CardTitle>入力と選択</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="catalog-input">名前</Label>
            <Input id="catalog-input" placeholder="入力例" />
            <Label htmlFor="catalog-invalid">エラーの入力</Label>
            <Input id="catalog-invalid" aria-invalid="true" aria-describedby="catalog-error" />
            <p id="catalog-error">名前を入力してください。</p>
            <Label htmlFor="catalog-readonly">変更できない値</Label>
            <Input id="catalog-readonly" readOnly value="登録済み" />
            <Label htmlFor="catalog-select">選択</Label>
            <Select id="catalog-select">
              <option>ホット</option>
              <option>アイス</option>
            </Select>
            <Label htmlFor="catalog-note">メモ</Label>
            <Textarea id="catalog-note" />
            <Label htmlFor="catalog-check">
              <Checkbox id="catalog-check" />
              確認済み
            </Label>
            <Segment
              ariaLabel="提供温度"
              value={value}
              onValueChange={setValue}
              options={[
                { label: "ホット", value: "hot" },
                { label: "アイス", value: "iced" },
              ]}
            />
            <Field label="店名" description="正式名称を入力" error="店名が必要です" required>
              {(control) => <Input {...control} />}
            </Field>
          </CardContent>
        </Card>
      </section>
      <section aria-label="一覧の操作">
        <LogListControls
          filter={filter}
          counts={{ all: 3, hot: 2, iced: 1 }}
          onFilterChange={setFilter}
          sortBy={sort}
          sortOrder={order}
          sortOptions={[
            { value: "date", label: "日付", initialOrder: "desc" },
            { value: "rating", label: "評価", initialOrder: "desc" },
          ]}
          onSortChange={(next) => {
            setOrder(next === sort ? (order === "desc" ? "asc" : "desc") : "desc");
            setSort(next);
          }}
        />
      </section>
      <section aria-label="画面の状態">
        <Loading />
        <ErrorState onRetry={() => {}} />
        <EmptyState title="記録がありません" description="最初の記録を追加してください。" />
      </section>
      <Button onClick={() => notify({ variant: "warning", message: "確認用の通知" })}>
        通知する
      </Button>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <NoticeProvider>
    <Catalog />
  </NoticeProvider>,
);

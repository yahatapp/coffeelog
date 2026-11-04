import styles from "./catalog.module.css";
import "@yahatapp/ui/styles.css";
import "@yahatapp/ui/themes/brewlog.css";
import "@yahatapp/ui/themes/cafelog.css";
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
function Catalog() {
  const [value, setValue] = useState<"hot" | "iced" | null>("hot");
  const [filter, setFilter] = useState<LogTemperatureFilter>("all");
  const [sort, setSort] = useState<"date" | "rating">("date");
  const [order, setOrder] = useState<LogSortOrder>("desc");
  return (
    <main className={styles.root}>
      <h1 className={styles.heading}>UI部品の確認</h1>
      <section className={styles.section} aria-label="基本部品">
        {(["primary", "secondary", "outline", "ghost", "danger"] as const).map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
        <Button asChild loading>
          <a href="#blocked">保存中のリンク</a>
        </Button>
        {(["xs", "sm", "md", "lg", "icon", "icon-lg"] as const).map((size) => (
          <Button key={size} size={size} aria-label={`サイズ ${size}`}>
            {size.startsWith("icon") ? "+" : `サイズ ${size}`}
          </Button>
        ))}
        <Button disabled>利用不可</Button>
        <Button loading>保存中</Button>
      </section>
      <section className={styles.section} aria-label="入力部品">
        <Card>
          <CardContent>
            <p>ヘッダーなしの本文</p>
          </CardContent>
        </Card>
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
            <Label htmlFor="catalog-disabled">利用不可の入力</Label>
            <Input id="catalog-disabled" disabled value="利用不可" />
            <Field label="日付">
              {(control) => <Input {...control} type="date" defaultValue="2026-10-31" />}
            </Field>
            <Field label="補助的な入力" labelVariant="secondary">
              {(control) => <Input {...control} placeholder="まとまりの中の入力" />}
            </Field>
            <Label htmlFor="catalog-select">選択</Label>
            <Select id="catalog-select">
              <option>ホット</option>
              <option>アイス</option>
            </Select>
            <Label htmlFor="catalog-note">メモ</Label>
            <Textarea id="catalog-note" />
            <Field label="利用不可のメモ">
              {(control) => <Textarea {...control} disabled value="利用不可" />}
            </Field>
            <Field label="変更できないメモ">
              {(control) => <Textarea {...control} readOnly value="登録済み" />}
            </Field>
            <Field label="エラーのメモ" error="メモを確認してください。">
              {(control) => <Textarea {...control} />}
            </Field>
            <Field label="利用不可の選択">
              {(control) => (
                <Select {...control} disabled>
                  <option>ホット</option>
                </Select>
              )}
            </Field>
            <Field label="エラーの選択" error="選択してください。">
              {(control) => (
                <Select {...control}>
                  <option>未選択</option>
                </Select>
              )}
            </Field>
            <Label htmlFor="catalog-disabled-check">
              <Checkbox id="catalog-disabled-check" disabled />
              利用不可の確認
            </Label>
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
            <Segment
              ariaLabel="利用不可の選択肢"
              value="hot"
              onValueChange={() => {}}
              disabled
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
      <section className={styles.section} aria-label="一覧の操作">
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
      <section className={styles.section} aria-label="画面の状態">
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

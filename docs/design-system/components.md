# 共通部品の選び方

## 入力と操作

| 場面             | 部品と定義元                                                                                                                                                              | 実装時の確認                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 保存・追加・削除 | [Button](../../packages/ui/src/components/button.tsx)                                                                                                                     | loadingで連打を防ぐ。遷移はasChildとLinkを組み合わせる              |
| 入力             | [Field](../../packages/ui/src/components/field.tsx)と[Input](../../packages/ui/src/components/input.tsx)・[Textarea](../../packages/ui/src/components/textarea.tsx)       | Fieldのrender propsを入力へ渡し、id・説明・エラーを結ぶ             |
| 選択             | [Select](../../packages/ui/src/components/select.tsx)・[Segment](../../packages/ui/src/components/segment.tsx)・[Checkbox](../../packages/ui/src/components/checkbox.tsx) | 選択肢の名前、選択中、disabledを確認する                            |
| 情報のまとまり   | [Card](../../packages/ui/src/components/card.tsx)                                                                                                                         | 標準のHeader・Contentを使う。独自の中身は自分のラッパーに配置を書く |

- variant・size・状態の正確な型は定義元を参照する。
- iconボタンには操作名を付ける。装飾アイコンは読み上げ対象から外す。
- ButtonにclassNameを渡して見た目を変える前に、既存の型付きAPIで表せるか確認する。
- 必須、invalid、read-only、disabled、loading、hover、focusは、利用する部品の状態として確認する。

## 複合部品と画面状態

| 場面                       | 定義元                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 読み込み・失敗・空         | [Loading・ErrorState・EmptyState](../../packages/ui/src/components/status.tsx)                                         |
| 操作結果の通知             | [NoticeProvider](../../packages/ui/src/components/notices.tsx)と[notify](../../packages/ui/src/lib/notices.ts)         |
| 一覧の絞り込み・並び替え   | [LogListControls](../../packages/ui/src/components/log-list-controls.tsx)                                              |
| 店舗検索・履歴             | [StoreList・StoreHistory](../../packages/ui/src/components/store-history.tsx)                                          |
| 外枠・固定ナビ・認証・同意 | [app-shell](../../packages/ui/src/components/app-shell.tsx)と[PageLayout](../../packages/ui/src/components/layout.tsx) |

- 単純な操作は意味の正しいHTMLを使う。Dialog等の複雑な対話はBase UIを使う。
- 成功・警告・失敗を見た目だけで区別せず、文言と操作を示す。
- 色や寸法の新しい意味が必要なら、部品の型とトークンを同じ変更で整備する。

## 実行できる例

- `pnpm ui:dev`で部品一覧を開く。実装は[部品一覧のコード](../../scripts/ui/catalog.tsx)を参照する。両テーマのvariant・size・入力状態を確認できる。
- 実フォームは[BrewlogのBeanFields](../../apps/brewlog/src/components/forms/BeanFields.tsx)と[CafelogのCafeLogForm](../../apps/cafelog/src/components/CafeLogForm.tsx)を参照する。
- 画像のDialogは[ImagePreview](../../apps/cafelog/src/components/ImagePreview.tsx)、店舗のDialogは[StoreHistory](../../packages/ui/src/components/store-history.tsx)を参照する。

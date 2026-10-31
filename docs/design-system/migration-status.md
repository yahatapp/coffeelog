# 移行の実施記録

実装中。途中の成果物は公開しない。手動・画面検証を終えるまでタスク完了としない。

## 対象ファイル

| ファイル | 担当 | 確認結果 |
| --- | --- | --- |
| `packages/ui/src/components/button.tsx` | T04/T05 | 未実施 |
| `packages/ui/src/components/card.tsx` | T04/T05 | 未実施 |
| `packages/ui/src/components/checkbox.tsx` | T04/T05 | 未実施 |
| `packages/ui/src/components/input.tsx` | T04/T05 | 未実施 |
| `packages/ui/src/components/label.tsx` | T04/T05 | 未実施 |
| `packages/ui/src/components/layout.tsx` | T04/T05 | 未実施 |
| `packages/ui/src/components/log-list-controls.tsx` | T04/T05 | 未実施 |
| `packages/ui/src/components/notices.tsx` | T04/T05 | 未実施 |
| `packages/ui/src/components/segment.tsx` | T04/T05 | 未実施 |
| `packages/ui/src/components/select.tsx` | T04/T05 | 未実施 |
| `packages/ui/src/components/status.tsx` | T04/T05 | 未実施 |
| `packages/ui/src/components/store-history.tsx` | T04/T05 | 未実施 |
| `packages/ui/src/components/textarea.tsx` | T04/T05 | 未実施 |
| `apps/brewlog/src/App.tsx` | T06 | 未実施 |
| `apps/brewlog/src/components/BeanVersionHistory.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/components/forms/BeanFields.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/components/forms/BeanStoreFields.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/components/forms/BrewLogFields.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/components/ui/CoffeeBeansIcon.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/components/ui/OriginFlag.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/components/ui/RoastLevelIndicator.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/components/ui/slider.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/pages/Beans/AddBean.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/pages/Beans/BeanDetail.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/pages/Beans/BeansList.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/pages/Beans/EditBean.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/pages/Home.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/pages/Logs/AddLog.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/pages/Logs/EditLog.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/pages/Logs/LogDetail.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/pages/Logs/LogsList.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/pages/NotFound.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/pages/Settings/Drippers.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/pages/Settings/Grinders.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/pages/Settings.tsx` | T07/T08 | 未実施 |
| `apps/brewlog/src/pages/Stores.tsx` | T07/T08 | 未実施 |
| `apps/cafelog/src/App.tsx` | T06 | 未実施 |
| `apps/cafelog/src/components/CafeLogForm.tsx` | T09/T10 | 未実施 |
| `apps/cafelog/src/components/CafeLogListCard.tsx` | T09/T10 | 未実施 |
| `apps/cafelog/src/components/CoffeeAttributes.tsx` | T09/T10 | 未実施 |
| `apps/cafelog/src/components/ImagePicker.tsx` | T09/T10 | 未実施 |
| `apps/cafelog/src/components/LogImages.tsx` | T09/T10 | 未実施 |
| `apps/cafelog/src/components/OriginFlag.tsx` | T09/T10 | 未実施 |
| `apps/cafelog/src/components/ProcessField.tsx` | T09/T10 | 未実施 |
| `apps/cafelog/src/pages/CreateLog.tsx` | T09/T10 | 未実施 |
| `apps/cafelog/src/pages/Home.tsx` | T09/T10 | 未実施 |
| `apps/cafelog/src/pages/LogDetail.tsx` | T09/T10 | 未実施 |
| `apps/cafelog/src/pages/Logs.tsx` | T09/T10 | 未実施 |
| `apps/cafelog/src/pages/NotFound.tsx` | T09/T10 | 未実施 |
| `apps/cafelog/src/pages/Settings.tsx` | T09/T10 | 未実施 |
| `apps/cafelog/src/pages/Stores.tsx` | T09/T10 | 未実施 |

## 意図した変更

補助文字と背景を分離し、secondaryボタンは前景と背景を組み合わせて定義する。入力境界、フォーカス、操作領域を改善計画に合わせる。

## 未実施

変更前の画面記録、LINE実機、読み上げ、全ルートの操作と画像・通知の確認は未実施。

## 検証記録

- 変更前：check・build成功。Node 20でtest失敗（Promise.withResolvers未対応）。指定のNix環境（Node 24.22.1）ではtest全成功。
- トークン契約：43項目を両テーマで検証。欠落・参照切れ・循環・型の不一致を検出するテスト成功。
- 現時点：T02とT04の一部を実装。Button・入力・選択・ラベルをCSS Modulesへ変更。Tailwind削除、Field、全画面移行、Stylelint、画面検証、CI接続は未完了。
- 公開：未実施。

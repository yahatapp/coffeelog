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

## T01 完了確認

- 基準コミット5054e9eの旧UIを隔離起動し、[対象一覧](evidence/inventory.json)に82ファイルと担当タスク、再公開のみの区別、className・styleの使用数を記録。全ルートは実装計画末尾の一覧と照合した。
- [画面記録](evidence/before/results.json)：両アプリ×320/390px×ホーム・フォーム・店舗・設定・店舗モーダル・通知の24ケース。ブラウザー例外なし。フォームへの日本語入力と通知のキーボードで閉じる操作を確認。PNGは同ディレクトリに保存した。
- 旧通知の閉じるボタンはaria-hiddenを持つため、role検索では検出できなかった。DOMのaria-labelで指定してフォーカス・Enter操作を確認した。T05でアクセシビリティを再評価する。
- 起動時の入場アニメーション完了後を記録した。画面は実装前のコードで、実機や本番データによる記録ではない。
- 変更前の指定環境でcheck・test・buildが成功していることを再確認。意図した配色・操作領域の変更は本文の記録を参照。

## T02 完了確認

- トークン契約と両テーマの参照検査、文字8組のコントラスト4.5:1以上と入力境界3:1以上をテストで確認。
- [現在の描画記録](evidence/foundation/results.json)24ケースでhtmlとbodyの用途別primary値を確認。通知も表示・キーボード操作が成功した。テーマは初期HTMLに付与し、bodyへ継承する。
- 両アプリのproduction CSSに共通寸法と各テーマの定義が含まれることを確認。check・test・buildは指定環境で成功。
- exportsとsideEffects、部品のCSS Modules型宣言を確認した。全画面の移行完了を示す確認ではない。

## T03 完了確認

- `pnpm check:design`で全CSSのStylelint、トークン、CSS Modulesのlayer・値・クラス参照・型宣言一致が成功。`pnpm test:design`で不正CSS、未知プロパティ、欠落クラス、不正トークン等が検出されることを確認。
- 開発専用の部品一覧を両テーマ・320/390pxで起動し、axe検査を実行した。記録はevidence/verification/のcatalog画像とaxe.json。各テーマ3要素の旧部品のコントラスト指摘は、T04/T05で解消する。検証基盤の完了を、部品の品質検証完了とは区別する。
- 認証待機・認証失敗・API待機・取得失敗・更新失敗をfixturesで指定できる。利用方法はREADMEを参照。

## T04 完了確認

- Button・入力・選択・Label・Card・Segment・FieldをCSS Modules化。クラス結合をclsxへ変更。
- 型検査、CSS規約・クラス参照検査、検証基盤の7テストが成功。基本部品を対象にしたaxe検査は両テーマ・320/390pxで指摘なし。
- 同じ4条件で、loadingボタンの無効化、loadingリンクの遷移抑止、Fieldの関連付け、Segmentのマウス・キーボード選択、Button各サイズ44px以上、hover色、focusの輪郭を確認。evidence/t04/に画面と全体のaxe結果を保存した。
- 検査中にリセットlayerによる背景の上書きを発見し、共通CSSを先に読む順序へ修正して再検査済み。部品以外の旧状態表示の指摘はT05の対象として残る。

## T05 完了確認

- 共有UIの通知・Loading/ErrorState/EmptyState・PageLayout・LogListControls・StoreList/StoreHistoryをCSS Modules化。店舗モーダルをBase UI Dialogへ移し、背景の操作制限・スクロール固定・フォーカス管理を共通化した。
- 両テーマ×320/390pxで店舗の並び替え・検索・検索なしへの復帰、絞り込み・ソート、モーダル内のTab移動・Escape終了・フォーカス復帰、通知のフォーカス時の操作名とEnter終了を確認。通知のaria-hiddenはBase UIの未展開・未フォーカス時の仕様で、フォーカス時に操作名が公開されることを確認した。
- 部品一覧全体、モーダル、通知のaxe検査は指摘なし。reduced-motionでLoadingのアニメーションが停止し、ラベルが残ることを確認。evidence/t05/に記録。実機の読み上げ監査はT13で別途行う。
- 目視で発見した実アプリのlayer順序の問題を修正。両main.tsxでCSSを最初に読み、モーダルの実際の余白が16px以上あることも検査した。
- CSS規約・型検査・検証テスト・既存テスト・両アプリのビルドが成功。

## T06 完了確認

- AppShell・BottomNavigation・ConsentNotice・SessionStateを共有し、両Appの外枠を置換。ルートとナビ項目、ページ計測の呼び出し、同意の保存処理、マスク属性を保持した。
- 両テーマ×320/390pxで現在位置1件、ナビ全リンク44px以上、フォーム最終保存ボタンがナビより上に表示されることを確認。CDPで上30px・下34pxのセーフエリアを設定し、ナビ高さ106pxと下余白を確認。HTMLにviewport-fit=coverを付与した。
- 実装した同意の許可・拒否をクリックし、再読み込み後の保存値を確認。認証待機、初期化失敗、期限切れ時の再ログイン呼び出しもfixtureで確認。外部通信は遮断した。evidence/t06/に28件の結果と画面を保存。
- 型・CSS規約検査、既存テスト、両アプリのビルドが成功。LINE実機の確認はT13に残る。

## T07 完了確認

- Brewlogの豆・記録の作成/編集、BeanFields・BeanStoreFields・BrewLogFieldsとSliderを移行。単一入力にField、動的な注ぎの選択欄に一意のidとラベルを適用し、グループの名前も整えた。
- 320/390pxで4ルートの作成・編集を操作。保存中の連打防止、作成/編集とも保存失敗後の入力保持、再保存の成功、通知と遷移、版追加時の変更禁止と日付同期、取得失敗後の再試行を確認した。
- Sliderはキーボードとポインター操作、目盛りとラベルの中心差1.5px以内、可視ラベルの重なりなしを確認。動的な注ぎと評価、温度も操作した。フォームのaxe検査は指摘なし。
- 目視で見つけた増減ボタンの横幅不足と狭い画面のラベルのずれを修正。44pxの反応領域、横はみ出しなし、保存ボタンがナビに重ならず操作できることを検査した。スクロール余白も共通化した。evidence/t07/に結果と画面を保存。
- CSS・型検査、検証基盤のテスト、既存のフォーム値・版管理を含むテスト、両アプリのビルドが成功。

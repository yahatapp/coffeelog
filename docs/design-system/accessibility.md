# 表示・操作の検証

## 品質基準

- 通常文字のコントラストは4.5:1以上を確認する。入力境界と状態を伝える非テキスト要素は3:1を基準にする。
- 前景と背景を組で確認し、透過色は背景との合成結果で判断する。
- 主要操作は44px以上の反応領域を確保する。アイコンの大きさと反応領域を分けて測る。
- キーボードで到達・操作でき、フォーカスが見え、固定ナビや通知で操作不能にならないことを確認する。
- 色だけで状態を伝えない。ラベル、選択状態、エラーと説明の関連付けも確認する。

## 自動検証

| コマンド       | 検査する内容                                                                            |
| -------------- | --------------------------------------------------------------------------------------- |
| `pnpm check`   | 型・lint、全CSS、トークン契約、クラスと型宣言、旧トークン・Tailwindクラス、ガイドと実例 |
| `pnpm test`    | 既存処理と検証器の失敗検出                                                              |
| `pnpm test:ui` | 両テーマ・320/390px、全ルートと主要フロー、axe、キーボード、保存状態、通知・Dialog      |
| `pnpm build`   | 両アプリのproduction成果物                                                              |

- 日時、認証、API、外部画像はfixtureで固定する。ブラウザーは依存に対応するPlaywrightのChromiumを使う。
- 検証環境のlocaleはja-JP、タイムゾーンはAsia/Tokyoに固定する。
- Safari系の入力部品を確認する場合は、`pnpm --filter brewlog exec playwright install webkit`を一度実行し、次のコマンドで両テーマの基本画面・部品一覧とCafelogの記録入力欄の高さを検証する。全操作を対象とする標準のChromium検証も実行する。

  ```sh
  UI_BROWSER=webkit UI_CATALOG=1 UI_OUTPUT=test-results/ui-webkit node scripts/ui/baseline.mjs
  ```

- 保存失敗や取得失敗を意図的に起こすケースのconsole.errorと、未処理のブラウザー例外を区別する。未処理例外は検証を失敗させる。
- axeだけでは、文章の意味や全操作の使いやすさを判定できない。画像と実操作も確認する。

## 画面の確認と基準画像の更新

1. `pnpm test:ui`を実行し、機能・CSS・アクセシビリティ検査の成功を確認する。
2. `test-results/ui/comparison.html`で差を確認し、意図した変更と理由をPRに記す。
3. 両テーマの狭い画面、日本語の長文、拡大、reduced-motion、フォーカス、セーフエリアを確認する。
4. 合意した変更のPNGとenvironment.jsonを`docs/design-system/evidence/reference/`へ反映する。
5. [変更記録](changelog.md)と必要なガイドを更新する。

- 画像の差はレビュー用の資料として扱う。OSとフォントが異なる環境の画像を、一律のピクセル一致で合否判定しない。
- 2026年11月1日の依頼により、今回の移行ではLINE内ブラウザーとスクリーンリーダーの実機確認を完了条件から外した。
- キーボード、アクセシビリティツリーのラベルと状態、320px幅、拡大、reduced-motion、セーフエリアの検証は継続する。

## ケースの追加と失敗の調査

- [Brewlog](../../scripts/ui/brew-fixtures.mjs)と[Cafelog](../../scripts/ui/cafe-fixtures.mjs)にデータを追加し、対応するforms/pages検証で状態と操作を確認する。
- 取得待機・取得失敗・空データ、保存待機・保存失敗・成功を区別する。
- 調査時は`UI_APP=brewlog UI_WIDTH=320 pnpm test:ui`のように対象を絞れる。CIと最終確認は両アプリ・両画面幅で実行する。
- 失敗時のJSON、画像、trace.zipは`test-results/ui/`に残る。比較HTMLとともにCIの成果物へ保存する。

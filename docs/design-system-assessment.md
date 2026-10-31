# デザイントークンとUI開発環境の改善計画

**BrewlogとCafelogのUIを標準CSS変数とCSS Modulesに統一し、Tailwindを削除する。** 両アプリの全画面と共通UIを一括で移行する。トークンの値はCSS、使い方と判断基準はMarkdownで管理し、CIと画面確認で検証する。

この文書は、UIを実装する人とAIが参照する改善計画である。実装方式と一括移行の方針は採用済みで、コードの移行は未実施である。

実装タスクの依存関係、対象ファイル、完了チェック項目は[実装計画](design-system-implementation-plan.md)にまとめる。

更新日：2026年10月31日。現状調査の実装コード：`f2632755554f5a8f640c740f00bbbfbba943fcb6`。

## 1. 現状と改善する箇所

共通UIパッケージ `@yahatapp/ui` には、用途に基づく10色のトークンがある。両アプリが `--app-color-*` に値を渡し、共通UIがTailwindのクラスで参照している。一方、ページやアプリ固有の部品には `coffee-*`・`cafe-*` の色クラスが多く残っている。

| 領域 | 現状 | 改善する内容 |
| --- | --- | --- |
| 色とテーマ | [共通トークン](../packages/ui/src/styles/tokens.css)と、[Brewlog](../apps/brewlog/src/index.css)・[Cafelog](../apps/cafelog/src/index.css)のCSSに色を定義。同じ色値を `@theme` と `:root` に重複して記述 | 共通パッケージに両テーマを集約し、補助文字・背景・入力境界・通知・操作状態の役割を分ける |
| 共通部品 | Button・Input等は共通化済み。[BrewlogのButton](../apps/brewlog/src/components/ui/button.tsx)等はその再公開。ページ側には独自のボタンや装飾が残る | 再公開だけのファイルは重複実装と区別し、独自の表示を共通部品とCSS Modulesへ移す |
| 文字・寸法 | 文字サイズ、余白、角丸、高さをクラスで個別に指定 | 本文・ラベル・補助文字の尺度と、部品・画面の寸法を定義する |
| 状態 | [Button](../packages/ui/src/components/button.tsx)はvariant・size・focus・disabledに対応。[Input](../packages/ui/src/components/input.tsx)のinvalid・read-onlyや、Buttonのloadingは共通の表現が未整備 | 各部品に必要な状態と、その見た目・操作を定義する |
| 入力と非同期処理 | [CafeLogForm](../apps/cafelog/src/components/CafeLogForm.tsx)のエラー関連付けは欄ごとの差がある。店舗画面は共通のLoading・ErrorState・EmptyStateを使用 | Label・説明・入力・エラーを結ぶFieldを整備し、保存・取得・空の一覧の表示を共通化する |
| ナビゲーション | 両アプリのApp.tsxで固定ナビと本文の下余白を指定 | ナビの高さ、セーフエリア、本文の下余白を揃え、フォーカスや操作が隠れないようにする |
| ガイド | [BrewlogのAGENTS.md](../apps/brewlog/AGENTS.md)はMaterial 3とTailwind・Base UIの利用を指示 | 共通ガイドへの参照を整え、Tailwindを使う指示をCSS Modulesへ変更する |
| 検証 | [CI](../.github/workflows/ci.yml)はcheck・test・build等を実行。[共通UIのcheck/build](../packages/ui/package.json)は型検査のみ。Playwrightの依存はあるが画面テストやStorybookは未整備 | CSS、トークン、部品の状態、画面の操作を検証対象に加える |

`src` 以下のTSXを静的に数えると、ブランド名を含む色クラスは次のとおりである。記述数は実行時の使用数や不具合数を表さない。色の置換では、ブランド装飾・文字・状態表示を用途ごとに判断する。

| 対象 | TSXファイル数 | 色クラスの記述数 | 該当ファイル数 |
| --- | ---: | ---: | ---: |
| 共通UI | 13 | 0 | 0 |
| Brewlog | 31 | 478 | 21 |
| Cafelog | 19 | 309 | 14 |

### 補助文字とsecondaryボタンの配色を直す

現在の `--app-color-muted` はsecondaryと同じ色で、補助文字やplaceholderにも使われている。CSS値から計算したコントラスト比は次のとおりである。

| 前景／背景 | Brewlog | Cafelog |
| --- | ---: | ---: |
| primary／白 | 7.44:1 | 9.25:1 |
| secondary／白 | 3.75:1 | 3.16:1 |
| muted／アプリ背景 | 3.56:1 | 3.00:1 |

secondary／白とmuted／背景は、通常文字に必要な4.5:1を下回る。補助文字と薄い背景のトークンを分け、secondaryボタンは文字色と背景色を一組で見直す。[WCAG 2.2・1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum)

計算は不透明なsRGB値に基づき、小数第2位で丸めた。透明度、hover、重なり、実際の文字サイズや太さは含めていない。移行後は状態ごとの描画結果も確認する。

## 2. ファイルの配置と責務

トークンと両テーマは `packages/ui` に置く。部品のCSSはTSXの隣、ページ固有の配置はページ側に置く。以下は移行後の配置案であり、未作成のファイルを含む。

```text
packages/ui/src/
  styles/
    index.css                共通CSSの入口とlayerの順序
    reset.css                ブラウザー既定値の調整
    base.css                 文書全体の文字・背景・要素の設定
    tokens/
      primitives.css         共通の基本値
      semantic.css           共通の寸法・文字・モーションの役割
      contract.json          公開トークンの名前・型・必須条件
    themes/
      brewlog.css            ブランド基本値と用途別の色
      cafelog.css            同上
  components/
    button.tsx
    button.module.css        Buttonのvariant・size・状態
apps/{brewlog,cafelog}/src/
  index.css                  共通CSSと自分のテーマを読み込む
  pages/*.module.css         ページ固有の配置
docs/design-system/
  README.md                  共通方針、読む順序、変更方法
  tokens.md                  名前の意味、使用条件、定義へのリンク
  components.md              部品の選び方、API・状態・実例へのリンク
  patterns.md                入力、保存、一覧、通知、ナビゲーション
  accessibility.md           品質基準と確認手順
  exceptions.md              例外の対象、理由、許可条件
  changelog.md               トークンとAPIの変更記録
```

`@yahatapp/ui/styles.css` は共通CSSの入口へ変更し、テーマもpackage.jsonのexportsから公開する。sideEffectsは現在のtokens.cssだけでなく、新しいCSS全体に合わせる。両アプリのproduction buildで必要なCSSが出力されることを確認する。

## 3. トークンの定義とテーマの選択

依存関係は「基本値 → 用途を表す公開トークン → 部品のスタイル」とする。部品とページは公開トークンを参照し、ブランドの基本値を直接使わない。

| 種類 | 定義・命名例 | 利用範囲 |
| --- | --- | --- |
| 基本値 | ブランド色、neutralの色、余白尺度、角丸、時間。`--cl-ref-brand-*`、`--cl-ref-space-*` | トークン定義とテーマの内部 |
| 公開トークン | 本文、補助文字、面、操作、入力境界、通知、フォーカス。`--cl-color-text-muted`、`--cl-space-page-inline` | 共通部品、ページ、アプリ全体のCSS |
| 部品専用 | Buttonの高さやCardの余白等。公開が必要なら `--cl-button-size-default` 等 | CSS Module内を基本とし、拡張APIとして必要なものだけ公開 |
| 部品内の一時変数 | `--_button-background` 等 | そのCSS Module内で使う。命名だけで言語上の非公開が保証されるわけではない |

共通の寸法・文字・モーションはsemantic.css、用途別の色は各テーマに定義する。両テーマは同じ公開名を使い、値を変える。現在のmutedは補助文字と薄い背景に分け、borderも装飾境界と入力境界に分ける。旧名と全参照を一括で置き換える。

トークンの値はCSSだけに置く。contract.jsonには公開名・型・必須条件を定め、検証に使う。TypeScriptはvariant等のAPI定義、Markdownは使い方と判断理由を担当する。同じ色値や寸法を複数の形式で手書きしない。

### テーマはhtmlで選び、Portalにも適用する

各アプリのhtmlに `data-app-theme="brewlog"` または `"cafelog"` を指定する。共通CSSと自分のテーマを読み込み、初期描画からテーマを適用する。部品一覧では両テーマを読み込んで比較する。

ブランド基本値と、それを参照する用途別の色は同じテーマ要素で定義する。次は既存primaryの色を使った関係の例である。

```css
/* themes/brewlog.css */
@layer tokens {
  [data-app-theme="brewlog"] {
    --cl-ref-brand-primary: #6f4e37;
    --cl-color-action-primary: var(--cl-ref-brand-primary);
  }
}
```

CSS変数は定義した要素で参照先を解決してから、DOMの子孫へ継承される。`:root` に用途別の色を定義し、子要素でブランド基本値だけを変える構成は避ける。[CSS Custom Properties](https://www.w3.org/TR/css-variables-1/#using-variables)

現在の通知はBase UIのToast.Portalを使い、既定ではbodyへ描画される。テーマを `#root` だけに付けると継承範囲から外れるため、通常のアプリではhtmlに置く。同じページで2テーマを比較するときは、各プレビュー内にPortalの配置先を用意する。React ContextとCSS変数の継承先は区別する。[Base UI Toast.Portal](https://base-ui.com/react/components/toast#portal)、[React createPortal](https://react.dev/reference/react-dom/createPortal)

### トークン以外の値を使う条件

文字・余白はrem、細い境界はpx、画面への追従は割合・dvh等、用途に応じて単位を選ぶ。本文サイズ、入力の高さ、カード余白、画面幅、ナビの高さ、重なり順、動きの時間を共通で管理する。

| 値・条件 | 扱い |
| --- | --- |
| `0`、`100%`、`auto`、`currentColor`、`transparent` | 構造や継承を表す指定として許可する |
| メディア・コンテナクエリーの条件 | 固定条件を揃え、変更時は全参照を更新する。必要なら共通定義からビルド時に生成する |
| `env(safe-area-inset-bottom)` | ナビの高さや余白トークンと `calc()` 等で組み合わせる |
| Sliderの位置、画像の比率 | データから計算し、型を付けたstyleや局所CSS変数で渡す |
| Base UIが公開する幅・位置のCSS変数 | 各部品のAPIに従って使い、自社トークンと区別する |

`var()` はメディアクエリーの条件には使えない。`@media (min-width: var(--cl-breakpoint-wide))` は採用しない。[CSS変数の使用範囲](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties)

必須トークンの定義漏れは検証で検出する。fallbackは、任意の拡張APIとして明示した値に絞る。

## 4. CSS Modulesの実装規約

通常のスタイルは `className` で適用し、データから計算する値だけstyleに渡す。部品とページの `.module.css` を使い分ける。[React](https://react.dev/reference/react-dom/components/common#applying-css-styles)、[Vite CSS Modules](https://vite.dev/guide/features.html#css-modules)

- 部品内のセレクターは `.root` 等の局所クラスを起点にする。要素名だけの `button { ... }` や、`:global` による意図しない全体への適用を避ける。
- variantとsizeは型付きpropsで公開し、対応するクラスを部品内で選ぶ。外側の配置はラッパーで扱い、再利用する見た目の違いは正式なvariantにする。
- ページから共通部品の内部DOMを指定するセレクターを作らない。classNameを公開する場合も、背景色や内部余白を呼び出し側で毎回上書きする運用にしない。
- Base UIの状態は、公開されたdata属性とCSS変数で装飾する。disabled・invalid・busy等の意味を持つ属性と、見た目を選ぶ独自のdata属性を使い分ける。[Base UI Styling](https://base-ui.com/react/handbook/styling)
- 各部品に必要なhover・active・focus・disabled・loading・invalid・read-only等を定義する。単純な入力や選択は意味の正しいHTMLを使い、複雑な対話には既存のBase UIを使う。
- CSS importの型宣言を共通UIにも用意する。クラス名の型生成か参照検査を加え、存在しないクラス名を検出する。

### 読み込み順とlayer

アプリの入口で共通CSSとテーマを一度読み込み、各部品は自分のCSS Moduleを読み込む。共通のトークンやリセットを部品ごとにimportしない。

```css
/* packages/ui/src/styles/index.css */
@layer reset, tokens, base, components, pages;

@import "./reset.css" layer(reset);
@import "./tokens/primitives.css" layer(tokens);
@import "./tokens/semantic.css" layer(tokens);
@import "./base.css" layer(base);
```

上の4ファイルは、内部を同名のlayerで再度包まない。テーマは `@layer tokens`、部品は `@layer components`、ページは `@layer pages` に置く。遅延読み込みするページや部品一覧でも、入口のlayer宣言を先に読み込む。

通常宣言ではlayer外のルールがlayer内より優先されるため、部品とページのCSSは指定のlayerに置く。同じlayer内では詳細度とソース順序が作用する。`!important` はlayer間の優先を逆転させるため、通常の上書き手段にしない。[CSS Cascade Level 5](https://www.w3.org/TR/css-cascade-5/#layer-order)

## 5. Tailwindの機能と依存を置き換える

| 現在の記述・依存 | 置換先・変更内容 |
| --- | --- |
| レイアウト・余白・幅・レスポンシブのクラス | 部品とページのCSS Modules。繰り返す配置は共通レイアウト部品へまとめる |
| 色・文字・角丸等のクラスと `@theme` | 公開トークンを参照する標準CSS |
| Preflight | reset.cssでbox-sizing・既定の余白・境界・画像・フォーム等を調整し、base.cssで文字と背景を設定 |
| `animate-*`、`tailwindcss-animate` | 必要なkeyframesとtransition。`prefers-reduced-motion` では状態の表示を残し、移動・拡大縮小・点滅を抑える |
| `focus-visible:*`、`data-*:*`、`has-*:*` | 疑似クラス、属性セレクター、必要な箇所の `:has()` |
| `twMerge(clsx(...))` | twMergeを外し、結合だけなら既存のclsxを使う |
| `@source`・`@plugin`・Tailwindのimport | 共通CSSとテーマの通常のimportへ変更 |
| 両アプリの `tailwindcss()` Viteプラグイン | importとプラグイン登録を削除 |
| package.json、pnpmのcatalog・peer設定 | Tailwind本体・Viteプラグイン・animate・mergeの参照を削除し、ロックファイルを再生成 |
| AGENTS.md | CSS Modulesとトークンを使う指示へ更新 |

Preflightは見出しや境界の既定値も変えるため、削除後に必要な設定をリセットと基本スタイルへ移す。[Tailwind Preflight](https://tailwindcss.com/docs/preflight)

`postcss` と `autoprefixer` は、直接の設定と対象ブラウザーでの必要性を確認して削除を判断する。React・Vite・Base UIは維持する。

## 6. 人とAIが参照するガイド

共通原則は、Brewlogが採用しているMaterial 3の色の役割、状態、操作領域の考え方を基に整える。両ブランドの配色と、落ち着いたモバイル向けLIFFの体験を保つ。Material UIの追加は行わず、既存のHTMLとBase UIで実装する。

AGENTS.mdには共通ガイドへの参照と必須の行動を記す。UIを変えるときは、次の順で確認する。

1. `docs/design-system/README.md` で共通方針とアプリの違いを確認する。
2. 対象となるトークン・部品・画面パターンの使用条件を読む。
3. `packages/ui/src/index.ts` の公開API、部品の型定義、実装、利用例を確認する。
4. 共通部品を組み合わせ、足りない役割はトークンや部品に追加する。
5. 自動検証と画面確認を行い、変更した仕様や例外をガイドへ反映する。

| ガイド | 記載する内容 |
| --- | --- |
| トークン | 名前の意味、前景と背景の組み合わせ、使用条件、定義へのリンク |
| 部品 | 使う場面、variantとsizeの選び方、必要な状態、キーボード・読み上げ、実行できる例へのリンク |
| 入力・保存 | Label・説明・入力・エラーの関連付け。未保存・保存中・失敗・完了の表示。Button・Input・Field・Noticeを組み合わせた実例 |
| 非同期画面 | 読み込み中・空・取得失敗・成功の表示条件、再試行や次の操作。保存の連打とレイアウトの変動を防ぐ方法 |
| 文言 | 「保存」「再試行」の使い分け、失敗から回復する方法、空の一覧で次にできる操作 |
| 変更と例外 | 対象、理由、許可条件、トークンやAPIの変更記録 |

props一覧は型定義へのリンクで参照できるようにする。日本語の文言はCSSトークンに含めず、必要なら型付きの文言定義で管理する。

## 7. 品質基準と完了条件

アクセシビリティの品質目標はWCAG 2.2 AAとする。通常文字は4.5:1を基準に、状態ごとの前景と背景を確認する。主要操作の反応領域は44px以上を目安とし、AAの最小ターゲットサイズ24×24 CSS pxと例外条件を区別する。フォーカスの外観を定める2.4.13はAAAとして扱う。[WCAG 2.2](https://www.w3.org/TR/WCAG22/)、[Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

Checkboxの `h-4 w-4` やButtonのiconサイズ40px角は、ラベルを含む反応領域と周囲の間隔も確認する。フォーカスは見えることに加え、固定ナビ等で完全に隠れないことを確かめる。[Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)

| 検証対象 | 完了条件・方法 |
| --- | --- |
| CSS | 全CSSにStylelintを実行し、構文・命名・layer・未許可の値・深いセレクターを検証する |
| トークン | 公開名・型・必須定義に適合する。両テーマで参照切れや循環がなく、部品から基本値を直接参照していない |
| 色とテーマ | 透明度の合成と操作状態を含めてコントラストを確認する。Portalを含む両テーマの表示が正しい |
| 型とクラス | 共通UIの型検査と、CSS Modulesのクラス名の参照検査が通る |
| 部品の状態 | Storybook等で両テーマと必要な状態を確認でき、アクセシビリティ検査が通る |
| 画面と操作 | 全ルートの描画を比較し、作成・編集・空・取得失敗・保存中・保存失敗・通知を検証する。LIFFとAPIはテスト用の応答を用意する |
| 手動確認 | 幅320pxを含む狭い画面、日本語の折り返し、拡大、キーボード、読み上げ、LINE内ブラウザーとセーフエリアを確認する |
| 置換漏れ | 全対象のCSS・TSX・設定に、Tailwindのクラス・ディレクティブ・不要な依存・旧トークンが残っていない |
| ビルド成果物 | 両アプリのcheck・test・buildが通り、必要なCSSが出力される。リセット削除による差を確認できている |

TSXは既存のOxcで検査し、CSSにはStylelintを追加する。複数ファイルやテーマをまたぐトークンの完全性は専用の検証を用意する。[Stylelint Rules](https://stylelint.io/user-guide/rules/)

画面の自動検証はPlaywrightと `@axe-core/playwright` を候補とする。部品一覧の検査と手動確認も組み合わせる。[Playwright](https://playwright.dev/docs/accessibility-testing)、[Storybook](https://storybook.js.org/docs/writing-tests/accessibility-testing)

ガイドだけを変えた場合もリンクや実例を検証する。Turborepoの設定・コマンドを変更する際は、リポジトリの指示に従ってインストール済みパッケージの同梱ドキュメントを先に読む。

## 8. 一括移行の作業順序

次の作業を一度の移行で完了させる。旧名の別名や旧propsへの互換処理、警告だけで通す移行対象は残さない。

| 順序 | 作業 | 確認する結果 |
| --- | --- | --- |
| 1 | 全画面を棚卸しし、規約・トークン・両テーマ・ガイドを定義する | 全画面の比較対象と、値の管理先が揃う |
| 2 | 基本部品・通知・画面状態・レイアウトをCSS Modulesへ書き換える | 文字色と操作状態を改善し、両テーマの部品一覧で確認できる |
| 3 | 両アプリの全ページと固有部品を置き換える | 全対象が共通部品と新トークンを使用し、ナビとセーフエリアも確認できる |
| 4 | Tailwind関連の依存・設定・指示を削除し、CIを更新する | 置換漏れの検査と型検査が通り、両アプリをビルドできる |
| 5 | 全ルートと主要フローを検証し、両アプリを公開する | 品質基準を満たし、両方の公開結果を確認できる |

テーマ・部品・ガイド・検証は同じ変更で更新し、メンテナーが両アプリへの影響を確認する。変更はGitとchangelogで追跡する。

`packages/` の変更は両アプリのデプロイ対象になる。各アプリの成果物で新旧のコードを混在させず、両方の公開結果を確認する。問題時は対象の成果物を戻せるようにする。[現在のデプロイ方針](../README.md#cicd)

### 今回は含めないもの

ダークテーマ、密度切り替え、DTCGとFigmaの同期、利用者向けAI機能、新しいレイアウト・モーション表現は、別途必要性を判断する。AI向けの参照はリポジトリ内のガイドと実コードで始め、専用MCPや独自スキルは必要になった時点で検討する。

DTCGを導入する場合は、JSONからCSSを生成する方式へ切り替え、値の二重管理を避ける。Figmaとの同期では編集の起点を決める。これらを理由に、今回の既存画面の置換を後回しにしない。

## 根拠と未確認事項

[参照レポート](https://docs.google.com/document/d/1tx8cfut1qxeVLSifI1PaY7x7HGT-UHl3WklgUcZtvto/edit)と、本文にリンクした公式資料を基に計画を整理した。現状の評価はコードの静的確認による。ブランドクラスの集計には、各src以下のTSXに対して正規表現 `\b(?:bg|text|border|ring|shadow)-(?:coffee|cafe)-[\w/-]+` を使った。

実画面、読み上げ、LINE内ブラウザーでの監査は未実施である。Vite+でCSS Modulesへ移行したビルドや出力サイズも未検証のため、実装時に確認する。Figma資産と編集フローは未確認である。

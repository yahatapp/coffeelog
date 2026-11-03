# スタイルの例外

## 現在認めるもの

| 対象                         | 理由と範囲                                                                                                                                      | 定義元                                                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Sliderの目盛り位置           | 値から百分率を計算する。計算した位置だけstyleに渡す                                                                                             | [slider](../../apps/brewlog/src/components/ui/slider.tsx)                                                                                   |
| 絞り込み・ソートの列数       | 選択肢の数からgridの列数を計算する。SortControlsとLogListControlsで共用する                                                                     | [LogListControls](../../packages/ui/src/components/log-list-controls.tsx)                                                                   |
| media・containerの境界       | 幅の境界値をCSS変数で指定できないため、条件に直接記す                                                                                           | [フォーム](../../apps/brewlog/src/components/forms/forms.module.css)、[モーダル](../../packages/ui/src/components/store-history.module.css) |
| SVGの図形と描画寸法          | 図形データとアイコン描画の属性を保持する。部品の反応領域はCSSで決める                                                                           | 各アイコンと[Button](../../packages/ui/src/components/button.module.css)                                                                    |
| reduced-motionの共通ルール   | 通常の部品指定より優先するため、共通base内だけimportantを使う                                                                                   | [base.css](../../packages/ui/src/styles/base.css)                                                                                           |
| ネイティブ入力のブラウザー差 | 日付・数値欄のappearance等を入口で揃える。日付欄のWebKit内部表示とカレンダーボタンの配置を調整し、両テーマ・Chromium/WebKitで中央寄せを確認する | [base.css](../../packages/ui/src/styles/base.css)、[Cafelog入口](../../apps/cafelog/src/index.css)                                          |

## 新しい例外の記録

- 目的、対象ファイル、通常のトークン・propsで表せない理由、影響する状態、確認方法をPRとこの文書に記す。
- 例外を追加する変更で検証を更新する。警告だけで通す設定や、広い検査除外を追加しない。
- Base UIが公開する実行時CSS変数を使う場合は、公開APIと用途を明記する。
- 条件がなくなった例外は、実装と検査を通常の規約へ戻して削除する。

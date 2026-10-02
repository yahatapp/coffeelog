# GA4 / Microsoft Clarity の設定

`brewlog` と `cafelog` は別のGA4プロパティとClarityプロジェクトで管理する。各アプリの本番環境に、次の GitHub Environment variables を登録する。IDは公開識別子であり、シークレットではない。

| Environment | Variables |
| --- | --- |
| `production-brewlog` | `VITE_GA4_MEASUREMENT_ID`, `VITE_CLARITY_PROJECT_ID` |
| `production-cafelog` | `VITE_GA4_MEASUREMENT_ID`, `VITE_CLARITY_PROJECT_ID` |

両方の変数が未設定なら計測UIとタグは無効。片方だけ設定しても動作する。タグは本番ビルドで、利用者が「許可する」を選択した後にだけ読み込む。選択はアプリごとに端末の `localStorage` に保存し、設定画面で変更できる。広告ストレージと広告パーソナライズは許可しない。

## GA4

1. 各アプリ用のWebデータストリームを作成し、測定ID（`G-...`）を登録する。
2. データストリームの「拡張計測機能」で「ブラウザの履歴イベントに基づくページの変更」を**オフ**にする。アプリがReact Routerの遷移ごとに `page_view` を手動送信するため、オンのままだと重複計測や実ID付きURLの送信が起こり得る。
3. DebugViewで初回表示と画面遷移につき1回の `page_view` を確認する。`page_location` は `/logs/:id` や `/beans/:id` に正規化され、検索パラメータは含めない。
4. `record_create_success` と `bean_create_success` など、目的に合うイベントをキーイベントに設定する。保存成功イベントはAPI保存の成功を示す。Cafelogの写真アップロード成功までは保証しない。
5. 運営者自身の本番利用を集計から除く場合は、GA4の内部トラフィック定義とデータフィルタを設定する。

送信するカスタムイベントは `app_open`、`record_create_start`、`record_create_success`、`record_create_error`、`record_update_success`、`record_update_error`、`bean_create_success`、`photo_add`、`filter_change`、`sort_change`、`external_link_click`。イベント値として入力内容、記録ID、LINE IDは送らない。

## Clarity

1. 各アプリ用のプロジェクトを作成し、プロジェクトIDを登録する。
2. プロジェクトの Settings → Masking を **Strict** に設定する。アプリ側にも `data-clarity-mask` をルート要素に付与している。録画で本文・画像・プロフィールが伏せられていることを公開前に確認する。
3. Settings → Setup で既定のCookie利用をオフにし、同意モードを利用する。アプリは許可後に Consent V2 API で分析ストレージを `granted`、広告ストレージを `denied` と通知する。
4. 実際のLINE内ブラウザで、拒否時に `googletagmanager.com/gtag/js` と `clarity.ms/tag` が読み込まれず、許可後にのみ送信されることを確認する。
5. 運営者の固定IPを除外できる場合は、ClarityのIP除外設定を使う。

注意: ClarityはSPAの現在URLやクリック先URLを収集する。`data-clarity-mask` はDOM内容の保護であり、URLのパス中の記録IDまでは伏せない。Clarity側でURLパラメータのマスキングを依頼しても、パス中のIDやクリック先URLには適用されない。Clarityの録画を閲覧できる人を絞り、URLに個人情報や秘密を含めない運用を続ける。

プライバシー告知はアプリ内の同意UIに簡潔に記載している。公開前に運営者のプライバシーポリシーにもGA4・Clarityの利用目的、送信先、同意撤回方法を記載する。

# 基本部品の使い方

実装中のガイド。移行全体の進捗は[実施記録](migration-status.md)で確認する。

## ボタン

[Button](../../packages/ui/src/components/button.tsx)のvariantはprimary・secondary・outline・ghost、sizeはsm・md・lg・iconを使う。loadingは処理中を表し、native buttonをdisabledにする。ラベルは処理内容が分かる文言を渡す。asChildを使うリンクでも処理中の遷移を抑止する。iconサイズには操作名を付ける。

色と内部余白を呼び出し側で上書きせず、部品のvariant・sizeを選ぶ。外側の配置はラッパーで扱う。

## 入力とField

[Field](../../packages/ui/src/components/field.tsx)はラベル・説明・エラーと入力欄を関連付ける。render propsから渡される属性を入力へ適用する。データ管理や保存処理はフォーム側で行う。

```tsx
<Field label="店舗名" description="正式名称を入力" error={error} required>
  {(control) => <Input {...control} value={name} onChange={onChange} />}
</Field>
```

[Input](../../packages/ui/src/components/input.tsx)・[Textarea](../../packages/ui/src/components/textarea.tsx)はinvalid・read-only・disabledとfocusの見た目を共通管理する。[Select](../../packages/ui/src/components/select.tsx)はnative selectを使う。Checkboxのラベルは関連付け、反応領域を含めて確認する。

## 選択と情報のまとまり

[Segment](../../packages/ui/src/components/segment.tsx)はnative radioのグループを使う。ariaLabelにグループの用途を渡し、表示ラベルはoptionsで定義する。ラベルのクリックと、ラジオボタンへのキーボード操作で選択できる。

[Card](../../packages/ui/src/components/card.tsx)で情報をまとめる。CardHeader・CardTitle・CardContent・CardFooterを組み合わせる。ページから内部DOMを指定して装飾を上書きしない。

APIの詳細は各ファイルの型定義を参照する。両テーマの状態は開発用部品一覧で確認し、変更時には型・CSS・操作・アクセシビリティの検査を実行する。

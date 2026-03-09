# くまちょんショップ

AIにECサイト制作を任せた結果、盛大に使いにくくなったという設定のエイプリルフール向けサイトです。  
フロントは `index.html` の単一ファイル構成で、受け入れ条件は Cucumber + Playwright で管理します。

## セットアップ

```bash
npm install
```

## 主なコマンド

```bash
npm test
# Cucumber テスト本体を実行する
# feature と step definition を突き合わせて、仕様どおり動くか確認する

npm run test:report
# Cucumber テストを実行し、HTMLレポートを output/report.html に出力する
# テスト結果を画面で見やすく確認したいときに使う

npm run feature-to-csv
# specs/*.feature を CSV に変換する
# feature ごとのシステムテスト観点表を output/ に出力する
```

## Scenario識別子の運用

- spreadsheet と突き合わせる `観点ID` は、`Scenario: [KEY] タイトル` の `KEY` から生成する永続キーとして扱う
- `観点ID` は `{FEATURE_CODE}__{KEY}` 形式で生成する
- 例: `Scenario: [VALID-COUPON] 有効なクーポンを入力する` → `PURCHASE__VALID-COUPON`
- `KEY` は英大文字・数字・ハイフンのみを使う
- `KEY` は featureファイル内で一意にする
- `KEY` は一度使い始めたら原則変更しない
- 表示文言を直したいときは `KEY` ではなくタイトル側だけを変更する

## 人の手で触る場所 / 自動で確認する場所

### 人の手で触る場所

- `specs/*.feature`: 追加したい振る舞いを日本語で定義する
- `tests/steps/*.ts`: feature に書いた振る舞いと画面操作を対応づける
- `index.html`: 画面表示とUI挙動を最小限修正する

### 自動で確認する場所

- `npm test`: feature と step と画面実装が一致しているか確認する
- `npm test`: `specs/*.feature` の `Given / When / Then` と `tests/steps/*.ts` の step definition の対応もここで確認する
- `npm run test:report`: テスト結果をHTMLで確認する
- `npm run feature-to-csv`: feature ごとのシステムテスト観点表を出力する
- `output/*-system-test-viewpoints.csv`: feature ごとに分かれた非エンジニア向けシステムテスト観点表

## BDDでfeatureを進める基本手順

BDDで開発を進めるときは、必ず「仕様を書く -> 失敗を確認する -> 実装する -> 通ることを確認する」の順で進めます。

1.  `specs/*.feature` に追加したい振る舞いを日本語で記述する
2. シナリオを「ユーザーに何が起きるか」を基準に、`Given / When / Then` で整理する
3. 自動確認として `npm test` を実行し、追加したシナリオに対応する step が未定義で失敗することを確認する
4.  `tests/steps/*.ts` に step definition を追加または更新する
5. 自動確認として `npm test` を実行し、step は見つかるが画面実装不足で失敗することを確認する
6.  `index.html` を最小限だけ修正し、feature の期待を満たす
7. 自動確認として再度 `npm test` を実行し、追加したシナリオが通ることを確認する
8. 必要に応じて自動確認として `npm run test:report` を実行し、HTMLレポートで結果を確認する
9. 必要に応じて自動整理として `npm run feature-to-csv` を実行し、feature 一覧とシステムテスト観点表を確認する

## 変更時に保証すること

変更を入れるときは、最低限以下を保証すること。

- `specs/*.feature` は実装方法ではなく、ユーザー視点の振る舞いだけを書く
- 追加・変更した振る舞いに対応する step definition が `tests/steps/*.ts` に存在する
- `index.html` の修正は feature を満たすための最小限にとどめる
- step 追加前に `npm test` で未定義 step として失敗することを確認する
- 実装修正前に `npm test` で step は解決するが期待どおりに動かず失敗することを確認する
- 実装後に `npm test` で追加・変更したシナリオが通ることを確認する
- 必要に応じて `npm run test:report` でレポート確認できる状態にする
- 必要に応じて `npm run feature-to-csv` で仕様一覧とシステムテスト観点表へ変換できる状態を保つ

## 運用ルール

- featureファイルには実装方法ではなく、ユーザー視点の振る舞いを書く
- テストが失敗することを確認する前に実装を始めない
- 実装や修正は、シナリオを満たすための最小限にとどめる
- step definition には、featureに書かれた振る舞いとの対応がわかる形で処理を追加する
- テストが通ったら完了ではなく、必要に応じてレポートでも結果を確認する

## 関連ファイル

- `specs/`: feature ファイル
- `tests/steps/`: step definition
- `tests/support/`: Cucumber / Playwright の共通設定
- `index.html`: 画面本体

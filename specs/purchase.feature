Feature: 購入画面
  くまちょんショップの購入画面の表示と操作

  Background:
    Given ユーザーが商品を選択して購入画面を開いている

  # === 注文内容表示 ===

  Scenario: [ORDER-SUMMARY-DISPLAY] 注文内容が表示される
    Then 選択した商品名が注文内容に表示される
    And 商品の数量が表示される

  # === 価格変動 ===

  Scenario: [PRICE-CHANGES-EVERY-2S] 価格が2秒ごとに変動する
    Then 価格が表示される
    When 2秒待機する
    Then 価格が前回と異なる値になる
    And 「AIが最終確認中のため、価格は2秒ごとに変動します」と表示される

  Scenario: [PRICE-BREAKDOWN-DISPLAY] 小計・送料・AI手数料が表示される
    Then 小計が表示される
    And 送料が表示される
    And AI最適化手数料が表示される
    And 合計が表示される

  # === クーポン ===

  Scenario: [INVALID-COUPON] 無効なクーポンを入力する
    When クーポンコードに「INVALID」と入力する
    And 「適用」ボタンをクリックする
    Then 「無効なクーポンです」というメッセージが表示される

  Scenario: [VALID-COUPON] 有効なクーポンを入力する
    When クーポンコードに「KUMA-FREE-2026」と入力する
    And 「適用」ボタンをクリックする
    Then 「クーポン適用成功！」というメッセージが表示される
    And 商品代金が無料になる
    And 送料が999,999,999円になる
    And 価格の変動が停止する

  Scenario: [EMPTY-COUPON] 空のクーポンで適用する
    When クーポンコードを空のまま「適用」ボタンをクリックする
    Then 「クーポンコードを入力してください！」というアラートが表示される

  # === フォーム入力（AI最適化用） ===

  Scenario: [REQUIRED-FIELDS-DISPLAY] 必須項目が表示される
    Then 血液型の入力欄が表示される
    And 星座の入力欄が表示される
    And 好きな色の入力欄が表示される
    And 今の気分の入力欄が表示される
    And これらは必須項目である

  Scenario: [PHONE-SPLIT-INTO-3] 電話番号が3分割されている
    Then 電話番号の入力欄が市外局番・市内局番・加入者番号に分かれている

  Scenario: [ADDRESS-SPLIT-INTO-6] 住所が6フィールドに分かれている
    Then 住所入力欄が郵便番号・都道府県・市区町村・町名番地・建物名・棟番号に分かれている

  # === 配送日・支払い方法（変更不可） ===

  Scenario: [AI-DELIVERY-DATE-DISPLAY] AIが決めた配送日が表示される
    Then 配送日に「2025年13月47日（土日祝）」と表示される
    And 配送日は変更できない

  Scenario: [AI-PAYMENT-METHOD-DISPLAY] AIが決めた支払い方法が表示される
    Then 支払い方法がAIにより選択されている
    And 支払い方法は変更できない

  # === 同意チェック ===

  Scenario: [CONSENT-CHECKBOXES-DISPLAY] 同意チェックが複数表示される
    Then 同意チェックボックスが6つ表示される
    And 「同意することに同意する」という項目が含まれる

  # === 購入確定ボタン（赤い大きいボタン） ===

  Scenario: [PURCHASE-BUTTON-CANCELS] 購入確定ボタンをクリックするとキャンセルされる
    When 赤い「購入を確定する」ボタンをクリックする
    Then 「ご注文はキャンセルされました」というアラートが表示される
    And ネタバレオーバーレイが表示される

  # === キャンセルボタン（小さい地味なボタン） ===

  Scenario: [DO-NOT-CANCEL-BUTTON-CANCELS] キャンセルしないボタンをクリックするとキャンセルされる
    When 「キャンセルしない」ボタンをクリックする
    Then 「AIが処理をキャンセルしました」というアラートが表示される
    And ネタバレオーバーレイが表示される

  # === ネタバレオーバーレイ ===

  Scenario: [SPOILER-OVERLAY-DISPLAY] ネタバレオーバーレイが表示される
    Given ネタバレオーバーレイが表示されている
    Then カウントダウンが3から始まる
    And 3秒後に外部サイトへリダイレクトされる

  Scenario: [SPOILER-OVERLAY-CLOSE] ネタバレオーバーレイを閉じる
    Given ネタバレオーバーレイが表示されている
    When 「悲しいので今すぐ閉じる」ボタンをクリックする
    Then オーバーレイが閉じる

  # === 商品一覧に戻る ===

  Scenario: [BACK-TO-LIST] 商品一覧に戻る
    When 「商品一覧に戻る」リンクをクリックする
    Then 商品一覧ページに遷移する

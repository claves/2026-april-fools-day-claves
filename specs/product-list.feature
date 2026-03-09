Feature: 商品一覧ページ
  くまちょんショップの商品一覧ページの表示と操作

  Background:
    Given ユーザーがトップページを開いている

  # === 商品表示 ===

  Scenario: [LIST-DISPLAY] 商品一覧が表示される
    Then 6つの商品カードが表示される
    And 各商品カードには商品名、説明、価格が表示される
    And 各商品カードには「くまちょん信頼度」がラーメンアイコンで表示される

  Scenario: [CARD-TILT-RANDOM] 商品カードがランダムに傾いて表示される
    Then 商品カードはそれぞれ異なる角度で傾いている

  Scenario: [SORT-ORDER-RANDOM] 商品の表示順がランダムになる
    When ページをリロードする
    Then 商品の表示順が前回と異なる可能性がある

  # === ソート・表示件数（意図的に機能しない） ===

  Scenario: [SORT-NO-EFFECT] ソート順を変更しても商品順は変わらない
    When ソート順を「運気順」に変更する
    Then 商品の並び順は変わらない

  Scenario: [PAGE-SIZE-NO-EFFECT] 表示件数を変更しても表示数は変わらない
    When 表示件数を「3.5件」に変更する
    Then 表示される商品数は6つのまま

  # === カートに追加 ===

  Scenario: [ADD-TO-CART] 商品をカートに追加する
    When 商品の「カートに追加」ボタンをクリックする
    Then カートドロワーが開く
    And カートに商品が1個追加される
    And ヘッダーのカートアイコンに件数が表示される

  Scenario: [ADD-SAME-ITEM-TWICE] 同じ商品を複数回カートに追加する
    When 同じ商品の「カートに追加」ボタンを2回クリックする
    Then カート内の商品数量が2になる

  # === 今すぐ購入ボタン ===

  Scenario: [BUY-NOW-NAVIGATES] 今すぐ購入ボタンで購入画面に遷移する
    When 商品の「今すぐ購入」ボタンをクリックする
    Then 購入画面に遷移する
    And 選択した商品が注文内容に表示される

  # === カートボタン（消えて移動する） ===

  Scenario: [CART-BUTTON-RELOCATES] カートボタンをクリックすると消えて別の位置に再表示される
    When ヘッダーのカートボタンをクリックする
    Then カートボタンが一度消える
    And カートボタンが画面内の別の位置に再表示される

  Scenario: [CART-BUTTON-LOOPS] カートボタンは一度クリックされると消えて移動を繰り返し続ける
    When ヘッダーのカートボタンをクリックする
    Then カートボタンが複数回消えては別の位置に再表示され続ける
    And カートボタンは約0.5秒表示された後に消える
    And カートボタンは約1秒消えた後に再表示される

  Scenario: [CART-BUTTON-OPENS-WHEN-VISIBLE] 表示されているタイミングでカートボタンをクリックすると開く
    Given カートボタンが消えて移動している状態
    When ヘッダーのカートボタンをクリックする
    Then カートドロワーが開く

  # === カートドロワー ===

  Scenario: [CART-UPDATE-QUANTITY] カートドロワーで数量を変更する
    Given カートに商品が1個入っている
    When カートドロワーの「+」ボタンをクリックする
    Then 商品の数量が2になる

  Scenario: [CART-REMOVE-ITEM] カートドロワーで商品を削除する
    Given カートに商品が入っている
    When 「削除する」ボタンをクリックする
    Then カートから商品が削除される

  Scenario: [CART-CHECKOUT] カートから購入画面へ進む
    Given カートに商品が入っている
    When 「購入手続きへ」ボタンをクリックする
    Then 購入画面に遷移する
    And カート内の全商品が注文内容に表示される

  Scenario: [EMPTY-CART-ALERT] 空のカートで購入手続きへ進もうとする
    Given カートが空の状態
    When 「購入手続きへ」ボタンをクリックする
    Then 「カートが空っぽです」というアラートが表示される

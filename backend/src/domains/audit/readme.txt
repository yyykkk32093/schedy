audit/log と“並列”になるサブドメインの例

「audit＝監査」の中にも関心は色々あるので、将来増やすならこんな分け方が自然。

audit/log
監査ログの生成・保存（今あなたがやってるやつ）

audit/policy
何を・どこまで・どれくらい保存するか（保持期間、マスキング、PIIポリシー）

audit/report
監査レポートの生成・エクスポート（CSV/PDF、期間指定、検索）

audit/retention
ローテーション・削除（リーガルホールド、TTL実装）

audit/anomaly
監査イベントの異常検知（しきい値・ルール・将来的なML）

audit/compliance
監査要件の適合チェック（J-SOX/ISMS対策のチェックリスト化）

まずは audit/log だけ置いて、必要になったら増やすでOK。構造は対称のまま育てられる。
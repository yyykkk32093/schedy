# backend/docs — 設計ドキュメント索引

> ドメインモデルの設計思想・判断根拠をドメインディレクトリ構成に対応させて管理する

## ディレクトリ構成

```
docs/
├── README.md               ← 本ファイル（索引）
├── activity/
│   └── activity-schedule-design.md  ← Activity / Schedule 分離設計
├── outbox/
│   └── outbox-design.md             ← Outbox パターン設計・AuditLog 分離経緯
├── community/               ← （今後追加）
├── auth/                    ← （今後追加）
├── announcement/            ← （今後追加）
├── user/                    ← （今後追加）
└── poll/                    ← （今後追加）
```

## ドキュメント一覧

| ドメイン | ドキュメント                                                         | 概要                                                                                                                 |
| -------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| activity | [Activity / Schedule 分離設計](activity/activity-schedule-design.md) | Activity（テンプレート）と Schedule（実開催）の集約分離の理由、`defaultStartTime/EndTime` の存在意義、画面表示ルール |
| outbox   | [Outbox パターン設計](outbox/outbox-design.md)                       | Outbox の全体像、2 種類の投入フロー、AuditLog を TX 内 INSERT に移行した経緯と判断根拠                               |

## 対応するソースディレクトリ

`backend/src/domains/` 配下のドメインディレクトリと 1:1 で対応させる。

```
backend/src/domains/     →  backend/docs/
├── activity/            →  ├── activity/
├── community/           →  ├── community/
├── auth/                →  ├── auth/
├── announcement/        →  ├── announcement/
├── user/                →  ├── user/
└── poll/                →  └── poll/
```

# バックエンド バリデーション設計方針

> **作成日**: 2026-03-21
> **ステータス**: 確定（段階的導入）

## 概要

本プロジェクトのバックエンドは **2層バリデーション** を採用する。
API 層（プレゼンテーション層）とドメイン層（ValueObject）の両方でバリデーションを行い、それぞれ **目的が異なる防御の重層化** として位置づける。

---

## 1. 2層バリデーションの原則

### 各層の役割

|                      | プレゼンテーション層（API入口）           | ドメイン層（ValueObject）                         |
| -------------------- | ----------------------------------------- | ------------------------------------------------- |
| **守るもの**         | IF（インターフェース）の契約              | ビジネスルール                                    |
| **問い**             | 「このリクエストは構造的に正しいか？」    | 「このデータはビジネス上妥当か？」                |
| **責任者**           | API仕様を定義した人                       | ドメインエキスパート                              |
| **不正データの原因** | クライアントのバグ、悪意あるリクエスト    | ビジネスルール違反                                |
| **エラーレスポンス** | `400 Bad Request`（リクエスト形式エラー） | `400 DomainValidationError`（ビジネスルール違反） |
| **実装手段**         | Zod スキーマ                              | ValueObject の `static create()`                  |

### フロー図

```
[クライアント]
    │
    ▼
┌─────────────────────────────────────┐
│ プレゼンテーション層 (Zod)           │  ← 「型が違う」「フィールドがない」を弾く
│ "この JSON の形は正しい？"           │     → 400 Bad Request
│                                     │
│ チェック内容:                        │
│   - フィールドの存在（必須/任意）    │
│   - 型チェック（string / number等）  │
│   - 形式チェック（email, URL等）     │
│   - 桁数/長さ制限                   │
└─────────────────────────────────────┘
    │ 構造的に正しいデータだけ通過
    ▼
┌─────────────────────────────────────┐
│ UseCase → ValueObject                │  ← 「値がビジネスルールに違反」を弾く
│ "この値はビジネス上妥当？"           │     → 400 DomainValidationError
│                                     │
│ チェック内容:                        │
│   - ビジネスルール（名前1〜50文字）  │
│   - 状態遷移の妥当性                 │
│   - ドメイン固有の制約               │
└─────────────────────────────────────┘
```

---

## 2. 重複は意図的な防御である

桁数やフォーマットなど、API 層と ValueObject で同じ制約値を持つことがある。これは **重複ではなく、目的が異なる防御の重層化** である。

### 例: パスワードの最小桁数

```typescript
// ── API層（Zod）: IF契約として定義 ──
// 「このAPIは6文字以上のstringを受け付ける」という契約書
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'パスワードは6文字以上'),
})

// ── ドメイン層（ValueObject）: ビジネスルールとして定義 ──
// 「パスワードは6文字以上」というビジネスルール（Source of Truth）
export class RawPassword extends ValueObject<string> {
  static create(value: string): RawPassword {
    if (!value || value.length < 6) {
      throw new DomainValidationError('パスワードは6文字以上で入力してください')
    }
    return new RawPassword(value)
  }
}
```

### 変更時の優先順位

**ValueObject が Source of Truth（正）。API スキーマは防御壁。**

ビジネスルール変更時:
1. ValueObject を変更する（例: `min(6)` → `min(8)`）
2. API Zod スキーマも追従させる

---

## 3. サンプルコード: 2層の対比

### 例: コミュニティ作成

```typescript
// ── API層: Zod スキーマ（IF契約） ──
const createCommunitySchema = z.object({
  name: z.string().min(1).max(50),             // 必須、1〜50文字
  description: z.string().max(500).optional(),  // 任意、500文字以内
  communityTypeId: z.string().min(1),           // 必須
  joinMethod: z.enum(['FREE_JOIN', 'APPROVAL', 'INVITATION']),
  isPublic: z.boolean(),
  coverUrl: z.string().url().optional(),        // URL形式チェック
  maxMembers: z.number().int().positive().optional(),
})

// Zod ミドルウェア（Express）
function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'リクエストが不正です',
        errors: result.error.flatten().fieldErrors,
      })
    }
    req.body = result.data  // パース済みデータで上書き
    next()
  }
}

// ルート定義
router.post('/v1/communities',
  authMiddleware,
  validateBody(createCommunitySchema),  // ← IF契約チェック
  communityController.create            // ← UseCase → ValueObject チェック
)
```

```typescript
// ── ドメイン層: ValueObject（ビジネスルール） ──
export class CommunityName extends ValueObject<string> {
  static create(value: string): CommunityName {
    const trimmed = value?.trim()
    if (!trimmed || trimmed.length < 1) {
      throw new DomainValidationError('コミュニティ名は必須です')
    }
    if (trimmed.length > 50) {
      throw new DomainValidationError('コミュニティ名は50文字以内で入力してください')
    }
    return new CommunityName(trimmed)
  }
}
```

### 例: 通知メタデータ（Json? カラムのバリデーション）

```typescript
// ── Zod スキーマ: Json カラムの型安全を補完 ──
const WaitlistPromotedSchema = z.object({
  type: z.literal('WAITLIST_PROMOTED'),
  activityId: z.string(),
  activityName: z.string(),
  scheduleDate: z.string(),
})

const SameDayCancelSchema = z.object({
  type: z.literal('SAME_DAY_CANCEL'),
  activityId: z.string(),
  cancelledByName: z.string(),
  scheduleDate: z.string(),
})

// Discriminated Union（type フィールドで自動判別）
const NotificationMetadataSchema = z.discriminatedUnion('type', [
  WaitlistPromotedSchema,
  SameDayCancelSchema,
  // ... 他の通知タイプ
])

// 書き込み時（UseCase）: Zod でバリデーションしてから DB に保存
const validated = NotificationMetadataSchema.parse(metadata)
await prisma.notification.create({
  data: { ...data, metadata: validated },
})

// 読み出し時（FE）: API レスポンスの unknown な JSON を安全にパース
const result = NotificationMetadataSchema.safeParse(notification.metadata)
if (result.success) {
  // result.data は型付き → switch(result.data.type) で分岐
}
```

---

## 4. ValueObject カバレッジ方針

### 原則: ビジネス上の制約があるフィールドはすべて ValueObject 化する

| カテゴリ | ValueObject 化すべきフィールド例     | バリデーション内容                                                                          |
| -------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| 金額系   | `fee`, `lateCancelFee`               | 0以上の整数                                                                                 |
| URL系    | `coverUrl`, `imageUrl`, `meetingUrl` | URL 形式チェック                                                                            |
| 日付系   | `startDate`                          | ISO 8601 形式 / 有効日付チェック                                                            |
| 容量系   | `maxParticipants`                    | null（上限なし）or 1以上の正の整数（※ `ScheduleCapacity` VO は存在するが UseCase で未使用） |
| ID系     | 中間テーブルの FK                    | 空文字チェック（最低限）                                                                    |

### 現状の課題

- ValueObject が存在するが UseCase で使われていないケース（`ScheduleCapacity` 等）
- Chat ドメインの ValueObject が `static create()` パターンではなくコンストラクタ直接呼び出し（パターン不統一）
- Community の追加属性（`coverUrl`, `activityLocation` 等）に ValueObject がない

---

## 5. 導入ロードマップ

| Phase                                      | スコープ           | 内容                                                                      |
| ------------------------------------------ | ------------------ | ------------------------------------------------------------------------- |
| **wave4 Phase 3**（現在）                  | metadata 限定      | BE に Zod 導入。`NotificationMetadata` の書き込み/読み出しバリデーション  |
| **バックログ: API バリデーション基盤**     | 全エンドポイント   | Zod ミドルウェア `validateBody()` の整備 + 主要エンドポイントへの適用     |
| **バックログ: ValueObject カバレッジ拡充** | 未カバーフィールド | `Fee`, `ImageUrl`, `ScheduleCapacity` 活用等。Chat ドメインのパターン統一 |

---

## 作業ログ
- 2026-03-21: 設計方針ドキュメント作成。2層バリデーション（API層=IF契約 / VO=ビジネスルール）を確定。wave4 Phase 3 で metadata 限定で Zod 導入、全体整備はバックログ化。

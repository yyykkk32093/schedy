# 広告機能 — フロントエンド設計ドキュメント

> **作成日**: 2026-04-12
> **対象**: W5-01 広告機能
> **要件定義**: `projects/00_requirements/202603_06_bugfix-and-refactoring_wave5/W5-01-ads.md`

---

## 1. Google 広告サービス体系

```
┌─────────────────────────────────────────────────┐
│            Google Ad Manager（統合管理）          │
│  広告枠・レポート・収益の一元管理ダッシュボード    │
├────────────────────┬────────────────────────────┤
│   Google AdSense   │      Google AdMob          │
│  Web サイト向け     │  モバイルアプリ向け         │
│  JS タグ埋め込み    │  SDK 組み込み（iOS/Android）│
│  利用料: 無料       │  利用料: 無料              │
│  収益分配: 68%      │  収益分配: 約60%           │
└────────────────────┴────────────────────────────┘
```

### 導入ロードマップ

| フェーズ | プラットフォーム       | SDK                              | 時期           |
| -------- | ---------------------- | -------------------------------- | -------------- |
| Phase 1  | Web（Vite SPA）        | **AdSense**                      | W5-01          |
| Phase 2  | LIFF WebView           | AdSense（制約付き）or 広告非表示 | LIFF統合時     |
| Phase 3  | iOS/Android ネイティブ | **AdMob** + WebView API for Ads  | ネイティブ化時 |

---

## 2. AdSense 導入方法（Web SPA）

### 2.1 AdSense アカウント・サイト登録

1. [Google AdSense](https://www.google.com/adsense/) でアカウント作成
2. サイト URL を登録（本番ドメイン）
3. 審査通過後、パブリッシャー ID（`ca-pub-XXXXXXX`）が発行される
4. 審査には **通常1〜2週間**、コンテンツが十分にあること（空サイトは通過しない）

### 2.2 スクリプト埋め込み

```html
<!-- index.html の <head> に追加 -->
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXX"
  crossorigin="anonymous"
></script>
```

### 2.3 広告ユニット作成

AdSense 管理画面で広告ユニットを作成し、`data-ad-slot` ID を取得。
各配置箇所ごとに別ユニットを作成すると、**配置別の収益レポート**が取得できる。

---

## 3. アーキテクチャ — 広告配置の集中管理パターン

### 3.1 課題

15箇所の広告配置を個別コンポーネントにハードコードすると：
- 配置変更（追加・削除・移動）のたびに各画面を修正する必要がある
- 表示条件（プラン、件数閾値）の変更が散在する
- テストが困難

### 3.2 設計: Ad Slot Registry パターン

**広告配置をデータ（設定）として一元管理**し、コンポーネントは設定を参照するだけにする。

```
┌──────────────────────────────────────────────────┐
│              adConfig.ts（Ad Slot Registry）       │
│  全広告スロットの定義: 位置ID・タイプ・条件・設定   │
└────────────┬─────────────────────────────────────┘
             │ import
             ▼
┌──────────────────────────────────────────────────┐
│          useAd(slotId) / useAdFeed(slotId)       │
│  Hook: プラン判定 + 条件評価 + AdSense 呼び出し    │
└────────────┬─────────────────────────────────────┘
             │ render
             ▼
┌──────────────────────────────────────────────────┐
│     <AdBanner slotId="..." />                     │
│     <AdFeedItem slotId="..." />                   │
│  UI コンポーネント: 広告枠のレンダリング           │
└──────────────────────────────────────────────────┘
```

### 3.3 adConfig.ts — 広告スロット定義

```typescript
// frontend/src/features/ads/adConfig.ts

export type AdSlotType = 'fixed' | 'feed';

export interface AdSlotConfig {
  /** 広告スロット一意ID（AdSense の data-ad-slot に対応） */
  slotId: string;
  /** AdSense 広告ユニット ID */
  adUnitId: string;
  /** 表示タイプ */
  type: AdSlotType;
  /** フィード内広告の場合: N件に1つ */
  feedInterval?: number;
  /** フィード内広告の場合: 最低何件あれば表示するか */
  feedMinItems?: number;
  /** 広告フォーマット */
  format: 'responsive' | 'fixed';
  /** 固定サイズの場合の幅x高さ */
  size?: { width: number; height: number };
  /** 上マージン（px） */
  marginTop: number;
  /** 有効/無効（環境変数でグローバル制御も可能） */
  enabled: boolean;
}

/**
 * 全広告スロットの定義
 * ここを変更するだけで全画面の広告配置が変わる
 */
export const AD_SLOTS: Record<string, AdSlotConfig> = {
  // ─── お知らせタブ ───
  'announcement-feed': {
    slotId: 'announcement-feed',
    adUnitId: 'XXXXXX',  // AdSense 管理画面で取得
    type: 'feed',
    feedInterval: 4,
    feedMinItems: 4,
    format: 'responsive',
    marginTop: 24,
    enabled: true,
  },
  'announcement-filter-below': {
    slotId: 'announcement-filter-below',
    adUnitId: 'XXXXXX',
    type: 'fixed',
    format: 'responsive',
    marginTop: 24,
    enabled: true,
  },

  // ─── コミュニティ一覧 ───
  'community-list-bookmark-below': {
    slotId: 'community-list-bookmark-below',
    adUnitId: 'XXXXXX',
    type: 'fixed',
    format: 'responsive',
    marginTop: 24,
    enabled: true,
  },

  // ─── コミュニティ検索 ───
  'community-search-below': {
    slotId: 'community-search-below',
    adUnitId: 'XXXXXX',
    type: 'fixed',
    format: 'responsive',
    marginTop: 24,
    enabled: true,
  },

  // ... 以下同様に全15スロットを定義
  // [5] community-search-detail-below
  // [6] community-join-below
  // [7] community-create-step-below
  // [8] community-detail-below
  // [9] activity-timeline-feed
  // [10] activity-timeline-past-below
  // [11] activity-calendar-feed
  // [12] activity-calendar-below
  // [13] chat-list-search-below
  // [14] activity-detail-participants-below
  // [15] notification-feed
};
```

### 3.4 useAd Hook — プラン判定 + 条件評価

```typescript
// frontend/src/features/ads/useAd.ts

import { AD_SLOTS, AdSlotConfig } from './adConfig';
import { useAuth } from '@/shared/hooks/useAuth';

export function useAd(slotId: string): {
  config: AdSlotConfig | null;
  shouldShow: boolean;
} {
  const { user } = useAuth();
  const config = AD_SLOTS[slotId] ?? null;

  // グローバル無効化（環境変数）
  const globalEnabled = import.meta.env.VITE_ADS_ENABLED !== 'false';

  // プラン判定: FREE のみ広告表示
  const isFreeUser = user?.plan === 'FREE';

  const shouldShow = !!(
    config?.enabled &&
    globalEnabled &&
    isFreeUser
  );

  return { config, shouldShow };
}

/**
 * フィード内広告用: アイテムリストに広告を挿入した新しいリストを返す
 */
export function useAdFeed<T>(
  slotId: string,
  items: T[]
): (T | { _isAd: true; slotId: string })[] {
  const { config, shouldShow } = useAd(slotId);

  if (!shouldShow || !config || config.type !== 'feed') {
    return items;
  }

  const interval = config.feedInterval ?? 4;
  const minItems = config.feedMinItems ?? interval;

  if (items.length < minItems) return items;

  const result: (T | { _isAd: true; slotId: string })[] = [];
  items.forEach((item, i) => {
    result.push(item);
    if ((i + 1) % interval === 0) {
      result.push({ _isAd: true, slotId });
    }
  });

  return result;
}
```

### 3.5 AdBanner コンポーネント — 固定位置広告

```tsx
// frontend/src/features/ads/components/AdBanner.tsx

import { useAd } from '../useAd';
import { useEffect, useRef } from 'react';

interface Props {
  slotId: string;
  className?: string;
}

export function AdBanner({ slotId, className }: Props) {
  const { config, shouldShow } = useAd(slotId);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shouldShow || !config) return;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 広告ロード失敗 → 何もしない（高さ0にcollapse）
    }
  }, [shouldShow, config]);

  if (!shouldShow || !config) return null;

  return (
    <div
      ref={adRef}
      className={className}
      style={{ marginTop: config.marginTop }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT_ID}
        data-ad-slot={config.adUnitId}
        data-ad-format={config.format === 'responsive' ? 'auto' : undefined}
        data-full-width-responsive={config.format === 'responsive' ? 'true' : undefined}
      />
    </div>
  );
}
```

### 3.6 各画面での使い方

```tsx
// 固定位置広告（例: コミュニティ一覧のブックマーク下）
import { AdBanner } from '@/features/ads/components/AdBanner';

function CommunityListPage() {
  return (
    <div>
      <BookmarkButton />
      <AdBanner slotId="community-list-bookmark-below" />
      <CommunityList />
    </div>
  );
}

// フィード内広告（例: お知らせタブ）
import { useAdFeed } from '@/features/ads/useAd';
import { AdBanner } from '@/features/ads/components/AdBanner';

function AnnouncementFeed({ items }) {
  const feedItems = useAdFeed('announcement-feed', items);

  return (
    <div>
      {feedItems.map((item, i) =>
        '_isAd' in item
          ? <AdBanner key={`ad-${i}`} slotId={item.slotId} />
          : <AnnouncementCard key={item.id} data={item} />
      )}
    </div>
  );
}
```

### 3.7 このパターンのメリット

| 変更したい内容            | 修正箇所                            |
| ------------------------- | ----------------------------------- |
| 広告の追加・削除          | `adConfig.ts` のみ                  |
| 表示間隔の変更（4件→5件） | `adConfig.ts` の `feedInterval`     |
| 特定広告の無効化          | `adConfig.ts` の `enabled: false`   |
| 全広告の一括無効化        | 環境変数 `VITE_ADS_ENABLED=false`   |
| プラン境界の変更          | `useAd.ts` の判定ロジック1箇所      |
| マージンの調整            | `adConfig.ts` の `marginTop`        |
| AdSense → 他サービス移行  | `AdBanner.tsx` のみ（設定層は不変） |

---

## 4. Cookie Consent 実装方針

### 4.1 Google Consent Mode v2

AdSense と連携するため、Google 推奨の **Consent Mode v2** を使う。

```html
<!-- index.html: AdSense より前に配置 -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}

  // デフォルト: 同意前は広告トラッキングを無効化
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied'
  });
</script>
```

### 4.2 同意バナーコンポーネント

ユーザーが「同意」を押したら:

```typescript
gtag('consent', 'update', {
  'ad_storage': 'granted',
  'ad_user_data': 'granted',
  'ad_personalization': 'granted',
  'analytics_storage': 'granted'
});
```

同意状態は `localStorage` に保存し、再訪問時はバナーを非表示にする。

### 4.3 ライブラリ候補

- **自前実装**（バナーUI + gtag 呼び出しのみ。シンプルで十分）
- [react-cookie-consent](https://github.com/Mastermindzh/react-cookie-consent)（軽量なOSSライブラリ）

---

## 5. LIFF（LINE WebView）での広告に関する注意点

| 項目                       | 内容                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| **AdSense ポリシー**       | WebView 内での AdSense 利用には制約がある。LINE の LIFF Browser はクロスサイト扱いになる |
| **推奨対応**               | LIFF 内では広告を非表示にし、外部ブラウザ（`liff.openWindow()`）でのみ広告を表示する     |
| **プラットフォーム判定**   | `liff.isInClient()` で LIFF 内かどうかを判定し、広告表示を分岐                           |
| **将来（ネイティブ化時）** | AdMob + WebView API for Ads で正式対応                                                   |

### adConfig での対応

```typescript
// useAd.ts に追加
const isLiff = typeof window !== 'undefined' && window.__LIFF_INTERNAL__;
// or liff.isInClient() を使う

const shouldShow = !!(
  config?.enabled &&
  globalEnabled &&
  isFreeUser &&
  !isLiff  // LIFF 内では広告非表示
);
```

---

## 6. パフォーマンス対策

| 対策                 | 方法                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| 遅延ロード           | Intersection Observer で画面内に入った広告のみロード                    |
| レイアウトシフト防止 | 広告枠に `min-height` を事前設定（ロード前に高さを確保）                |
| SPA 遷移時           | ページ遷移時に `adsbygoogle.push({})` を再実行                          |
| バンドルサイズ       | AdSense JS は外部スクリプト（`<script async>`）なのでバンドルに影響なし |

---

## 7. ディレクトリ構成

```
frontend/src/features/ads/
├── adConfig.ts          # 全広告スロット定義（Ad Slot Registry）
├── useAd.ts             # Hook: プラン判定 + 条件評価
├── types.ts             # 広告関連の型定義
└── components/
    ├── AdBanner.tsx      # 固定位置広告コンポーネント
    ├── AdFeedItem.tsx    # フィード内広告コンポーネント
    └── CookieConsent.tsx # Cookie同意バナー
```

# Android ネイティブアプリ（Kotlin） — 案件概要

> **作成日**: 2026-03-06
> **ステータス**: 🔲 未着手
> **ゴール**: Kotlin で Android ネイティブアプリを構築し、Google Play で公開
> **前提条件**: iOS ネイティブアプリ完了（iOS で確立した設計パターンを流用）
> **優先度**: 🥉 3番目（後回し）

---

## 案件スコープ

iOS ネイティブアプリで確立した設計パターン・API 連携を踏襲し、Kotlin（Jetpack Compose）で Android 版を構築する。

---

## 主要タスク（概要）

### 1. Android プロジェクト初期化

- Android Studio プロジェクト作成（Kotlin / Jetpack Compose）
- アーキテクチャ設計（iOS 版の設計パターンを踏襲）
- API 通信層（Retrofit / Ktor + Bearer トークン管理）

### 2. ネイティブ認証フロー

- LINE Login SDK for Android 統合
- パスワード認証（既存 BE API 呼び出し）
- EncryptedSharedPreferences によるトークン管理

### 3. 画面実装

- iOS 版と同等の全画面を Jetpack Compose で構築

### 4. Stripe Android SDK + PaymentSheet 統合

- Stripe Android SDK 導入
- Google Pay 対応
- BE 共通決済基盤を利用

### 5. RevenueCat Android SDK 統合

- Google Play Billing Library 経由のサブスクリプション管理

### 6. FCM プッシュ通知

- Firebase Cloud Messaging Android SDK 導入
- デバイストークン登録 API 連携

### 7. Google Play 申請

- ストアメタデータ・スクリーンショット
- APK/AAB ビルド → Google Play Console 申請

---

## 技術メモ

- **iOS 版の設計資産を流用**: API 連携パターン、画面構成、認証フローは iOS 版で確立済みの設計を踏襲
- **BE 共通基盤**: REST API・認証・Stripe・プッシュ通知基盤は iOS/Web/LIFF と完全共通
- **Capacitor 不使用**: ハイブリッドではなくフルネイティブ方針（2026-03-06 決定）

---

## 依存関係

```
iOS ネイティブアプリ完了（設計パターン確立）
  └── Android ネイティブ
       ├── BE REST API（共通）
       ├── BE UBL-14 プッシュ通知基盤（共通）
       ├── BE IStripeService（共通決済基盤）
       └── Google Play 申請
```

---

## 作業ログ

- 2026-03-06: 案件作成。Capacitor 撤廃に伴い、Kotlin ネイティブ Android アプリを独立案件として切り出し。iOS リリース後に着手予定

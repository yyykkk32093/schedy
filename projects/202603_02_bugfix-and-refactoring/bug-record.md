# バグ修正記録 — 202603_02_bugfix-and-refactoring

> 作成日: 2026-03-11
> 案件No: 202603_02
> 本ドキュメントは、本案件で発見・修正したバグの障害内容・原因・対応内容を記録する

---

## 目次

- [Phase 0: クリティカルバグ](#phase-0-クリティカルバグ)
- [Phase 1: 表示バグ・UI不整合](#phase-1-表示バグui不整合)
- [Phase 2: レイアウト・ナビゲーション改善](#phase-2-レイアウトナビゲーション改善)
- [Phase 3: 新機能追加時のバグ修正](#phase-3-新機能追加時のバグ修正)
- [Phase 3 レビュー後バグ修正（Session 3.2）](#phase-3-レビュー後バグ修正session-32)
- [Phase 3 レビュー後バグ修正（Session 3.3）](#phase-3-レビュー後バグ修正session-33)
- [Phase 3 レビュー後バグ修正（Session 3.4）](#phase-3-レビュー後バグ修正session-34)

---

## Phase 0: クリティカルバグ

### BUG-0-1: ログイン2度押し問題

| 項目         | 内容                                                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 事象         | ログインボタンを2度押さないと画面遷移しない。1度目はヘッダーがログイン状態に切り替わるが画面遷移しない                                                     |
| 原因         | `loginMutation.onSuccess` 内で `qc.invalidateQueries` の完了を `await` せずに `navigate('/')` を呼んでいたため、認証状態が確定する前にナビゲーションが発生 |
| 対応         | `onSuccess` を `async` にし、`await qc.invalidateQueries({ queryKey: authKeys.me() })` で再フェッチ完了を待ってからナビゲーション                          |
| 対象ファイル | `frontend/src/features/auth/pages/LoginPage.tsx`                                                                                                           |

### BUG-0-2: HeaderActionsContext Maximum update depth エラー

| 項目         | 内容                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| 事象         | アクティビティ詳細画面でヘッダーの編集ボタン押下後、戻るボタンで `Maximum update depth exceeded` エラー発生                           |
| 原因         | `useSetHeaderActions` が `useEffect` 内で毎回新しい ReactNode を `setState` していたため、コンポーネントの mount/unmount で無限ループ |
| 対応         | `useMemo` でヘッダーアクションの参照を安定化。依存配列を `[activity, id, navigate]` に限定                                            |
| 対象ファイル | `frontend/src/features/activity/pages/ActivityDetailPage.tsx`                                                                         |

### BUG-0-3: XSS/インジェクション対策

| 項目         | 内容                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| 事象         | フリーテキスト入力欄でスクリプト・HTMLタグ入力時にアプリが壊れる可能性                                                |
| 原因         | React はデフォルトで文字列をエスケープするため直接的な XSS は防がれるが、`dangerouslySetInnerHTML` 等の使用確認が必要 |
| 対応         | 全フリーテキスト入力にZodバリデーション適用。`dangerouslySetInnerHTML` 未使用を確認済み                               |
| 対象ファイル | `frontend/src/features/activity/components/ActivityForm.tsx` 他                                                       |

### BUG-0-4: お知らせ投稿時の画像非表示

| 項目         | 内容                                                                       |
| ------------ | -------------------------------------------------------------------------- |
| 事象         | お知らせ投稿時に画像添付しても画像が表示されない                           |
| 原因         | 画像URLの生成・取得ロジックの不備（S3署名付きURL関連）                     |
| 対応         | S3 presigned URL の取得ロジック修正                                        |
| 対象ファイル | `frontend/src/features/home/components/FeedCard.tsx`, BE: announcement関連 |

### BUG-0-5: ＋ボタン重複表示

| 項目         | 内容                                                                       |
| ------------ | -------------------------------------------------------------------------- |
| 事象         | タイムラインの+ボタンが青色と黒色で2つ表示されている                       |
| 原因         | FABボタンとページ内ボタンが両方レンダリングされていた                      |
| 対応         | 重複FABの一方を削除し、専用PNGアイコンのFABに統一                          |
| 対象ファイル | `frontend/src/features/community/components/detail/tabs/ActivitiesTab.tsx` |

---

## Phase 1: 表示バグ・UI不整合

### BUG-1-1: 幹事名がID表示

| 項目         | 内容                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| 事象         | アクティビティ詳細画面で幹事名がユーザIDで表示されていた                                                      |
| 原因         | `FindActivityUseCase` が `organizerUserId` のみ返しており、表示名を解決していなかった                         |
| 対応         | BE: `FindActivityUseCase` に `organizerDisplayName` フィールド追加（UserRepository で解決）。FE: 表示名を使用 |
| 対象ファイル | BE: `FindActivityUseCase.ts`, FE: `ActivityDetailPage.tsx`                                                    |

### BUG-1-2: 参加者数表示バグ（残り：ー/ー）

| 項目         | 内容                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| 事象         | 参加者一覧のヘッダーが「残り：ー/ー」と表示される                              |
| 原因         | `capacity` が `null` の場合のフォールバック処理がなかった                      |
| 対応         | capacity が null の場合は「{participants.length}名」と表示するよう条件分岐追加 |
| 対象ファイル | `frontend/src/features/activity/pages/ActivityDetailPage.tsx`                  |

### BUG-1-3: 参加するボタン非活性

| 項目         | 内容                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| 事象         | アクティビティ詳細画面の参加するボタンが非活性（disabled）                     |
| 原因         | ボタンの `disabled` 条件に管理者権限チェックが誤って含まれていた               |
| 対応         | `disabled` 条件を `isPending` のみに修正。管理者自身も参加可能に               |
| 対象ファイル | `frontend/src/features/participation/components/ParticipationActionButton.tsx` |

### BUG-1-7: カレンダー日付選択でアクティビティ非表示

| 項目         | 内容                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| 事象         | カレンダーで日付をタップしてもアクティビティが表示されない                                                     |
| 原因         | `useCommunitySchedules` が日付フィルタで from/to の比較を文字列で行っていたが、timezone 差異で日付がずれていた |
| 対応         | 日付比較を `yyyy-MM-dd` 形式の文字列で統一し、`format(date, 'yyyy-MM-dd')` で正規化                            |
| 対象ファイル | `frontend/src/features/community/components/detail/tabs/ActivitiesTab.tsx`                                     |

### BUG-1-9: チャットコミュニティ名がID表示

| 項目         | 内容                                                       |
| ------------ | ---------------------------------------------------------- |
| 事象         | チャット一覧でコミュニティ名がUUID表示（例: 853259dc...）  |
| 原因         | チャットチャンネルAPIがコミュニティ名を返していなかった    |
| 対応         | BE: チャットチャンネル取得時にコミュニティ名をJOINして返却 |
| 対象ファイル | BE: チャットチャンネル関連UseCase, FE: ChannelListPage     |

### BUG-1-10: ドロップダウン上展開・背景透明

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| 事象         | Selectドロップダウンが上方向に展開され、背景が透明で見づらい        |
| 原因         | shadcn/ui Select の `side` プロパティ未指定（ブラウザ判断で上展開） |
| 対応         | 全Selectに `<SelectContent side="bottom" sideOffset={4}>` を指定    |
| 対象ファイル | `frontend/src/features/activity/components/ActivityForm.tsx`        |

---

## Phase 3: 新機能追加時のバグ修正

### BUG-3-11: スプリットボタン（支払い方法選択）の状態管理不備

| 項目         | 内容                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| 事象         | 参加するスプリットボタンで支払い方法選択後、再度開くと前回の選択が残る         |
| 原因         | 支払い方法の状態がボタン外のuseStateで保持されていた                           |
| 対応         | `ParticipationActionButton` コンポーネント化し、ボタン内部で状態管理           |
| 対象ファイル | `frontend/src/features/participation/components/ParticipationActionButton.tsx` |

---

## Phase 3 レビュー後バグ修正（Session 3.2）

### BUG-3.2-1: アクティビティ詳細画面のGoogleマップリンク表示条件

| 項目         | 内容                                                                      |
| ------------ | ------------------------------------------------------------------------- |
| 事象         | オンラインアクティビティでもGoogleマップリンクが表示される                |
| 原因         | `defaultAddress` が設定されている場合は無条件にマップリンクを表示していた |
| 対応         | `isOnline` でない場合のみGoogleマップリンクを表示するよう条件追加         |
| 対象ファイル | `frontend/src/features/activity/pages/ActivityDetailPage.tsx`             |

### BUG-3.2-2: 会議URLラベルの表示

| 項目         | 内容                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| 事象         | 会議URLが「開催場所」ラベルの下に表示されていた                                   |
| 原因         | 会議URL表示の条件分岐とラベルが不適切                                             |
| 対応         | 会議URLは「会議URL：」ラベルで独立表示に変更                                      |
| 対象ファイル | `frontend/src/features/activity/pages/ActivityDetailPage.tsx`, `ScheduleCard.tsx` |

### BUG-3.2-3: DB defaultAddress 未定義

| 項目         | 内容                                                                             |
| ------------ | -------------------------------------------------------------------------------- |
| 事象         | アクティビティ作成時に住所を入力してもGoogleマップリンクが表示されない           |
| 原因         | Activity テーブルに `defaultAddress` カラムが存在しなかった                      |
| 対応         | Prisma migration で `defaultAddress` カラム追加。BE: entity/repo/usecase 全更新  |
| 対象ファイル | `backend/prisma/schema.prisma`, Activity関連のentity/repo/usecase/controller全般 |

### BUG-3.2-4: キャンセルUIバグ（myStatus / findsByScheduleId）

| 項目         | 内容                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| 事象         | 参加取り消し後もUIが更新されない、または参加者一覧から消えない                                                   |
| 原因         | `findsByScheduleId` が CANCELLED 含む全レコードを返していた。myStatus 判定でキャンセル済みが考慮されていなかった |
| 対応         | `findsByScheduleId` に `status: 'ATTENDING'` フィルタ追加。myStatus 判定ロジック修正                             |
| 対象ファイル | BE: `ParticipationRepositoryImpl.ts`, `FindScheduleUseCase.ts`                                                   |

### BUG-3.2-5: ScheduleCard の X（削除）アイコン不要表示

| 項目         | 内容                                                                       |
| ------------ | -------------------------------------------------------------------------- |
| 事象         | コミュニティ詳細のアクティビティタブでScheduleCardにXアイコンが表示された  |
| 原因         | `onRemove` prop が不要な箇所でも渡されていた                               |
| 対応         | コミュニティ詳細のActivitiesTab では `onRemove` を渡さないよう修正         |
| 対象ファイル | `frontend/src/features/community/components/detail/tabs/ActivitiesTab.tsx` |

---

## Phase 3 レビュー後バグ修正（Session 3.3）

### BUG-3.3-1: ActivitiesTab に幹事・参加費・参加人数が非表示

| 項目         | 内容                                                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 事象         | コミュニティ詳細画面のアクティビティタブに幹事名・参加費・参加人数が表示されていない（ユーザ側と不一致）                                                                        |
| 原因         | Timeline SubTab が `ListActivities` の `upcomingSchedules`（date/startTime/endTimeのみ）を使用しており、参加費・参加人数等のデータがなかった                                    |
| 対応         | Timeline SubTab を `useCommunitySchedules`（フルスケジュールAPI）ベースに切替。`ListSchedulesUseCase` に `participantCount` 追加。メンバー一覧から `organizerName` をマッピング |
| 対象ファイル | BE: `ListSchedulesUseCase.ts`, `_usecaseFactory.ts`。FE: `ActivitiesTab.tsx`                                                                                                    |

### BUG-3.3-2: 定員入力UIの不備

| 項目         | 内容                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| 事象         | 定員の表示がおかしい。ドロップダウンがメインで入力もできるようにしてほしい                 |
| 原因         | `<Input type="number">` + `<datalist>` の組み合わせでブラウザ間の表示差異が大きかった      |
| 対応         | `<Select>` ドロップダウン（メンバー数20%刻みの候補）+ 「その他（手入力）」オプションに変更 |
| 対象ファイル | `frontend/src/features/activity/components/ActivityForm.tsx`                               |

### BUG-3.3-3: 過去日付でアクティビティ作成可能

| 項目         | 内容                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------- |
| 事象         | 過去の日付でアクティビティが作成できてしまう                                                 |
| 原因         | 日付入力フィールドに `min` 制約がなかった                                                    |
| 対応         | `<Input type="date">` に `min={today}` を追加（作成時のみ、編集時は `allowPastDate` で制御） |
| 対象ファイル | `frontend/src/features/activity/components/ActivityForm.tsx`                                 |

### BUG-3.3-4: アクティビティ編集画面の初期値不足

| 項目         | 内容                                                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 事象         | アクティビティ更新時に、日付・上限人数・オンライン設定・会議URL・参加費が初期セットされない                                                        |
| 原因         | `ActivityEditPage` が Activity データのみを使用し、Schedule のデータ（date, capacity, isOnline, meetingUrl, participationFee）を取得していなかった |
| 対応         | `useSchedules` で先頭スケジュールのデータを取得し、`initialValues` にセット                                                                        |
| 対象ファイル | `frontend/src/features/activity/pages/ActivityEditPage.tsx`                                                                                        |

### BUG-3.3-5: 編集画面で定員更新が反映されない

| 項目         | 内容                                                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 事象         | 更新画面で上限人数を変更して保存しても、変更が反映されない                                                                                               |
| 原因         | `handleSubmit` が `updateActivity` のみ呼び出しており、Schedule フィールド（capacity, participationFee, date, isOnline, meetingUrl）を更新していなかった |
| 対応         | `useUpdateSchedule` を追加し、Activity 更新に加えて Schedule も同時更新                                                                                  |
| 対象ファイル | `frontend/src/features/activity/pages/ActivityEditPage.tsx`                                                                                              |

### BUG-3.3-6: 初期表示時のmyStatusバグ（キャンセル待ちボタン誤表示）

| 項目         | 内容                                                                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 事象         | 上限に達したアクティビティで、参加済みユーザのボタンが初期表示時に「参加取り消し」ではなく「キャンセル待ち」になる。リロードで正常に戻る                             |
| 原因         | `scheduleDetail` の useQuery が完了する前に `myStatus ?? 'none'` でフォールバックし、isFull + myStatus='none' の組み合わせで「キャンセル待ち」ボタンが表示されていた |
| 対応         | `scheduleDetail` ロード完了まで `ParticipationActionButton` を非表示（スピナー表示）に変更                                                                           |
| 対象ファイル | `frontend/src/features/activity/pages/ActivityDetailPage.tsx`                                                                                                        |

### BUG-3.3-7: キャンセル待ち再登録でユニーク制約違反

| 項目         | 内容                                                                                                                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 事象         | 一度キャンセル待ちしてから取り消し、再度キャンセル待ちするとエラー: `Unique constraint failed on the fields: (scheduleId, userId)`                                                                                          |
| 原因         | `JoinWaitlistUseCase` で `WaitlistEntry.create()` が新しいIDで新規エントリを生成し、`upsert({ where: { id: newId } })` でINSERTを試みるが、`@@unique([scheduleId, userId])` に既存の CANCELLED レコードが残っており制約違反 |
| 対応         | `JoinWaitlistUseCase` で既存の CANCELLED エントリがあれば `rejoin()` メソッド（status=WAITING, cancelledAt=null にリセット）を呼び出すよう変更。`WaitlistEntry` エンティティに `rejoin(newPosition)` メソッド追加           |
| 対象ファイル | BE: `JoinWaitlistUseCase.ts`, `WaitlistEntry.ts`, `WaitlistEntryRepositoryImpl.ts`                                                                                                                                          |

### BUG-3.3-8: キャンセル待ちリストUI不在

| 項目         | 内容                                                                                                                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 事象         | キャンセル待ちユーザがUI上で確認できない                                                                                                                                                                                              |
| 原因         | キャンセル待ち一覧を取得するAPIおよびUIが存在しなかった                                                                                                                                                                               |
| 対応         | BE: `GET /v1/schedules/:id/waitlist-entries` エンドポイント新設（`ListWaitlistEntriesUseCase`）。FE: `useWaitlistEntries` フック + 参加者テーブルの下にキャンセル待ちテーブル常時表示。空の場合は「キャンセル待ちはいません。」と表示 |
| 対象ファイル | BE: `ListWaitlistEntriesUseCase.ts`, `participationController.ts`, `participationRoutes.ts`。FE: `ActivityDetailPage.tsx`, `useParticipationQueries.ts`, `participationApi.ts`, `queryKeys.ts`, `api.ts`                              |

---

## Phase 3 レビュー後バグ修正（Session 3.4）

### BUG-3.4-1: 別ユーザログイン時のmyStatusキャッシュ混在

| 項目         | 内容                                                                                                                                                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 事象         | ユーザAがキャンセル待ち後、ユーザB（参加済み）でログインしてアクティビティ詳細画面を見ると「キャンセル待ち取り消し」ボタンが表示される。リロードで「参加取り消し」に正常化                                                                                                                                               |
| 原因         | `scheduleKeys.detail(scheduleId)` のクエリキーにユーザIDが含まれていない。ログイン時に `LoginPage.onSuccess` は `authKeys.me()` のみ invalidate しており、他のクエリキャッシュ（`myStatus` を含む schedule detail 等）はクリアされない。ユーザAの `myStatus: 'waitlisted'` キャッシュがユーザBのセッションに引き継がれた |
| 対応         | `LoginPage.onSuccess` でログイン成功時に `qc.removeQueries()` で全クエリキャッシュをクリアしてから `authKeys.me()` を再フェッチ。同様に `AuthProvider` のログアウト時にも `qc.removeQueries()` で全キャッシュをクリア                                                                                                    |
| 対象ファイル | `frontend/src/features/auth/pages/LoginPage.tsx`, `frontend/src/app/providers/AuthProvider.tsx`                                                                                                                                                                                                                          |

### BUG-3.4-2: キャンセル繰り上げ後の参加取り消しでユニーク制約違反

| 項目         | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 事象         | キャンセル待ちから繰り上がったユーザが参加取り消しを行うと `Unique constraint failed on the fields: (scheduleId, userId)` エラー                                                                                                                                                                                                                                                                                                                                                         |
| 原因         | `CancelParticipationUseCase` のキャンセル待ち繰り上げ処理で、`Participation.create()` が新しいUUIDで新規レコードを生成。しかし当該ユーザが過去に参加→キャンセルした CANCELLED レコードが `@@unique([scheduleId, userId])` で残っているため、INSERT時に制約違反。繰り上げの流れ: ① 別ユーザが参加取消 → ② キャンセル待ち先頭を繰り上げ → ③ `Participation.create()` で新ID生成 → ④ `upsert({ where: { id: newId } })` が INSERT → ⑤ 既存CANCELLEDレコードと `(scheduleId, userId)` が重複 |
| 対応         | `CancelParticipationUseCase` の繰り上げロジックで、新規 `Participation.create()` の前に `findByScheduleAndUser` で既存レコードを確認。CANCELLED レコードが存在すれば `reattend()` メソッド（status=ATTENDING, cancelledAt=null）を呼び出して再利用。存在しなければ従来通り `Participation.create()` で新規作成                                                                                                                                                                           |
| 対象ファイル | `backend/src/application/participation/usecase/CancelParticipationUseCase.ts`                                                                                                                                                                                                                                                                                                                                                                                                            |

### BUG-3.4-3: 繰り上げ済みユーザの再キャンセル待ちでWaitlistEntryユニーク制約違反

| 項目         | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 事象         | ユーザ1参加 → ユーザ2キャンセル待ち → ユーザ1取消(ユーザ2繰り上げ) → ユーザ2取消(ユーザ1繰り上げ) → ユーザ2再キャンセル待ち → `Unique constraint failed on the fields: (scheduleId, userId)` on `waitlistEntry.upsert()`                                                                                                                                                                                                                                                                                                                      |
| 原因         | `JoinWaitlistUseCase` の再登録ロジックが `existingEntry.getStatus().isCancelled()` のみチェックしていた。繰り上げ済み（PROMOTED）の WaitlistEntry が DB に残っている場合、`isCancelled()=false` で rejoin 分岐を通過し、`else` ブロックで新規 `WaitlistEntry.create()` → `upsert({ where: { id: newId } })` が INSERT → `@@unique([scheduleId, userId])` の既存 PROMOTED レコードと重複。さらに `WaitlistEntry.rejoin()` メソッドも `!isCancelled()` ガードで PROMOTED 状態からの遷移を拒否しており、仮に条件を修正しても rejoin できなかった |
| 対応         | ① `WaitlistEntry.rejoin()`: ガード条件を `isWaiting()` のみに変更（CANCELLED / PROMOTED 両方から WAITING に遷移可能に）。`promotedAt` も null クリア追加。② `JoinWaitlistUseCase`: rejoin 条件を `existingEntry && isCancelled()` から `existingEntry`（存在すれば rejoin）に簡略化。WAITING は上位で既にガードされているため、ここに到達するのは CANCELLED / PROMOTED のみ                                                                                                                                                                   |
| 対象ファイル | BE: `WaitlistEntry.ts`, `JoinWaitlistUseCase.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

---

## 統計

| Phase       | バグ件数 | クリティカル | 中     | 軽微   |
| ----------- | -------- | ------------ | ------ | ------ |
| Phase 0     | 5        | 3            | 1      | 1      |
| Phase 1     | 14       | 0            | 8      | 6      |
| Phase 2     | 0        | 0            | 0      | 0      |
| Phase 3     | 1        | 0            | 1      | 0      |
| Session 3.2 | 5        | 0            | 3      | 2      |
| Session 3.3 | 8        | 1            | 5      | 2      |
| Session 3.4 | 3        | 3            | 0      | 0      |
| **合計**    | **36**   | **7**        | **18** | **11** |

---

## 再発防止策

### キャッシュ関連
- ログイン/ログアウト時に `queryClient.removeQueries()` で全キャッシュクリアを必須化
- ユーザ固有データ（`myStatus` 等）を返すAPIは、クエリキーにユーザIDを含めることを検討

### @@unique 制約関連
- 論理削除パターン（status=CANCELLED で残す）と `@@unique` 制約の組み合わせでは、再作成時に必ず既存レコードの再利用（`reattend()` / `rejoin()`）パターンを使用する
- `Participation` と `WaitlistEntry` の両方で同じ問題が発生したため、今後同様のパターンでは設計段階でチェック
- 論理ステータスが複数終端状態を持つ場合（CANCELLED / PROMOTED 等）、再登録ロジックは特定ステータスではなく「再登録不可ステータス以外」（=除外条件）で判定する方が安全

### テスト観点
- 「参加→キャンセル→再参加」「キャンセル待ち→取消→再キャンセル待ち」等のライフサイクルテストを E2E テストに追加すべき
- マルチユーザシナリオ（ユーザ切替後のキャッシュ状態）のテストケース追加

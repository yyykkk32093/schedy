# Git 手順書  
## feature/split-frontend-backend を main にマージするまでの流れ

このドキュメントは以下を一気に行うための手順書です。

1. feature/split-frontend-backend にコミットする  
2. リモートへ push する  
3. main ブランチへマージする  
4. main を push する  

---

# 🧭 1. feature ブランチでコミット & push

現在のブランチが `feature/split-frontend-backend` の場合は以下を実行：

```sh
git add . && \
git commit -m "split frontend/backend update" && \
git pull --rebase && \
git push -u origin feature/split-frontend-backend
🔄 2. ブランチが違う場合（切り替え → コミット → push）
sh
コードをコピーする
git checkout feature/split-frontend-backend && \
git add . && \
git commit -m "split frontend/backend update" && \
git pull --rebase && \
git push -u origin feature/split-frontend-backend
🔀 3. main にマージ（ローカルで完結する場合）
sh
コードをコピーする
git checkout main && \
git pull && \
git merge feature/split-frontend-backend && \
git push
📝 4. GitHub / GitLab の PR/MR を使う場合
UI で PR/MR を作成したい場合は、次のコマンドを実行して push のみ行い、
あとは Web UI で PR を作成してください。

sh
コードをコピーする
git push && \
echo "➡️ Open GitHub/GitLab to create a PR: feature/split-frontend-backend → main"
🌟 5. 全自動 一括実行版（危険だが最速）
以下は、

feature に切り替え

コミット / push

main にマージ

main を push

feature に戻る

まで 1発で行うスクリプト です。

sh
コードをコピーする
git checkout feature/split-frontend-backend && \
git add . && \
git commit -m "split frontend/backend update" && \
git pull --rebase && \
git push && \
git checkout main && \
git pull && \
git merge feature/split-frontend-backend && \
git push && \
git checkout feature/split-frontend-backend
✔ Tips
git pull --rebase を使う理由
→ 不必要な "Merge commit" を作らず履歴がキレイになる

-u origin feature/...
→ 初回 push で upstream 設定するため

マージ後は feature ブランチを削除しても OK（GitHub UI 推奨）
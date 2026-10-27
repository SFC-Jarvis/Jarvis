#!/usr/bin/env bash
# GitHub の Organization / リポジトリ設定（Owner が自分の Mac で 1 回だけ実行）
#   ./scripts/setup-github.sh                    設定だけ
#   ./scripts/setup-github.sh userA userB        設定 + メンバーを developers チームに招待
# 前提: gh auth login 済み（Owner のアカウント）、main に最初のコミットが Push 済み
set -euo pipefail
cd "$(dirname "$0")/.."
ORG=SFC-Jarvis
REPO=$ORG/Jarvis
TEAM=developers

ok() { printf "  \033[32m✓\033[0m %s\n" "$1"; }

echo "ログイン中: $(gh api user -q .login)（$REPO の Owner である必要があります）"

echo "1. Organization の既定権限（メンバーは閲覧のみ・リポジトリ作成不可）"
gh api -X PATCH "orgs/$ORG" -f default_repository_permission=read -F members_can_create_repositories=false >/dev/null
ok "done"

echo "2. developers チーム（Jarvis に write 権限。admin ではないので保護ルールを迂回できない）"
gh api "orgs/$ORG/teams/$TEAM" >/dev/null 2>&1 || gh api -X POST "orgs/$ORG/teams" -f name=$TEAM -f privacy=closed >/dev/null
gh api -X PUT "orgs/$ORG/teams/$TEAM/repos/$REPO" -f permission=push >/dev/null
ok "done"
for u in "$@"; do
  gh api -X PUT "orgs/$ORG/teams/$TEAM/memberships/$u" -f role=member >/dev/null
  ok "$u を招待（メールの招待を承認してもらう）"
done

echo "3. マージ方法（Squash のみ・マージ後にブランチ削除・「Update branch」ボタンを有効）"
gh api -X PATCH "repos/$REPO" \
  -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false \
  -F delete_branch_on_merge=true -F allow_update_branch=true \
  -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY >/dev/null
ok "done"

echo "4. Actions（読み取り専用トークン・Actions が PR を Approve できないようにする）"
gh api -X PUT "repos/$REPO/actions/permissions/workflow" \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false >/dev/null
ok "done"

echo "5. セキュリティ（秘密情報の検出と Push のブロック・脆弱性アラート）"
gh api -X PATCH "repos/$REPO" --input - >/dev/null <<'JSON'
{ "security_and_analysis": { "secret_scanning": { "status": "enabled" }, "secret_scanning_push_protection": { "status": "enabled" } } }
JSON
gh api -X PUT "repos/$REPO/vulnerability-alerts" >/dev/null
gh api -X PUT "repos/$REPO/automated-security-fixes" >/dev/null
ok "done"

echo "6. ラベル"
gh label create no-test-needed -R "$REPO" -c BFD4F2 -d "テスト不要な変更（理由を PR 本文に書く）" --force >/dev/null
ok "no-test-needed"

echo "7. main の保護ルール（.github/rulesets/main.json）"
ID=$(gh api "repos/$REPO/rulesets" -q '.[] | select(.name=="main を守る") | .id' || true)
if [ -n "$ID" ]; then
  gh api -X PUT "repos/$REPO/rulesets/$ID" --input .github/rulesets/main.json >/dev/null; ok "更新"
else
  gh api -X POST "repos/$REPO/rulesets" --input .github/rulesets/main.json >/dev/null; ok "作成"
fi

echo
echo "完了。確認: https://github.com/$REPO/settings/rules"

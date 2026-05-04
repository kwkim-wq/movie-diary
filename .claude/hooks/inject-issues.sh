#!/bin/bash
REPO="kwkim-wq/movie-diary"

ISSUES=$(gh issue list --repo "$REPO" --state open --json number,title --limit 5 2>/dev/null)
if [ -z "$ISSUES" ]; then exit 0; fi

ISSUE_LINE=$(echo "$ISSUES" | python3 -c "
import sys, json
data = json.load(sys.stdin)
parts = ['#' + str(i['number']) + ' ' + i['title'][:30] for i in data]
print(' · '.join(parts))
" 2>/dev/null)

ISSUE_COUNT=$(echo "$ISSUES" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)

LAST_COMMIT=$(git -C "/Users/kwkim/Desktop/Personal/260505_영화 아카이빙" log --oneline -1 2>/dev/null)

echo "[movie-diary | 열린이슈 ${ISSUE_COUNT}개] $ISSUE_LINE | 최근커밋: $LAST_COMMIT"
echo ""
echo "======================================================"
echo "[MANDATORY - 매 응답 시작 전 반드시 실행]"
echo "1. gh issue comment → 이번 응답에서 진행한 내용 기록"
echo "2. 작업 완료 시 → git commit + gh issue close"
echo "이슈 업데이트 없이 응답 본문 시작 절대 금지"
echo "======================================================"

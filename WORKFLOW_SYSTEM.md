# Claude Code 업무 지속성 시스템

## 핵심 개념

컴팩트(context 압축)가 발생해도 업무가 끊기지 않게 하는 3가지 축:

1. **자동 주입 훅** — 매 메시지마다 현재 상태를 컨텍스트에 자동 주입
2. **GitHub Issues** — 모든 작업/설계/리서치의 유일한 진실 원천
3. **메모리 파일** — 사용자 특성, 협업 방식, 프로젝트 개요를 영구 저장

---

## 1. 자동 주입 훅 설정

### 파일 구조

```
프로젝트루트/
├── .claude/
│   ├── settings.json       # 훅 설정
│   └── hooks/
│       └── inject-issues.sh  # 이슈 주입 스크립트
```

### .claude/settings.json

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "type": "command",
        "command": "bash \"/절대경로/.claude/hooks/inject-issues.sh\"",
        "timeout": 15
      }
    ]
  }
}
```

### .claude/hooks/inject-issues.sh

```bash
#!/bin/bash
REPO="owner/repo-name"  # 프로젝트마다 변경

ISSUES=$(gh issue list --repo "$REPO" --state open --json number,title --limit 5 2>/dev/null)
if [ -z "$ISSUES" ]; then exit 0; fi

ISSUE_LINE=$(echo "$ISSUES" | python3 -c "
import sys, json
data = json.load(sys.stdin)
parts = ['#' + str(i['number']) + ' ' + i['title'][:30] for i in data]
print(' · '.join(parts))
" 2>/dev/null)

LAST_COMMIT=$(git -C "$(dirname $(dirname $0))" log --oneline -1 2>/dev/null)

echo "[$(basename $(dirname $(dirname $0))) | 열린이슈 $(echo "$ISSUES" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)개] $ISSUE_LINE | 최근커밋: $LAST_COMMIT"
```

```bash
chmod +x .claude/hooks/inject-issues.sh
```

**효과**: 컴팩트 전/후 관계없이 매 메시지마다 이슈 목록이 Claude 컨텍스트에 자동 주입됨.

---

## 2. GitHub Issues 운영 규칙

### 이슈 라벨 체계

| 라벨 | 용도 |
|------|------|
| `bug` | 버그 |
| `enhancement` | 새 기능 |
| `research` | 데이터 조사/리서치 결과 |
| `design` | 설계 방향 논의 |
| `improvement` | 개선 사항 |

### 언제 이슈를 만드나

- 새 기능 구현 전
- 설계 고민이 생겼을 때
- 리서치 결과가 나왔을 때
- 중요한 결정을 내렸을 때

### 이슈 생명주기

1. 이슈 생성 (작업 시작)
2. 설계 논의 → 코멘트로 기록
3. 구현 완료 → 커밋 메시지에 `#이슈번호` 참조
4. QA 완료 → 이슈 close

### 컴팩트 후 재개 프로토콜

Claude Code 새 세션/컴팩트 후 첫 메시지:

```bash
gh issue list --repo owner/repo --state open
gh issue view 8  # 가장 중요한 이슈 내용 확인
git log --oneline -5
```

→ 사용자 설명 없이 현황 파악 후 바로 보고

---

## 3. 메모리 파일 시스템

### 위치

`~/.claude/projects/[인코딩된-경로]/memory/`

### 파일 종류

| 파일 | 내용 |
|------|------|
| `MEMORY.md` | 인덱스 (자동 로드됨) |
| `user_*.md` | 사용자 특성, 선호도 |
| `feedback_*.md` | 협업 방식, 주의사항 |
| `project_*.md` | 프로젝트 현황, 다음 작업 |

### 메모리 저장 원칙

- **저장**: 사용자 협업 방식, 반복되는 선호, 중요한 제약
- **저장 안함**: 코드 패턴, 파일 구조 (코드에서 읽으면 됨), 일회성 작업
- 컴팩트 후 자동 로드되므로 "다음에도 기억해야 할 것"만 저장

---

## 4. CLAUDE.md 구조

각 프로젝트 루트에 위치. 자동 로드됨.

```markdown
# 프로젝트명 — Claude 작업 규칙

## 협업 방식 (최우선)
- Claude는 팀장 역할만 (요구사항, 분배, 리뷰)
- 실무(파일 읽기/수정/배포)는 에이전트에게 위임
- 작업 전 반드시 사용자에게 계획 보고 후 승인

## 에이전트 팀 구성
| 역할 | 에이전트 | 담당 |
|------|---------|------|
| 설계 | Plan | 기능 명세, API 설계 |
| 백엔드 | general-purpose | 서버 코드 |
| 프론트엔드 | general-purpose | UI/UX |
| QA | general-purpose | 검증 |

## 프로젝트 정보
- URL, 서버 접속 정보, 배포 명령 등

## 컴팩트 후 재개 프로토콜
1. gh issue list --state open
2. git log --oneline -10
3. design/research 이슈 있으면 내용 읽기
4. 현재 상태 요약 + 다음 작업 제안 보고

## 표준 개발 프로세스
1. GitHub Issue 생성
2. Plan 에이전트 → 설계
3. Backend/Frontend 에이전트 → 구현
4. QA 에이전트 → 검증
5. git commit + push + 이슈 close

## 다음 작업 우선순위
GitHub Issues: https://github.com/owner/repo/issues
```

---

## 5. 에이전트 팀 운영 원칙

### Claude(팀장)가 하는 것

- 요구사항 정리
- 에이전트 계획 수립 후 사용자 승인
- 에이전트 결과 리뷰
- GitHub Issues 관리

### Claude가 하지 않는 것

- 파일 직접 읽기/수정
- SSH 접속
- 배포
- 에이전트 프롬프트에 코드 직접 작성

### 이유

에이전트에게 위임하면 팀장(Claude)의 컨텍스트 소모를 최소화해서 컴팩트 빈도를 줄임.

### 에이전트 투입 순서

`Plan → Backend/Frontend (병렬 가능) → QA (검증 + commit + push + Issue close)`

---

## 6. 새 프로젝트에 적용하는 방법

```bash
# 1. git 초기화 + GitHub private repo 생성
git init
gh repo create 프로젝트명 --private --source=. --push

# 2. .gitignore에 민감 파일 추가
echo "config.py\n*.env\n*token*\n*.pickle\n.claude/settings.local.json" >> .gitignore

# 3. .claude 폴더 생성
mkdir -p .claude/hooks

# 4. settings.json 생성 (위 내용 참고)

# 5. inject-issues.sh 생성 + 권한 부여 (위 내용 참고)

# 6. CLAUDE.md 작성 (위 내용 참고)

# 7. GitHub Issues로 백로그 정리
gh issue create --title "[Feature] 기능명" --label enhancement

# 8. 메모리 파일 작성
# ~/.claude/projects/[경로]/memory/ 에 user, feedback, project 파일 생성
```

---

## 7. 체크리스트

### 새 프로젝트 시작 시

- [ ] git init + GitHub private repo
- [ ] .gitignore 설정
- [ ] CLAUDE.md 작성
- [ ] .claude/settings.json + inject-issues.sh
- [ ] GitHub Issues로 백로그 등록
- [ ] 메모리 파일 작성

### 운영 중

- [ ] 작업마다 GitHub Issue 생성/close
- [ ] 설계 논의는 Issue 코멘트로 기록
- [ ] git commit 메시지에 이슈 번호 참조
- [ ] 중요 결정은 메모리 파일에 저장
- [ ] QA 에이전트가 commit + push + Issue close까지 완료했는지 확인

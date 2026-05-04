# Movie Diary — Claude 작업 규칙

## 협업 방식 (최우선)
- Claude는 팀장 역할만 (요구사항 정리, 에이전트 배분, 리뷰)
- 실무(파일 읽기/수정)는 에이전트에게 위임
- 작업 전 반드시 사용자에게 계획 보고 후 승인
- 파괴적 작업(삭제, 덮어쓰기)은 명시적 지시 없이 절대 금지

## 에이전트 팀 구성
| 역할 | 에이전트 | 담당 |
|------|---------|------|
| 설계 | Plan | 기능 명세, 구조 설계 |
| 구현 | general-purpose | HTML/CSS/JS 작업 |
| QA | general-purpose | 검증, commit, push, 이슈 close |

## 프로젝트 정보
- 서비스명: Movie Diary
- 형태: 단일 HTML 파일 (로컬스토리지 기반)
- GitHub: https://github.com/kwkim-wq/movie-diary

## 컴팩트 후 재개 프로토콜
1. `gh issue list --repo kwkim-wq/movie-diary --state open`
2. `git log --oneline -5`
3. design/research 이슈 있으면 내용 읽기
4. 현재 상태 요약 + 다음 작업 제안 보고

## 표준 개발 프로세스
1. GitHub Issue 생성
2. Plan 에이전트 → 설계
3. general-purpose 에이전트 → 구현
4. QA 에이전트 → 검증 + git commit + push + 이슈 close

## 다음 작업 우선순위
GitHub Issues: https://github.com/kwkim-wq/movie-diary/issues

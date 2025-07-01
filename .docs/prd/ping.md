### 8.5 문제 해결
```bash
# 프로세스 상태 확인
claude-ping status

# 문제 시 재시작
claude-ping stop
claude-ping start

# 연결 테스트
claude-ping test

## 1. 프로젝트 개요

### 1.1 프로젝트 명
**claude-ping** - Claude Code CLI 토큰 최적화 자동화 도구

### 1.2 목적
Claude Code CLI의 5시간 토큰 리셋 주기를 활용하여 최대 토큰 가용성을 확보하는 Node.js 기반 백그라운드 서비스

### 1.3 핵심 가치
- **토큰 최적화**: 5시간마다 자동으로 새 세션 시작하여 토큰 리셋
- **무인 운영**: 부팅 시 자동 시작, 백그라운드 상주 실행
- **사용 편의성**: 한 번 설치 후 완전 자동화
- **권한 최소화**: sudo/관리자 권한 불필요

## 2. 핵심 기능

### 2.1 Claude CLI 자동 대화
**동작 방식**:
- `claude` 명령어로 대화형 세션 시작
- "What time is it now?" 질문 전송
- Claude 응답 확인 후 세션 종료
- 토큰 리셋 완료

**실행 주기**: 5시간마다 자동 실행

**연속 실행 메커니즘** (토큰 리셋 보장):
- 5시간 타이머 도달 시 연속으로 3회 실행
- 각 실행 간격: 2분
- 목적: 기존 세션 종료 후 새 세션 확실한 시작

**연속 실행 패턴**:
```
5시간 후 → 1차 Claude 호출
2분 후 → 2차 Claude 호출  
2분 후 → 3차 Claude 호출
완료 → 다음 5시간 대기
```

### 2.2 백그라운드 상주 프로세스
- Node.js 프로세스가 데몬으로 지속 실행
- 내부 타이머 기반 스케줄링
- PID 파일로 프로세스 상태 관리
- 안전한 종료 신호 처리

### 2.3 자동 시작 서비스
- **macOS**: launchd User Agent (권한 불필요)
- **Linux**: systemd user service (권한 불필요)
- **Windows**: Task Scheduler 사용자 작업 (권한 불필요)

## 3. 명령어 인터페이스

### 3.1 주요 명령어
```bash
claude-ping start                         # 백그라운드 상주 프로세스 시작 (기본 5시간 간격)
claude-ping start -i 3                    # 3시간 간격으로 백그라운드 실행
claude-ping start --interval 8            # 8시간 간격으로 백그라운드 실행
claude-ping start --foreground            # 포그라운드에서 실행 (터미널 유지)
claude-ping start -f                      # 포그라운드 실행 (단축형)
claude-ping start --retry-count 3         # 연속 실행 횟수 설정 (기본: 3회)
claude-ping start --retry-interval 2      # 연속 실행 간격 설정 (기본: 2분)
claude-ping start --no-retry              # 연속 실행 비활성화 (1회만)
claude-ping status                        # 현재 실행 상태 확인
claude-ping test                          # Claude 연결 테스트
claude-ping config                        # 설정 파일 확인
claude-ping stop                          # 실행 중인 프로세스 중지
claude-ping --help                        # 도움말 표시
```

### 3.2 start 명령어 동작
**자동 등록 확인 및 설정**:
1. 부팅 시 자동 시작 서비스 등록 상태 확인
2. 미등록 시 자동으로 등록 (사용자 확인 후)
3. 등록 완료 후 프로세스 시작

**실행 모드**:
- **기본 (백그라운드)**: 데몬으로 실행, 터미널 종료와 무관
- **포그라운드 (--foreground, -f)**: 터미널에서 실시간 로그 출력

**간격 설정**:
- **기본**: 5시간 간격
- **커스텀**: `-i` 또는 `--interval` 옵션으로 지정 (1-24시간)

**연속 실행 설정**:
- **기본**: 3회 연속 실행, 2분 간격
- **횟수 조정**: `--retry-count` 옵션 (1-10회)
- **간격 조정**: `--retry-interval` 옵션 (1-10분)
- **비활성화**: `--no-retry` 옵션 (1회만 실행)

## 4. 설치 및 설정

### 4.1 전제 조건
1. **Node.js 18.0.0 이상**
2. **Claude Code CLI 설치 및 인증**
   ```bash
   npm install -g @anthropic-ai/claude-code
   claude auth
   ```

### 4.2 설치 과정
```bash
# 1. claude-ping 설치
npm install -g claude-ping

# 2. 실행 (자동 시작 설정 포함)
claude-ping start
# ? Setup auto-start on boot? (Y/n) Y
# ✅ Auto-start service registered
# 🚀 Starting Claude Ping (5h interval)...
# 📄 PID saved: 12345

# 또는 커스텀 간격으로 실행
claude-ping start -i 3
# 🚀 Starting Claude Ping (3h interval)...
```

### 4.3 설정 파일
**위치**: `~/.claude-ping/config.json`

**기본 설정**:
```json
{
  "intervalHours": 5,
  "timeout": 30000,
  "retryCount": 3,
  "retryInterval": 2,
  "question": "What time is it now?",
  "logLevel": "info",
  "autoRestart": true
}
```

**설정 옵션 설명**:
- `intervalHours`: 주 실행 간격 (시간)
- `retryCount`: 연속 실행 횟수
- `retryInterval`: 연속 실행 간격 (분)
- `timeout`: Claude 응답 대기 시간 (밀리초)
- `question`: Claude에게 할 질문
- `logLevel`: 로그 상세도 (info, debug, error)
- `autoRestart`: 자동 재시작 여부

## 5. start 명령어 상세 동작

### 5.1 자동 시작 서비스 관리
**등록 상태 확인**:
1. OS별 자동 시작 서비스 등록 여부 확인
2. 미등록 시 사용자에게 등록 여부 묻기
3. 동의 시 백그라운드에서 자동 등록

**서비스 등록 위치**:
- **macOS**: `~/Library/LaunchAgents/com.claude-ping.plist`
- **Linux**: `~/.config/systemd/user/claude-ping.service`
- **Windows**: Task Scheduler 사용자 작업

### 5.2 실행 모드별 동작

**백그라운드 모드 (기본)**:
```bash
claude-ping start
# ✅ Auto-start service registered
# 🚀 Starting Claude Ping (5h interval, 3 retries)...
# 📄 PID saved: 12345
# ⏰ Next ping scheduled: 7/1/2025, 7:30:25 PM
# 
# Process running in background. Use 'claude-ping status' to check.
```

**포그라운드 모드**:
```bash
claude-ping start --foreground
# ✅ Auto-start service registered  
# 🚀 Starting Claude Ping (5h interval, 3 retries)...
# [14:30:25] ⏰ 5-hour timer triggered, starting retry sequence...
# [14:30:26] 🔄 Attempt 1/3: Starting Claude session...
# [14:30:28] Human: What time is it now?
# [14:30:30] Claude: It's currently 2:30 PM on July 1st, 2025.
# [14:30:31] ✅ Attempt 1 completed
# [14:32:26] 🔄 Attempt 2/3: Starting Claude session...
# [14:32:28] Human: What time is it now?
# [14:32:30] Claude: It's currently 2:32 PM on July 1st, 2025.
# [14:32:31] ✅ Attempt 2 completed
# [14:34:26] 🔄 Attempt 3/3: Starting Claude session...
# [14:34:28] Human: What time is it now?
# [14:34:30] Claude: It's currently 2:34 PM on July 1st, 2025.
# [14:34:31] ✅ Attempt 3 completed
# [14:36:32] 🎯 Retry sequence complete. Next cycle in 5 hours...
# 
# (실시간 로그 출력, Ctrl+C로 종료)
```

### 5.3 간격 및 재시도 설정
**기본 설정**:
```bash
claude-ping start    # 5시간 간격, 3회 연속, 2분 간격
```

**커스텀 설정**:
```bash
claude-ping start -i 3                      # 3시간 간격
claude-ping start --retry-count 3           # 3회만 연속 실행
claude-ping start --retry-interval 3        # 3분 간격으로 연속 실행
claude-ping start --no-retry                # 1회만 실행 (연속 없음)
claude-ping start -i 4 --retry-count 5      # 4시간 간격, 5회 연속
```

**유효 범위**:
- 간격: 1-24시간
- 재시도 횟수: 1-10회
- 재시도 간격: 1-10분

## 6. 상태 관리 및 모니터링

### 6.1 실시간 상태 확인
```bash
claude-ping status
```

**출력 예시**:
```
✅ Claude Ping is running (PID: 12345)
📅 Next ping: in 3h 42m
⏰ Last ping: 2025-07-01 14:30:25 (3/3 attempts completed)

Recent activity:
  [14:30:25] ⏰ 5-hour timer triggered, starting retry sequence...
  [14:30:26] 🔄 Attempt 1/3: Claude responded successfully
  [14:32:26] 🔄 Attempt 2/3: Claude responded successfully  
  [14:34:26] 🔄 Attempt 3/3: Claude responded successfully
  [14:36:32] 🎯 Retry sequence complete
```

### 6.2 프로세스 제어
```bash
# 프로세스 중지
claude-ping stop
# 🛑 Stopping Claude Ping (PID: 12345)...
# ✅ Process stopped successfully

# 상태 확인 후 필요시 시작
claude-ping status
# ❌ Claude Ping is not running

claude-ping start
# 🚀 Starting Claude Ping (5h interval)...
```

### 6.3 로그 파일
- **표준 출력**: `~/.claude-ping/output.log`
- **에러 로그**: `~/.claude-ping/error.log`
- **PID 파일**: `~/.claude-ping/claude-ping.pid`

## 7. 에러 처리 및 복구

### 7.1 주요 에러 시나리오

**Claude CLI 미설치**:
- 감지: `claude --version` 실행 실패
- 해결: 설치 가이드 표시 후 종료

**인증 실패**:
- 감지: Claude 실행 시 인증 에러
- 해결: `claude auth` 실행 안내, 작업 일시 중단

**Claude 응답 타임아웃**:
- 기본 타임아웃: 30초
- 연속 실행 중 개별 시도 타임아웃 적용
- 한 번의 시도 실패해도 다음 시도 계속 진행

**연속 실행 중 오류**:
- 개별 시도 실패 시 다음 시도로 계속 진행
- 모든 시도 실패 시에만 전체 실패로 간주
- 부분 성공도 유효한 결과로 처리

**네트워크 오류**:
- 재시도: 지수적 백오프 (2초, 4초, 8초)
- 최대 재시도: 3회
- 실패 시: 로그 기록 후 다음 주기 대기

### 7.2 자동 복구
- **프로세스 크래시**: 시스템 서비스 자동 재시작
- **일시적 오류**: 재시도 메커니즘
- **영구적 오류**: 사용자 알림 및 작업 중단

## 8. 사용 시나리오

### 8.1 최초 설정 (원스텝)
```bash
# Claude 인증 확인
claude
# > What time is it?
# > (응답 확인 후 종료)

# claude-ping 설치 및 시작
npm install -g claude-ping
claude-ping start
# ? Setup auto-start on boot? (Y/n) Y
# ✅ Auto-start service registered
# 🚀 Starting Claude Ping (5h interval)...
```

### 8.2 커스텀 간격 설정
```bash
# 3시간 간격으로 실행
claude-ping start -i 3

# 8시간 간격으로 실행 (절약 모드)
claude-ping start -i 8
```

### 8.3 개발/테스트 시나리오
```bash
# 포그라운드로 실행하여 로그 확인
claude-ping start --foreground

# 1시간 간격, 3회 연속으로 테스트
claude-ping start -i 1 --retry-count 3 --foreground

# 재시도 없이 단순 테스트
claude-ping start -i 1 --no-retry --foreground
```

### 8.4 일상 사용
```bash
# 상태 확인만
claude-ping status

# 수동 테스트
claude-ping test

# 재시작 (설정 변경 후)
claude-ping stop
claude-ping start -i 5 --retry-count 3
```

## 9. 테스트 전략

### 9.1 기능 테스트
1. **Claude CLI 통합**: 설치, 인증, 대화 테스트
2. **프로세스 관리**: 시작/중지, PID 관리, 신호 처리
3. **자동 시작**: OS별 서비스 등록/해제 테스트
4. **설정 관리**: 파일 로드/저장, 기본값 적용
5. **에러 처리**: 각 에러 타입별 적절한 대응

### 9.2 환경 테스트
- **다중 플랫폼**: macOS, Linux, Windows
- **권한 테스트**: sudo 없이 정상 동작 확인
- **장기 실행**: 24시간 이상 안정성 테스트

## 10. 배포 및 유지보수

### 10.1 패키지 배포
- **npm 레지스트리**: 공식 패키지 게시
- **Semantic Versioning**: 버전 관리 정책
- **플랫폼 지원**: Node.js 18+ 지원 모든 플랫폼

### 10.2 사용자 지원
**문서화**:
- README: 설치 및 기본 사용법
- 문제 해결 가이드: 일반적인 오류 및 해결책
- 설정 참조: 모든 설정 옵션 상세 설명

**커뮤니티 지원**:
- GitHub Issues: 버그 리포트 및 기능 요청
- 예제 설정: 다양한 사용 사례별 설정 예시

### 10.3 업데이트 정책
- **자동 업데이트**: npm update로 간단 업데이트
- **하위 호환성**: 기존 설정 파일 마이그레이션
- **변경 로그**: 버전별 변경사항 상세 기록

이 요구사항 명세서는 claude-ping의 핵심 기능과 사용자 경험을 정의하며, 실제 구현을 위한 명확한 가이드라인을 제공합니다.
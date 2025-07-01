# claude-ping 토큰 사용량 조회 기능 요구사항 명세서

## 1. 개요

### 1.1 목적
claude-ping의 MVP 개발 완료 후, Claude Code CLI의 토큰 사용량을 실시간으로 추적하고 조회할 수 있는 기능을 추가하여 사용자가 토큰 소비 패턴을 파악하고 최적화할 수 있도록 지원

### 1.2 기능 범위
- 백그라운드 프로세스에서 토큰 사용량 자동 추적
- 사용량 데이터 로컬 저장 및 관리
- 명령어를 통한 실시간 사용량 조회
- 세션별 토큰 사용 통계 제공

## 2. 핵심 기능 요구사항

### 2.1 사용량 자동 추적 (start 명령어 확장)

#### 2.1.1 기본 동작
- 기존 `claude-ping start` 명령어에 사용량 추적 기능 통합
- ccusage CLI 도구를 활용한 토큰 데이터 수집
- 백그라운드 프로세스에서 자동 모니터링 수행

#### 2.1.2 추적 옵션
```bash
# 기본 실행 (사용량 추적 포함)
claude-ping start

# 사용량 추적 비활성화
claude-ping start --no-tracking

# 사용량 추적 간격 설정 (기본: 30초)
claude-ping start --track-interval 60

# 상세 추적 모드 (캐시 사용량 포함)
claude-ping start --detailed-tracking
```

#### 2.1.3 데이터 수집 주기
- **기본 간격**: 30초마다 토큰 사용량 체크
- **설정 가능 범위**: 10초 ~ 300초 (5분)
- **적응형 수집**: 활성 세션 감지 시 더 자주 수집

### 2.2 사용량 데이터 저장

#### 2.2.1 저장 위치
- **데이터베이스**: `~/.claude-ping/usage.db` (SQLite)
- **로그 파일**: `~/.claude-ping/usage.log` (백업용)

#### 2.2.2 데이터 구조
**sessions 테이블**:
```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE,
    start_time DATETIME,
    end_time DATETIME,
    status TEXT, -- 'active', 'expired', 'unknown'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**usage_records 테이블**:
```sql
CREATE TABLE usage_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    timestamp DATETIME,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cache_creation_tokens INTEGER DEFAULT 0,
    cache_read_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER GENERATED ALWAYS AS (
        input_tokens + output_tokens + cache_creation_tokens + cache_read_tokens
    ) STORED,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
```

#### 2.2.3 데이터 보존 정책
- **기본 보존 기간**: 30일
- **설정 가능**: 7일 ~ 365일
- **자동 정리**: 주기적으로 오래된 데이터 삭제

### 2.3 사용량 조회 명령어 (usage)

#### 2.3.1 기본 명령어
```bash
# 현재 활성 세션 사용량 조회 (기본 - 간단한 정보)
claude-ping usage

# 상세 정보 출력 (토큰 타입별 분석, 갱신 시간 등)
claude-ping usage --detail

# 세션별 상세 사용량
claude-ping usage --sessions

# 오늘 전체 사용량
claude-ping usage --today

# 특정 기간 사용량
claude-ping usage --from 2025-07-01 --to 2025-07-03

# 최근 N일 사용량
claude-ping usage --last 7

# JSON 형태로 출력
claude-ping usage --json
```

#### 2.3.2 실시간 모니터링
```bash
# 실시간 사용량 추적 (3초 간격)
claude-ping usage --watch

# 커스텀 간격으로 실시간 추적
claude-ping usage --watch --interval 5

# 간단한 형태로 실시간 추적
claude-ping usage --watch --compact
```

## 3. 출력 형태 및 UI

### 3.1 기본 사용량 출력 (claude-ping usage)
```
┌─ 🚀 Claude Usage Summary ──────────────────────────────────────────────┐
│                                                                          │
│  🔄 CURRENT SESSION                              Started: 2h 30m ago     │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  🎯 Total: 7,697 tokens  ████████████████████████░░░░░░░░░░░░░░░░░░   │ │
│  │                                         22.0% of 35,000 token limit  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ⏰ TOKEN REFRESH                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Next refresh: Jul 1, 2025 at 7:30 PM (in 2h 30m)                  │ │
│  │  ████████████████████████████████████████████████████░░░░░░░░░░░░░░   │ │
│  │                                         Session progress: 50%        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  📅 TODAY'S TOTAL                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  15,234 tokens used across 3 sessions                               │ │
│  │  ████████████████████████████████████████░░░░░░░░░░  43.5% of daily  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  💡 Use --detail for breakdown • --sessions for session details         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 상세 사용량 출력 (claude-ping usage --detail)
```
┌─ 🚀 Claude Token Usage (Detailed) ──────────────────────────────────────┐
│                                                                          │
│  🔄 CURRENT SESSION                              Started: 2h 30m ago     │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  📥 Input       ████████░░░░░░░░░░░░░░░░░░░░  1,247 tokens   (16.2%)  │ │
│  │  📤 Output      ████████████████████████░░░░  3,891 tokens   (50.5%)  │ │
│  │  💾 Cache Write ███░░░░░░░░░░░░░░░░░░░░░░░░░    456 tokens   ( 5.9%)  │ │
│  │  📖 Cache Read  ████████████░░░░░░░░░░░░░░░░  2,103 tokens   (27.3%)  │ │
│  │  ─────────────────────────────────────────────────────────────────  │ │
│  │  🎯 Total       ████████████████████████░░░░  7,697 / 35,000 (22.0%) │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ⏰ TOKEN REFRESH SCHEDULE                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Current 5h window: 5:00 PM → 10:00 PM (Jul 1, 2025)               │ │
│  │  Next refresh: Jul 1, 2025 at 10:00 PM (in 2h 30m)                 │ │
│  │  ████████████████████████████████████████████████████░░░░░░░░░░░░░░   │ │
│  │                                         Session progress: 50%        │ │
│  │                                                                       │ │
│  │  🔥 Burn rate: ~2,566 tokens/hour                                    │ │
│  │  ⏰ Time to limit: 10h 43m remaining                                 │ │
│  │  🎯 Projected usage: ~13,830 tokens by refresh                       │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  📅 TODAY'S ACTIVITY                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Total used: 15,234 tokens (3 sessions)                             │ │
│  │  ████████████████████████████████████████░░░░░░░░░░  43.5% of daily  │ │
│  │                                                                       │ │
│  │  🕐 5:00-10:00 PM    7,697 tokens (current, 50% done)               │ │
│  │  🕐 12:00-5:00 PM    4,823 tokens (expired)                         │ │
│  │  🕐 7:00-12:00 PM    2,714 tokens (expired)                         │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  📈 WEEKLY TRENDS (Last 7 days)                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Jul 1  ████████████████████████████████████████████████  15.2k*    │ │
│  │  Jun 30 ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░  12.3k     │ │
│  │  Jun 29 ███████████████████████████████░░░░░░░░░░░░░░░░░░░  14.1k     │ │
│  │  Jun 28 ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   6.8k     │ │
│  │  Jun 27 ████████████████████████████████████░░░░░░░░░░░░░░  16.2k     │ │
│  │  Jun 26 ████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░  11.5k     │ │
│  │  Jun 25 ███████████████████████████████████████░░░░░░░░░░░  17.4k     │ │
│  │                                                   * Today (ongoing)  │ │
│  │  📊 Daily Avg: 13.4k  📈 Peak: 17.4k  📉 Low: 6.8k  🔢 Total: 93.5k  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.3 세션별 상세 출력 (claude-ping usage --sessions)
```
┌─ 📋 Session Details ────────────────────────────────────────────────────┐
│                                                                          │
│  🔴 Session A (ACTIVE)                         5:00 PM → 10:00 PM today  │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  📊 7,697 tokens  ████████████████████████████████████████░░░░░░░░   │ │
│  │  📥 1,247  📤 3,891  💾 456  📖 2,103                                │ │
│  │  ⏱️  Expires: Jul 1 at 10:00 PM (in 2h 30m)                          │ │
│  │  🔥 Rate: 2,566 tokens/hour  🎯 Projected: ~13,830 by expiry         │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  🟡 Session B (EXPIRED)                        12:00 PM → 5:00 PM today  │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  📊 4,823 tokens  ████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░   │ │
│  │  📥 892   📤 2,145  💾 234  📖 1,552                                 │ │
│  │  ✅ Completed full 5h cycle                                           │ │
│  │  🔥 Final rate: 965 tokens/hour  🎯 Total usage: 4,823 tokens        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ⚫ Session C (EXPIRED)                         7:00 AM → 12:00 PM today  │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  📊 2,714 tokens  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │ │
│  │  📥 445   📤 1,567  💾 122  📖 580                                   │ │
│  │  ✅ Completed full 5h cycle                                           │ │
│  │  🔥 Final rate: 543 tokens/hour  🎯 Total usage: 2,714 tokens        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  📊 TODAY'S SUMMARY                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Total: 15,234 tokens across 3 sessions (1 active, 2 completed)     │ │
│  │  Average session: 5,078 tokens  Peak session: 7,697 tokens          │ │
│  │  Total active time: 12h 30m  Average rate: 1,218 tokens/hour        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.3 실시간 모니터링 출력
```bash
claude-ping usage --watch
```
```
┌─ 🔴 LIVE MONITOR ────────────────── Updates every 3s ──────────────────┐
│                                                                          │
│  🎯 CURRENT SESSION                            7,697 tokens ↗️ (+45)     │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│  ┃ ████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░ ┃ │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                 22.0% of 35k limit      │
│                                                                          │
│  📊 BREAKDOWN                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  📥 Input       ████████░░░░░░░░░░░░░░░░░░░░  1,247 (+12)             │ │
│  │  📤 Output      ████████████████████████░░░░  3,891 (+28)             │ │
│  │  💾 Cache Write ███░░░░░░░░░░░░░░░░░░░░░░░░░    456 (+3)              │ │
│  │  📖 Cache Read  ████████████░░░░░░░░░░░░░░░░  2,103 (+2)              │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  🔥 BURN RATE: ~900 tokens/hour                                         │
│  ⏰ TIME TO LIMIT: 30h 25m remaining                                     │
│  🕐 SESSION EXPIRES: in 2h 30m                                          │
│                                                                          │
│  ⚡ ACTIVITY                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  [14:30:25] +45 tokens (Input: +12, Output: +28, Cache: +5)          │ │
│  │  [14:30:22] +23 tokens (Input: +8, Output: +15)                      │ │
│  │  [14:30:19] +67 tokens (Output: +67)                                 │ │
│  │  [14:30:16] +31 tokens (Input: +5, Output: +26)                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                              Press Ctrl+C to stop                       │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.4 컴팩트 모드 출력
```bash
claude-ping usage --compact
```
```
🚀 claude-ping usage
🔄 Current: 7,697/35,000 tokens (22.0%) • 📥1.2k 📤3.9k 💾456 📖2.1k
📅 Today: 15,234 tokens (3 sessions) • 🔥900/hr • ⏰30h25m left
📈 Week: 59,150 tokens (avg 8.5k/day, peak 18.9k)
```

### 3.5 경고 및 알림 출력
```bash
claude-ping usage
```
```
┌─ ⚠️  WARNING ────────────────────────────────────────────────────────────┐
│                                                                          │
│  🚨 HIGH USAGE DETECTED                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Current session: 31,250 / 35,000 tokens (89.3%)                    │ │
│  │  ████████████████████████████████████████████████████████████████░░  │ │
│  │                                                                       │ │
│  │  🔥 Burn rate: 2,340 tokens/hour (VERY HIGH)                         │ │
│  │  ⏰ Estimated depletion: in 1h 36m                                    │ │
│  │  🕐 Session expires: in 47m                                           │ │
│  │                                                                       │ │
│  │  💡 Recommendation: Slow down usage or wait for session reset        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.6 빈 상태 출력
```bash
claude-ping usage
```
```
┌─ 📊 Claude Token Usage ─────────────────────────────────────────────────┐
│                                                                          │
│                           🌙 No Active Sessions                          │
│                                                                          │
│                      Start a Claude Code session to                     │
│                           begin tracking usage                          │
│                                                                          │
│                     💡 Run 'claude' to start a session                   │
│                                                                          │
│  📅 TODAY'S SUMMARY                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  No usage today • Last session: yesterday at 3:45 PM               │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.4 JSON 출력 형태
```bash
claude-ping usage --json
```
```json
{
  "timestamp": "2025-07-01T14:30:25Z",
  "current_session": {
    "session_id": "session_xyz",
    "status": "active", 
    "start_time": "2025-07-01T12:00:25Z",
    "duration_minutes": 150,
    "tokens": {
      "input": 1247,
      "output": 3891,
      "cache_creation": 456,
      "cache_read": 2103,
      "total": 7697
    }
  },
  "today_summary": {
    "date": "2025-07-01",
    "total_tokens": 15234,
    "sessions_count": 3,
    "active_sessions": 2
  },
  "recent_activity": {
    "period_days": 7,
    "daily_average": 8450,
    "peak_day": {
      "date": "2025-07-01",
      "tokens": 18923
    },
    "total_tokens": 59150
  }
}
```

## 4. 설정 및 구성

### 4.1 설정 파일 확장
**~/.claude-ping/config.json**에 사용량 추적 관련 설정 추가:

```json
{
  "intervalHours": 5,
  "timeout": 30000,
  "retryCount": 3,
  "retryInterval": 2,
  "question": "What time is it now?",
  "logLevel": "info",
  "autoRestart": true,
  
  // 사용량 추적 설정
  "usage": {
    "enabled": true,
    "trackInterval": 30,
    "detailedTracking": false,
    "dataRetentionDays": 30,
    "autoCleanup": true
  }
}
```

### 4.2 환경 변수
```bash
# ccusage CLI 경로 (자동 감지 실패 시)
export CCUSAGE_PATH="/usr/local/bin/ccusage"

# 사용량 추적 비활성화
export CLAUDE_PING_NO_TRACKING=true

# 디버그 모드
export CLAUDE_PING_DEBUG=true
```

## 5. 에러 처리 및 복구

### 5.1 ccusage CLI 의존성 처리

#### 5.1.1 자동 설치 확인
```bash
# 시작 시 ccusage 설치 상태 확인
claude-ping start
# ❌ ccusage not found. Install with: npm install -g ccusage
# 🔧 Auto-install ccusage? (Y/n) Y
# ⬇️  Installing ccusage...
# ✅ ccusage installed successfully
# 🚀 Starting Claude Ping with usage tracking...
```

#### 5.1.2 설치 실패 처리
- ccusage 설치 실패 시 사용량 추적 기능 비활성화
- 기본 claude-ping 기능은 정상 동작 유지
- 사용자에게 수동 설치 안내

### 5.2 데이터 수집 오류 처리

#### 5.2.1 일시적 오류
- ccusage 명령어 실패 시 재시도 (최대 3회)
- 연속 실패 시 일시적으로 추적 간격 증가
- 복구 시 정상 간격으로 복원

#### 5.2.2 영구적 오류
- 연속 10회 실패 시 사용량 추적 비활성화
- 사용자에게 알림 및 수동 확인 요청
- 다음 재시작 시 자동으로 재시도

### 5.3 데이터베이스 오류 처리
- SQLite 파일 손상 시 백업에서 복구
- 복구 불가능 시 새 데이터베이스 생성
- 기존 데이터 손실 시 사용자에게 알림

## 6. 성능 및 리소스 관리

### 6.1 리소스 사용 최적화
- **메모리 사용량**: 최대 50MB 이하 유지
- **CPU 사용률**: 평균 1% 이하
- **디스크 I/O**: 배치 처리로 최소화

### 6.2 데이터베이스 최적화
- **인덱스 설정**: session_id, timestamp 컬럼
- **배치 삽입**: 여러 레코드 한 번에 처리
- **압축**: 30일 이상 데이터 압축 저장

### 6.3 네트워크 사용량
- ccusage 호출 시에만 네트워크 사용
- 로컬 데이터 우선 활용
- API 호출 최소화

## 7. 통합 테스트 시나리오

### 7.1 기본 동작 테스트
1. **추적 시작**: `claude-ping start` 실행
2. **Claude 사용**: 실제 Claude Code 세션 진행
3. **사용량 확인**: `claude-ping usage` 로 데이터 확인
4. **실시간 모니터링**: `claude-ping usage --watch` 테스트

### 7.2 오류 상황 테스트
1. **ccusage 미설치**: 자동 설치 프로세스 테스트
2. **네트워크 오류**: 일시적 연결 실패 시 복구 테스트
3. **데이터 손상**: 데이터베이스 복구 테스트

### 7.3 장기 실행 테스트
1. **24시간 연속 실행**: 메모리 누수 및 안정성 확인
2. **대용량 데이터**: 30일 이상 데이터 누적 시 성능 확인
3. **다중 세션**: 여러 Claude 세션 동시 추적 테스트

## 8. 구현 우선순위

### 8.1 Phase 1 (MVP+)
- [ ] ccusage CLI 통합
- [ ] 기본 데이터 수집 및 저장
- [ ] `claude-ping usage` 명령어 구현
- [ ] 현재 세션 사용량 표시

### 8.2 Phase 2 (고급 기능)
- [ ] 실시간 모니터링 (`--watch`)
- [ ] 세션별 상세 정보
- [ ] JSON 출력 형태
- [ ] 기간별 통계

### 8.3 Phase 3 (최적화)
- [ ] 성능 최적화
- [ ] 고급 필터링 옵션
- [ ] 데이터 내보내기 기능
- [ ] 웹 대시보드 (선택사항)

## 9. 사용자 경험 시나리오

### 9.1 일반 사용자
```bash
# 설치 후 첫 실행
claude-ping start
# 🔧 Setting up usage tracking...
# ✅ Ready! Use 'claude-ping usage' to check your usage.

# 작업 중 사용량 확인
claude-ping usage
# 📊 Current session: 3,450 tokens used

# 실시간 모니터링
claude-ping usage --watch
# (실시간 업데이트 화면)
```

### 9.2 개발자/파워 유저
```bash
# 상세 추적으로 시작
claude-ping start --detailed-tracking

# JSON 데이터로 스크립트 연동
usage_data=$(claude-ping usage --json)
echo $usage_data | jq '.current_session.tokens.total'

# 특정 기간 분석
claude-ping usage --from 2025-07-01 --to 2025-07-07 --sessions
```

### 9.3 문제 해결
```bash
# 추적 상태 확인
claude-ping status
# ✅ Claude Ping running (with usage tracking)

# 추적 재시작
claude-ping stop
claude-ping start --track-interval 60

# 수동 테스트
claude-ping test
# ✅ Claude connection: OK
# ✅ ccusage integration: OK
# ✅ Database: OK
```

이 명세서는 claude-ping의 토큰 사용량 조회 기능에 대한 완전한 요구사항을 정의하며, MVP 이후 단계적 구현을 위한 명확한 가이드라인을 제공합니다.
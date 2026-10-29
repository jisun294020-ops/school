# 밴드 강사 공고 알림 — 빈 날짜만

가입한 네이버 밴드에 강사 공고(강사·모집·공고·채용·섭외·구인)가 올라오면,
글 속 날짜를 읽어서 **내 구글 캘린더가 비어 있는 날이 있을 때만** 알려줍니다.

- 바쁜 날 = 구글 캘린더 일정 **또는** 구글 할 일(✓ 표시 항목)이 있는 날
- 5분마다 확인 (밴드는 실시간 푸시를 지원하지 않아 주기적으로 확인)
- 알림: **Gmail**(설정 없이 바로) / 텔레그램 / 카카오톡 나에게 보내기 (선택)

알림 예시
```
📢 [OO강사모임] 강사 공고
10/29 14:02 · 홍길동
✅ 비어 있는 날: 11/21(토), 12/2(수)
❌ 일정 있는 날: 11/18(수)

[공고] AI 코딩 강사 모집 …
```
- 날짜가 **전부 일정과 겹치거나 지난 날**이면 알리지 않습니다.
- 날짜를 못 읽은 공고(예: "매주 화요일", "12월 중")는 `⚠ 날짜 확인 필요`로 알려줍니다.
  끄려면 `NOTIFY_UNDATED: false`.
- 읽는 날짜 형식: `11월 17일`, `11/17`, `11.17(화)`, `2026.11.17`, `11/17~11/20`, `11월 17일~19일`, `12월 3일, 10일, 17일`

## 설치 (PC에서 10분)

### 1. 밴드 Access Token 발급
1. https://developers.band.us → 밴드 계정 로그인
2. **내 서비스 → 서비스 등록** (이름 아무거나)
3. **Access Token 발급** → 밴드 연동 허용 → 토큰 복사

### 2. 구글 Apps Script 만들기
1. https://script.google.com → **새 프로젝트** (jisun294020@gmail.com 계정으로)
2. 기본 `Code.gs` 내용을 지우고, 이 폴더의 [`Code.gs`](Code.gs) 전체를 붙여넣기
3. 맨 위 `CONFIG`의 `BAND_ACCESS_TOKEN: ''` 따옴표 안에 1번 토큰 붙여넣기
4. 왼쪽 **서비스 +** → **Google Tasks API** 추가 (이름 `Tasks` 그대로)
5. 💾 저장

### 3. 시작
1. 위쪽 함수 선택에서 **`setup`** 고르고 **▶ 실행**
2. 권한 요청 → 계정 선택 → "고급" → "(안전하지 않음)으로 이동" → **허용**
   (내가 만든 스크립트라 뜨는 경고입니다. 캘린더·할 일 읽기, 메일 보내기, 외부 접속 권한)
3. Gmail로 "✅ 밴드 강사 공고 알림을 시작합니다" 메일이 오면 끝
4. 휴대폰 Gmail 앱 알림이 켜져 있는지 확인

끄고 싶으면 함수 **`stop`** 실행.

## 선택 설정 (`CONFIG`)
| 항목 | 설명 |
|---|---|
| `KEYWORDS` | 알림 키워드 |
| `BAND_KEYS` | 특정 밴드만 확인 (비우면 가입 밴드 전체) |
| `CALENDAR_IDS` | 바쁜 날 판단 캘린더. 기본 `['primary']`(내 캘린더). 예: `'family1227…@group.calendar.google.com'` 추가 가능 |
| `USE_TASKS` | 구글 할 일도 바쁜 날로 볼지 (기본 `true`) |
| `NOTIFY_EMAIL` | Gmail 알림 (기본 `true`) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | 텔레그램 알림 — `@BotFather`에서 `/newbot`, 봇에게 메시지 보낸 뒤 `https://api.telegram.org/bot<토큰>/getUpdates`의 `chat.id` |
| `KAKAO_REST_API_KEY`, `KAKAO_REFRESH_TOKEN` | 카카오톡 나에게 보내기 (아래) |

### 카카오톡으로 받기 (선택)
1. https://developers.kakao.com → 애플리케이션 추가 → **REST API 키** 복사
2. 카카오 로그인 활성화, Redirect URI `https://localhost` 등록, 동의항목 **카카오톡 메시지 전송** 설정
3. 브라우저로 열고 동의 → 주소창의 `code=` 값 복사
   `https://kauth.kakao.com/oauth/authorize?client_id=<REST키>&redirect_uri=https://localhost&response_type=code&scope=talk_message`
4. 아래 명령 결과의 `refresh_token`을 `KAKAO_REFRESH_TOKEN`에 입력 (이후 자동 연장)
   ```
   curl -X POST https://kauth.kakao.com/oauth/token -d grant_type=authorization_code \
     -d client_id=<REST키> -d redirect_uri=https://localhost -d code=<code>
   ```

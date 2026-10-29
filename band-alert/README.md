# 밴드 강사 공고 알림

가입한 네이버 밴드에 **강사·모집·공고·채용·섭외·구인** 같은 단어가 들어간 새 글이 올라오면
**텔레그램** 또는 **카카오톡(나에게 보내기)** 으로 알려줍니다.
GitHub Actions가 **10분마다** 밴드를 확인합니다. 밴드는 실시간 푸시(웹훅)를 제공하지 않아서 주기적으로 확인하는 방식이고, GitHub 사정에 따라 몇 분 늦어질 수 있습니다.

## 1. 밴드 Access Token 발급 (필수)
1. https://developers.band.us 접속 → 밴드 계정으로 로그인
2. **내 서비스 → 서비스 등록** (이름 아무거나)
3. 등록한 서비스에서 **Access Token 발급** 버튼 → 밴드 연동 허용
4. 나온 토큰을 복사

## 2. 알림 받을 곳 정하기 (하나 이상)

### A. 텔레그램 (가장 간단, 추천)
1. 텔레그램에서 `@BotFather` → `/newbot` → 봇 토큰 복사
2. 만든 봇에게 아무 메시지나 보내기
3. 브라우저에서 `https://api.telegram.org/bot<봇토큰>/getUpdates` 열기 → `"chat":{"id":숫자` 의 숫자가 Chat ID

### B. 카카오톡 나에게 보내기
1. https://developers.kakao.com → 애플리케이션 추가 → **REST API 키** 복사
2. 카카오 로그인 활성화, Redirect URI에 `https://localhost` 등록, 동의항목에서 **카카오톡 메시지 전송** 사용 설정
3. 브라우저에서 아래 주소 열고 동의 → 주소창의 `code=` 값 복사
   `https://kauth.kakao.com/oauth/authorize?client_id=<REST키>&redirect_uri=https://localhost&response_type=code&scope=talk_message`
4. 터미널에서 refresh token 발급:
   ```
   curl -X POST https://kauth.kakao.com/oauth/token \
     -d grant_type=authorization_code -d client_id=<REST키> \
     -d redirect_uri=https://localhost -d code=<복사한code>
   ```
   응답의 `refresh_token` 복사 (약 2개월 유효 — 만료되면 3~4단계 다시)

## 3. GitHub에 비밀값 등록
저장소 **Settings → Secrets and variables → Actions**

| 종류 | 이름 | 값 |
|---|---|---|
| Secret | `BAND_ACCESS_TOKEN` | 1번 토큰 (필수) |
| Secret | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | 텔레그램 사용 시 |
| Secret | `KAKAO_REST_API_KEY`, `KAKAO_REFRESH_TOKEN` | 카카오 사용 시 (Client Secret을 켰다면 `KAKAO_CLIENT_SECRET`도) |
| Variable (선택) | `BAND_KEYWORDS` | 키워드 변경, 예: `강사,모집,AI,코딩` |
| Variable (선택) | `BAND_KEYS` | 특정 밴드만 확인 (밴드 key 쉼표 구분). 비우면 가입한 밴드 전체 |

## 4. 시작
이 변경이 기본 브랜치(main)에 병합된 뒤, **Actions → 밴드 강사 공고 알림 → Run workflow** 를 한 번 누르세요.
첫 실행은 기존 글을 "이미 본 글"로 기록만 하고 "✅ 알림을 시작합니다" 메시지를 보냅니다. 그 뒤부터 새 공고만 알려줍니다.

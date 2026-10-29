#!/usr/bin/env python3
"""네이버 밴드 강사 공고 알림.

내가 가입한 밴드의 새 게시글을 확인해서, 키워드(강사·모집·공고 등)가 들어간 글이 있으면
텔레그램 또는 카카오톡 '나에게 보내기'로 알려준다. GitHub Actions에서 주기적으로 실행된다.

환경변수
  BAND_ACCESS_TOKEN   (필수) developers.band.us 에서 발급한 Access Token
  BAND_KEYS           (선택) 확인할 밴드 key, 쉼표 구분. 비우면 가입한 밴드 전체
  BAND_KEYWORDS       (선택) 알림 키워드, 쉼표 구분. 기본: 강사,모집,공고,채용,섭외,구인
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID           (선택) 텔레그램 알림
  KAKAO_REST_API_KEY, KAKAO_REFRESH_TOKEN,
  KAKAO_CLIENT_SECRET                            (선택) 카카오톡 나에게 보내기
  STATE_FILE          (선택) 이미 본 글 기록 파일. 기본: band-alert/state.json
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

BAND_API = "https://openapi.band.us"
DEFAULT_KEYWORDS = "강사,모집,공고,채용,섭외,구인"
KST = timezone(timedelta(hours=9))
MAX_SEEN = 5000


def http(method, url, params=None, data=None):
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    body = urllib.parse.urlencode(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{method} {url.split('?')[0]} -> {e.code}: {e.read().decode()[:300]}")


def band_get(path, token, **params):
    res = http("GET", BAND_API + path, {"access_token": token, **params})
    if res.get("result_code") != 1:
        raise RuntimeError(f"Band API {path} 오류: {res}")
    return res["result_data"]


def list_bands(token):
    return {b["band_key"]: b["name"] for b in band_get("/v2.1/bands", token)["bands"]}


def recent_posts(token, band_key):
    return band_get("/v2/band/posts", token, band_key=band_key, locale="ko_KR").get("items", [])


def matches(text, keywords):
    return any(k in text for k in keywords)


def format_message(band_name, post):
    when = datetime.fromtimestamp(post["created_at"] / 1000, KST).strftime("%m/%d %H:%M")
    author = post.get("author", {}).get("name", "")
    content = post.get("content", "").strip()
    return f"📢 [{band_name}] 새 강사 공고\n{when} · {author}\n\n{content}"


def send_telegram(text):
    token, chat_id = os.environ.get("TELEGRAM_BOT_TOKEN"), os.environ.get("TELEGRAM_CHAT_ID")
    if not (token and chat_id):
        return False
    http("POST", f"https://api.telegram.org/bot{token}/sendMessage",
         data={"chat_id": chat_id, "text": text[:4000], "disable_web_page_preview": "true"})
    return True


_kakao_token = None


def kakao_access_token():
    global _kakao_token
    if _kakao_token is None:
        data = {
            "grant_type": "refresh_token",
            "client_id": os.environ["KAKAO_REST_API_KEY"],
            "refresh_token": os.environ["KAKAO_REFRESH_TOKEN"],
        }
        if os.environ.get("KAKAO_CLIENT_SECRET"):
            data["client_secret"] = os.environ["KAKAO_CLIENT_SECRET"]
        _kakao_token = http("POST", "https://kauth.kakao.com/oauth/token", data=data)["access_token"]
    return _kakao_token


def send_kakao(text):
    if not (os.environ.get("KAKAO_REST_API_KEY") and os.environ.get("KAKAO_REFRESH_TOKEN")):
        return False
    # 카카오 텍스트 템플릿은 최대 200자
    short = text if len(text) <= 200 else text[:197] + "..."
    template = {
        "object_type": "text",
        "text": short,
        "link": {"web_url": "https://band.us", "mobile_web_url": "https://band.us"},
        "button_title": "밴드에서 보기",
    }
    url = "https://kapi.kakao.com/v2/api/talk/memo/default/send"
    req = urllib.request.Request(
        url,
        data=urllib.parse.urlencode({"template_object": json.dumps(template, ensure_ascii=False)}).encode(),
        headers={"Authorization": f"Bearer {kakao_access_token()}"},
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=30).read()
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"카카오 전송 실패 {e.code}: {e.read().decode()[:300]}")
    return True


def notify(text):
    sent = False
    for sender in (send_telegram, send_kakao):
        try:
            sent = sender(text) or sent
        except Exception as e:  # 한 채널이 실패해도 다른 채널은 시도
            print(f"알림 실패({sender.__name__}): {e}", file=sys.stderr)
    if not sent:
        print("[알림 채널 없음 — 콘솔 출력]\n" + text)
    return sent


def load_state(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_state(path, state):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main():
    token = os.environ.get("BAND_ACCESS_TOKEN")
    if not token:
        sys.exit("BAND_ACCESS_TOKEN 이 설정되지 않았습니다.")
    keywords = [k.strip() for k in (os.environ.get("BAND_KEYWORDS") or DEFAULT_KEYWORDS).split(",") if k.strip()]
    state_file = os.environ.get("STATE_FILE") or os.path.join(os.path.dirname(__file__), "state.json")

    bands = list_bands(token)
    wanted = [k.strip() for k in os.environ.get("BAND_KEYS", "").split(",") if k.strip()]
    if wanted:
        bands = {k: bands.get(k, k) for k in wanted}

    state = load_state(state_file)
    first_run = not state.get("initialized")
    seen = state.get("seen", [])
    seen_set = set(seen)
    new_hits = []

    for band_key, band_name in bands.items():
        try:
            posts = recent_posts(token, band_key)
        except Exception as e:
            print(f"[{band_name}] 게시글 조회 실패: {e}", file=sys.stderr)
            continue
        for post in posts:
            key = f"{band_key}:{post['post_key']}"
            if key in seen_set:
                continue
            seen.append(key)
            seen_set.add(key)
            if not first_run and matches(post.get("content", ""), keywords):
                new_hits.append((post["created_at"], band_name, post))

    for _, band_name, post in sorted(new_hits, key=lambda h: h[0]):
        notify(format_message(band_name, post))

    if first_run:
        notify(f"✅ 밴드 강사 공고 알림을 시작합니다.\n확인 중인 밴드 {len(bands)}개 · 키워드: {', '.join(keywords)}")

    print(f"밴드 {len(bands)}개 확인, 새 공고 {len(new_hits)}건")
    save_state(state_file, {"initialized": True, "seen": seen[-MAX_SEEN:]})


if __name__ == "__main__":
    main()

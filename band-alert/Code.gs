/**
 * 밴드 강사 공고 알림 — 내 구글 캘린더에서 "비어 있는 날짜"인 공고만 알려준다.
 *
 * 1) 가입한 밴드의 새 글 중 키워드(강사·모집·공고…)가 있는 글을 찾고
 * 2) 글 속 날짜(11월 17일, 11/17, 2026.11.17, 11/17~11/20, 12월 3일, 10일 …)를 읽어서
 * 3) 구글 캘린더 일정 + 구글 할 일(Tasks)이 없는 날이 하나라도 있으면 알림을 보낸다.
 *    날짜를 못 읽은 글은 "날짜 확인 필요"로 표시해서 보낸다 (CONFIG.NOTIFY_UNDATED).
 *
 * 설정 방법은 README.md 참고. 처음 한 번 setup() 을 실행하면 5분마다 자동 확인한다.
 */
var CONFIG = {
  BAND_ACCESS_TOKEN: '',            // 필수: developers.band.us 에서 발급
  BAND_KEYS: [],                    // 비우면 가입한 밴드 전체. 특정 밴드만: ['밴드key1', '밴드key2']
  KEYWORDS: ['강사', '모집', '공고', '채용', '섭외', '구인'],
  CALENDAR_IDS: ['primary'],        // 바쁜 날 판단에 쓸 캘린더 (휴일 캘린더는 넣지 마세요)
  USE_TASKS: true,                  // 구글 할 일(✓ 표시 일정)도 바쁜 날로 볼지
  NOTIFY_UNDATED: true,             // 날짜를 못 읽은 공고도 알릴지
  NOTIFY_EMAIL: true,               // 내 Gmail로 알림 (설정 없이 바로 됨)
  TELEGRAM_BOT_TOKEN: '',           // 선택
  TELEGRAM_CHAT_ID: '',
  KAKAO_REST_API_KEY: '',           // 선택: 카카오톡 나에게 보내기
  KAKAO_REFRESH_TOKEN: '',
  KAKAO_CLIENT_SECRET: '',
  TIME_ZONE: 'Asia/Seoul',
  CHECK_EVERY_MINUTES: 5
};

var BAND_API = 'https://openapi.band.us';
var DAY_MS = 24 * 60 * 60 * 1000;
var WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 처음 한 번 실행: 기존 글은 건너뛰고, 5분마다 자동 확인을 켠다. */
function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'checkBand') ScriptApp.deleteTrigger(t);
  });
  PropertiesService.getScriptProperties().deleteProperty('lastSeen');
  checkBand();  // 첫 실행은 기준점만 기록
  ScriptApp.newTrigger('checkBand').timeBased().everyMinutes(CONFIG.CHECK_EVERY_MINUTES).create();
  notify('✅ 밴드 강사 공고 알림을 시작합니다.\n내 캘린더가 비어 있는 날짜의 공고만 알려드릴게요.');
}

/** 자동 확인을 끈다. */
function stop() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'checkBand') ScriptApp.deleteTrigger(t);
  });
}

/** 주기적으로 실행되는 본체. */
function checkBand() {
  var props = PropertiesService.getScriptProperties();
  var lastSeen = JSON.parse(props.getProperty('lastSeen') || '{}');
  var bands = listBands();
  var hits = [];

  Object.keys(bands).forEach(function (bandKey) {
    var posts;
    try {
      posts = bandGet('/v2/band/posts', { band_key: bandKey, locale: 'ko_KR' }).items || [];
    } catch (e) {
      console.error('[' + bands[bandKey] + '] 게시글 조회 실패: ' + e);
      return;
    }
    var newest = posts.reduce(function (m, p) { return Math.max(m, p.created_at); }, 0);
    var since = lastSeen[bandKey];
    if (since === undefined) {         // 처음 보는 밴드: 기준점만 기록
      lastSeen[bandKey] = newest;
      return;
    }
    posts.forEach(function (p) {
      if (p.created_at > since && matchesKeyword(p.content || '')) {
        hits.push({ band: bands[bandKey], post: p });
      }
    });
    lastSeen[bandKey] = Math.max(since, newest);
  });

  hits.sort(function (a, b) { return a.post.created_at - b.post.created_at; });
  hits.forEach(function (h) {
    var msg = buildMessage(h.band, h.post, new Date());
    if (msg) notify(msg);
  });

  props.setProperty('lastSeen', JSON.stringify(lastSeen));
  console.log('밴드 ' + Object.keys(bands).length + '개 확인, 키워드 글 ' + hits.length + '건');
}

// ---------------------------------------------------------------- 밴드

function bandGet(path, params) {
  var q = Object.keys(params || {}).map(function (k) {
    return k + '=' + encodeURIComponent(params[k]);
  });
  q.push('access_token=' + encodeURIComponent(CONFIG.BAND_ACCESS_TOKEN));
  var res = JSON.parse(UrlFetchApp.fetch(BAND_API + path + '?' + q.join('&')).getContentText());
  if (res.result_code !== 1) throw new Error('Band API ' + path + ' 오류: ' + JSON.stringify(res));
  return res.result_data;
}

function listBands() {
  var all = {};
  bandGet('/v2.1/bands').bands.forEach(function (b) { all[b.band_key] = b.name; });
  if (!CONFIG.BAND_KEYS.length) return all;
  var picked = {};
  CONFIG.BAND_KEYS.forEach(function (k) { picked[k] = all[k] || k; });
  return picked;
}

function matchesKeyword(text) {
  return CONFIG.KEYWORDS.some(function (k) { return text.indexOf(k) !== -1; });
}

// ---------------------------------------------------------------- 공고 판단

/** 알림 메시지를 만든다. 보낼 필요가 없으면 null. */
function buildMessage(bandName, post, now) {
  var content = (post.content || '').trim();
  var today = dayKey(now);
  var dates = extractDates(content, now).filter(function (d) { return d >= today; });
  var header = '📢 [' + bandName + '] 강사 공고\n' +
    formatDateTime(new Date(post.created_at)) + ' · ' + ((post.author || {}).name || '');

  if (!dates.length) {
    if (extractDates(content, now).length) return null;   // 날짜가 전부 지난 공고
    if (!CONFIG.NOTIFY_UNDATED) return null;
    return header + '\n⚠ 날짜를 못 읽었어요. 직접 확인해 주세요.\n\n' + content;
  }

  var busy = busyDays(dates[0], dates[dates.length - 1]);
  var free = dates.filter(function (d) { return !busy[d]; });
  if (!free.length) return null;                           // 전부 일정 있는 날

  var taken = dates.filter(function (d) { return busy[d]; });
  var lines = ['✅ 비어 있는 날: ' + free.map(prettyDay).join(', ')];
  if (taken.length) lines.push('❌ 일정 있는 날: ' + taken.map(prettyDay).join(', '));
  return header + '\n' + lines.join('\n') + '\n\n' + content;
}

/**
 * 글에서 날짜를 'yyyy-MM-dd' 목록으로 뽑는다(중복 제거, 정렬).
 * 지원: 2026.11.17 / 2026-11-17 / 2026년 11월 17일 / 11월 17일 / 11/17 / 11.17(화)
 *       범위 11/17~11/20, 11월 17일~19일, 11.17~20 / 나열 12월 3일, 10일, 17일
 */
function extractDates(text, now) {
  var out = {};
  var nowYear = now.getFullYear();
  var re = /(?:(20\d{2})\s*[.\-\/년]\s*)?(\d{1,2})\s*(?:월\s*(\d{1,2})\s*일?|[.\/](\d{1,2})(?![\d:]))(?:\s*\([^)]{1,3}\))?(?:\s*[~∼\-–]\s*(?:(\d{1,2})\s*(?:월|[.\/])\s*)?(\d{1,2})(?![\d:.\/])\s*일?)?|(\d{1,2})\s*일/g;
  var lastYear = null, lastMonth = null, lastEnd = -1, m;

  while ((m = re.exec(text)) !== null) {
    var before = text.charAt(m.index - 1);
    if (/\d/.test(before)) continue;                       // 전화번호 등 숫자 중간
    if (m[7] !== undefined) {                              // "3일, 10일"처럼 나열된 일 — 앞 날짜의 달을 이어받음
      var gap = lastEnd < 0 ? 'x' : text.slice(lastEnd, m.index);
      if (lastMonth !== null && /^[\s,、·및]+$/.test(gap)) {
        add(lastYear, lastMonth, +m[7]);
        lastEnd = re.lastIndex;
      }
      continue;
    }
    var month = +m[2], day = +(m[3] || m[4]);
    if (!validMD(month, day)) continue;
    var year = m[1] ? +m[1] : null;
    add(year, month, day);
    lastYear = year; lastMonth = month; lastEnd = re.lastIndex;
    if (m[6] !== undefined) {                              // 범위
      var endMonth = m[5] !== undefined ? +m[5] : month, endDay = +m[6];
      if (!validMD(endMonth, endDay)) continue;
      var start = toDate(year, month, day), end = toDate(year, endMonth, endDay);
      if (end < start) end = new Date(end.getFullYear() + 1, end.getMonth(), end.getDate());
      if ((end - start) / DAY_MS > 62) continue;           // 너무 긴 기간은 무시
      for (var d = new Date(start); d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        out[dayKey(d)] = true;
      }
      lastMonth = endMonth;
    }
  }
  return Object.keys(out).sort();

  function validMD(mo, da) { return mo >= 1 && mo <= 12 && da >= 1 && da <= 31; }
  function toDate(y, mo, da) {
    if (y) return new Date(y, mo - 1, da);
    var d = new Date(nowYear, mo - 1, da);
    if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60)) d = new Date(nowYear + 1, mo - 1, da);
    return d;
  }
  function add(y, mo, da) { if (validMD(mo, da)) out[dayKey(toDate(y, mo, da))] = true; }
}

/** firstDay~lastDay 사이에 일정(캘린더 이벤트·할 일)이 있는 날 { 'yyyy-MM-dd': true } */
function busyDays(firstDay, lastDay) {
  var start = parseDay(firstDay), end = new Date(parseDay(lastDay).getTime() + DAY_MS);
  var busy = {};
  CONFIG.CALENDAR_IDS.forEach(function (id) {
    var cal = id === 'primary' ? CalendarApp.getDefaultCalendar() : CalendarApp.getCalendarById(id);
    if (!cal) return;
    cal.getEvents(start, end).forEach(function (ev) {
      var s = ev.isAllDayEvent() ? ev.getAllDayStartDate() : ev.getStartTime();
      var e = ev.isAllDayEvent() ? ev.getAllDayEndDate() : ev.getEndTime();
      var last = dayKey(new Date(e.getTime() - 1));       // 종료 시각은 포함하지 않음
      for (var d = s; ; d = new Date(d.getTime() + DAY_MS)) {
        busy[dayKey(d)] = true;
        if (dayKey(d) >= last) break;
      }
    });
  });
  if (CONFIG.USE_TASKS) {
    var dueMin = firstDay + 'T00:00:00.000Z', dueMax = lastDay + 'T23:59:59.000Z';
    (Tasks.Tasklists.list().items || []).forEach(function (list) {
      var pageToken;
      do {
        var page = Tasks.Tasks.list(list.id, {
          dueMin: dueMin, dueMax: dueMax, showCompleted: true, showHidden: true,
          maxResults: 100, pageToken: pageToken
        });
        (page.items || []).forEach(function (t) { if (t.due) busy[t.due.slice(0, 10)] = true; });
        pageToken = page.nextPageToken;
      } while (pageToken);
    });
  }
  return busy;
}

// ---------------------------------------------------------------- 날짜 도우미

function dayKey(d) { return Utilities.formatDate(d, CONFIG.TIME_ZONE, 'yyyy-MM-dd'); }
function parseDay(s) { var p = s.split('-'); return new Date(+p[0], p[1] - 1, +p[2]); }
function prettyDay(s) {
  var d = parseDay(s);
  return (d.getMonth() + 1) + '/' + d.getDate() + '(' + WEEKDAYS[d.getDay()] + ')';
}
function formatDateTime(d) { return Utilities.formatDate(d, CONFIG.TIME_ZONE, 'MM/dd HH:mm'); }

// ---------------------------------------------------------------- 알림

function notify(text) {
  var sent = false;
  [sendTelegram, sendKakao, sendEmail].forEach(function (send) {
    try { sent = send(text) || sent; } catch (e) { console.error('알림 실패: ' + e); }
  });
  if (!sent) console.log('[알림 채널 없음]\n' + text);
}

function sendEmail(text) {
  if (!CONFIG.NOTIFY_EMAIL) return false;
  var subject = text.split('\n')[0].slice(0, 80);
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), subject, text);
  return true;
}

function sendTelegram(text) {
  if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) return false;
  UrlFetchApp.fetch('https://api.telegram.org/bot' + CONFIG.TELEGRAM_BOT_TOKEN + '/sendMessage', {
    method: 'post',
    payload: { chat_id: CONFIG.TELEGRAM_CHAT_ID, text: text.slice(0, 4000), disable_web_page_preview: 'true' }
  });
  return true;
}

function sendKakao(text) {
  if (!CONFIG.KAKAO_REST_API_KEY || !CONFIG.KAKAO_REFRESH_TOKEN) return false;
  var props = PropertiesService.getScriptProperties();
  var payload = {
    grant_type: 'refresh_token',
    client_id: CONFIG.KAKAO_REST_API_KEY,
    refresh_token: props.getProperty('kakaoRefreshToken') || CONFIG.KAKAO_REFRESH_TOKEN
  };
  if (CONFIG.KAKAO_CLIENT_SECRET) payload.client_secret = CONFIG.KAKAO_CLIENT_SECRET;
  var tok = JSON.parse(UrlFetchApp.fetch('https://kauth.kakao.com/oauth/token',
    { method: 'post', payload: payload }).getContentText());
  if (tok.refresh_token) props.setProperty('kakaoRefreshToken', tok.refresh_token);  // 자동 연장

  var short = text.length <= 200 ? text : text.slice(0, 197) + '...';
  UrlFetchApp.fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
    method: 'post',
    headers: { Authorization: 'Bearer ' + tok.access_token },
    payload: { template_object: JSON.stringify({
      object_type: 'text', text: short,
      link: { web_url: 'https://band.us', mobile_web_url: 'https://band.us' },
      button_title: '밴드에서 보기'
    }) }
  });
  return true;
}

const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/root/.claude/skills/synced/10f8f65c-fcdd-4fae-a6fc-cb9fd5202757_aa0e37c3-f9a2-4efb-9701-99e663a6d33b/pptx/scripts/apply_theme.js");
const OUT = process.argv[2];
const FONT = "맑은 고딕";
const THEME = { name: "Entry AI Audio", headFontFace: FONT, bodyFontFace: FONT,
  colors: { dk1:"1F2041", lt1:"FFFFFF", dk2:"2B2F7A", lt2:"EEF1FB", accent1:"5B6CF0", accent2:"FFB547",
    accent3:"2DB88F", accent4:"E8466F", accent5:"8C5CE6", accent6:"3D9BE0", hlink:"3D9BE0", folHlink:"8C5CE6" } };
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
pres.title = "엔트리 인공지능 - 오디오 감지";
const C = pres.SchemeColor;
const W = 13.333, H = 7.5;

// Entry block category colors (hex, these are content colors)
const BK = { start:"3FAE49", flow:"3D9BE0", looks:"E8466F", ai:"7B52D6", move:"A04FDB", sound:"52B23A", calc:"F2A33A", data:"E58A2E", judge:"4DB6E8" };

pres.defineSlideMaster({ title:"TITLE", background:{ color:C.text1 }, objects:[], slideNumber:undefined });
pres.defineSlideMaster({ title:"DIVIDER", background:{ color:C.text2 }, objects:[] });
pres.defineSlideMaster({ title:"CONTENT", background:{ color:C.background1 },
  objects:[ { placeholder:{ options:{ name:"title", type:"title", x:0.6, y:0.35, w:12.1, h:0.8, fontSize:30, bold:true, color:C.text1, valign:"middle", margin:0 }, text:"" } } ],
  slideNumber:{ x:12.35, y:6.95, w:0.6, h:0.35, fontSize:11, color:"8A8FB5", align:"right" } });

let curSection = "";
function add(master){ return pres.addSlide({ masterName: master, sectionTitle: curSection }); }
function section(t){ curSection = t; pres.addSection({ title: t }); }
function tb(s, text, o){ s.addText(text, Object.assign({ isTextBox:true, margin:0, fontSize:16, color:C.text1, valign:"top" }, o)); }
function chip(s, x, y, text, fill, o={}){
  const w = o.w || (text.length*0.17+0.5);
  s.addText(text, { isTextBox:true, x, y, w, h:o.h||0.4, shape:pres.shapes.ROUNDED_RECTANGLE, rectRadius:0.2, fill:{color:fill}, color:o.color||"FFFFFF", fontSize:o.fs||13, bold:true, align:"center", valign:"middle", margin:0 });
  return w;
}


const IMGDIR = process.argv[3];
function pngSize(f){ const b=require("fs").readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; }
function codeImg(s, key, x, y, maxW, maxH, fixedH){
  const f = IMGDIR+"/"+key+".png"; const [pw,ph] = pngSize(f);
  let w = pw/2/96, h = ph/2/96;            // CSS px at 2x -> inches
  let k = fixedH ? fixedH/h : Math.min(1, maxW/w, maxH/h);
  s.addImage({ path:f, x, y, w:w*k, h:h*k, altText:key });
  return w*k;
}
// ---------- Entry code-block renderer ----------
// line: {k:"hat"|"cmd"|"open"|"else"|"close", c:color, r:[ "text", {v:"value"} ...]}
function runs(r){ return r.map(p => typeof p === "string" ? { text:p, options:{ color:"FFFFFF", bold:true } } : { text:" "+p.v+" ", options:{ color:"1F2041", bold:true, highlight:"FFF3B0" } }); }
function rlen(r){ return r.reduce((a,p)=>a+(typeof p==="string"?p:p.v+"  ").length,0); }
function code(s, x, y, lines, fs=13, LH=0.42){
  const IND = 0.32, CH = fs*0.0135;
  let cy = y; const stack = [];
  for (const ln of lines){
    const lvl = stack.length;
    if (ln.k === "close"){
      const o = stack.pop();
      s.addShape(pres.shapes.RECTANGLE, { x:o.x, y:o.y+LH-0.02, w:0.3, h:cy-(o.y+LH)+0.04, fill:{color:o.c}, line:{color:o.c, width:0} });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:o.x, y:cy, w:1.6, h:0.2, rectRadius:0.06, fill:{color:o.c}, line:{color:o.c,width:0} });
      cy += 0.26; continue;
    }
    if (ln.k === "else"){
      const o = stack[stack.length-1];
      s.addShape(pres.shapes.RECTANGLE, { x:o.x, y:o.y+LH-0.02, w:0.3, h:cy-(o.y+LH)+0.04, fill:{color:o.c}, line:{color:o.c, width:0} });
      s.addText(runs(ln.r), { isTextBox:true, x:o.x, y:cy, w:1.6, h:LH-0.04, shape:pres.shapes.ROUNDED_RECTANGLE, rectRadius:0.08, fill:{color:o.c}, fontSize:fs, margin:[0,8,0,8], valign:"middle" });
      o.y = cy; cy += LH; continue;
    }
    const bx = x + (ln.k==="hat"?0:lvl*IND) ;
    const w = rlen(ln.r)*CH + 0.45;
    s.addText(runs(ln.r), { isTextBox:true, x:bx, y:cy, w, h:LH-0.04, shape:pres.shapes.ROUNDED_RECTANGLE, rectRadius:ln.k==="hat"?0.18:0.08,
      fill:{color:ln.c}, fontSize:fs, margin:[0,8,0,8], valign:"middle" });
    if (ln.k === "open") stack.push({ x:bx, y:cy, c:ln.c });
    cy += LH;
  }
  return cy;
}
function codePanel(s, x, y, w, h, objName){
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius:0.12, fill:{color:"F6F7FC"}, line:{color:"D9DDF0", width:1} });
  tb(s, "▸ 오브젝트: "+objName, { x:x+0.25, y:y+0.18, w:w-0.5, h:0.3, fontSize:12, color:"6B7099", bold:true });
}
function stepCard(s, x, y, w, h, num, title, body, col){
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius:0.12, fill:{color:C.background2}, line:{color:C.background2, width:0} });
  s.addShape(pres.shapes.OVAL, { x:x+0.25, y:y+0.25, w:0.55, h:0.55, fill:{color:col} });
  tb(s, String(num), { x:x+0.25, y:y+0.25, w:0.55, h:0.55, fontSize:String(num).length>2?11:18, bold:true, color:"FFFFFF", align:"center", valign:"middle" });
  tb(s, title, { x:x+0.95, y:y+0.25, w:w-1.15, h:0.55, fontSize:17, bold:true, valign:"middle" });
  tb(s, body, { x:x+0.3, y:y+0.95, w:w-0.6, h:h-1.1, fontSize:14, color:"3A3E66" });
}
function tip(s, x, y, w, h, text){
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius:0.12, fill:{color:"FFF4DD"}, line:{color:"FFD58A", width:1} });
  chip(s, x+0.2, y+0.2, "TIP", "FFB547", { w:0.7, h:0.34, fs:12, color:"1F2041" });
  tb(s, text, { x:x+0.2, y:y+0.65, w:w-0.4, h:h-0.8, fontSize:14, color:"5A4A20" });
}

// ================== SLIDES ==================
section("시작");
// 1 Title
{ const s = add("TITLE");
  // mic icon motif: concentric sound circles
  [3.2,2.5,1.8].forEach((d,i)=> s.addShape(pres.shapes.OVAL, { x:10.2-d/2, y:3.75-d/2, w:d, h:d, fill:{color:"5B6CF0", transparency:70+i*8}, line:{color:"5B6CF0", width:0} }));
  s.addShape(pres.shapes.OVAL, { x:9.6, y:3.15, w:1.2, h:1.2, fill:{color:"2DB88F"} });
  tb(s, "🎤", { x:9.6, y:3.15, w:1.2, h:1.2, fontSize:40, align:"center", valign:"middle", color:"FFFFFF" });
  chip(s, 0.8, 1.6, "엔트리 인공지능 · 오디오 감지", "2DB88F", { w:3.6, h:0.45, fs:15 });
  tb(s, "목소리로 움직이는\n인공지능 프로그램", { x:0.8, y:2.3, w:8, h:2.0, fontSize:44, bold:true, color:"FFFFFF" });
  tb(s, "Chapter 04  열려라, 미래도시!\nChapter 05  스마트 스피커의 이름을 불러줘!", { x:0.8, y:4.6, w:8, h:1.0, fontSize:18, color:"C9CDF5", paraSpaceAfter:4 });
  tb(s, "준비물: 컴퓨터 · 마이크 · 스피커(헤드셋) · 크롬 브라우저", { x:0.8, y:6.4, w:9, h:0.4, fontSize:14, color:"8A8FC8" });
}
// 2 Overview
{ const s = add("CONTENT"); s.addText("오늘 배울 내용", { placeholder:"title" });
  const cards = [
    ["04", "열려라, 미래도시!", "오디오 감지", "주문을 외치면 회색도시가 열리고\n명수가 미래도시로 이동해요.", ["마이크 연결 확인","음성 인식하기","인식 결과로 장면 바꾸기"], "5B6CF0"],
    ["05", "스마트 스피커의 이름을 불러줘!", "오디오 감지 + 읽어주기", "이름을 지어 준 스마트 스피커가\n날씨를 알려주고 음악을 틀어줘요.", ["문자를 음성으로 읽어주기","이름 부르기로 명령 시작","'날씨'·'음악' 단어 찾기"], "2DB88F"] ];
  cards.forEach((c,i)=>{ const x = 0.6+i*6.15, y=1.45, w=5.95, h=5.3;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius:0.15, fill:{color:C.background2}, line:{color:C.background2,width:0} });
    tb(s, "Chapter "+c[0], { x:x+0.4, y:y+0.35, w:3, h:0.4, fontSize:15, bold:true, color:c[5] });
    tb(s, c[1], { x:x+0.4, y:y+0.8, w:w-0.8, h:0.6, fontSize:24, bold:true });
    chip(s, x+0.4, y+1.5, c[2], c[5], { fs:13 });
    tb(s, c[3], { x:x+0.4, y:y+2.15, w:w-0.8, h:0.9, fontSize:15, color:"3A3E66" });
    c[4].forEach((t,j)=>{ s.addShape(pres.shapes.OVAL, { x:x+0.4, y:y+3.3+j*0.6, w:0.38, h:0.38, fill:{color:c[5]} });
      tb(s, String(j+1), { x:x+0.4, y:y+3.3+j*0.6, w:0.38, h:0.38, fontSize:13, bold:true, color:"FFFFFF", align:"center", valign:"middle" });
      tb(s, t, { x:x+0.95, y:y+3.3+j*0.6, w:w-1.4, h:0.38, fontSize:15, valign:"middle" }); });
  });
}
// 3 What is speech recognition
{ const s = add("CONTENT"); s.addText("인공지능은 어떻게 내 말을 알아들을까?", { placeholder:"title" });
  const steps = [["🎤","소리 입력","마이크로 목소리를\n받아들여요","5B6CF0"],["〰","디지털 변환","소리를 컴퓨터가 아는\n데이터로 바꿔요","8C5CE6"],["가","문자로 변환 (STT)","음성을 글자로 바꿔요\n= 음성을 문자로 바꾼 값","2DB88F"],["🔊","음성으로 변환 (TTS)","글자를 다시 목소리로\n= 읽어주기","FFB547"]];
  steps.forEach((st,i)=>{ const x=0.6+i*3.12, y=1.6;
    s.addShape(pres.shapes.OVAL, { x:x+0.85, y, w:1.2, h:1.2, fill:{color:st[3]} });
    tb(s, st[0], { x:x+0.85, y, w:1.2, h:1.2, fontSize:30, bold:true, color:"FFFFFF", align:"center", valign:"middle" });
    if (i<3) tb(s, "▶", { x:x+2.55, y:y+0.35, w:0.5, h:0.5, fontSize:20, color:"B5BAE0", align:"center" });
    tb(s, st[1], { x, y:y+1.45, w:2.9, h:0.45, fontSize:18, bold:true, align:"center" });
    tb(s, st[2], { x, y:y+1.95, w:2.9, h:0.9, fontSize:14, color:"4A4F7A", align:"center" });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.6, y:5.0, w:12.1, h:1.6, rectRadius:0.12, fill:{color:C.background2}, line:{color:C.background2,width:0} });
  tb(s, "우리 주변의 음성 인식", { x:0.9, y:5.2, w:5, h:0.4, fontSize:16, bold:true, color:"2B2F7A" });
  tb(s, "스마트 스피커 · 휴대폰 음성 비서 · 자동차 내비게이션 · 자동 자막처럼, 음성 인식 기술은 이미 생활 곳곳에서 쓰이고 있어요. 엔트리의 [오디오 감지] 블록은 NAVER Clova 기술로 음성을 인식합니다. (인터넷 연결 필요)", { x:0.9, y:5.65, w:11.5, h:0.85, fontSize:14, color:"3A3E66" });
}

// ================== CHAPTER 04 ==================
section("Chapter 04 열려라, 미래도시!");
{ const s = add("DIVIDER");
  tb(s, "CHAPTER 04", { x:0.8, y:2.2, w:6, h:0.5, fontSize:20, bold:true, color:"FFB547" });
  tb(s, "열려라, 미래도시!", { x:0.8, y:2.8, w:11, h:1.2, fontSize:54, bold:true, color:"FFFFFF" });
  tb(s, "AI 블록: 오디오 감지  |  예제 파일 04-01(예제).ent  →  완성 파일 04-01(완성).ent", { x:0.8, y:4.2, w:11.5, h:0.5, fontSize:17, color:"C9CDF5" });
}
// mission
{ const s = add("CONTENT"); s.addText("미션: 주문을 외쳐 미래도시로!", { placeholder:"title" });
  // story box left
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.6, y:1.45, w:6.3, h:5.3, rectRadius:0.15, fill:{color:"2B2F7A"}, line:{color:"2B2F7A",width:0} });
  tb(s, "인공지능 이야기", { x:1.0, y:1.75, w:5, h:0.4, fontSize:16, bold:true, color:"FFB547" });
  tb(s, "회색도시에 갇힌 명수가 있어요.\n마이크에 \"열려라 참깨\"라고 외치면 회색 건물이 양옆으로 열리고, 명수는 미래도시로 이동해요.", { x:1.0, y:2.25, w:5.5, h:1.9, fontSize:17, color:"FFFFFF", paraSpaceAfter:6 });
  s.addText("우와~ 미래도시다!!", { isTextBox:true, x:1.0, y:4.55, w:3.6, h:0.7, shape:pres.shapes.ROUNDED_RECTANGLE, rectRadius:0.2, fill:{color:"FFFFFF"}, fontSize:18, bold:true, color:"2B2F7A", align:"center", valign:"middle", margin:0 });
  tb(s, "※ 음성을 문자로 바꾼 값이 \"열려라 참깨\"와 같은지 판단해요.", { x:1.0, y:5.6, w:5.6, h:0.8, fontSize:13, color:"C9CDF5" });
  // goals right
  tb(s, "학습 목표", { x:7.3, y:1.5, w:5, h:0.4, fontSize:18, bold:true, color:"5B6CF0" });
  const g = ["엔트리의 [오디오 감지] 명령블록을 불러옵니다.","마이크가 연결되면 음성을 인식하도록 코딩합니다.","음성을 인식하여 인식된 결과에 따라 배경이 변경되도록 코딩합니다."];
  g.forEach((t,i)=>{ const y=2.05+i*0.95;
    s.addShape(pres.shapes.OVAL, { x:7.3, y, w:0.5, h:0.5, fill:{color:"5B6CF0"} });
    tb(s, String(i+1), { x:7.3, y, w:0.5, h:0.5, fontSize:16, bold:true, color:"FFFFFF", align:"center", valign:"middle" });
    tb(s, t, { x:7.95, y, w:4.8, h:0.8, fontSize:15, valign:"top" }); });
  tb(s, "필요한 오브젝트", { x:7.3, y:5.0, w:5, h:0.4, fontSize:16, bold:true, color:"5B6CF0" });
  let cx=7.3; ["명수","미래도시","회색도시_왼쪽","회색도시_오른쪽"].forEach((t,i)=>{ cx += chip(s, cx, 5.5+(i>1?0.55:0)-(0), t, "8C5CE6", { fs:13 })+0.15; if(i===1) cx=7.3; });
}
// blocks & devices
{ const s = add("CONTENT"); s.addText("주요 인공지능 블록과 필요 장치", { placeholder:"title" });
  const rows = [["k_mic","마이크가 연결되었는가?","판단 블록 – 마이크가 연결되어 있으면 '참'이 돼요. '~이(가) 될 때까지 기다리기'와 함께 써요."],
    ["k_rec","음성 인식하기","마이크로 들어온 목소리를 인식해요. 실행되면 녹음 창이 나타나요."],
    ["k_stt","음성을 문자로 바꾼 값","인식한 목소리를 글자로 바꾼 값이에요. 이 값을 비교해서 조건을 만들어요."]];
  rows.forEach((r,i)=>{ const y=1.6+i*1.3;
    codeImg(s, r[0], 0.6, y+0.1, 3.7, 0.7, 0.62);
    tb(s, r[2], { x:4.5, y:y, w:5.0, h:0.9, fontSize:15, color:"3A3E66", valign:"middle" }); });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:9.9, y:1.6, w:2.8, h:3.6, rectRadius:0.15, fill:{color:C.background2}, line:{color:C.background2,width:0} });
  tb(s, "🎤", { x:9.9, y:1.9, w:2.8, h:1.4, fontSize:60, align:"center", valign:"middle" });
  tb(s, "마이크", { x:9.9, y:3.4, w:2.8, h:0.5, fontSize:20, bold:true, align:"center" });
  tb(s, "컴퓨터에 먼저\n연결해 두세요", { x:9.9, y:3.95, w:2.8, h:0.9, fontSize:14, color:"4A4F7A", align:"center" });
  tip(s, 0.6, 5.55, 12.1, 1.25, "오디오 감지 블록은 인터넷이 연결되어 있어야 동작해요. IE/Safari 브라우저는 지원하지 않으니 크롬(Chrome)을 사용하세요.");
}
// setup steps
{ const s = add("CONTENT"); s.addText("준비하기: 오디오 감지 블록 불러오기", { placeholder:"title" });
  const st = [["마이크 연결","컴퓨터에 '마이크'를 연결합니다."],
    ["엔트리 접속","크롬에서 playentry.org 접속 → 로그인 → [만들기] → [작품 만들기]"],
    ["예제 불러오기","[새로 만들기] → [오프라인 작품 불러오기] → '04-01(예제).ent' 선택"],
    ["AI 블록 추가","[인공지능] → [인공지능 블록 불러오기] → [오디오 감지] 선택 → [불러오기]"]];
  st.forEach((t,i)=> stepCard(s, 0.6+i*3.1, 1.6, 2.9, 3.3, i+1, t[0], t[1], ["5B6CF0","8C5CE6","3D9BE0","2DB88F"][i]));
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.6, y:5.3, w:12.1, h:1.4, rectRadius:0.12, fill:{color:"F6F7FC"}, line:{color:"D9DDF0",width:1} });
  tb(s, "불러오기가 끝나면 [인공지능] 꾸러미에 이런 블록이 생겨요", { x:0.9, y:5.45, w:11, h:0.4, fontSize:14, bold:true, color:"6B7099" });
  let x=0.9; ["k_mic","k_rec","k_stt"].forEach(t=>{ x += codeImg(s, t, x, 5.88, 4, 0.6, 0.6)+0.3; });
}
// code 1
{ const s = add("CONTENT"); s.addText("코딩 ① 시작하면 주문을 요청해요", { placeholder:"title" });
  codePanel(s, 0.6, 1.45, 7.0, 5.3, "명수");
  codeImg(s, "c04_1", 0.9, 2.0, 6.5, 4.6);
  stepCard(s, 8.0, 1.45, 4.7, 2.4, 4, "말하기", "'명수'를 선택하고 [시작], [생김새] 블록으로 2초 동안 \"주문을 외쳐주세요!\"를 말하게 해요.", "E8466F");
  stepCard(s, 8.0, 4.05, 4.7, 2.7, 5, "마이크 확인 후 신호", "[흐름], [인공지능] 블록으로 마이크가 연결될 때까지 기다린 뒤 '주문' 신호를 보내요.\n※ 신호는 [속성] 탭 → [신호 추가하기]로 먼저 만들어요.", "3D9BE0");
}
// code 2
{ const s = add("CONTENT"); s.addText("코딩 ② 주문을 듣고 맞는지 판단해요", { placeholder:"title" });
  codePanel(s, 0.6, 1.45, 7.0, 5.3, "명수");
  codeImg(s, "c04_2", 0.9, 2.0, 6.5, 4.6);
  stepCard(s, 8.0, 1.45, 4.7, 2.0, 6, "음성 인식", "'주문' 신호를 받으면 [인공지능]의 음성 인식하기를 실행해요.", "7B52D6");
  stepCard(s, 8.0, 3.65, 4.7, 3.1, 7, "조건 판단", "인식한 값이 \"열려라 참깨\"면 → '열림' 신호\n아니면 → 1초 동안 실패 메시지를 말하고 '주문' 신호를 다시 보내 재도전!", "3D9BE0");
}
// code 3
{ const s = add("CONTENT"); s.addText("코딩 ③ 미래도시 도착! 만세 동작", { placeholder:"title" });
  codePanel(s, 0.6, 1.45, 7.0, 5.3, "명수");
  codeImg(s, "c04_3", 0.9, 2.0, 6.5, 4.6);
  stepCard(s, 8.0, 1.45, 4.7, 1.7, 8, "도착 인사", "1초 뒤 \"우와! 미래도시다!!\"를 2초 동안 말해요.", "E8466F");
  stepCard(s, 8.0, 3.3, 4.7, 1.7, 9, "만세 동작", "모양을 0.3초마다 10번 바꿔 만세하는 모습을 표현해요.", "FFB547");
  stepCard(s, 8.0, 5.15, 4.7, 1.6, 10, "프로그램 종료", "[흐름]의 모든 코드 멈추기로 끝내요.", "3D9BE0");
}
// code 4
{ const s = add("CONTENT"); s.addText("코딩 ④ 회색도시가 양옆으로 열려요", { placeholder:"title" });
  codePanel(s, 0.6, 1.45, 5.95, 3.0, "회색도시_왼쪽");
  codeImg(s, "c04_4L", 0.9, 2.0, 5.4, 1.85);
  codePanel(s, 6.75, 1.45, 5.95, 3.0, "회색도시_오른쪽");
  codeImg(s, "c04_4R", 7.05, 2.0, 5.4, 1.85);
  tb(s, "◀ 왼쪽으로 -5씩 × 50번", { x:0.9, y:3.95, w:5, h:0.35, fontSize:13, bold:true, color:"A04FDB" });
  tb(s, "오른쪽으로 +5씩 × 50번 ▶", { x:7.05, y:3.95, w:5, h:0.35, fontSize:13, bold:true, color:"A04FDB" });
  tip(s, 0.6, 4.75, 12.1, 2.0, "'회색도시_왼쪽'에서 완성한 코드를 마우스 오른쪽 버튼으로 클릭 → [코드 복사] → '회색도시_오른쪽'의 블록 조립소에서 마우스 오른쪽 버튼 → [붙여넣기]. 그다음 -5를 5로만 바꾸면 빠르게 완성돼요!");
}
// flow & run
{ const s = add("CONTENT"); s.addText("실행하기: 프로그램 흐름 한눈에 보기", { placeholder:"title" });
  const nodes = [["시작","주문을 외쳐주세요!","3FAE49"],["마이크 확인","연결될 때까지 대기","3D9BE0"],["음성 인식","주문 신호","7B52D6"],["판단","= 열려라 참깨 ?","3D9BE0"],["열림!","도시 열림 + 만세","E8466F"]];
  nodes.forEach((n,i)=>{ const x=0.6+i*2.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y:1.8, w:2.1, h:1.5, rectRadius:0.15, fill:{color:n[2]}, line:{color:n[2],width:0} });
    tb(s, n[0], { x, y:1.95, w:2.1, h:0.5, fontSize:18, bold:true, color:"FFFFFF", align:"center" });
    tb(s, n[1], { x:x+0.1, y:2.5, w:1.9, h:0.65, fontSize:13, color:"FFFFFF", align:"center" });
    if(i<4) tb(s, "▶", { x:x+2.1, y:2.3, w:0.4, h:0.5, fontSize:18, color:"B5BAE0", align:"center" }); });
  // retry loop
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:5.6, y:3.65, w:4.6, h:0.75, rectRadius:0.15, fill:{color:"FFE3EA"}, line:{color:"E8466F",width:1} });
  tb(s, "↺ 틀리면: \"실패! 다시 외쳐주세요!\" → 다시 음성 인식", { x:5.7, y:3.65, w:4.4, h:0.75, fontSize:13, bold:true, color:"B0284E", align:"center", valign:"middle" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.6, y:4.8, w:12.1, h:1.9, rectRadius:0.12, fill:{color:C.background2}, line:{color:C.background2,width:0} });
  tb(s, "13  직접 해 보기", { x:0.9, y:5.0, w:6, h:0.4, fontSize:17, bold:true, color:"2B2F7A" });
  tb(s, [{ text:"[시작하기]를 누르고 녹음 창이 뜨면 마이크에 \"열려라 참깨\"를 말해 보세요.", options:{ breakLine:true } },
    { text:"인식이 잘 안 되면? 또박또박 천천히 말하기 · 주변 소음 줄이기 · 마이크 권한 '허용' 확인하기" , options:{ color:"5A5F8A" } }],
    { x:0.9, y:5.5, w:11.5, h:1.0, fontSize:15, paraSpaceAfter:6 });
}
// more 04
{ const s = add("CONTENT"); s.addText("더 만들어 보기 (Chapter 04)", { placeholder:"title" });
  const ex = [["예제 1","스마트 시티 드론","04-02(예제).ent","5B6CF0",
      ["'스마트 드론'이 계속해서 움직이며 사람의 음성을 인식합니다.","음성을 문자로 바꾼 값이 '도와주세요'면 '경찰차'가 출동합니다.","음성 인식에 실패하면 다시 음성을 인식하도록 합니다."],"\"경찰이 출동합니다!\""],
    ["예제 2","사물인터넷 스마트 홈","04-03(예제).ent","2DB88F",
      ["마이크가 연결되면 '사물인터넷'이 음성을 인식합니다.","'취침'이면 '전등'이 꺼지고 '커튼'이 닫힙니다.","'기상'이면 '전등'이 켜지고 '커튼'이 열립니다.","인식에 실패하면 인식된 음성을 말하고 다시 인식합니다."],"\"안녕히 주무세요\""]];
  ex.forEach((e,i)=>{ const x=0.6+i*6.15, y=1.45, w=5.95, h=5.3;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius:0.15, fill:{color:C.background2}, line:{color:C.background2,width:0} });
    chip(s, x+0.35, y+0.35, e[0], e[3], { w:1.1, fs:14 });
    tb(s, e[1], { x:x+1.6, y:y+0.33, w:w-1.9, h:0.45, fontSize:20, bold:true, valign:"middle" });
    tb(s, "파일: "+e[2], { x:x+0.35, y:y+0.95, w:w-0.7, h:0.35, fontSize:12, color:"6B7099" });
    tb(s, e[4].map((t,j)=>({ text:t, options:{ bullet:{ type:"number" }, breakLine: j<e[4].length-1 } })), { x:x+0.35, y:y+1.45, w:w-0.7, h:2.9, fontSize:15, color:"2A2E55", paraSpaceAfter:8 });
    s.addText(e[5], { isTextBox:true, x:x+0.35, y:y+4.5, w:3.2, h:0.5, shape:pres.shapes.ROUNDED_RECTANGLE, rectRadius:0.2, fill:{color:"FFFFFF"}, line:{color:e[3],width:1.5}, fontSize:14, bold:true, color:e[3], align:"center", valign:"middle", margin:0 });
  });
}

// ================== CHAPTER 05 ==================
section("Chapter 05 스마트 스피커");
{ const s = add("DIVIDER");
  tb(s, "CHAPTER 05", { x:0.8, y:2.2, w:6, h:0.5, fontSize:20, bold:true, color:"2DB88F" });
  tb(s, "스마트 스피커의 이름을 불러줘!", { x:0.8, y:2.8, w:11.5, h:1.2, fontSize:50, bold:true, color:"FFFFFF" });
  tb(s, "AI 블록: 오디오 감지 + 읽어주기  |  확장 블록: 날씨  |  예제 파일 05-01(예제).ent", { x:0.8, y:4.2, w:11.5, h:0.5, fontSize:17, color:"C9CDF5" });
}
{ const s = add("CONTENT"); s.addText("미션: 나만의 스마트 스피커 만들기", { placeholder:"title" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.6, y:1.45, w:6.3, h:5.3, rectRadius:0.15, fill:{color:"1E5E50"}, line:{color:"1E5E50",width:0} });
  tb(s, "인공지능 이야기", { x:1.0, y:1.75, w:5, h:0.4, fontSize:16, bold:true, color:"FFB547" });
  tb(s, "스마트 스피커에 이름을 붙여 주고, 그 이름을 부르면 스피커가 깨어나요.\n\"날씨\"라고 말하면 서울의 기온을 알려주고, \"음악\"이라고 말하면 음악을 틀어줘요.", { x:1.0, y:2.25, w:5.5, h:2.3, fontSize:17, color:"FFFFFF", paraSpaceAfter:6 });
  s.addText("나의 이름을 지어주세요.", { isTextBox:true, x:1.0, y:4.8, w:3.8, h:0.65, shape:pres.shapes.ROUNDED_RECTANGLE, rectRadius:0.2, fill:{color:"FFFFFF"}, fontSize:16, bold:true, color:"1E5E50", align:"center", valign:"middle", margin:0 });
  s.addText("다시 불러주세요.", { isTextBox:true, x:2.6, y:5.65, w:3.2, h:0.65, shape:pres.shapes.ROUNDED_RECTANGLE, rectRadius:0.2, fill:{color:"DFF5EE"}, fontSize:16, bold:true, color:"1E5E50", align:"center", valign:"middle", margin:0 });
  tb(s, "학습 목표", { x:7.3, y:1.5, w:5, h:0.4, fontSize:18, bold:true, color:"2DB88F" });
  const g = ["[오디오 감지], [읽어주기] 명령블록을 불러옵니다.","입력한 문자를 음성으로 변환하여 읽어주도록 코딩합니다.","음성을 문자로 바꾼 값이 입력한 값이면 오브젝트가 작동하도록 코딩합니다.","음성을 문자로 바꾼 값에 따라 해당하는 명령을 실행하도록 코딩합니다."];
  g.forEach((t,i)=>{ const y=2.05+i*0.85;
    s.addShape(pres.shapes.OVAL, { x:7.3, y, w:0.5, h:0.5, fill:{color:"2DB88F"} });
    tb(s, String(i+1), { x:7.3, y, w:0.5, h:0.5, fontSize:16, bold:true, color:"FFFFFF", align:"center", valign:"middle" });
    tb(s, t, { x:7.95, y, w:4.8, h:0.75, fontSize:15 }); });
  tb(s, "필요한 오브젝트 · 장치", { x:7.3, y:5.55, w:5, h:0.4, fontSize:16, bold:true, color:"2DB88F" });
  let cx=7.3; ["스마트 스피커","배경","🎤 마이크","🔊 스피커"].forEach((t,i)=>{ cx += chip(s, cx, 6.05, t, i<2?"8C5CE6":"FFB547", { fs:13, color:i<2?"FFFFFF":"1F2041" })+0.12; });
}
{ const s = add("CONTENT"); s.addText("준비하기: 블록 꾸러미 3개 불러오기", { placeholder:"title" });
  const st = [["장치 연결","컴퓨터에 '마이크'와 '스피커'를 연결합니다."],
    ["예제 불러오기","playentry.org 로그인 후 '05-01(예제).ent' 파일을 불러옵니다."],
    ["AI 블록","[인공지능] → [인공지능 블록 불러오기] → [오디오 감지], [읽어주기] 선택 → [불러오기]"],
    ["확장 블록","[확장] → [확장 블록 불러오기] → [날씨] 선택 → [불러오기]"]];
  st.forEach((t,i)=> stepCard(s, 0.6+i*3.1, 1.6, 2.9, 3.3, i+1, t[0], t[1], ["2DB88F","3D9BE0","7B52D6","E8466F"][i]));
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.6, y:5.3, w:12.1, h:1.4, rectRadius:0.12, fill:{color:"F6F7FC"}, line:{color:"D9DDF0",width:1} });
  tb(s, "새로 쓰는 블록", { x:0.9, y:5.45, w:11, h:0.4, fontSize:14, bold:true, color:"6B7099" });
  let x=0.9; ["k_read","k_stt","k_temp"].forEach(t=>{ x += codeImg(s, t, x, 5.88, 4, 0.6, 0.6)+0.3; });
}
{ const s = add("CONTENT"); s.addText("코딩 ① 스마트 스피커에게 이름 지어주기", { placeholder:"title" });
  codePanel(s, 0.6, 1.45, 7.3, 5.3, "스마트 스피커");
  codeImg(s, "c05_1", 0.9, 2.0, 6.8, 4.6);
  stepCard(s, 8.2, 1.45, 4.5, 2.4, 5, "이름 묻기", "[시작], [자료] 블록으로 이름을 묻고 대답을 기다려요. 입력한 대답이 스피커의 이름이 돼요.", "E58A2E");
  stepCard(s, 8.2, 4.05, 4.5, 2.7, 6, "이름 읽어주기", "[계산]의 합치기 블록으로 \"나의 이름은 ○○(입력한 값)\"을 만들어 읽어준 뒤 '음성 인식' 신호를 보내요.", "7B52D6");
}
{ const s = add("CONTENT"); s.addText("코딩 ② 이름을 부르면 깨어나요", { placeholder:"title" });
  codePanel(s, 0.6, 1.45, 7.3, 5.3, "스마트 스피커");
  codeImg(s, "c05_2", 0.9, 2.0, 6.8, 4.6);
  stepCard(s, 8.2, 1.45, 4.5, 2.25, 7, "이름 듣기", "마이크 연결을 확인하고 안내를 읽어준 뒤 음성을 인식해요. 인식한 값이 '이름+야'면 '작업 명령' 신호를 보내요.", "7B52D6");
  tip(s, 8.2, 3.9, 4.5, 2.85, "'읽어주고 기다리기'는 다 읽은 뒤 다음 블록을 실행하고, '읽어주기'는 읽는 동시에 다음 블록을 실행해요. 음성 인식 전에는 '기다리기'를 써야 스피커 소리가 녹음되지 않아요.");
}
{ const s = add("CONTENT"); s.addText("코딩 ③ 무엇을 도와 드릴까요?", { placeholder:"title" });
  codePanel(s, 0.6, 1.45, 7.6, 5.3, "스마트 스피커");
  codeImg(s, "c05_3a", 0.9, 2.0, 7.1, 4.65);
  stepCard(s, 8.5, 1.45, 4.2, 2.6, 9, "명령 듣기", "'작업 명령' 신호를 받으면 \"무엇을 도와 드릴까요?\"를 읽어준 뒤 음성을 인식해요.", "7B52D6");
}
{ const s = add("CONTENT"); s.addText("코딩 ④ '날씨'가 들어 있나요?", { placeholder:"title" });
  codePanel(s, 0.6, 1.45, 7.6, 5.3, "스마트 스피커");
  codeImg(s, "c05_3b", 0.9, 2.0, 7.1, 4.65);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:8.5, y:1.45, w:4.2, h:2.75, rectRadius:0.12, fill:{color:C.background2}, line:{color:C.background2,width:0} });
  tb(s, "'시작 위치 > 0' 의 뜻", { x:8.75, y:1.65, w:3.8, h:0.4, fontSize:16, bold:true, color:"2B2F7A" });
  tb(s, "\"오늘 날씨 알려줘\"에서 '날씨'는 4번째 글자에서 시작 → 4 > 0 → 참!\n단어가 없으면 시작 위치가 0이라서 거짓이 돼요.", { x:8.75, y:2.1, w:3.75, h:2.0, fontSize:14, color:"3A3E66", paraSpaceAfter:6 });
  stepCard(s, 8.5, 4.4, 4.2, 2.35, 10, "날씨 찾기", "'날씨'가 들어 있으면 '날씨' 신호를 보내고 기다린 뒤 이 코드를 멈춰요.", "3D9BE0");
}
{ const s = add("CONTENT"); s.addText("코딩 ⑤ '음악'도 찾고, 없으면 다시", { placeholder:"title" });
  codePanel(s, 0.6, 1.45, 7.6, 5.3, "스마트 스피커");
  codeImg(s, "c05_3", 0.9, 2.0, 7.1, 4.65);
  stepCard(s, 8.5, 1.45, 4.2, 2.6, 11, "음악 찾기", "⑩과 같은 방법으로 '음악'이 들어 있으면 '음악' 신호를 보내요.", "3D9BE0");
  stepCard(s, 8.5, 4.25, 4.2, 2.5, 12, "다시 듣기", "'날씨'나 '음악'이 없으면 다시 '작업 명령' 신호를 보내요.", "4AA84E");
}
{ const s = add("CONTENT"); s.addText("코딩 ⑥ 날씨 알려주기 · 음악 틀기", { placeholder:"title" });
  codePanel(s, 0.6, 1.45, 6.2, 3.6, "스마트 스피커 – 날씨");
  codeImg(s, "c05_4w", 0.9, 2.0, 5.7, 2.9);
  codePanel(s, 7.0, 1.45, 5.7, 3.6, "스마트 스피커 – 음악");
  codeImg(s, "c05_4m", 7.3, 2.0, 5.2, 2.9);
  tip(s, 0.6, 5.3, 6.2, 1.45, "날씨 블록의 지역 목록 버튼(▼)을 눌러 우리 지역으로 바꿔 보세요.");
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:7.0, y:5.3, w:5.7, h:1.45, rectRadius:0.12, fill:{color:C.background2}, line:{color:C.background2,width:0} });
  tb(s, "15  직접 해 보기", { x:7.25, y:5.45, w:5, h:0.35, fontSize:15, bold:true, color:"2B2F7A" });
  tb(s, "이름 입력 → 마이크로 이름 부르기 → \"날씨\" 또는 \"음악\"이라고 말해 보세요.", { x:7.25, y:5.85, w:5.25, h:0.8, fontSize:14, color:"3A3E66" });
}
{ const s = add("CONTENT"); s.addText("더 만들어 보기 (Chapter 05)", { placeholder:"title" });
  const ex = [["예제 1","긴급 상황 도우미","05-02(예제).ent","E8466F",
      ["음성을 문자로 바꾼 값이 '긴급'이면 '도움 요청' 신호를 보냅니다.","'도움 요청' 신호를 받으면 다시 음성을 인식합니다.","'소화기'가 포함되어 있으면 소화기 사용법을 읽어줍니다.","'119'가 포함되어 있으면 사이렌이 울립니다."],"\"119 신고\""],
    ["예제 2","목소리 금고","05-03(예제).ent","FFB547",
      ["4자리 숫자를 입력하면 입력한 값을 '비밀번호'로 지정합니다.","'금고'를 클릭하면 음성을 인식합니다.","'열림'이면 음성으로 비밀번호를 인식시켜 '금고'를 엽니다.","'잠금'이면 금고가 잠깁니다."],"\"4자리 비밀번호를 입력하세요\""]];
  ex.forEach((e,i)=>{ const x=0.6+i*6.15, y=1.45, w=5.95, h=5.3;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius:0.15, fill:{color:C.background2}, line:{color:C.background2,width:0} });
    chip(s, x+0.35, y+0.35, e[0], e[3], { w:1.1, fs:14, color:i?"1F2041":"FFFFFF" });
    tb(s, e[1], { x:x+1.6, y:y+0.33, w:w-1.9, h:0.45, fontSize:20, bold:true, valign:"middle" });
    tb(s, "파일: "+e[2], { x:x+0.35, y:y+0.95, w:w-0.7, h:0.35, fontSize:12, color:"6B7099" });
    tb(s, e[4].map((t,j)=>({ text:t, options:{ bullet:{ type:"number" }, breakLine: j<e[4].length-1 } })), { x:x+0.35, y:y+1.45, w:w-0.7, h:2.9, fontSize:15, color:"2A2E55", paraSpaceAfter:8 });
    s.addText(e[5], { isTextBox:true, x:x+0.35, y:y+4.5, w:i?4.2:2.4, h:0.5, shape:pres.shapes.ROUNDED_RECTANGLE, rectRadius:0.2, fill:{color:"FFFFFF"}, line:{color:i?"D18A16":e[3],width:1.5}, fontSize:14, bold:true, color:i?"A86B00":e[3], align:"center", valign:"middle", margin:0 });
  });
}
section("정리");
{ const s = add("TITLE");
  tb(s, "오늘의 정리", { x:0.8, y:0.8, w:8, h:0.8, fontSize:36, bold:true, color:"FFFFFF" });
  const q = [["음성 인식하기","목소리를 듣고 인식해요","7B52D6"],["음성을 문자로 바꾼 값","들은 말을 글자로 (STT)","5B6CF0"],["읽어주기","글자를 목소리로 (TTS)","2DB88F"],["시작 위치 > 0","문장에 단어가 들어있나?","FFB547"]];
  q.forEach((r,i)=>{ const x=0.8+i*3.0, y=2.0;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w:2.75, h:2.2, rectRadius:0.15, fill:{color:"2B2F7A"}, line:{color:r[2],width:2} });
    tb(s, r[0], { x:x+0.2, y:y+0.35, w:2.35, h:0.9, fontSize:17, bold:true, color:r[2] });
    tb(s, r[1], { x:x+0.2, y:y+1.3, w:2.35, h:0.7, fontSize:14, color:"E3E6FF" }); });
  tb(s, "생각해 보기", { x:0.8, y:4.7, w:5, h:0.5, fontSize:20, bold:true, color:"FFB547" });
  tb(s, [{ text:"음성 인식이 실패하는 경우는 언제일까요? 어떻게 하면 더 잘 인식할까요?", options:{ bullet:true, breakLine:true } },
    { text:"내 생활에서 목소리로 조종하면 편리한 것을 하나 골라 프로그램으로 설계해 보세요.", options:{ bullet:true } }],
    { x:0.8, y:5.25, w:11.5, h:1.4, fontSize:17, color:"FFFFFF", paraSpaceAfter:8 });
}

(async()=>{ await pres.writeFile({ fileName: OUT }); await applyTheme(OUT, THEME); console.log("ok"); })();

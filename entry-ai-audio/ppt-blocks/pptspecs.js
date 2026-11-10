const S=(t)=>({s:t}), N=(t)=>({n:t}), D=(t)=>({dd:t});
const sig=(n,w)=>({t:"cmd",c:"start",p:[D(n),w?"신호 보내고 기다리기":"신호 보내기"]});
const hat=(n)=>({t:"hat",icon:"sig",p:[D(n),"신호를 받았을 때"]});
const play={t:"hat",icon:"play",p:["시작하기 버튼을 클릭했을 때"]};
const say=(t,n)=>({t:"cmd",c:"looks",p:[S(t),"을(를)",N(n),"초 동안",D("말하기")]});
const read=(t)=>({t:"cmd",c:"ai",p:[S(t),"읽어주고 기다리기"]});
const wait=(n)=>({t:"cmd",c:"flow",p:[N(n),"초 기다리기"]});
const mic={t:"cmd",c:"flow",p:[{hex:["마이크가 연결되었는가?"],c:"ai"},"이(가) 될 때까지 기다리기"]};
const rec={t:"cmd",c:"ai",p:["음성 인식하기"]};
const stt={rp:["음성을 문자로 바꾼 값"],c:"ai"};
const stop=(d)=>({t:"cmd",c:"flow",p:[D(d),"코드 멈추기"]});
const find=(w)=>({hex:[{rp:[{rp:["음성 값"],c:"ai"},"에서",S(w),"의 시작 위치"],c:"calc"},">",N("0")]});
const B=(file,blocks)=>({file,bare:1,scripts:[{blocks}]});
module.exports=[
 B("c04_1",[play,say("주문을 외쳐주세요!","2"),mic,{t:"cmd",c:"start",p:[D("주문"),"신호 보내기"]}]),
 B("c04_2",[{t:"hat",icon:"sig",p:[D("주문"),"신호를 받았을 때"]},rec,
   {t:"c",p:["만일",{hex:[stt,"=",S("열려라 참깨")]},"(이)라면"],body:[{t:"cmd",c:"start",p:[D("열림"),"신호 보내기"]}],
    else:[say("실패! 다시 외쳐주세요!","1"),{t:"cmd",c:"start",p:[D("주문"),"신호 보내기"]}]}]),
 B("c04_3",[{t:"hat",icon:"sig",p:[D("열림"),"신호를 받았을 때"]},wait("1"),say("우와! 미래도시다!!","2"),
   {t:"c",p:[N("10"),"번 반복하기"],body:[{t:"cmd",c:"looks",p:[D("다음"),"모양으로 바꾸기"]},wait("0.3")]},stop("모든")]),
 B("c04_4L",[{t:"hat",icon:"sig",p:[D("열림"),"신호를 받았을 때"]},{t:"c",p:[N("50"),"번 반복하기"],body:[{t:"cmd",c:"move",p:["x 좌표를",N("-5"),"만큼 바꾸기"]}]}]),
 B("c04_4R",[{t:"hat",icon:"sig",p:[D("열림"),"신호를 받았을 때"]},{t:"c",p:[N("50"),"번 반복하기"],body:[{t:"cmd",c:"move",p:["x 좌표를",N("5"),"만큼 바꾸기"]}]}]),
 B("c05_1",[play,{t:"cmd",c:"data",p:["대답",D("숨기기")]},{t:"cmd",c:"data",p:[S("나의 이름을 지어주세요."),"을(를) 묻고 대답 기다리기"]},
   {t:"cmd",c:"ai",p:[{rp:[S("나의 이름은"),"과(와)",{rp:["대답"],c:"data"},"를 합치기"],c:"calc"},"읽어주고 기다리기"]},{t:"cmd",c:"start",p:[D("음성 인식"),"신호 보내기"]}]),
 B("c05_2",[{t:"hat",icon:"sig",p:[D("음성 인식"),"신호를 받았을 때"]},mic,read("명령을 내리려면, 저의 이름을 불러 주세요."),rec,
   {t:"c",p:["만일",{hex:[stt,"=",{rp:[{rp:["대답"],c:"data"},"과(와)",N("야"),"를 합치기"],c:"calc"}]},"(이)라면"],body:[{t:"cmd",c:"start",p:[D("작업 명령"),"신호 보내기"]}],
    else:[say("다시 불러주세요","1"),{t:"cmd",c:"start",p:[D("음성 인식"),"신호 보내기"]}]}]),
 B("c05_3",[{t:"hat",icon:"sig",p:[D("작업 명령"),"신호를 받았을 때"]},read("무엇을 도와드릴까요?"),rec,
   {t:"c",p:["만일",find("날씨"),"(이)라면"],body:[{t:"cmd",c:"start",p:[D("날씨"),"신호 보내고 기다리기"]},stop("이")]},
   {t:"c",p:["만일",find("음악"),"(이)라면"],body:[{t:"cmd",c:"start",p:[D("음악"),"신호 보내고 기다리기"]},stop("이")]},
   {t:"cmd",c:"start",p:[D("작업 명령"),"신호 보내기"]}]),
 B("c05_4w",[{t:"hat",icon:"sig",p:[D("날씨"),"신호를 받았을 때"]},read("현재 서울의 기온은"),
   {t:"cmd",c:"ai",p:[{rp:["현재",D("서울"),D("전체"),"의 기온"],c:"looks"},"읽어주고 기다리기"]},read("도 입니다."),{t:"cmd",c:"start",p:[D("음성 인식"),"신호 보내기"]}]),
 B("c05_4m",[{t:"hat",icon:"sig",p:[D("음악"),"신호를 받았을 때"]},{t:"cmd",c:"sound",p:["소리",S("1~5 사이 무작위 수"),"재생하고 기다리기"]},{t:"cmd",c:"start",p:[D("음성 인식"),"신호 보내기"]}]),
 B("k_mic",[{t:"raw",p:[{hex:["마이크가 연결되었는가?"],c:"ai"}]}]),
 B("k_rec",[rec]),
 B("k_stt",[{t:"raw",p:[{rp:["음성을 문자로 바꾼 값"],c:"ai"}]}]),
 B("k_read",[{t:"cmd",c:"ai",p:["엔트리 읽어주고 기다리기"]}]),
 B("k_temp",[{t:"raw",p:[{rp:["현재 서울 전체 의 기온"],c:"looks"}]}]),
];

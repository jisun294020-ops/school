const S=(t)=>({s:t}), N=(t)=>({n:t}), D=(t)=>({dd:t});
const sig=(name)=>({t:"cmd",c:"start",p:[D(name),"신호 보내기"]});
const hatSig=(name)=>({t:"hat",icon:"sig",p:[D(name),"신호를 받았을 때"]});
const hatPlay={t:"hat",icon:"play",p:["시작하기 버튼을 클릭했을 때"]};
const say=(t,n)=>({t:"cmd",c:"looks",p:[S(t),"을(를)",N(n),"초 동안",D("말하기")]});
const read=(t)=>({t:"cmd",c:"ai",p:[S(t),"읽어주고 기다리기"]});
const wait=(n)=>({t:"cmd",c:"flow",p:[N(n),"초 기다리기"]});
const waitHex=(h)=>({t:"cmd",c:"flow",p:[{hex:h,c:"ai"},"이(가) 될 때까지 기다리기"]});
const stt={rp:["음성을 문자로 바꾼 값"],c:"ai"};
const ansP={rp:["대답"],c:"data"};
const mirae=[hatSig("열림"),wait("1"),say("우와! 미래도시다!!","2"),
  {t:"c",p:[N("10"),"번 반복하기"],body:[{t:"cmd",c:"looks",p:[D("다음"),"모양으로 바꾸기"]},wait("0.3")]}];
module.exports=[
 {file:"01_스마트스피커_이름부르기", obj:"스마트 스피커", scripts:[
  {blocks:[hatPlay,{t:"cmd",c:"data",p:["대답",D("숨기기")]},{t:"cmd",c:"data",p:[S("나의 이름을 지어주세요."),"을(를) 묻고 대답 기다리기"]},
    {t:"cmd",c:"ai",p:[{rp:[S("나의 이름은"),"과(와)",ansP,"를 합치기"],c:"calc"},"읽어주고 기다리기"]},sig("음성 인식")]},
  {red:1,blocks:[hatSig("음성 인식"),waitHex(["마이크가 연결되었는가?"]),read("명령을 내리려면, 저의 이름을 불러주세요."),{t:"cmd",c:"ai",p:["음성 인식하기"]}]} ]},
 {file:"02_명수_주문판단", obj:"명수", scripts:[{blocks:[hatSig("주문"),{t:"cmd",c:"ai",p:["음성 인식하기"]},
  {t:"c",red:1,p:["만일",{hex:[stt,"=",S("열려라 참깨")]},"(이)라면"],body:[sig("열림")],else:[say("실패! 다시 외쳐주세요!","1"),sig("주문")]}]}]},
 {file:"03_스마트스피커_이름확인", obj:"스마트 스피커", scripts:[{blocks:[hatSig("음성 인식"),waitHex(["마이크가 연결되었는가?"]),
  read("명령을 내리려면, 저의 이름을 불러 주세요."),{t:"cmd",c:"ai",p:["음성 인식하기"]},
  {t:"c",red:1,p:["만일",{hex:[stt,"=",{rp:[ansP,"과(와)",N("야"),"를 합치기"],c:"calc"}]},"(이)라면"],body:[sig("작업 명령")],else:[say("다시 불러주세요","1"),sig("음성 인식")]}]}]},
 {file:"04a_명수_미래도시_만세", obj:"명수", scripts:[{blocks:[...mirae.slice(0,3),Object.assign({},mirae[3],{red:1})]}]},
 {file:"04b_명수_코드멈추기", obj:"명수", scripts:[{blocks:[...mirae,{t:"cmd",c:"flow",red:1,p:[D("모든"),"코드 멈추기"]}]}]},
 {file:"05_명수_시작", obj:"명수", scripts:[{blocks:[hatPlay,say("주문을 외쳐주세요!","2")]}]},
 {file:"06_AI운동로봇", obj:"AI 운동로봇", scripts:[{blocks:[hatPlay,
  {t:"cmd",c:"ai",p:[D("앙증맞은"),"목소리를",D("보통"),"속도",D("보통"),"음높이로 설정하기"]},
  read("팔을 뻗어 별을 잡는 운동을 해 볼까요?"),read("운동단계 측정을 위해 카메라를 보세요."),
  {t:"cmd",c:"looks",p:[{slot:[D("소눌 AI 로봇_이미지 인식_1")]},"모양으로 바꾸기"]},
  {t:"cmd",c:"ai",p:[D("HCAM01N (0c45:6367)"),"카메라로 바꾸기"]},
  waitHex(["비디오가 연결되었는가?"]),
  {t:"cmd",c:"ai",p:["비디오 화면",D("보이기")]},
  {t:"cmd",c:"ai",p:[D("얼굴"),"인식",D("시작하기")]},
  waitHex([D("얼굴"),"인식이 되었는가?"]),
  {t:"cmd",c:"data",p:[D("나이"),"를",{rp:[D("1"),"번째 얼굴의",D("나이")],c:"ai"},"(으)로 정하기"]},
  {t:"c",red:1,p:["만일",{hex:[{hex:[N("9"),"≥",{rp:[D("나이"),"값"],c:"data"}]},D("또는"),{hex:[{rp:[D("나이"),"값"],c:"data"},"≥",N("13")]}]},"(이)라면"],
   body:[{t:"cmd",c:"data",p:[D("운동단계"),"를",N("1"),"(으)로 정하기"]}],else:[]}]}]},
];

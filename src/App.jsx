import { useState, useCallback, useEffect } from "react";

const fmtPct  = v => (!v&&v!==0)||isNaN(v) ? "-" : (v*100).toFixed(2)+"%";
const fmt2    = n => isFinite(n)&&!isNaN(n) ? Math.round(n).toLocaleString("ko-KR") : "-";
const fmtArea = n => isFinite(n)&&!isNaN(n) ? Number(n).toFixed(1) : "0.0";
const todayStr= () => new Date().toLocaleDateString("ko-KR");

const BLANK = {
  propertyName:"새 매물", 매매금액:0, 취득세율:4.6,
  등기비용율:0.2, 등기비용수동:false, 등기비용수동값:0,
  중개수수료율:0.9, 담보대출비율:70, 보증금:0,
  연면적:0, 리모델링평당단가:0, 신축평당단가:0,
  공사기간개월:12, 예비비율:20, 공사비대출비율:0,
  월세관리비:0, 대출금리:4.0, 재매각금액:0, 대지면적:0,
  토지면적:0, 토지면적단위:"평", 공시지가2015:0, 공시지가2025:0,
  pdf섹션임대:true, pdf섹션수익률:true, pdf섹션재매각:true, pdf섹션양도:true, pdf섹션공시지가:true,
  메모:"", 저장일:"",
};
const DEMO = {...BLANK,
  propertyName:"논현동 224-3", 매매금액:470000, 취득세율:4.6,
  등기비용율:0.2, 보증금:15000, 담보대출비율:70,
  연면적:150, 리모델링평당단가:300, 신축평당단가:0,
  공사기간개월:12, 예비비율:20, 공사비대출비율:50,
  월세관리비:1132, 대출금리:4.0, 재매각금액:1300000, 대지면적:63.55,
  토지면적:63.55, 공시지가2015:8300000, 공시지가2025:22110000,
};

function calc(d) {
  const 취득세       = Math.round(d.매매금액*d.취득세율/100);
  const 중개수수료   = Math.round(d.매매금액*d.중개수수료율/100);
  const 담보대출     = Math.round(d.매매금액*d.담보대출비율/100);
  const 등기비용     = d.등기비용수동?(d.등기비용수동값||0):Math.round(d.매매금액*(d.등기비용율||0.2)/100);
  const 리모델링공사비 = Math.round(d.연면적*d.리모델링평당단가);
  const 신축공사비   = Math.round(d.연면적*d.신축평당단가);
  const 공사비용     = 리모델링공사비+신축공사비;
  const 공사비대출   = Math.round(공사비용*d.공사비대출비율/100);
  const 월이자공사   = ((담보대출+공사비대출)*d.대출금리/100)/12;
  const 이자합계     = Math.round(월이자공사*d.공사기간개월);
  const 예비비       = Math.round(공사비용*d.예비비율/100);
  const 이자예비비   = 이자합계+예비비;
  const 총투입       = d.매매금액+취득세+등기비용+중개수수료+공사비용+이자예비비-d.보증금;
  const 실투자       = 총투입-담보대출-공사비대출;
  const 월이자운영   = ((담보대출+공사비대출)*d.대출금리/100)/12;
  const 월수익       = d.월세관리비-월이자운영;
  const 연임대       = d.월세관리비*12;
  const 수익률원가   = 총투입>0?연임대/총투입:0;
  const 재매각수익률 = (d.재매각금액-d.보증금)>0?연임대/(d.재매각금액-d.보증금):0;
  const 대지평단가   = d.대지면적>0?d.재매각금액/d.대지면적:0;
  const 양도차익     = d.재매각금액-총투입;
  const 실투자수익률 = 실투자>0?양도차익/실투자:0;
  const m2 = d.토지면적단위==="평"?d.토지면적*3.30579:d.토지면적;
  const 공시2015 = Math.round(m2*d.공시지가2015/10000);
  const 공시2025 = Math.round(m2*d.공시지가2025/10000);
  const cagr = (d.공시지가2015>0&&d.공시지가2025>0)?Math.pow(d.공시지가2025/d.공시지가2015,1/10)-1:0;
  return {취득세,등기비용,중개수수료,담보대출,리모델링공사비,신축공사비,공사비용,
    월이자공사,이자합계,예비비,이자예비비,공사비대출,총투입,실투자,월이자운영,월수익,
    연임대,수익률원가,재매각수익률,대지평단가,양도차익,실투자수익률,
    m2,공시2015,공시2025,cagr,상승5:Math.pow(1+cagr,5)-1,상승10:Math.pow(1+cagr,10)-1};
}

const NI_S = {background:"#0f172a",border:"1px solid #334155",borderRadius:6,color:"#60a5fa",fontSize:13,textAlign:"right",padding:"4px 8px"};
const PI_S = {background:"#0f172a",border:"1px solid #1e3a5f",borderRadius:6,color:"#93c5fd",fontSize:13,textAlign:"right",padding:"4px 8px"};

function IntField({value, onChange, width=98}) {
  const [raw, setRaw] = useState(null);
  const display = raw !== null ? raw : (value===0?"0":Math.round(value).toLocaleString("ko-KR"));
  return (
    <input type="text" inputMode="numeric" value={display}
      onFocus={e=>{setRaw(value===0?"":String(Math.round(value)));setTimeout(()=>e.target.select(),0);}}
      onChange={e=>{const s=e.target.value.replace(/[^0-9]/g,"");setRaw(s);onChange(parseInt(s,10)||0);}}
      onBlur={()=>setRaw(null)}
      style={{...NI_S,width}}/>
  );
}
function AreaField({value, onChange, width=98}) {
  const [raw, setRaw] = useState(null);
  const display = raw !== null ? raw : fmtArea(value);
  return (
    <input type="text" inputMode="decimal" value={display}
      onFocus={e=>{setRaw(value===0?"":String(value));setTimeout(()=>e.target.select(),0);}}
      onChange={e=>{const s=e.target.value.replace(/[^0-9.]/g,"");setRaw(s);const n=parseFloat(s);onChange(isNaN(n)?0:n);}}
      onBlur={()=>setRaw(null)}
      style={{...NI_S,width}}/>
  );
}
function PctField({value, onChange, width=78}) {
  const [raw, setRaw] = useState(null);
  const display = raw !== null ? raw : String(value??0);
  return (
    <input type="text" inputMode="decimal" value={display}
      onFocus={e=>{setRaw(String(value??0));setTimeout(()=>e.target.select(),0);}}
      onChange={e=>{const s=e.target.value.replace(/[^0-9.]/g,"");setRaw(s);const n=parseFloat(s);onChange(isNaN(n)?0:n);}}
      onBlur={()=>setRaw(null)}
      style={{...PI_S,width}}/>
  );
}

const Row=({label,labelW=162,mb=7,children})=>(
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:mb}}>
    {label&&<span style={{width:labelW,fontSize:13,color:"#94a3b8",flexShrink:0}}>{label}</span>}
    {children}
  </div>
);
const Suf=({c})=><span style={{fontSize:12,color:"#475569"}}>{c}</span>;
const Pct$=()=><span style={{fontSize:13,color:"#3b82f6",fontWeight:700}}>%</span>;
const Divider=()=><div style={{borderTop:"1px solid #1e3a5f",margin:"8px 0"}}/>;
const SubSec=({children,color="#60a5fa"})=><div style={{fontSize:12,fontWeight:700,color,marginBottom:8,marginTop:4}}>{children}</div>;

// ✅ localStorage 기반 저장소 (window.storage 대신)
const storage = {
  get: (key) => { try { const v = localStorage.getItem(key); return v ? { value: v } : null; } catch { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, value); return true; } catch { return false; } },
  delete: (key) => { try { localStorage.removeItem(key); return true; } catch { return false; } },
};

const SK = id => `prop:${id}`;
const LK = "prop-list-v1";
const INIT_MSGS = [{role:"assistant",content:"안녕하세요! 빌딩 자금스케줄 AI 에이전트입니다. 🏢\n\n현재 매물의 자금 계획을 분석해드릴 수 있습니다.\n\n예시:\n• \"담보대출을 75%로 올리면 실투자금은?\"\n• \"이 매물 투자 가치 분석해줘\"\n• \"공시지가 상승률이 투자에 미치는 영향은?\""}];

// ✅ Anthropic API 키 (Vercel 환경변수에서 불러옴)
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export default function App() {
  const [list,setList]=useState([]);
  const [cid,setCid]=useState(null);
  const [d,setD]=useState(DEMO);
  const [msgs,setMsgs]=useState(INIT_MSGS);
  const [inp,setInp]=useState("");
  const [aiLoad,setAiLoad]=useState(false);
  const [tab,setTab]=useState("schedule");
  const [sidebar,setSidebar]=useState(true);
  const [toast,setToast]=useState("");
  const [saving,setSaving]=useState(false);
  const v=calc(d);
  const upd=(k,val)=>setD(p=>({...p,[k]:val}));
  const showToast=m=>{setToast(m);setTimeout(()=>setToast(""),2800);};

  useEffect(()=>{
    try{const r=storage.get(LK);if(r)setList(JSON.parse(r.value));}catch{}
  },[]);

  const save=()=>{
    setSaving(true);
    const id=cid||`p${Date.now()}`;const now=todayStr();
    try{
      storage.set(SK(id),JSON.stringify({...d,저장일:now}));
      const e={id,name:d.propertyName,저장일:now};
      const nl=cid?list.map(x=>x.id===id?e:x):[...list,e];
      storage.set(LK,JSON.stringify(nl));
      setList(nl);setCid(id);showToast("✅ 저장 완료");
    }catch{showToast("❌ 저장 실패");}
    setSaving(false);
  };

  const load=id=>{
    try{const r=storage.get(SK(id));if(r){setD({...BLANK,...JSON.parse(r.value)});setCid(id);setTab("schedule");setMsgs(INIT_MSGS);showToast("📂 불러오기 완료");}}
    catch{showToast("❌ 불러오기 실패");}
  };

  const newProp=()=>{setD({...BLANK});setCid(null);setMsgs(INIT_MSGS);setTab("schedule");};

  const del=(id,e)=>{
    e.stopPropagation();
    try{
      const nl=list.filter(x=>x.id!==id);
      storage.set(LK,JSON.stringify(nl));
      setList(nl);
      if(cid===id){setD({...BLANK});setCid(null);}
      showToast("🗑️ 삭제 완료");
    }catch{
      setList(p=>p.filter(x=>x.id!==id));
      if(cid===id){setD({...BLANK});setCid(null);}
      showToast("🗑️ 삭제 완료");
    }
  };

  const sendMsg=useCallback(async()=>{
    if(!inp.trim()||aiLoad)return;
    const um=inp.trim();setInp("");
    setMsgs(p=>[...p,{role:"user",content:um}]);setAiLoad(true);
    const ctx=`매물:${d.propertyName}|매매${fmt2(d.매매금액)}만|담보대출${d.담보대출비율}%(${fmt2(v.담보대출)}만)|총투입${fmt2(v.총투입)}만|실투자${fmt2(v.실투자)}만|월수익${fmt2(v.월수익)}만|수익률${fmtPct(v.수익률원가)}|양도차익${fmt2(v.양도차익)}만|실투자수익률${fmtPct(v.실투자수익률)}|공시CAGR${fmtPct(v.cagr)}`;
    try{
      // ✅ 수정된 headers (Vercel 독립 배포용)
      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`당신은 상업용 빌딩 중개 전문 AI입니다.\n데이터:${ctx}\n간결하고 실용적으로(400자이내)`,
          messages:[{role:"user",content:um}]
        })
      });
      const j=await r.json();
      setMsgs(p=>[...p,{role:"assistant",content:j.content?.map(b=>b.text||"").join("")||"응답 오류"}]);
    }catch{setMsgs(p=>[...p,{role:"assistant",content:"오류가 발생했습니다. API 키를 확인해주세요."}]);}
    setAiLoad(false);
  },[inp,aiLoad,d,v]);

  const genPDF=useCallback(()=>{
    const s=[];
    s.push(`<h2>1. 투입금액 내역</h2><table>
<tr><td>① 매매금액</td><td>${fmt2(d.매매금액)}만원</td></tr>
<tr><td>② 취득세 (${d.취득세율}%)</td><td>${fmt2(v.취득세)}만원</td></tr>
<tr><td>③ 등기비용 ${d.등기비용수동?"":`(${d.등기비용율}%)`}</td><td>${fmt2(v.등기비용)}만원</td></tr>
<tr><td>④ 중개수수료 (${d.중개수수료율}%)</td><td>${fmt2(v.중개수수료)}만원</td></tr>
<tr><td>⑤ 담보대출 (${d.담보대출비율}%)</td><td>(${fmt2(v.담보대출)}만원)</td></tr>
<tr><td>⑥ 공사비용 (연면적 ${fmtArea(d.연면적)}평${d.리모델링평당단가>0?` / 리모델링 ${fmt2(d.리모델링평당단가)}만/평`:""}${d.신축평당단가>0?` / 신축 ${fmt2(d.신축평당단가)}만/평`:""})</td><td>${fmt2(v.공사비용)}만원</td></tr>
<tr><td>⑦ 이자+예비비 (${d.공사기간개월}개월 / 예비비 ${d.예비비율}%)</td><td>${fmt2(v.이자예비비)}만원</td></tr>
<tr><td>⑧ 공사비대출 (${d.공사비대출비율}%)</td><td>(${fmt2(v.공사비대출)}만원)</td></tr>
<tr><td>⑨ 보증금</td><td>(${fmt2(d.보증금)}만원)</td></tr>
<tr class="total"><td>⑩ 총 투입금액</td><td>${fmt2(v.총투입)}만원</td></tr>
<tr class="hl"><td>⑪ 실 투자금액</td><td>${fmt2(v.실투자)}만원</td></tr></table>`);
    if(d.pdf섹션임대)s.push(`<h2>2. 임대료 및 지출</h2><table>
<tr><td>월세+관리비</td><td>${fmt2(d.월세관리비)}만원</td></tr>
<tr><td>월 이자 (${d.대출금리}%)</td><td>(${fmt2(v.월이자운영)}만원)</td></tr>
<tr class="hl"><td>월 수익금</td><td>${fmt2(v.월수익)}만원</td></tr></table>`);
    if(d.pdf섹션수익률)s.push(`<h2>3. 원가대비 수익률</h2><table>
<tr><td>연 임대료</td><td>${fmt2(v.연임대)}만원</td></tr>
<tr><td>총 투입금액</td><td>${fmt2(v.총투입)}만원</td></tr>
<tr class="hl"><td>수익률</td><td>${fmtPct(v.수익률원가)}</td></tr></table>`);
    if(d.pdf섹션재매각)s.push(`<h2>4. 재매각</h2><table>
<tr><td>재매각 예상금액</td><td>${fmt2(d.재매각금액)}만원</td></tr>
<tr><td>재매각 기준 수익률</td><td>${fmtPct(v.재매각수익률)}</td></tr>
<tr><td>대지평단가</td><td>${fmt2(v.대지평단가)}만원/평</td></tr></table>`);
    if(d.pdf섹션양도)s.push(`<h2>5. 양도차익</h2><table>
<tr><td>양도금액</td><td>${fmt2(d.재매각금액)}만원</td></tr>
<tr><td>총 투입금액</td><td>(${fmt2(v.총투입)}만원)</td></tr>
<tr class="hl"><td>양도차익</td><td>${fmt2(v.양도차익)}만원</td></tr>
<tr class="hl"><td>실투자금 대비 수익률</td><td>${fmtPct(v.실투자수익률)}</td></tr></table>`);
    if(d.pdf섹션공시지가)s.push(`<h2>공시지가 추이 (2015→2025)</h2><table>
<tr><td>토지면적</td><td>${fmtArea(d.토지면적)}${d.토지면적단위} (${v.m2.toFixed(2)}㎡)</td></tr>
<tr><td>2015년 공시지가</td><td>${fmt2(d.공시지가2015)}원/㎡ → ${fmt2(v.공시2015)}만원</td></tr>
<tr><td>2025년 공시지가</td><td>${fmt2(d.공시지가2025)}원/㎡ → ${fmt2(v.공시2025)}만원</td></tr>
<tr class="total"><td>10년 CAGR</td><td>${fmtPct(v.cagr)}</td></tr>
<tr><td>5년간 누적 상승률</td><td>${fmtPct(v.상승5)}</td></tr>
<tr class="hl"><td>10년간 누적 상승률</td><td>${fmtPct(v.상승10)}</td></tr></table>`);
    const html=`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>${d.propertyName} 자금스케줄</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans KR',sans-serif;background:#fff;color:#1e293b;font-size:11px}
.cover{background:linear-gradient(135deg,#1d4ed8,#0f172a);color:#fff;padding:12px 20px;display:flex;align-items:center;justify-content:space-between}
.cover h1{font-size:16px;font-weight:700}.cover .sub{font-size:10px;color:#93c5fd}
.body{padding:10px 20px;columns:2;column-gap:16px}
h2{font-size:11px;font-weight:700;color:#1d4ed8;margin:8px 0 4px;padding-bottom:3px;border-bottom:1.5px solid #e2e8f0;break-after:avoid}
table{width:100%;border-collapse:collapse;margin-bottom:4px;break-inside:avoid}
tr{border-bottom:1px solid #f1f5f9}td{padding:3px 6px;font-size:10px}
td:last-child{text-align:right;font-family:monospace;font-weight:600}
tr.total td{background:#eff6ff;font-weight:700;color:#1e40af}
tr.hl td{background:#f0fdf4;font-weight:700;color:#16a34a}
.disc{font-size:9px;color:#94a3b8;margin-top:6px;padding-top:4px;border-top:1px solid #e2e8f0;column-span:all}
@media print{@page{size:A4;margin:8mm}body{background:#fff}.cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}.noprint{display:none!important}}</style>
</head><body>
<button class="noprint" onclick="window.print()" style="position:fixed;bottom:14px;right:14px;padding:6px 14px;background:#1d4ed8;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;z-index:999">🖨️ 인쇄/PDF저장</button>
<div class="cover">
  <div><div class="sub">상업용 빌딩 자금스케줄 분석</div><h1>${d.propertyName}</h1></div>
  <div style="text-align:right">
    <div style="font-size:13px;font-weight:700;color:#fff">BSN빌사남부동산중개법인</div>
    <div style="font-size:11px;color:#93c5fd;margin-top:3px">전완준 팀장 010-4366-9942</div>
    <div style="font-size:10px;color:#93c5fd;margin-top:4px">작성일: ${todayStr()}</div>
  </div>
</div>
<div class="body">${s.join("")}<p class="disc">※ 본 자료는 참고용이며 실제 투자 의사결정에는 전문가 상담을 권장합니다.</p></div></body></html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`${d.propertyName}_자금스케줄.html`;a.style.display="none";
    document.body.appendChild(a);a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},3000);
    showToast("✅ 다운로드 완료 — 파일 열고 Ctrl+P로 PDF 저장");
  },[d,v]);

  const C={card:{background:"#1e293b",borderRadius:12,padding:16,border:"1px solid #334155"}};
  const Note=({lbl,val,color="#64748b"})=><div style={{fontSize:11,color,marginLeft:170,marginBottom:7}}> ↳ {lbl}: <span style={{color:"#94a3b8",fontFamily:"monospace"}}>{val}</span></div>;
  const Res=({lbl,val,color,sz=13})=><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}><span style={{fontSize:13,color:"#94a3b8"}}>{lbl}</span><span style={{fontSize:sz,fontWeight:sz>=14?700:500,color:color||"#e2e8f0",fontFamily:"monospace"}}>{val}</span></div>;
  const Sec=({children})=><div style={{fontSize:13,fontWeight:700,color:"#60a5fa",marginBottom:12,paddingBottom:7,borderBottom:"1px solid #1e3a5f"}}>{children}</div>;
  const Stat=({lbl,val,accent,note})=><div style={{background:accent?"linear-gradient(135deg,#1d4ed8,#1e40af)":"#1e293b",border:`1px solid ${accent?"#3b82f6":"#334155"}`,borderRadius:10,padding:"11px 13px",flex:1,minWidth:100}}><div style={{fontSize:11,color:accent?"#93c5fd":"#64748b",marginBottom:2}}>{lbl}</div><div style={{fontSize:14,fontWeight:700,color:accent?"#fff":"#e2e8f0",fontFamily:"monospace"}}>{val}</div>{note&&<div style={{fontSize:10,color:accent?"#bfdbfe":"#475569",marginTop:1}}>{note}</div>}</div>;
  const PChk=({lbl,k})=><label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"7px 10px",background:d[k]?"#0f172a":"transparent",borderRadius:6,border:`1px solid ${d[k]?"#334155":"transparent"}`}}>
    <input type="checkbox" checked={!!d[k]} onChange={e=>upd(k,e.target.checked)} style={{width:13,height:13,accentColor:"#3b82f6",cursor:"pointer"}}/>
    <span style={{fontSize:13,color:d[k]?"#e2e8f0":"#64748b"}}>{lbl}</span></label>;

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#0f172a",color:"#e2e8f0",fontFamily:"'Pretendard','Noto Sans KR',sans-serif"}}>
      <div style={{background:"#0a1628",borderBottom:"1px solid #1e3a5f",padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <div style={{width:30,height:30,background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>🏢</div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:"#f1f5f9"}}>빌딩 자금스케줄 AI 에이전트 <span style={{fontSize:10,color:"#3b82f6",fontWeight:400}}>v1.0</span></div>
          <div style={{fontSize:10,color:"#475569"}}>상업용 빌딩 투자 분석 · 매물 관리 시스템</div>
        </div>
        <input value={d.propertyName} onChange={e=>upd("propertyName",e.target.value)}
          style={{background:"#1e293b",border:"1px solid #334155",borderRadius:7,padding:"5px 12px",color:"#f1f5f9",fontSize:13,width:175,textAlign:"center"}}/>
        <button onClick={save} disabled={saving} style={{padding:"6px 14px",background:saving?"#334155":"linear-gradient(135deg,#059669,#065f46)",border:"none",borderRadius:7,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>
          {saving?"저장중…":"💾 저장"}</button>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{width:sidebar?200:0,minWidth:sidebar?200:0,background:"#0a1120",borderRight:"1px solid #1e293b",display:"flex",flexDirection:"column",transition:"all .2s",overflow:"hidden",flexShrink:0}}>
          {sidebar&&<>
            <div style={{padding:"10px 10px 6px",borderBottom:"1px solid #1e293b",display:"flex",gap:6,flexDirection:"column"}}>
              <button onClick={()=>setSidebar(false)} style={{background:"none",border:"none",color:"#475569",fontSize:11,cursor:"pointer",textAlign:"left",padding:"0 2px"}}>← 닫기</button>
              <button onClick={newProp} style={{padding:"7px 0",background:"linear-gradient(135deg,#1d4ed8,#1e40af)",border:"none",borderRadius:7,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ 새 매물</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"3px 5px"}}>
              {list.length===0&&<div style={{fontSize:11,color:"#334155",textAlign:"center",padding:"18px 8px",lineHeight:1.7}}>저장된 매물 없음<br/><span style={{color:"#1e3a5f"}}>💾 저장 버튼으로<br/>매물을 저장하세요</span></div>}
              {list.map(p=>(
                <div key={p.id} onClick={()=>load(p.id)} style={{padding:"8px 9px",borderRadius:7,marginBottom:3,cursor:"pointer",background:cid===p.id?"#1e3a5f":"transparent",border:`1px solid ${cid===p.id?"#3b82f6":"transparent"}`,position:"relative"}}>
                  <div style={{fontSize:12,fontWeight:600,color:cid===p.id?"#60a5fa":"#94a3b8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",paddingRight:20}}>{p.name}</div>
                  <div style={{fontSize:10,color:"#334155",marginTop:1}}>{p.저장일}</div>
                  <button onClick={e=>del(p.id,e)} style={{position:"absolute",top:6,right:5,background:"#7f1d1d",border:"1px solid #ef4444",borderRadius:4,color:"#fca5a5",cursor:"pointer",fontSize:11,width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                </div>))}
            </div>
          </>}
          {!sidebar&&<button onClick={()=>setSidebar(true)} style={{padding:"14px 0",background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:11}}>▶ 매물</button>}
        </div>

        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{display:"flex",borderBottom:"1px solid #1e293b",flexShrink:0,background:"#0a1628"}}>
            {[["schedule","📊 자금스케줄"],["chat","💬 AI 상담"],["pdf","📄 고객 보고서"]].map(([key,lbl])=>(
              <button key={key} onClick={()=>setTab(key)} style={{padding:"9px 18px",border:"none",background:"transparent",color:tab===key?"#60a5fa":"#475569",borderBottom:tab===key?"2px solid #3b82f6":"2px solid transparent",fontSize:12,fontWeight:tab===key?600:400,cursor:"pointer"}}>{lbl}</button>))}
          </div>

          {tab==="schedule"&&(
            <div style={{flex:1,overflow:"auto",padding:14}}>
              <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
                <Stat lbl="총 투입금액" val={`${fmt2(v.총투입)}만`}/>
                <Stat lbl="실 투자금액" val={`${fmt2(v.실투자)}만`} accent/>
                <Stat lbl="월 순수익" val={`${fmt2(v.월수익)}만`} note={v.월수익<0?"⚠️적자":"✅흑자"}/>
                <Stat lbl="원가수익률" val={fmtPct(v.수익률원가)}/>
                <Stat lbl="양도차익" val={`${fmt2(v.양도차익)}만`}/>
                <Stat lbl="실투자금 대비 수익률" val={fmtPct(v.실투자수익률)} accent/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={C.card}>
                  <Sec>1. 투입금액 내역</Sec>
                  <Row label="① 매매금액"><IntField value={d.매매금액} onChange={val=>upd("매매금액",val)}/><Suf c="만원"/></Row>
                  <Row label="② 취득세율"><PctField value={d.취득세율} onChange={val=>upd("취득세율",val)}/><Pct$/></Row>
                  <Note lbl="취득세" val={`${fmt2(v.취득세)}만원`}/>
                  <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:7}}>
                    <span style={{width:162,fontSize:13,color:"#94a3b8",flexShrink:0}}>③ 등기비용</span>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {d.등기비용수동
                          ? <><IntField value={d.등기비용수동값} onChange={val=>upd("등기비용수동값",val)} width={90}/><Suf c="만원"/></>
                          : <div style={{width:98,padding:"4px 8px",background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,color:"#64748b",fontSize:13,textAlign:"right"}}>{fmt2(v.등기비용)}</div>
                        }
                        {!d.등기비용수동&&<Suf c="만원"/>}
                        <button onClick={()=>upd("등기비용수동",!d.등기비용수동)} style={{fontSize:10,padding:"2px 7px",background:d.등기비용수동?"#1e3a5f":"#0f172a",border:"1px solid #334155",borderRadius:5,color:d.등기비용수동?"#60a5fa":"#475569",cursor:"pointer",whiteSpace:"nowrap"}}>
                          {d.등기비용수동?"직접입력":"자동"}</button>
                      </div>
                      {!d.등기비용수동&&<div style={{display:"flex",alignItems:"center",gap:5}}>
                        <span style={{fontSize:11,color:"#475569"}}>매매금액 ×</span>
                        <PctField value={d.등기비용율} onChange={val=>upd("등기비용율",val)} width={52}/><Pct$/>
                      </div>}
                      <span style={{fontSize:10,color:"#475569"}}>채권할인 + 법무사 수수료 포함</span>
                    </div>
                  </div>
                  <Row label="④ 중개수수료율"><PctField value={d.중개수수료율} onChange={val=>upd("중개수수료율",val)}/><Pct$/></Row>
                  <Note lbl="중개수수료" val={`${fmt2(v.중개수수료)}만원`}/>
                  <Row label="⑤ 담보대출비율"><PctField value={d.담보대출비율} onChange={val=>upd("담보대출비율",val)}/><Pct$/></Row>
                  <Note lbl="담보대출금" val={`${fmt2(v.담보대출)}만원`}/>
                  <Divider/>
                  <SubSec color="#38bdf8">⑥ 공사비용</SubSec>
                  <Row label="연면적" labelW={130}><AreaField value={d.연면적} onChange={val=>upd("연면적",val)} width={80}/><Suf c="평"/></Row>
                  <Row label="🔨 리모델링" labelW={130}><IntField value={d.리모델링평당단가} onChange={val=>upd("리모델링평당단가",val)} width={80}/><Suf c="만/평 →"/><span style={{fontSize:12,fontWeight:600,color:"#38bdf8",fontFamily:"monospace"}}>{fmt2(v.리모델링공사비)}만</span></Row>
                  <Row label="🏗️ 신축" labelW={130}><IntField value={d.신축평당단가} onChange={val=>upd("신축평당단가",val)} width={80}/><Suf c="만/평 →"/><span style={{fontSize:12,fontWeight:600,color:"#a78bfa",fontFamily:"monospace"}}>{fmt2(v.신축공사비)}만</span></Row>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,paddingLeft:130}}><span style={{fontSize:11,color:"#94a3b8"}}>총 공사비용</span><span style={{fontSize:12,fontWeight:700,color:"#fbbf24",fontFamily:"monospace"}}>{fmt2(v.공사비용)}만원</span></div>
                  <Divider/>
                  <SubSec color="#fb923c">⑦ 이자+예비비</SubSec>
                  <div style={{fontSize:11,color:"#64748b",marginBottom:7}}>(담보대출 {fmt2(v.담보대출)}만 + 공사비대출 {fmt2(v.공사비대출)}만) × {d.대출금리}% → 월이자 <strong style={{color:"#fb923c"}}>{fmt2(v.월이자공사)}만원</strong></div>
                  <Row label="공사기간" labelW={130}><IntField value={d.공사기간개월} onChange={val=>upd("공사기간개월",val)} width={80}/><Suf c="개월"/></Row>
                  <Row label="예비비(공사비용%)" labelW={130}><PctField value={d.예비비율} onChange={val=>upd("예비비율",val)} width={80}/><Pct$/></Row>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2,paddingLeft:130}}><span style={{fontSize:11,color:"#94a3b8"}}>이자합계</span><span style={{fontSize:11,color:"#fb923c",fontFamily:"monospace"}}>{fmt2(v.이자합계)}만원</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2,paddingLeft:130}}><span style={{fontSize:11,color:"#94a3b8"}}>예비비 (공사비용 {fmt2(v.공사비용)}만 × {d.예비비율}%)</span><span style={{fontSize:11,color:"#fb923c",fontFamily:"monospace"}}>{fmt2(v.예비비)}만원</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,paddingLeft:130}}><span style={{fontSize:11,color:"#94a3b8"}}>이자+예비비 합계</span><span style={{fontSize:12,fontWeight:700,color:"#fb923c",fontFamily:"monospace"}}>{fmt2(v.이자예비비)}만원</span></div>
                  <Divider/>
                  <SubSec color="#a78bfa">⑧ 공사비 대출</SubSec>
                  <Row label="공사비 대출비율" labelW={130}><PctField value={d.공사비대출비율} onChange={val=>upd("공사비대출비율",val)} width={80}/><Pct$/></Row>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,paddingLeft:130}}><span style={{fontSize:11,color:"#94a3b8"}}>공사비대출</span><span style={{fontSize:12,fontWeight:700,color:"#a78bfa",fontFamily:"monospace"}}>{fmt2(v.공사비대출)}만원</span></div>
                  <Divider/>
                  <Row label="⑨ 보증금"><IntField value={d.보증금} onChange={val=>upd("보증금",val)}/><Suf c="만원"/></Row>
                  <div style={{borderTop:"1px solid #334155",paddingTop:9,marginTop:5}}>
                    <Res lbl="⑩ 총 투입금액" val={`${fmt2(v.총투입)}만원`} color="#fbbf24" sz={14}/>
                    <Res lbl="⑪ 실 투자금액" val={`${fmt2(v.실투자)}만원`} color="#34d399" sz={14}/>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={C.card}>
                    <Sec>2. 임대료 및 지출</Sec>
                    <Row label="⑫ 월세+관리비"><IntField value={d.월세관리비} onChange={val=>upd("월세관리비",val)}/><Suf c="만원"/></Row>
                    <Row label="대출금리"><PctField value={d.대출금리} onChange={val=>upd("대출금리",val)}/><Pct$/></Row>
                    <Note lbl="월 이자(운영중)" val={`${fmt2(v.월이자운영)}만원`}/>
                    <div style={{borderTop:"1px solid #334155",paddingTop:7,marginTop:3}}>
                      <Res lbl="⑭ 월 수익금" val={`${fmt2(v.월수익)}만원`} color={v.월수익>=0?"#34d399":"#f87171"} sz={14}/>
                    </div>
                  </div>
                  <div style={C.card}>
                    <Sec>3. 원가대비 수익률</Sec>
                    <Res lbl="연 임대료(월세×12)" val={`${fmt2(v.연임대)}만원`}/>
                    <Res lbl="총 투입금액" val={`${fmt2(v.총투입)}만원`}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:7}}>
                      <span style={{fontSize:13,fontWeight:700}}>수익률</span>
                      <span style={{fontSize:19,fontWeight:700,color:"#fbbf24",fontFamily:"monospace"}}>{fmtPct(v.수익률원가)}</span>
                    </div>
                  </div>
                  <div style={C.card}>
                    <Sec>4. 재매각 &amp; 5. 양도차익</Sec>
                    <Row label="재매각 예상금액"><IntField value={d.재매각금액} onChange={val=>upd("재매각금액",val)}/><Suf c="만원"/></Row>
                    <Row label="대지면적"><AreaField value={d.대지면적} onChange={val=>upd("대지면적",val)}/><Suf c="평"/></Row>
                    <Res lbl="재매각 기준 수익률" val={fmtPct(v.재매각수익률)}/>
                    <Res lbl="대지평단가" val={`${fmt2(v.대지평단가)}만원/평`}/>
                    <div style={{borderTop:"1px solid #334155",paddingTop:7,marginTop:3}}>
                      <Res lbl="양도차익"            val={`${fmt2(v.양도차익)}만원`} color="#34d399" sz={14}/>
                      <Res lbl="실투자금 대비 수익률" val={fmtPct(v.실투자수익률)}   color="#a78bfa" sz={14}/>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{...C.card,marginTop:12}}>
                <Sec>공시지가 추이 (토지면적 × 개별공시지가 / 2015→2025 / 10년 CAGR)</Sec>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:10}}>
                  <div>
                    <div style={{fontSize:11,color:"#64748b",marginBottom:3}}>토지면적</div>
                    <div style={{display:"flex",gap:4,alignItems:"center"}}>
                      <AreaField value={d.토지면적} onChange={val=>upd("토지면적",val)} width={68}/>
                      <select value={d.토지면적단위} onChange={e=>upd("토지면적단위",e.target.value)} style={{background:"#0f172a",border:"1px solid #334155",borderRadius:5,color:"#e2e8f0",fontSize:11,padding:"4px 3px"}}>
                        <option value="평">평</option><option value="㎡">㎡</option>
                      </select>
                    </div>
                    <div style={{fontSize:10,color:"#475569",marginTop:2}}>{v.m2.toFixed(2)}㎡</div>
                  </div>
                  {[["2015년 공시지가(원/㎡)","공시지가2015",fmt2(v.공시2015)],["2025년 공시지가(원/㎡)","공시지가2025",fmt2(v.공시2025)]].map(([lbl,k,total])=>(
                    <div key={k}>
                      <div style={{fontSize:11,color:"#64748b",marginBottom:3}}>{lbl}</div>
                      <IntField value={d[k]} onChange={val=>upd(k,val)} width={120}/>
                      <div style={{fontSize:10,color:"#94a3b8",marginTop:2,fontFamily:"monospace"}}>총액: {total}만원</div>
                    </div>))}
                  <div>
                    <div style={{fontSize:11,color:"#64748b",marginBottom:3}}>10년 연평균 상승률</div>
                    <div style={{padding:"5px 8px",background:"#0f172a",border:"1px solid #475569",borderRadius:6,fontSize:17,fontWeight:700,color:"#34d399"}}>{fmtPct(v.cagr)}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:7}}>
                  {[["5년간 누적 상승률",v.상승5,v.공시2025*(1+v.상승5)],["10년간 누적 상승률",v.상승10,v.공시2025*(1+v.상승10)]].map(([lbl,pv,est])=>(
                    <div key={lbl} style={{flex:1,background:"#0f172a",borderRadius:7,padding:"9px 11px",border:"1px solid #334155"}}>
                      <div style={{fontSize:10,color:"#64748b",marginBottom:1}}>{lbl}</div>
                      <div style={{fontSize:14,fontWeight:700,color:"#34d399",fontFamily:"monospace"}}>{fmtPct(pv)}</div>
                      <div style={{fontSize:10,color:"#475569",marginTop:1}}>예상총액: {fmt2(est)}만원</div>
                    </div>))}
                  <div style={{flex:2,background:"#0f172a",borderRadius:7,padding:"9px 11px",border:"1px solid #1e3a5f",fontSize:11,color:"#475569",lineHeight:1.7}}>
                    <strong style={{color:"#60a5fa"}}>📌 공시지가 조회</strong><br/>
                    부동산공시가격알리미: realtyprice.kr<br/>국토이용정보체계: eum.go.kr
                  </div>
                </div>
              </div>
              <div style={{...C.card,marginTop:12}}>
                <Sec>📝 매물 메모</Sec>
                <textarea value={d.메모} onChange={e=>upd("메모",e.target.value)} placeholder="이 매물에 대한 메모를 남겨두세요..." rows={3}
                  style={{width:"100%",background:"#0f172a",border:"1px solid #334155",borderRadius:7,color:"#e2e8f0",fontSize:13,padding:"9px 11px",resize:"vertical",outline:"none"}}/>
              </div>
            </div>
          )}

          {tab==="chat"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{flex:1,overflow:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>
                {msgs.map((m,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                    <div style={{maxWidth:"75%",padding:"10px 14px",background:m.role==="user"?"linear-gradient(135deg,#1d4ed8,#1e40af)":"#1e293b",border:`1px solid ${m.role==="user"?"#3b82f6":"#334155"}`,borderRadius:m.role==="user"?"17px 17px 4px 17px":"17px 17px 17px 4px",fontSize:13,lineHeight:1.6,color:"#e2e8f0",whiteSpace:"pre-wrap"}}>
                      {m.role==="assistant"&&<div style={{fontSize:10,color:"#60a5fa",marginBottom:3,fontWeight:600}}>🤖 AI 에이전트</div>}
                      {m.content}
                    </div>
                  </div>))}
                {aiLoad&&<div style={{display:"flex"}}><div style={{padding:"10px 14px",background:"#1e293b",border:"1px solid #334155",borderRadius:"17px 17px 17px 4px"}}><div style={{display:"flex",gap:4}}>{[0,1,2].map(j=><div key={j} style={{width:7,height:7,background:"#3b82f6",borderRadius:"50%",animation:"pulse 1s infinite",animationDelay:`${j*0.2}s`}}/>)}</div></div></div>}
              </div>
              <div style={{padding:"10px 14px",borderTop:"1px solid #1e293b",display:"flex",gap:7}}>
                <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMsg()} placeholder="질문하거나 수치를 요청하세요..."
                  style={{flex:1,padding:"10px 13px",background:"#1e293b",border:"1px solid #334155",borderRadius:9,color:"#e2e8f0",fontSize:13,outline:"none"}}/>
                <button onClick={sendMsg} disabled={aiLoad} style={{padding:"10px 16px",background:aiLoad?"#334155":"linear-gradient(135deg,#3b82f6,#1d4ed8)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>전송</button>
              </div>
              <div style={{padding:"0 14px 10px",display:"flex",gap:5,flexWrap:"wrap"}}>
                {["이 매물 투자 가치 분석해줘","담보대출 75%로 올리면?","리모델링 vs 신축 어떤 게 유리해?","리스크 요인 알려줘"].map(q=>(
                  <button key={q} onClick={()=>setInp(q)} style={{padding:"4px 9px",background:"#1e293b",border:"1px solid #334155",borderRadius:18,color:"#94a3b8",fontSize:11,cursor:"pointer"}}>{q}</button>))}
              </div>
            </div>
          )}

          {tab==="pdf"&&(
            <div style={{flex:1,overflow:"auto",padding:18}}>
              <div style={{maxWidth:540}}>
                <div style={{fontSize:14,fontWeight:700,color:"#f1f5f9",marginBottom:3}}>📄 고객용 제안서 생성</div>
                <div style={{fontSize:12,color:"#64748b",marginBottom:16}}>포함할 섹션을 선택 후 다운로드하세요.</div>
                <div style={{...C.card,marginBottom:8,display:"flex",alignItems:"center",gap:9}}>
                  <div style={{width:16,height:16,background:"#1d4ed8",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,flexShrink:0}}>✓</div>
                  <span style={{fontSize:13,fontWeight:600,color:"#60a5fa",flex:1}}>✅ 1. 투입금액 내역</span>
                  <span style={{fontSize:10,color:"#475569",background:"#1e3a5f",padding:"2px 7px",borderRadius:9}}>필수</span>
                </div>
                <div style={{...C.card,marginBottom:14}}>
                  <div style={{fontSize:11,color:"#64748b",marginBottom:9}}>선택 섹션</div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <PChk lbl="2. 임대료 및 지출" k="pdf섹션임대"/>
                    <PChk lbl="3. 원가대비 수익률" k="pdf섹션수익률"/>
                    <PChk lbl="4. 재매각" k="pdf섹션재매각"/>
                    <PChk lbl="5. 양도차익" k="pdf섹션양도"/>
                    <PChk lbl="공시지가 추이 (2015→2025)" k="pdf섹션공시지가"/>
                  </div>
                </div>
                <div style={{...C.card,marginBottom:18,border:"1px solid #1e3a5f"}}>
                  <div style={{fontSize:11,color:"#64748b",marginBottom:8}}>📊 핵심 수치</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                    {[["총 투입금액",`${fmt2(v.총투입)}만원`],["실 투자금액",`${fmt2(v.실투자)}만원`],["월 순수익",`${fmt2(v.월수익)}만원`],["수익률",fmtPct(v.수익률원가)],["양도차익",`${fmt2(v.양도차익)}만원`],["실투자금 대비 수익률",fmtPct(v.실투자수익률)],["공시CAGR",fmtPct(v.cagr)],["10년누적",fmtPct(v.상승10)]].map(([k,val])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 7px",background:"#0f172a",borderRadius:5}}>
                        <span style={{fontSize:11,color:"#64748b"}}>{k}</span>
                        <span style={{fontSize:11,fontFamily:"monospace",fontWeight:600,color:"#e2e8f0"}}>{val}</span>
                      </div>))}
                  </div>
                </div>
                <button onClick={genPDF} style={{width:"100%",padding:"12px 0",background:"linear-gradient(135deg,#1d4ed8,#1e40af)",border:"none",borderRadius:9,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                  ⬇️ HTML 다운로드 (브라우저에서 PDF 저장)
                </button>
                <div style={{fontSize:11,color:"#475569",marginTop:7,textAlign:"center"}}>다운로드 후 브라우저로 열고 Ctrl+P → PDF 저장</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast&&<div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"#1e293b",border:"1px solid #334155",borderRadius:9,padding:"9px 18px",fontSize:13,color:"#e2e8f0",boxShadow:"0 4px 20px rgba(0,0,0,.5)",zIndex:999,whiteSpace:"nowrap"}}>{toast}</div>}
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}input:focus,textarea:focus{outline:none!important;border-color:#3b82f6!important}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#0f172a}::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}`}</style>
    </div>
  );
}

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Gold palette sampled from the Goldbar logo:
// Deep burnished base #C8922A | Warm mid #D4A030 | Bright highlight #E8B84B | Shadow #9A6E1C
const T = {
  obsidian:   "#050503",
  void:       "#080806",
  surface:    "#0F0F0B",
  raised:     "#161610",
  elevated:   "#1E1E16",
  border:     "rgba(212,160,48,0.13)",
  borderMid:  "rgba(212,160,48,0.25)",
  borderHot:  "rgba(232,184,75,0.50)",
  gold:       "#C8922A",
  goldBright: "#E8B84B",
  goldDim:    "#9A6E1C",
  goldFaint:  "rgba(200,146,42,0.07)",
  platinum:   "#F5F2EC",
  silver:     "#C8C0B0",
  muted:      "#8A8070",
  faint:      "#4A4438",
  green:      "#3DD68C",
  greenDim:   "#1E6B47",
  red:        "#E05252",
  redDim:     "#6B2020",
  purple:     "#8B7FD4",
  mono:       "'DM Mono', 'Courier New', monospace",
  serif:      "'Inter', system-ui, sans-serif",
  sans:       "'Inter', system-ui, sans-serif",
};

// Gold shimmer keyframes injected once
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Inter:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes goldPulse {
    0%,100% { opacity: 0.6; }
    50%      { opacity: 1; }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateX(24px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes rowIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${T.void}; }
  ::-webkit-scrollbar-thumb { background: ${T.gold}30; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: ${T.gold}60; }

  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.3) sepia(1) saturate(3) hue-rotate(5deg); opacity: 0.6; cursor: pointer; }

  .lux-btn { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
  .lux-btn:hover { transform: translateY(-1px); }
  .lux-btn:active { transform: translateY(0); }

  .stage-row { transition: all 0.18s ease; }
  .stage-row:hover { background: rgba(200,146,42,0.08) !important; transform: translateX(3px); }

  .kpi-card { transition: all 0.22s cubic-bezier(0.4,0,0.2,1); }
  .kpi-card:hover { transform: translateY(-3px); border-color: rgba(232,184,75,0.38) !important; }

  .lead-row { transition: background 0.12s ease; }
  .lead-row:hover { background: rgba(200,146,42,0.06) !important; }

  .tab-btn { transition: all 0.18s ease; position: relative; }
  .tab-btn::after { content: ''; position: absolute; bottom: -1px; left: 50%; right: 50%; height: 1px; background: ${T.gold}; transition: all 0.22s ease; }
  .tab-btn.active::after { left: 8px; right: 8px; }

  .source-bar-fill { transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
`;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SOURCES = ["Meta Ads","Referral","Direct Referral","Website / Direct","Manual","Unknown"];
const SOURCE_COLORS = { "Meta Ads":"#E8B84B","Referral":"#C8922A","Direct Referral":"#A87020","Website / Direct":"#7A5018","Manual":"#4E3410","Unknown":"#2A2418" };
const PIPELINE_STAGES = ["New Lead","Contacted","Appt Booked","Appt Completed","Qualified","Proposal / Sales","Closed Won","Closed Lost","Nurture"];
const STAGE_COLORS = { "New Lead":"#C8922A","Contacted":"#B87E22","Appt Booked":"#A06C18","Appt Completed":"#8A5C12","Qualified":"#74500E","Proposal / Sales":"#5E400A","Closed Won":"#3DD68C","Closed Lost":"#E05252","Nurture":"#8B7FD4" };
const STAGE_BG    = { "Closed Won":"rgba(61,214,140,0.06)","Closed Lost":"rgba(224,82,82,0.06)","Nurture":"rgba(139,127,212,0.06)" };
const STAGE_TEXT  = { "Closed Won":"#3DD68C","Closed Lost":"#E05252","Nurture":"#B39DDB" };
const OWNERS = ["Sarah K.","Marcus T.","Janelle R.","Devon P.","Aisha M."];
const FIRST_NAMES = ["James","Maria","Tyler","Priya","Daniel","Keisha","Ryan","Fatima","Carlos","Brittany","Elijah","Sofia","Nathan","Zara","Marcus","Chloe","Darius","Nadia","Owen","Yuki","Trevor","Amara","Logan","Destiny","Ethan"];
const LAST_NAMES  = ["Williams","Johnson","Brown","Garcia","Martinez","Davis","Miller","Wilson","Moore","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Robinson","Clark","Lewis","Lee","Walker","Hall","Allen","Young"];

function makeLead(i, date, source, stage) {
  const first=FIRST_NAMES[i%FIRST_NAMES.length], last=LAST_NAMES[(i*7+3)%LAST_NAMES.length], owner=OWNERS[(i*3+1)%OWNERS.length];
  const d=new Date(date), apptDate=new Date(d); apptDate.setDate(d.getDate()+(Math.floor(i*1.7)%5+1));
  const hasAppt=["Appt Booked","Appt Completed","Qualified","Proposal / Sales","Closed Won","Closed Lost"].includes(stage);
  const apptStatus=stage==="Appt Booked"?"Booked":stage==="Appt Completed"?"Completed":stage==="Closed Won"?"Completed":stage==="Closed Lost"?(i%2===0?"Completed":"No-show"):hasAppt?"Completed":"—";
  return { id:`lead-${i}`, name:`${first} ${last}`, email:`${first.toLowerCase()}.${last.toLowerCase()}@email.com`, phone:`(${300+i%700}) ${100+i%900}-${1000+i%9000}`, source, stage, owner, createdAt:d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}), apptDate:hasAppt?apptDate.toLocaleDateString("en-US",{month:"short",day:"numeric"}):"—", apptStatus, lastActivity:["Called","Emailed","Meeting set","Proposal sent","Follow-up","No response"][i%6] };
}

const RAW_DAILY = [
  {date:new Date(2026,3,21),label:"Apr 21","Meta Ads":14,Referral:5,"Direct Referral":3,"Website / Direct":2,Manual:1,Unknown:0},
  {date:new Date(2026,3,22),label:"Apr 22","Meta Ads":18,Referral:7,"Direct Referral":4,"Website / Direct":3,Manual:2,Unknown:1},
  {date:new Date(2026,3,23),label:"Apr 23","Meta Ads":11,Referral:4,"Direct Referral":2,"Website / Direct":2,Manual:1,Unknown:0},
  {date:new Date(2026,3,24),label:"Apr 24","Meta Ads":22,Referral:9,"Direct Referral":6,"Website / Direct":4,Manual:2,Unknown:1},
  {date:new Date(2026,3,25),label:"Apr 25","Meta Ads":31,Referral:11,"Direct Referral":7,"Website / Direct":5,Manual:3,Unknown:0},
  {date:new Date(2026,3,26),label:"Apr 26","Meta Ads":19,Referral:6,"Direct Referral":4,"Website / Direct":3,Manual:1,Unknown:1},
  {date:new Date(2026,3,27),label:"Apr 27","Meta Ads":8,Referral:3,"Direct Referral":2,"Website / Direct":1,Manual:0,Unknown:0},
  {date:new Date(2026,3,28),label:"Apr 28","Meta Ads":25,Referral:8,"Direct Referral":5,"Website / Direct":4,Manual:2,Unknown:0},
  {date:new Date(2026,3,29),label:"Apr 29","Meta Ads":29,Referral:10,"Direct Referral":6,"Website / Direct":3,Manual:2,Unknown:1},
  {date:new Date(2026,3,30),label:"Apr 30","Meta Ads":33,Referral:12,"Direct Referral":8,"Website / Direct":5,Manual:3,Unknown:0},
  {date:new Date(2026,4,1), label:"May 1", "Meta Ads":27,Referral:9,"Direct Referral":5,"Website / Direct":4,Manual:2,Unknown:1},
  {date:new Date(2026,4,2), label:"May 2", "Meta Ads":38,Referral:14,"Direct Referral":9,"Website / Direct":6,Manual:3,Unknown:0},
  {date:new Date(2026,4,3), label:"May 3", "Meta Ads":21,Referral:7,"Direct Referral":4,"Website / Direct":3,Manual:1,Unknown:0},
  {date:new Date(2026,4,4), label:"May 4", "Meta Ads":10,Referral:4,"Direct Referral":2,"Website / Direct":1,Manual:0,Unknown:0},
  {date:new Date(2026,4,5), label:"May 5", "Meta Ads":34,Referral:11,"Direct Referral":7,"Website / Direct":5,Manual:2,Unknown:1},
  {date:new Date(2026,4,6), label:"May 6", "Meta Ads":41,Referral:15,"Direct Referral":10,"Website / Direct":7,Manual:3,Unknown:0},
  {date:new Date(2026,4,7), label:"May 7", "Meta Ads":36,Referral:13,"Direct Referral":8,"Website / Direct":5,Manual:2,Unknown:1},
  {date:new Date(2026,4,8), label:"May 8", "Meta Ads":44,Referral:16,"Direct Referral":11,"Website / Direct":7,Manual:4,Unknown:0},
  {date:new Date(2026,4,9), label:"May 9", "Meta Ads":39,Referral:14,"Direct Referral":9,"Website / Direct":6,Manual:3,Unknown:1},
  {date:new Date(2026,4,10),label:"May 10","Meta Ads":12,Referral:4,"Direct Referral":3,"Website / Direct":2,Manual:1,Unknown:0},
  {date:new Date(2026,4,11),label:"May 11","Meta Ads":15,Referral:5,"Direct Referral":3,"Website / Direct":2,Manual:0,Unknown:0},
  {date:new Date(2026,4,12),label:"May 12","Meta Ads":47,Referral:17,"Direct Referral":11,"Website / Direct":8,Manual:4,Unknown:1},
  {date:new Date(2026,4,13),label:"May 13","Meta Ads":43,Referral:15,"Direct Referral":10,"Website / Direct":6,Manual:3,Unknown:0},
  {date:new Date(2026,4,14),label:"May 14","Meta Ads":51,Referral:19,"Direct Referral":13,"Website / Direct":9,Manual:4,Unknown:1},
  {date:new Date(2026,4,15),label:"May 15","Meta Ads":48,Referral:17,"Direct Referral":11,"Website / Direct":7,Manual:3,Unknown:0},
  {date:new Date(2026,4,16),label:"May 16","Meta Ads":22,Referral:8,"Direct Referral":5,"Website / Direct":3,Manual:1,Unknown:0},
  {date:new Date(2026,4,17),label:"May 17","Meta Ads":19,Referral:7,"Direct Referral":4,"Website / Direct":3,Manual:1,Unknown:0},
];
const TODAY=new Date(2026,4,17);

function assignStage(idx){const r=(idx*137+29)%1000/1000;if(r<0.076)return"Closed Won";if(r<0.152)return"Closed Lost";if(r<0.263)return"Nurture";if(r<0.369)return"Proposal / Sales";if(r<0.597)return"Qualified";if(r<0.912)return"Appt Completed";if(r<0.950)return"Appt Booked";if(r<0.975)return"Contacted";return"New Lead";}
function buildLeads(rows){const leads=[];let idx=0;rows.forEach(row=>{SOURCES.forEach(src=>{const count=row[src]||0;for(let i=0;i<count;i++){leads.push(makeLead(idx,row.date,src,assignStage(idx)));idx++;}});});return leads;}
const BOOK_RATES={"Meta Ads":0.380,"Referral":0.621,"Direct Referral":0.509,"Website / Direct":0.282,"Manual":0.442,"Unknown":0.222};
const CLOSE_RATES={"Meta Ads":0.076,"Referral":0.153,"Direct Referral":0.166,"Website / Direct":0.082,"Manual":0.154,"Unknown":0.056};
function buildSourceStats(rows){const agg={};SOURCES.forEach(s=>{agg[s]={leads:0,booked:0,closed:0};});rows.forEach(r=>{SOURCES.forEach(s=>{const v=r[s]||0;agg[s].leads+=v;agg[s].booked+=Math.round(v*BOOK_RATES[s]);agg[s].closed+=Math.round(v*CLOSE_RATES[s]);});});return SOURCES.map(s=>({source:s,...agg[s]}));}
function buildApptData(rows){const total=rows.reduce((s,r)=>s+SOURCES.reduce((a,k)=>a+(r[k]||0),0),0);const booked=Math.round(total*0.435),completed=Math.round(booked*0.743),canceled=Math.round(booked*0.160);const noshow=Math.max(0,booked-completed-canceled);return{booked,completed,canceled,noshow,showRate:booked?+((completed/booked)*100).toFixed(1):0,cancelRate:booked?+((canceled/booked)*100).toFixed(1):0};}
function buildPipelineData(leads){if(!leads.length)return[];const counts={};PIPELINE_STAGES.forEach(s=>{counts[s]=0;});leads.forEach(l=>{if(counts[l.stage]!==undefined)counts[l.stage]++;});const total=leads.length;return PIPELINE_STAGES.map(s=>({stage:s,count:counts[s],pct:total?+((counts[s]/total)*100).toFixed(1):0}));}
const fmtISO=d=>d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`:"";
const fmtDisp=d=>d?d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"";
const daysBetween=(a,b)=>Math.round((b-a)/86400000);
function pct(a,b){return !b?"0%":(a/b*100).toFixed(1)+"%"}
const PRESETS=[{label:"Today",getDates:()=>({from:TODAY,to:TODAY})},{label:"Yesterday",getDates:()=>{const d=new Date(TODAY);d.setDate(d.getDate()-1);return{from:d,to:d};}},{label:"Last 7D",getDates:()=>{const d=new Date(TODAY);d.setDate(d.getDate()-6);return{from:d,to:TODAY};}},{label:"Last 14D",getDates:()=>{const d=new Date(TODAY);d.setDate(d.getDate()-13);return{from:d,to:TODAY};}},{label:"This Month",getDates:()=>{const d=new Date(TODAY.getFullYear(),TODAY.getMonth(),1);return{from:d,to:TODAY};}},{label:"All Time",getDates:()=>({from:RAW_DAILY[0].date,to:TODAY})}];

// ─── LUXURY PRIMITIVES ───────────────────────────────────────────────────────

// Gold ruled section divider with serif label
function SectionLabel({children, action}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:18}}>
      <div style={{width:20,height:"0.5px",background:`linear-gradient(90deg,transparent,${T.gold})`}}/>
      <span style={{fontFamily:T.sans,fontSize:10,fontWeight:500,letterSpacing:"0.14em",textTransform:"uppercase",color:T.goldDim,whiteSpace:"nowrap"}}>{children}</span>
      <div style={{flex:1,height:"0.5px",background:`linear-gradient(90deg,${T.gold}40,transparent)`}}/>
      {action&&<span style={{color:T.muted,fontSize:9,letterSpacing:"0.08em"}}>{action}</span>}
    </div>
  );
}

// Luxury card with subtle inner glow edge
function LuxCard({children, style={}, onClick, glow=false}) {
  return (
    <div className={onClick?"kpi-card":""} onClick={onClick} style={{
      background:T.raised,
      border:`0.5px solid ${T.border}`,
      borderRadius:2,
      position:"relative",
      overflow:"hidden",
      cursor:onClick?"pointer":"default",
      ...style,
    }}>
      {/* Top gold rule */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"0.5px",background:`linear-gradient(90deg,transparent 0%,${T.gold}${glow?"90":"40"} 30%,${T.gold}${glow?"90":"40"} 70%,transparent 100%)`}}/>
      {/* Inner light */}
      {glow&&<div style={{position:"absolute",top:0,left:"20%",right:"20%",height:40,background:`radial-gradient(ellipse at top,${T.gold}08 0%,transparent 70%)`,pointerEvents:"none"}}/>}
      {children}
    </div>
  );
}

// Premium tooltip
const LuxTooltip=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div style={{background:T.surface,border:`0.5px solid ${T.borderMid}`,borderRadius:2,padding:"12px 16px",fontFamily:T.sans}}><div style={{color:T.goldDim,fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8,fontFamily:T.sans}}>{label}</div>{payload.map(p=>(<div key={p.dataKey} style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><div style={{width:3,height:10,borderRadius:1,background:p.fill||p.color}}/><span style={{color:T.silver,fontSize:11}}>{p.dataKey}</span><span style={{color:T.platinum,fontSize:11,fontFamily:T.mono,marginLeft:"auto",paddingLeft:16}}>{p.value}</span></div>))}</div>);};

// KPI stat card
function KpiCard({label, value, sub, subColor=T.green, gold=false, onClick}) {
  return (
    <LuxCard glow={gold} onClick={onClick} style={{padding:"22px 20px 18px"}}>
      <div style={{color:T.muted,fontFamily:T.sans,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span>{label}</span>
        {onClick&&<span style={{color:T.gold,fontSize:8,letterSpacing:"0.12em",opacity:0.6}}>VIEW ↗</span>}
      </div>
      <div style={{color:gold?T.goldBright:T.platinum,fontSize:32,fontWeight:400,lineHeight:1,fontFamily:T.mono,letterSpacing:"-0.02em"}}>{value}</div>
      {sub&&<div style={{color:subColor,fontSize:10,marginTop:10,fontFamily:T.sans,opacity:0.8}}>{sub}</div>}
    </LuxCard>
  );
}

// Micro stat row used in side panels
function StatRow({label,value,color=T.gold,onClick}) {
  return (
    <div onClick={onClick} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 14px",borderBottom:`0.5px solid ${T.border}`,cursor:onClick?"pointer":"default",transition:"background 0.15s"}}
      onMouseEnter={e=>onClick&&(e.currentTarget.style.background=T.goldFaint)}
      onMouseLeave={e=>onClick&&(e.currentTarget.style.background="transparent")}
    >
      <span style={{color:T.silver,fontSize:11,fontFamily:T.sans}}>{label}{onClick&&<span style={{color:T.gold,fontSize:9,marginLeft:8,opacity:0.5}}>↗</span>}</span>
      <span style={{color,fontSize:14,fontFamily:T.mono,fontWeight:400}}>{value}</span>
    </div>
  );
}

// ─── DATE FILTER BAR ─────────────────────────────────────────────────────────
function DateFilterBar({dateRange,setDateRange}) {
  const [showPicker,setShowPicker]=useState(false);
  const [customFrom,setCustomFrom]=useState(fmtISO(dateRange.from));
  const [customTo,  setCustomTo]  =useState(fmtISO(dateRange.to));
  const ref=useRef();
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setShowPicker(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const activePreset=PRESETS.find(p=>{const d=p.getDates();return fmtISO(d.from)===fmtISO(dateRange.from)&&fmtISO(d.to)===fmtISO(dateRange.to);});
  const applyCustom=()=>{const f=new Date(customFrom+"T00:00:00"),t=new Date(customTo+"T00:00:00");if(!isNaN(f)&&!isNaN(t)&&f<=t){setDateRange({from:f,to:t});setShowPicker(false);}};
  const days=daysBetween(dateRange.from,dateRange.to)+1;
  const isCustom=!activePreset;

  return (
    <div ref={ref} style={{position:"relative",marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",gap:0,background:T.surface,border:`0.5px solid ${T.border}`,borderRadius:2,padding:"2px",width:"fit-content"}}>
        {PRESETS.map((p,i)=>{
          const on=activePreset?.label===p.label;
          return (
            <button key={p.label} className="lux-btn" onClick={()=>{setDateRange(p.getDates());setShowPicker(false);}} style={{
              background:on?T.raised:"transparent",
              border:"none",
              borderRadius:1,
              padding:"7px 16px",
              color:on?T.goldBright:T.muted,
              fontSize:10,cursor:"pointer",fontFamily:T.sans,
              letterSpacing:"0.08em",fontWeight:400,
              borderRight:i<PRESETS.length-1?`0.5px solid ${T.border}`:"none",
            }}>{p.label}</button>
          );
        })}
        <div style={{width:"0.5px",height:30,background:T.border}}/>
        <button className="lux-btn" onClick={()=>setShowPicker(s=>!s)} style={{
          background:showPicker||isCustom?T.raised:"transparent",
          border:"none",borderRadius:1,
          padding:"7px 16px",color:showPicker||isCustom?T.gold:T.muted,
          fontSize:10,cursor:"pointer",fontFamily:T.sans,letterSpacing:"0.08em",fontWeight:400,
          display:"flex",alignItems:"center",gap:8,
        }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 7h13M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          {isCustom?`${fmtDisp(dateRange.from)}${days>1?" — "+fmtDisp(dateRange.to):""}` :"Custom"}
        </button>
      </div>

      {/* Range pill */}
      <div style={{display:"inline-flex",alignItems:"center",gap:8,marginLeft:12,padding:"6px 14px",background:T.goldFaint,border:`0.5px solid ${T.border}`,borderRadius:2}}>
        <div style={{width:5,height:5,borderRadius:"50%",background:T.gold,animation:"goldPulse 2.5s ease infinite"}}/>
        <span style={{color:T.goldDim,fontFamily:T.sans,fontSize:10,letterSpacing:"0.08em"}}>{days} day{days>1?"s":""} selected</span>
      </div>

      {/* Picker dropdown */}
      {showPicker&&(
        <div style={{position:"absolute",top:"calc(100% + 8px)",left:0,zIndex:500,background:T.surface,border:`0.5px solid ${T.borderMid}`,borderRadius:2,padding:"22px 24px",minWidth:360,animation:"fadeIn 0.15s ease"}}>
          <div style={{fontFamily:T.sans,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:T.gold,marginBottom:18,fontWeight:500}}>Select Range</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:18}}>
            {RAW_DAILY.filter((_,i)=>i%4===0||i===RAW_DAILY.length-1).map(r=>{
              const iso=fmtISO(r.date),on=customFrom===iso&&customTo===iso;
              return(<button key={iso} onClick={()=>{setCustomFrom(iso);setCustomTo(iso);}} style={{background:on?`${T.gold}20`:"transparent",border:`0.5px solid ${on?T.gold:T.border}`,borderRadius:2,padding:"4px 10px",color:on?T.goldBright:T.muted,fontSize:10,cursor:"pointer",fontFamily:T.mono}}>{r.label}</button>);
            })}
          </div>
          <div style={{height:"0.5px",background:T.border,marginBottom:18}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            {[["From",customFrom,setCustomFrom],["To",customTo,setCustomTo]].map(([l,v,sv])=>(
              <div key={l}>
                <div style={{color:T.muted,fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:T.sans,marginBottom:6}}>{l}</div>
                <input type="date" value={v} onChange={e=>sv(e.target.value)} min="2026-04-21" max={fmtISO(TODAY)} style={{background:T.raised,border:`0.5px solid ${T.borderMid}`,borderRadius:2,color:T.platinum,fontSize:11,padding:"9px 12px",width:"100%",colorScheme:"dark",fontFamily:T.mono}}/>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={applyCustom} className="lux-btn" style={{flex:1,background:T.gold,border:"none",borderRadius:2,color:"#000",fontSize:11,fontWeight:600,padding:"10px",cursor:"pointer",fontFamily:T.sans,letterSpacing:"0.08em"}}>Apply</button>
            <button onClick={()=>setShowPicker(false)} style={{background:"transparent",border:`0.5px solid ${T.border}`,borderRadius:2,color:T.muted,fontSize:11,padding:"10px 16px",cursor:"pointer",fontFamily:T.sans}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LEAD DRAWER ─────────────────────────────────────────────────────────────
function LeadDrawer({open,stage,leads,onClose}) {
  const [search,setSearch]=useState("");
  const [sortBy,setSortBy]=useState("name");
  const [filterSrc,setFilterSrc]=useState("All");

  const drawerLeads=useMemo(()=>{
    let list=stage?leads.filter(l=>l.stage===stage):leads;
    if(filterSrc!=="All")list=list.filter(l=>l.source===filterSrc);
    if(search.trim()){const q=search.toLowerCase();list=list.filter(l=>l.name.toLowerCase().includes(q)||l.email.toLowerCase().includes(q)||l.source.toLowerCase().includes(q));}
    return[...list].sort((a,b)=>a[sortBy]?.localeCompare?.(b[sortBy])||0);
  },[stage,leads,search,filterSrc,sortBy]);

  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose();};if(open)document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);},[open,onClose]);
  if(!open)return null;

  const stageColor=stage?(STAGE_COLORS[stage]||T.gold):T.gold;
  const uniqueSources=[...new Set(leads.filter(l=>!stage||l.stage===stage).map(l=>l.source))];

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:400,animation:"fadeIn 0.2s ease"}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:660,background:T.surface,borderLeft:`0.5px solid ${T.borderMid}`,zIndex:500,display:"flex",flexDirection:"column",fontFamily:T.sans,animation:"fadeSlideIn 0.28s cubic-bezier(0.4,0,0.2,1)"}}>
        {/* Gold top bar */}
        <div style={{height:"0.5px",background:`linear-gradient(90deg,transparent,${T.gold}80,${T.gold},${T.gold}80,transparent)`}}/>

        {/* Header */}
        <div style={{padding:"24px 28px 18px",borderBottom:`0.5px solid ${T.border}`,background:T.raised,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <div style={{fontFamily:T.sans,fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:T.goldDim,marginBottom:8}}>Pipeline Stage</div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:2,height:22,background:stageColor,borderRadius:1}}/>
                <span style={{color:STAGE_TEXT[stage]||T.platinum,fontFamily:T.sans,fontSize:18,fontWeight:500,letterSpacing:"0.02em"}}>{stage||"All Leads"}</span>
                <div style={{background:`${stageColor}18`,border:`0.5px solid ${stageColor}40`,borderRadius:2,padding:"3px 12px",color:stageColor,fontSize:11,fontFamily:T.mono}}>{drawerLeads.length}</div>
              </div>
            </div>
            <button onClick={onClose} style={{background:"transparent",border:`0.5px solid ${T.border}`,borderRadius:2,width:34,height:34,cursor:"pointer",color:T.muted,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.mono,transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.gold;e.currentTarget.style.color=T.gold;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted;}}
            >✕</button>
          </div>

          {/* Controls */}
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1,position:"relative"}}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",opacity:0.35,pointerEvents:"none"}}>
                <circle cx="6.5" cy="6.5" r="5" stroke={T.gold} strokeWidth="1.4"/>
                <path d="M10.5 10.5l3.5 3.5" stroke={T.gold} strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads…" style={{width:"100%",background:T.elevated,border:`0.5px solid ${T.border}`,borderRadius:2,padding:"8px 12px 8px 30px",color:T.platinum,fontSize:11,fontFamily:T.sans,boxSizing:"border-box"}}/>
            </div>
            {[["filterSrc","All",...uniqueSources.map(s=>s)],[],].map(()=>null)}
            <select value={filterSrc} onChange={e=>setFilterSrc(e.target.value)} style={{background:T.elevated,border:`0.5px solid ${T.border}`,borderRadius:2,color:T.silver,fontSize:10,padding:"8px 10px",fontFamily:T.sans,cursor:"pointer",letterSpacing:"0.04em"}}>
              <option>All</option>
              {uniqueSources.map(s=><option key={s}>{s}</option>)}
            </select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{background:T.elevated,border:`0.5px solid ${T.border}`,borderRadius:2,color:T.silver,fontSize:10,padding:"8px 10px",fontFamily:T.sans,cursor:"pointer",letterSpacing:"0.04em"}}>
              <option value="name">Name</option>
              <option value="source">Source</option>
              <option value="owner">Owner</option>
              <option value="apptStatus">Appt</option>
            </select>
          </div>
        </div>

        {/* Table head */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 100px 80px 70px 72px",padding:"10px 28px",background:T.void,borderBottom:`0.5px solid ${T.border}`,flexShrink:0}}>
          {["Lead","Source","Owner","Appt","Status"].map(h=>(
            <span key={h} style={{color:T.faint,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:T.sans}}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        <div style={{flex:1,overflowY:"auto"}}>
          {!drawerLeads.length
            ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,color:T.muted,fontFamily:T.sans,fontSize:13,letterSpacing:"0.06em"}}>No leads match</div>
            : drawerLeads.map((lead,i)=><LeadRow key={lead.id} lead={lead} i={i}/>)
          }
        </div>

        {/* Footer */}
        <div style={{padding:"12px 28px",background:T.raised,borderTop:`0.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <span style={{color:T.muted,fontSize:10,fontFamily:T.sans,letterSpacing:"0.08em"}}><span style={{color:T.gold}}>{drawerLeads.length}</span> leads shown</span>
          <span style={{color:T.faint,fontSize:9,letterSpacing:"0.1em",fontFamily:T.sans}}>ESC TO CLOSE</span>
        </div>
      </div>
    </>
  );
}

function LeadRow({lead,i}) {
  const [expanded,setExpanded]=useState(false);
  const sc=SOURCE_COLORS[lead.source]||T.muted;
  const apptColor=lead.apptStatus==="Completed"?T.green:lead.apptStatus==="Booked"?T.gold:lead.apptStatus==="No-show"?"#FF8C00":lead.apptStatus==="Canceled"?T.red:T.muted;

  return (
    <>
      <div className="lead-row" onClick={()=>setExpanded(e=>!e)} style={{display:"grid",gridTemplateColumns:"1fr 100px 80px 70px 72px",padding:"12px 28px",cursor:"pointer",background:expanded?`${T.gold}06`:i%2===0?T.void:T.surface,borderBottom:`0.5px solid ${T.border}`,animation:`rowIn 0.2s ease ${Math.min(i*0.02,0.3)}s both`}}>
        <div style={{display:"flex",flexDirection:"column",gap:3,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,background:`${sc}18`,border:`0.5px solid ${sc}40`,display:"flex",alignItems:"center",justifyContent:"center",color:sc,fontSize:8,fontFamily:T.mono,fontWeight:500,letterSpacing:"0.05em"}}>{lead.name.split(" ").map(n=>n[0]).join("")}</div>
            <span style={{color:T.platinum,fontSize:12,fontWeight:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.name}</span>
            <span style={{color:T.faint,fontSize:9,flexShrink:0,transition:"transform 0.15s",transform:expanded?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
          </div>
          <div style={{color:T.muted,fontSize:9,paddingLeft:34,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:T.mono}}>{lead.email}</div>
        </div>
        <div style={{display:"flex",alignItems:"center"}}>
          <span style={{background:`${sc}12`,border:`0.5px solid ${sc}30`,borderRadius:2,padding:"2px 8px",color:sc,fontSize:8,letterSpacing:"0.06em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:88,fontFamily:T.sans}}>{lead.source}</span>
        </div>
        <div style={{display:"flex",alignItems:"center"}}><span style={{color:T.silver,fontSize:11}}>{lead.owner}</span></div>
        <div style={{display:"flex",alignItems:"center"}}><span style={{color:T.muted,fontSize:10,fontFamily:T.mono}}>{lead.apptDate}</span></div>
        <div style={{display:"flex",alignItems:"center"}}><span style={{color:apptColor,fontSize:10,fontFamily:T.mono}}>{lead.apptStatus}</span></div>
      </div>
      {expanded&&(
        <div style={{background:`${T.gold}04`,borderBottom:`0.5px solid ${T.borderMid}`,padding:"14px 28px 16px 62px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,animation:"fadeIn 0.15s ease"}}>
          {[["Phone",lead.phone,T.mono],["Pipeline Stage",lead.stage,T.sans],["Last Activity",lead.lastActivity,T.sans],["Lead Created",lead.createdAt,T.mono],["Appt Date",lead.apptDate,T.mono],["Appt Status",lead.apptStatus,T.mono]].map(([l,v,f])=>(
            <div key={l}>
              <div style={{color:T.muted,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:T.sans,marginBottom:5}}>{l}</div>
              <div style={{color:l==="Appt Status"?apptColor:l==="Pipeline Stage"?(STAGE_TEXT[v]||T.silver):T.silver,fontSize:11,fontFamily:f}}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── NO DATA ─────────────────────────────────────────────────────────────────
function NoData(){return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 0",gap:14}}><div style={{width:40,height:40,border:`0.5px solid ${T.border}`,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:16,height:16,border:`0.5px solid ${T.gold}40`,borderRadius:1}}/></div><div style={{color:T.muted,fontSize:12,fontFamily:T.sans,letterSpacing:"0.1em"}}>No data for selected period</div><div style={{color:T.faint,fontSize:10,fontFamily:T.mono}}>Apr 21 – May 17, 2026</div></div>);}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({filtered,sourceStats,apptStats,pipelineStats,onOpen}) {
  const [activeSrc, setActiveSrc] = useState("All");
  if(!filtered.length)return<NoData/>;

  // Filter sourceStats and chart data by selected source
  const filteredStats = activeSrc==="All"
    ? sourceStats
    : sourceStats.filter(r=>r.source===activeSrc);

  const tl=filteredStats.reduce((s,r)=>s+r.leads,0);
  const tb=filteredStats.reduce((s,r)=>s+r.booked,0);
  const tw=filteredStats.reduce((s,r)=>s+r.closed,0);
  const tq=activeSrc==="All"
    ? pipelineStats.find(p=>p.stage==="Qualified")?.count||0
    : Math.round((pipelineStats.find(p=>p.stage==="Qualified")?.count||0) * (tl / Math.max(sourceStats.reduce((s,r)=>s+r.leads,0),1)));

  // For chart: if a source is selected, zero out all other sources
  const chartData = filtered.map(r=>{
    if(activeSrc==="All") return {...r, day:r.label};
    const row = {day:r.label};
    SOURCES.forEach(s=>{ row[s] = s===activeSrc ? (r[s]||0) : 0; });
    return row;
  });

  // Visible sources in chart
  const visibleSources = activeSrc==="All" ? SOURCES : [activeSrc];

  // Conversion rate for selected source
  const selectedStat = activeSrc==="All" ? null : filteredStats[0];
  const bookRate = selectedStat ? pct(selectedStat.booked, selectedStat.leads) : pct(tb,tl);
  const winRate  = selectedStat ? pct(selectedStat.closed, selectedStat.leads) : pct(tw,tl);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>

      {/* ── Source Filter Pills ── */}
      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        <span style={{color:T.muted,fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:T.sans,marginRight:4}}>Source</span>
        {["All",...SOURCES].map(src=>{
          const on = activeSrc===src;
          const color = src==="All" ? T.gold : SOURCE_COLORS[src];
          return(
            <button key={src} onClick={()=>setActiveSrc(src)} style={{
              background: on ? `${color}18` : "transparent",
              border: `0.5px solid ${on ? color : T.border}`,
              borderRadius: 2,
              padding: "5px 14px",
              color: on ? color : T.muted,
              fontSize: 10,
              cursor: "pointer",
              fontFamily: T.sans,
              letterSpacing: "0.06em",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s",
            }}>
              {src!=="All" && (
                <div style={{width:6,height:6,borderRadius:1,background:color,opacity:on?1:0.5}}/>
              )}
              {src}
            </button>
          );
        })}
        {activeSrc!=="All" && (
          <button onClick={()=>setActiveSrc("All")} style={{
            background:"transparent",border:"none",cursor:"pointer",
            color:T.muted,fontSize:10,fontFamily:T.sans,
            marginLeft:4,opacity:0.6,
          }}>✕ Clear</button>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div>
        <SectionLabel>
          {activeSrc==="All"
            ? (filtered.length===1?filtered[0].label:`${filtered.length}-Day Performance Overview`)
            : `${activeSrc} · ${filtered.length}-Day Overview`}
        </SectionLabel>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
          <KpiCard label="Total Leads" value={tl} sub={`${Math.round(tl/Math.max(filtered.length,1))}/day avg`} subColor={T.goldDim} gold onClick={()=>onOpen(null, activeSrc==="All"?null:activeSrc)}/>
          <KpiCard label="Avg Per Day" value={Math.round(tl/Math.max(filtered.length,1))} sub="daily lead volume" subColor={T.muted}/>
          <KpiCard label="Appointments" value={apptStats.booked} sub={`${apptStats.completed} completed`} onClick={()=>onOpen("Appt Booked")}/>
          <KpiCard label="Book Rate" value={bookRate} sub="lead to appointment" subColor={T.gold} gold/>
          <KpiCard label="Qualified" value={tq} sub="active opportunities" subColor={T.muted} onClick={()=>onOpen("Qualified")}/>
          <KpiCard label="Closed Won" value={tw} sub={`${winRate} win rate`} subColor={T.gold} gold onClick={()=>onOpen("Closed Won")}/>
        </div>
      </div>

      {/* ── Chart + Side Stats ── */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
        <LuxCard style={{padding:"22px 22px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div>
              <div style={{fontFamily:T.sans,color:T.platinum,fontSize:13,fontWeight:400,letterSpacing:"0.06em",marginBottom:4}}>
                Daily Lead Volume
                {activeSrc!=="All" && (
                  <span style={{color:SOURCE_COLORS[activeSrc],fontSize:11,marginLeft:10,fontFamily:T.mono}}>· {activeSrc}</span>
                )}
              </div>
              <div style={{color:T.muted,fontSize:10,fontFamily:T.mono}}>
                {activeSrc==="All" ? "Stacked by acquisition source" : `Filtered to ${activeSrc} only`}
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
              {visibleSources.map(s=>(<div key={s} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:6,height:6,borderRadius:1,background:SOURCE_COLORS[s]}}/>
                <span style={{color:T.silver,fontSize:8,fontFamily:T.sans,letterSpacing:"0.08em"}}>{s.split(" ")[0]}</span>
              </div>))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={chartData} margin={{top:4,right:0,left:-24,bottom:0}}>
              <CartesianGrid strokeDasharray="1 4" stroke={T.border} vertical={false}/>
              <XAxis dataKey="day" tick={{fill:T.muted,fontSize:8,fontFamily:"DM Mono"}} tickLine={false} axisLine={false} interval={Math.max(0,Math.floor(filtered.length/9)-1)}/>
              <YAxis tick={{fill:T.muted,fontSize:8,fontFamily:"DM Mono"}} tickLine={false} axisLine={false}/>
              <Tooltip content={<LuxTooltip/>}/>
              {visibleSources.slice().reverse().map(s=>(
                <Area key={s} type="monotone" dataKey={s} stackId="1" stroke="none" fill={SOURCE_COLORS[s]} fillOpacity={0.88}/>
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </LuxCard>

        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {activeSrc==="All" ? (
            // Default side stats when no filter
            [{l:"Show Rate",v:apptStats.showRate+"%",c:T.green},{l:"Cancel Rate",v:apptStats.cancelRate+"%",c:T.red},{l:"Meta → Booked",v:pct(sourceStats[0]?.booked||0,sourceStats[0]?.leads||1),c:T.goldBright},{l:"Referral → Booked",v:pct(sourceStats[1]?.booked||0,sourceStats[1]?.leads||1),c:T.gold}].map(item=>(
              <LuxCard key={item.l} style={{padding:"16px 18px",flex:1}}>
                <div style={{color:T.muted,fontFamily:T.sans,fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:8}}>{item.l}</div>
                <div style={{color:item.c,fontSize:24,fontWeight:400,fontFamily:T.mono}}>{item.v}</div>
              </LuxCard>
            ))
          ) : (
            // Source-specific stats when filtered
            [
              {l:"Total Leads",    v:tl,                              c:SOURCE_COLORS[activeSrc]},
              {l:"Appts Booked",  v:selectedStat?.booked||0,          c:T.gold},
              {l:"Booking Rate",  v:bookRate,                         c:T.goldBright},
              {l:"Closed Won",    v:tw,                               c:T.green},
              {l:"Win Rate",      v:winRate,                          c:T.green},
            ].map(item=>(
              <LuxCard key={item.l} style={{padding:"14px 18px",flex:1}}>
                <div style={{color:T.muted,fontFamily:T.sans,fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>{item.l}</div>
                <div style={{color:item.c,fontSize:20,fontWeight:400,fontFamily:T.mono}}>{item.v}</div>
              </LuxCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LEAD SOURCES TAB ────────────────────────────────────────────────────────
function LeadSourcesTab({sourceStats,onOpen}) {
  if(sourceStats.every(r=>r.leads===0))return<NoData/>;
  const total=sourceStats.reduce((s,r)=>s+r.leads,0);
  const pieData=sourceStats.filter(r=>r.leads>0).map(r=>({name:r.source,value:r.leads}));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <LuxCard style={{padding:"22px 22px 18px"}}>
          <SectionLabel>Volume by Source</SectionLabel>
          {sourceStats.map(row=>(
            <div key={row.source} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{color:T.silver,fontSize:11,fontFamily:T.sans}}>{row.source}</span>
                <div style={{display:"flex",gap:14,alignItems:"center"}}>
                  <button onClick={()=>onOpen(null,row.source)} style={{background:"transparent",border:"none",cursor:"pointer",color:T.silver,fontSize:11,fontFamily:T.mono,textDecoration:"underline",textDecorationColor:`${T.gold}40`,textDecorationStyle:"dotted",padding:0}}>{row.leads}</button>
                  <span style={{color:SOURCE_COLORS[row.source],fontSize:10,minWidth:36,textAlign:"right",fontFamily:T.mono}}>{total?pct(row.leads,total):"—"}</span>
                </div>
              </div>
              <div style={{background:T.faint,borderRadius:1,height:3,overflow:"hidden"}}>
                <div className="source-bar-fill" style={{width:total?pct(row.leads,total):"0%",height:"100%",background:`linear-gradient(90deg,${SOURCE_COLORS[row.source]}80,${SOURCE_COLORS[row.source]})`}}/>
              </div>
            </div>
          ))}
        </LuxCard>

        <LuxCard style={{padding:"22px 22px 18px"}}>
          <SectionLabel>Source Distribution</SectionLabel>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3} stroke="none">
                {pieData.map((e,i)=><Cell key={i} fill={SOURCE_COLORS[e.name]}/>)}
              </Pie>
              <Tooltip formatter={(v,n)=>[v+" leads",n]} contentStyle={{background:T.surface,border:`0.5px solid ${T.borderMid}`,borderRadius:2,fontSize:11,fontFamily:T.sans}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",marginTop:4}}>
            {SOURCES.map(s=>(<div key={s} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:6,height:6,borderRadius:1,background:SOURCE_COLORS[s]}}/><span style={{color:T.muted,fontSize:9,fontFamily:T.sans,letterSpacing:"0.06em"}}>{s}</span></div>))}
          </div>
        </LuxCard>
      </div>

      <LuxCard style={{padding:"22px 22px 8px"}}>
        <SectionLabel action="click leads count to drill down">Conversion by Source</SectionLabel>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Source","Leads","Booked","Book Rate","Won","Won % Leads","Won % Appts"].map(h=>(<th key={h} style={{color:T.muted,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",textAlign:h==="Source"?"left":"right",padding:"0 12px 12px",borderBottom:`0.5px solid ${T.border}`,fontFamily:T.sans,fontWeight:400}}>{h}</th>))}</tr></thead>
          <tbody>
            {sourceStats.map((row,ri)=>(
              <tr key={row.source} style={{borderBottom:`0.5px solid ${T.border}`}}>
                <td style={{padding:"12px 12px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:3,height:14,borderRadius:1,background:SOURCE_COLORS[row.source]}}/><span style={{color:T.silver,fontSize:11}}>{row.source}</span></div></td>
                <td style={{padding:"12px",textAlign:"right"}}><button onClick={()=>onOpen(null,row.source)} style={{background:"transparent",border:"none",cursor:"pointer",color:T.silver,fontSize:11,fontFamily:T.mono,textDecoration:"underline",textDecorationColor:`${T.gold}40`,textDecorationStyle:"dotted"}}>{row.leads}</button></td>
                <td style={{padding:"12px",textAlign:"right",color:T.muted,fontSize:11,fontFamily:T.mono}}>{row.booked}</td>
                <td style={{padding:"12px",textAlign:"right",color:SOURCE_COLORS[row.source],fontSize:11,fontFamily:T.mono}}>{pct(row.booked,row.leads)}</td>
                <td style={{padding:"12px",textAlign:"right",color:T.green,fontSize:11,fontFamily:T.mono}}>{row.closed}</td>
                <td style={{padding:"12px",textAlign:"right",color:T.gold,fontSize:11,fontFamily:T.mono}}>{pct(row.closed,row.leads)}</td>
                <td style={{padding:"12px",textAlign:"right",color:T.goldBright,fontSize:11,fontFamily:T.mono}}>{pct(row.closed,row.booked)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </LuxCard>
    </div>
  );
}

// ─── PIPELINE TAB ─────────────────────────────────────────────────────────────
function PipelineTab({pipelineStats,onOpen}) {
  if(!pipelineStats.length)return<NoData/>;
  const won=pipelineStats.find(p=>p.stage==="Closed Won"),lost=pipelineStats.find(p=>p.stage==="Closed Lost"),nurt=pipelineStats.find(p=>p.stage==="Nurture");
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <LuxCard style={{padding:"22px 22px 18px"}}>
          <SectionLabel action="click any row to view leads">Funnel Stages</SectionLabel>
          {pipelineStats.map((row,i)=>{
            const c=STAGE_COLORS[row.stage]||T.gold;
            return(
              <div key={row.stage} className="stage-row" onClick={()=>onOpen(row.stage)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:1,marginBottom:4,background:STAGE_BG[row.stage]||"transparent",borderLeft:`1.5px solid ${c}40`,cursor:"pointer"}}>
                <span style={{color:T.faint,fontSize:9,width:16,textAlign:"right",fontFamily:T.mono}}>{String(i+1).padStart(2,"0")}</span>
                <span style={{flex:1,color:STAGE_TEXT[row.stage]||T.silver,fontSize:11,fontFamily:T.sans}}>{row.stage}</span>
                <div style={{width:72,background:T.faint,borderRadius:1,height:2}}>
                  <div style={{width:`${Math.min(row.pct,100)}%`,height:"100%",background:c}}/>
                </div>
                <span style={{color:T.platinum,fontSize:13,fontFamily:T.mono,width:44,textAlign:"right",textDecoration:"underline",textDecorationColor:`${c}40`,textDecorationStyle:"dotted"}}>{row.count}</span>
                <span style={{color:c,fontSize:9,width:38,textAlign:"right",fontFamily:T.mono}}>{row.pct}%</span>
              </div>
            );
          })}
          <div style={{marginTop:12,padding:"8px 14px",borderTop:`0.5px solid ${T.border}`}}>
            <span style={{color:T.faint,fontSize:9,fontFamily:T.sans,letterSpacing:"0.1em"}}>Each row is clickable — opens lead list for that stage</span>
          </div>
        </LuxCard>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <LuxCard style={{padding:"22px 22px 18px",flex:1}}>
            <SectionLabel>Stage Distribution</SectionLabel>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pipelineStats} layout="vertical" margin={{left:8,right:28,top:0,bottom:0}}>
                <XAxis type="number" tick={{fill:T.muted,fontSize:8,fontFamily:"DM Mono"}} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="stage" tick={{fill:T.muted,fontSize:8,fontFamily:"DM Mono"}} axisLine={false} tickLine={false} width={98}/>
                <Tooltip content={<LuxTooltip/>}/>
                <Bar dataKey="count" radius={[0,2,2,0]} cursor="pointer" onClick={d=>onOpen(d.stage)}>
                  {pipelineStats.map(e=><Cell key={e.stage} fill={STAGE_COLORS[e.stage]||T.gold}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </LuxCard>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[{d:won,c:T.green,l:"Won"},{d:lost,c:T.red,l:"Lost"},{d:nurt,c:T.purple,l:"Nurture"}].map(item=>(
              <LuxCard key={item.l} onClick={()=>onOpen(item.d?.stage||item.l)} style={{padding:"16px 14px",cursor:"pointer"}}>
                <div style={{color:item.c,fontSize:8,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:T.sans,marginBottom:8,opacity:0.7}}>{item.l}</div>
                <div style={{color:item.c,fontSize:24,fontWeight:400,fontFamily:T.mono}}>{item.d?.count||0}</div>
                <div style={{color:item.c,fontSize:9,marginTop:4,fontFamily:T.mono,opacity:0.6}}>{item.d?.pct||0}%</div>
              </LuxCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APPOINTMENTS TAB ────────────────────────────────────────────────────────
function AppointmentsTab({apptStats,sourceStats,onOpen}) {
  if(!apptStats.booked)return<NoData/>;
  const totalWon=sourceStats.reduce((s,r)=>s+r.closed,0);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[{l:"Booked",v:apptStats.booked,c:T.gold,s:"Appt Booked"},{l:"Completed",v:apptStats.completed,c:T.green,s:"Appt Completed"},{l:"Canceled",v:apptStats.canceled,c:T.red,s:null},{l:"No-Show",v:apptStats.noshow,c:"#FF8C00",s:null}].map(item=>(
          <LuxCard key={item.l} glow={!!item.s} onClick={item.s?()=>onOpen(item.s):undefined} style={{padding:"22px 20px 18px"}}>
            <div style={{color:T.muted,fontFamily:T.sans,fontSize:8,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:12}}>{item.l}{item.s&&<span style={{color:T.gold,marginLeft:8,fontSize:8,opacity:0.6}}>↗</span>}</div>
            <div style={{color:item.c,fontSize:32,fontWeight:400,fontFamily:T.mono}}>{item.v}</div>
            <div style={{color:T.muted,fontSize:9,marginTop:8,fontFamily:T.mono}}>{pct(item.v,apptStats.booked)} of booked</div>
          </LuxCard>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <LuxCard style={{padding:"22px 22px 18px"}}>
          <SectionLabel>Booking Rate by Source</SectionLabel>
          {sourceStats.map(row=>(
            <div key={row.source} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{color:T.silver,fontSize:11}}>{row.source}</span>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <span style={{color:T.muted,fontSize:10,fontFamily:T.mono}}>{row.booked}/{row.leads}</span>
                  <span style={{color:SOURCE_COLORS[row.source],fontSize:11,fontFamily:T.mono,minWidth:38,textAlign:"right"}}>{pct(row.booked,row.leads)}</span>
                </div>
              </div>
              <div style={{background:T.faint,borderRadius:1,height:2}}>
                <div style={{width:pct(row.booked,row.leads),height:"100%",background:SOURCE_COLORS[row.source]}}/>
              </div>
            </div>
          ))}
        </LuxCard>
        <LuxCard style={{padding:"22px 22px 8px"}}>
          <SectionLabel>Appointment Health</SectionLabel>
          {[{l:"Show Rate",v:apptStats.showRate+"%",d:`${apptStats.completed} of ${apptStats.booked}`,c:T.green},{l:"Cancel Rate",v:apptStats.cancelRate+"%",d:`${apptStats.canceled} canceled`,c:T.red},{l:"No-Show Rate",v:pct(apptStats.noshow,apptStats.booked),d:`${apptStats.noshow} no-shows`,c:"#FF8C00"},{l:"Completed → Won",v:pct(totalWon,apptStats.completed),d:`${totalWon} closed`,c:T.gold}].map(item=>(
            <div key={item.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:`0.5px solid ${T.border}`}}>
              <div><div style={{color:T.silver,fontSize:11}}>{item.l}</div><div style={{color:T.muted,fontSize:9,marginTop:2,fontFamily:T.mono}}>{item.d}</div></div>
              <div style={{color:item.c,fontSize:20,fontWeight:400,fontFamily:T.mono}}>{item.v}</div>
            </div>
          ))}
        </LuxCard>
      </div>
    </div>
  );
}

// ─── ACTIVITY TAB ─────────────────────────────────────────────────────────────
function ActivityTab({filtered,sourceStats,onOpen}) {
  if(!filtered.length)return<NoData/>;
  const tl=sourceStats.reduce((s,r)=>s+r.leads,0),tb=sourceStats.reduce((s,r)=>s+r.booked,0),tw=sourceStats.reduce((s,r)=>s+r.closed,0);
  const metaRow=sourceStats.find(r=>r.source==="Meta Ads")||{leads:0,booked:0,closed:0};
  const weekMap={};
  filtered.forEach(r=>{const d=new Date(r.date),mon=new Date(d);mon.setDate(d.getDate()-((d.getDay()+6)%7));const wk=mon.toLocaleDateString("en-US",{month:"short",day:"numeric"});if(!weekMap[wk])weekMap[wk]={week:"Wk "+wk,leads:0,appts:0,won:0};const dl=SOURCES.reduce((a,k)=>a+(r[k]||0),0);weekMap[wk].leads+=dl;weekMap[wk].appts+=Math.round(dl*0.435);weekMap[wk].won+=Math.round(dl*0.106);});
  const weeklyData=Object.values(weekMap);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <LuxCard style={{padding:"22px 22px 18px"}}>
        <SectionLabel>Weekly Sales Rhythm</SectionLabel>
        <div style={{display:"flex",gap:20,marginBottom:16}}>
          {[{l:"Leads",c:T.gold},{l:"Appointments",c:T.green},{l:"Closed Won",c:T.goldBright}].map(i=>(<div key={i.l} style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:14,height:2,background:i.c,borderRadius:1}}/><span style={{color:T.muted,fontSize:9,fontFamily:T.sans,letterSpacing:"0.1em"}}>{i.l}</span></div>))}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData} barGap={4} margin={{left:-14,right:0,top:0,bottom:0}}>
            <CartesianGrid strokeDasharray="1 4" stroke={T.border} vertical={false}/>
            <XAxis dataKey="week" tick={{fill:T.muted,fontSize:9,fontFamily:"DM Mono"}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:T.muted,fontSize:9,fontFamily:"DM Mono"}} axisLine={false} tickLine={false}/>
            <Tooltip content={<LuxTooltip/>}/>
            <Bar dataKey="leads" fill={T.gold} radius={[2,2,0,0]}/>
            <Bar dataKey="appts" fill={T.green} radius={[2,2,0,0]}/>
            <Bar dataKey="won"   fill={T.goldBright} radius={[2,2,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </LuxCard>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <LuxCard style={{padding:"22px 22px 18px"}}>
          <SectionLabel>Meta Ads Funnel</SectionLabel>
          {[{l:"Meta leads (UTM tracked)",v:metaRow.leads},{l:"Appointment booked",v:metaRow.booked},{l:"Appointment attended",v:Math.round(metaRow.booked*0.728)},{l:"Deal created",v:Math.round(metaRow.booked*0.541)},{l:"Closed Won",v:metaRow.closed}].map((step,i,arr)=>(
            <div key={step.l}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0"}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0,width:12}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:i===arr.length-1?T.green:T.gold,flexShrink:0}}/>
                  {i<arr.length-1&&<div style={{width:"0.5px",height:20,background:`${T.gold}30`,marginTop:2}}/>}
                </div>
                <span style={{flex:1,color:i===arr.length-1?T.green:T.silver,fontSize:11}}>{step.l}</span>
                <span style={{color:i===arr.length-1?T.green:T.platinum,fontSize:13,fontFamily:T.mono}}>{step.v}</span>
                {i>0&&<span style={{color:T.faint,fontSize:10,fontFamily:T.mono,width:32,textAlign:"right"}}>-{arr[i-1].v-step.v}</span>}
              </div>
            </div>
          ))}
          <div style={{marginTop:12,paddingTop:14,borderTop:`0.5px solid ${T.border}`,display:"flex",gap:24}}>
            {[{l:"Meta → Won",v:pct(metaRow.closed,metaRow.leads),c:T.goldBright},{l:"Attended → Won",v:pct(metaRow.closed,Math.round(metaRow.booked*0.728)),c:T.green}].map(m=>(<div key={m.l}><div style={{color:T.muted,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:T.sans,marginBottom:4}}>{m.l}</div><div style={{color:m.c,fontSize:18,fontFamily:T.mono,fontWeight:400}}>{m.v}</div></div>))}
          </div>
        </LuxCard>

        <LuxCard style={{padding:"22px 22px 8px"}}>
          <SectionLabel>Period Summary</SectionLabel>
          <StatRow label="Total Leads"          value={tl}               color={T.gold}      onClick={()=>onOpen(null)}/>
          <StatRow label="Appointments Booked"  value={tb}               color={T.gold}      onClick={()=>onOpen("Appt Booked")}/>
          <StatRow label="Closed Won"           value={tw}               color={T.green}     onClick={()=>onOpen("Closed Won")}/>
          <StatRow label="Lead → Appt Rate"     value={pct(tb,tl)}       color={T.goldBright}/>
          <StatRow label="Lead → Won Rate"      value={pct(tw,tl)}       color={T.green}/>
          <StatRow label="Avg Leads / Day"      value={Math.round(tl/Math.max(filtered.length,1))} color={T.silver}/>
        </LuxCard>
      </div>
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({activeTab,setActiveTab}) {
  const tabs=["Overview","Lead Sources","Pipeline","Appointments","Activity"];
  return(
    <div style={{background:T.void,borderBottom:`0.5px solid ${T.border}`,padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:62,position:"relative"}}>
      {/* Thin gold top line */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"0.5px",background:`linear-gradient(90deg,transparent 0%,${T.gold}60 20%,${T.gold} 50%,${T.gold}60 80%,transparent 100%)`}}/>

      {/* Logo */}
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <img
          src="/logo.png"
          alt="Goldbar"
          style={{height:36,width:"auto",objectFit:"contain",filter:"drop-shadow(0 0 6px rgba(200,146,42,0.4))"}}
        />
        <div style={{width:"0.5px",height:28,background:T.border}}/>
        <div style={{color:T.goldDim,fontSize:8,letterSpacing:"0.22em",textTransform:"uppercase",fontFamily:T.mono}}>SALES COMMAND CENTER</div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,height:"100%",alignItems:"stretch"}}>
        {tabs.map(t=>{
          const on=activeTab===t;
          return(
            <button key={t} className={`tab-btn${on?" active":""}`} onClick={()=>setActiveTab(t)} style={{
              background:"transparent",border:"none",borderBottom:`1.5px solid ${on?T.gold:"transparent"}`,
              padding:"0 20px",color:on?T.goldBright:T.muted,
              fontSize:10,cursor:"pointer",letterSpacing:"0.1em",fontFamily:T.sans,
              fontWeight:400,textTransform:"uppercase",
            }}>{t}</button>
          );
        })}
      </div>

      {/* Status */}
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{display:"flex",alignItems:"center",gap:7,padding:"5px 14px",background:`${T.green}08`,border:`0.5px solid ${T.green}25`,borderRadius:2}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:T.green,animation:"goldPulse 3s ease infinite"}}/>
          <span style={{color:T.green,fontSize:9,letterSpacing:"0.14em",fontFamily:T.mono}}>LIVE · HUBSPOT + CALENDLY</span>
        </div>
        <span style={{color:T.muted,fontSize:9,fontFamily:T.mono,letterSpacing:"0.08em"}}>MAY 17, 2026</span>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab,setActiveTab]=useState("Overview");
  const [dateRange,setDateRange]=useState(()=>PRESETS.find(p=>p.label==="Last 7D").getDates());
  const [drawer,setDrawer]=useState({open:false,stage:null,filterSrc:null});

  const filtered=useMemo(()=>{const from=new Date(dateRange.from);from.setHours(0,0,0,0);const to=new Date(dateRange.to);to.setHours(23,59,59,999);return RAW_DAILY.filter(r=>r.date>=from&&r.date<=to);},[dateRange]);
  const leads=useMemo(()=>buildLeads(filtered),[filtered]);
  const sourceStats=useMemo(()=>buildSourceStats(filtered),[filtered]);
  const apptStats=useMemo(()=>buildApptData(filtered),[filtered]);
  const pipelineStats=useMemo(()=>buildPipelineData(leads),[leads]);

  const openDrawer=useCallback((stage,src=null)=>setDrawer({open:true,stage,filterSrc:src}),[]);
  const closeDrawer=useCallback(()=>setDrawer(d=>({...d,open:false})),[]);
  const drawerLeads=useMemo(()=>drawer.filterSrc?leads.filter(l=>l.source===drawer.filterSrc):leads,[leads,drawer.filterSrc]);

  const tabContent={
    "Overview":     <OverviewTab     filtered={filtered} sourceStats={sourceStats} apptStats={apptStats} pipelineStats={pipelineStats} onOpen={openDrawer}/>,
    "Lead Sources": <LeadSourcesTab  sourceStats={sourceStats} onOpen={openDrawer}/>,
    "Pipeline":     <PipelineTab     pipelineStats={pipelineStats} onOpen={openDrawer}/>,
    "Appointments": <AppointmentsTab apptStats={apptStats} sourceStats={sourceStats} onOpen={openDrawer}/>,
    "Activity":     <ActivityTab     filtered={filtered} sourceStats={sourceStats} onOpen={openDrawer}/>,
  };

  return (
    <div style={{background:T.obsidian,minHeight:"100vh",fontFamily:T.sans}}>
      <style>{GLOBAL_CSS}</style>
      <TopBar activeTab={activeTab} setActiveTab={setActiveTab}/>

      {/* Ambient gold glow behind content */}
      <div style={{position:"fixed",top:62,left:"50%",transform:"translateX(-50%)",width:"80%",height:1,background:`radial-gradient(ellipse,${T.gold}18 0%,transparent 70%)`,pointerEvents:"none",zIndex:0}}/>

      <div style={{padding:"28px 32px 60px",position:"relative",zIndex:1}}>
        <DateFilterBar dateRange={dateRange} setDateRange={setDateRange}/>
        {tabContent[activeTab]}
      </div>

      <LeadDrawer open={drawer.open} stage={drawer.stage} leads={drawerLeads} onClose={closeDrawer}/>
    </div>
  );
}

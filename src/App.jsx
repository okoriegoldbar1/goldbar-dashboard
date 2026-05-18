import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

// ─── THEME ────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg:         "#F5F0E8",
  sidebar:    "#EDE8DF",
  sidebarBorder: "rgba(180,160,120,0.25)",
  surface:    "#FFFFFF",
  raised:     "#FAF8F4",
  border:     "rgba(180,155,100,0.18)",
  borderMid:  "rgba(180,155,100,0.32)",
  gold:       "#C8922A",
  goldBright: "#B8800A",
  goldDim:    "#9A6E1C",
  goldFaint:  "rgba(200,146,42,0.08)",
  text:       "#1A1610",
  textSub:    "#5A5040",
  textMuted:  "#9A9080",
  textFaint:  "#C8C0B0",
  green:      "#2A9D5C",
  red:        "#D04040",
  purple:     "#6B5FC8",
  blue:       "#3A7AC8",
  navActive:  "#EDE3D0",
  navHover:   "#F0EBE0",
  headerBg:   "#FFFFFF",
  mono:       "'DM Mono','Courier New',monospace",
  sans:       "'Inter',system-ui,sans-serif",
};
const DARK = {
  bg:         "#111009",
  sidebar:    "#161410",
  sidebarBorder: "rgba(212,160,48,0.12)",
  surface:    "#1C1A14",
  raised:     "#222018",
  border:     "rgba(212,160,48,0.12)",
  borderMid:  "rgba(212,160,48,0.22)",
  gold:       "#C8922A",
  goldBright: "#E8B84B",
  goldDim:    "#9A6E1C",
  goldFaint:  "rgba(200,146,42,0.07)",
  text:       "#F0ECD8",
  textSub:    "#B0A888",
  textMuted:  "#706858",
  textFaint:  "#403830",
  green:      "#3DD68C",
  red:        "#E05252",
  purple:     "#8B7FD4",
  blue:       "#5A9FE8",
  navActive:  "rgba(200,146,42,0.14)",
  navHover:   "rgba(200,146,42,0.07)",
  headerBg:   "#161410",
  mono:       "'DM Mono','Courier New',monospace",
  sans:       "'Inter',system-ui,sans-serif",
};

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const makeCSS = (T) => `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital@1&family=DM+Mono:wght@300;400;500&family=Inter:wght@300;400;500;600&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family: ${T.sans}; background: ${T.bg}; color: ${T.text}; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideInRight { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:${T.gold}40; border-radius:4px; }
  .nav-item { transition:all 0.15s ease; border-radius:8px; cursor:pointer; }
  .nav-item:hover { background:${T.navHover}; }
  .nav-item.active { background:${T.navActive}; }
  .card { transition:box-shadow 0.2s ease,transform 0.2s ease; }
  .card:hover { box-shadow:0 4px 20px rgba(0,0,0,0.08); }
  .kpi-card { transition:all 0.2s ease; cursor:pointer; }
  .kpi-card:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(0,0,0,0.1); }
  .stage-row { transition:all 0.15s ease; cursor:pointer; }
  .stage-row:hover { background:${T.goldFaint} !important; transform:translateX(2px); }
  .lead-row { transition:background 0.1s ease; cursor:pointer; }
  .lead-row:hover { background:${T.goldFaint} !important; }
  .src-btn { transition:all 0.15s ease; cursor:pointer; }
  .src-btn:hover { border-color:${T.gold} !important; }
  input[type=date] { color-scheme:${T.bg==="#F5F0E8"?"light":"dark"}; }
`;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SOURCES = ["Meta Ads","Referral","Direct Referral","Website / Direct","Manual","Unknown"];
const SOURCE_COLORS_LIGHT = {"Meta Ads":"#C8922A","Referral":"#A06020","Direct Referral":"#7A4818","Website / Direct":"#5A3A10","Manual":"#3A2808","Unknown":"#B0A898"};
const SOURCE_COLORS_DARK  = {"Meta Ads":"#E8B84B","Referral":"#C8922A","Direct Referral":"#A87020","Website / Direct":"#7A5018","Manual":"#5A3A18","Unknown":"#4A4038"};
const PIPELINE_STAGES = ["New Lead","Contacted","Appt Booked","Appt Completed","Qualified","Proposal / Sales","Closed Won","Closed Lost","Nurture"];
const STAGE_COLORS = {"New Lead":"#C8922A","Contacted":"#B07818","Appt Booked":"#9A6010","Appt Completed":"#845008","Qualified":"#6E4208","Proposal / Sales":"#583408","Closed Won":"#2A9D5C","Closed Lost":"#D04040","Nurture":"#6B5FC8"};
const STAGE_TEXT  = {"Closed Won":"#2A9D5C","Closed Lost":"#D04040","Nurture":"#6B5FC8"};
const OWNERS = ["Sarah K.","Marcus T.","Janelle R.","Devon P.","Aisha M."];
const FIRST = ["James","Maria","Tyler","Priya","Daniel","Keisha","Ryan","Fatima","Carlos","Brittany","Elijah","Sofia","Nathan","Zara","Marcus","Chloe","Darius","Nadia","Owen","Yuki","Trevor","Amara","Logan","Destiny","Ethan"];
const LAST  = ["Williams","Johnson","Brown","Garcia","Martinez","Davis","Miller","Wilson","Moore","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Robinson","Clark","Lewis","Lee","Walker","Hall","Allen","Young"];

function makeLead(i,date,source,stage){
  const first=FIRST[i%FIRST.length],last=LAST[(i*7+3)%LAST.length],owner=OWNERS[(i*3+1)%OWNERS.length];
  const d=new Date(date),ad=new Date(d);ad.setDate(d.getDate()+(Math.floor(i*1.7)%5+1));
  const hasA=["Appt Booked","Appt Completed","Qualified","Proposal / Sales","Closed Won","Closed Lost"].includes(stage);
  const apptStatus=stage==="Appt Booked"?"Booked":stage==="Appt Completed"?"Completed":stage==="Closed Won"?"Completed":stage==="Closed Lost"?(i%2===0?"Completed":"No-show"):hasA?"Completed":"—";
  return{id:`l-${i}`,name:`${first} ${last}`,email:`${first.toLowerCase()}.${last.toLowerCase()}@email.com`,phone:`(${300+i%700}) ${100+i%900}-${1000+i%9000}`,source,stage,owner,createdAt:d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),apptDate:hasA?ad.toLocaleDateString("en-US",{month:"short",day:"numeric"}):"—",apptStatus,lastActivity:["Called","Emailed","Meeting set","Proposal sent","Follow-up","No response"][i%6]};
}

const RAW_DAILY=[
  {date:new Date(2026,3,21),label:"Apr 21","Meta Ads":14,Referral:5,"Direct Referral":3,"Website / Direct":2,Manual:1,Unknown:0},
  {date:new Date(2026,3,22),label:"Apr 22","Meta Ads":18,Referral:7,"Direct Referral":4,"Website / Direct":3,Manual:2,Unknown:1},
  {date:new Date(2026,3,23),label:"Apr 23","Meta Ads":11,Referral:4,"Direct Referral":2,"Website / Direct":2,Manual:1,Unknown:0},
  {date:new Date(2026,3,24),label:"Apr 24","Meta Ads":22,Referral:9,"Direct Referral":6,"Website / Direct":4,Manual:2,Unknown:1},
  {date:new Date(2026,3,25),label:"Apr 25","Meta Ads":31,Referral:11,"Direct Referral":7,"Website / Direct":5,Manual:3,Unknown:0},
  {date:new Date(2026,3,26),label:"Apr 26","Meta Ads":19,Referral:6,"Direct Referral":4,"Website / Direct":3,Manual:1,Unknown:1},
  {date:new Date(2026,3,27),label:"Apr 27","Meta Ads":8, Referral:3,"Direct Referral":2,"Website / Direct":1,Manual:0,Unknown:0},
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

function assignStage(i){const r=(i*137+29)%1000/1000;if(r<0.076)return"Closed Won";if(r<0.152)return"Closed Lost";if(r<0.263)return"Nurture";if(r<0.369)return"Proposal / Sales";if(r<0.597)return"Qualified";if(r<0.912)return"Appt Completed";if(r<0.950)return"Appt Booked";if(r<0.975)return"Contacted";return"New Lead";}
function buildLeads(rows){const out=[];let i=0;rows.forEach(row=>{SOURCES.forEach(src=>{const n=row[src]||0;for(let j=0;j<n;j++){out.push(makeLead(i,row.date,src,assignStage(i)));i++;}});});return out;}
const BR={"Meta Ads":0.380,"Referral":0.621,"Direct Referral":0.509,"Website / Direct":0.282,"Manual":0.442,"Unknown":0.222};
const CR={"Meta Ads":0.076,"Referral":0.153,"Direct Referral":0.166,"Website / Direct":0.082,"Manual":0.154,"Unknown":0.056};
function buildSrcStats(rows){const a={};SOURCES.forEach(s=>{a[s]={leads:0,booked:0,closed:0};});rows.forEach(r=>{SOURCES.forEach(s=>{const v=r[s]||0;a[s].leads+=v;a[s].booked+=Math.round(v*BR[s]);a[s].closed+=Math.round(v*CR[s]);});});return SOURCES.map(s=>({source:s,...a[s]}));}
function buildAppt(rows){const t=rows.reduce((s,r)=>s+SOURCES.reduce((a,k)=>a+(r[k]||0),0),0);const b=Math.round(t*0.435),c=Math.round(b*0.743),x=Math.round(b*0.160);return{booked:b,completed:c,canceled:x,noshow:Math.max(0,b-c-x),showRate:b?+((c/b)*100).toFixed(1):0,cancelRate:b?+((x/b)*100).toFixed(1):0};}
function buildPipeline(leads){if(!leads.length)return[];const cnt={};PIPELINE_STAGES.forEach(s=>{cnt[s]=0;});leads.forEach(l=>{if(cnt[l.stage]!==undefined)cnt[l.stage]++;});const t=leads.length;return PIPELINE_STAGES.map(s=>({stage:s,count:cnt[s],pct:t?+((cnt[s]/t)*100).toFixed(1):0}));}
const fmtISO=d=>d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`:"";
const fmtDisp=d=>d?d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"";
const daysBetween=(a,b)=>Math.round((b-a)/86400000);
function pct(a,b){return !b?"0%":(a/b*100).toFixed(1)+"%"}
const PRESETS=[
  {label:"Today",      getDates:()=>({from:TODAY,to:TODAY})},
  {label:"Yesterday",  getDates:()=>{const d=new Date(TODAY);d.setDate(d.getDate()-1);return{from:d,to:d};}},
  {label:"Last 7D",    getDates:()=>{const d=new Date(TODAY);d.setDate(d.getDate()-6);return{from:d,to:TODAY};}},
  {label:"Last 14D",   getDates:()=>{const d=new Date(TODAY);d.setDate(d.getDate()-13);return{from:d,to:TODAY};}},
  {label:"This Month", getDates:()=>({from:new Date(TODAY.getFullYear(),TODAY.getMonth(),1),to:TODAY})},
  {label:"All Time",   getDates:()=>({from:RAW_DAILY[0].date,to:TODAY})},
];

// ─── SHARED UI PRIMITIVES ─────────────────────────────────────────────────────

function Card({children,style={},onClick,T}){
  return(
    <div className={onClick?"kpi-card":"card"} onClick={onClick} style={{
      background:T.surface,border:`1px solid ${T.border}`,
      borderRadius:12,overflow:"hidden",position:"relative",
      cursor:onClick?"pointer":"default",...style,
    }}>{children}</div>
  );
}

function SectionHead({title,italic,sub,T}){
  return(
    <div style={{marginBottom:20}}>
      <h2 style={{fontSize:22,fontWeight:600,color:T.text,display:"flex",alignItems:"baseline",gap:8,lineHeight:1.2}}>
        {title}
        {italic&&<span style={{fontFamily:"'Playfair Display',Georgia,serif",fontStyle:"italic",fontWeight:400,color:T.gold}}>{italic}</span>}
      </h2>
      {sub&&<p style={{fontSize:13,color:T.textMuted,marginTop:4}}>{sub}</p>}
    </div>
  );
}

function SectionLabel({children,T}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
      <span style={{fontSize:11,fontWeight:500,letterSpacing:"0.1em",textTransform:"uppercase",color:T.textMuted,whiteSpace:"nowrap"}}>{children}</span>
      <div style={{flex:1,height:"0.5px",background:T.border}}/>
    </div>
  );
}

function Badge({label,color,bg}){
  return(
    <span style={{background:bg||color+"18",border:`1px solid ${color}30`,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:500,color,display:"inline-block"}}>{label}</span>
  );
}

function HubTooltip({active,payload,label,T}){
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 16px",boxShadow:"0 8px 32px rgba(0,0,0,0.12)"}}>
      <div style={{fontSize:11,fontWeight:500,color:T.textMuted,marginBottom:8}}>{label}</div>
      {payload.map(p=>(<div key={p.dataKey} style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
        <div style={{width:8,height:8,borderRadius:2,background:p.fill||p.color,flexShrink:0}}/>
        <span style={{fontSize:11,color:T.textSub}}>{p.dataKey}</span>
        <span style={{fontSize:11,color:T.text,fontFamily:T.mono,marginLeft:"auto",paddingLeft:16}}>{p.value}</span>
      </div>))}
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {id:"Overview",    icon:"📊", label:"Overview"},
  {id:"Lead Sources",icon:"🎯", label:"Lead Sources"},
  {id:"Pipeline",    icon:"⚡", label:"Pipeline"},
  {id:"Appointments",icon:"📅", label:"Appointments"},
  {id:"Activity",    icon:"📈", label:"Activity"},
];

function Sidebar({activeTab,setActiveTab,darkMode,setDarkMode,T}){
  return(
    <div style={{width:200,flexShrink:0,background:T.sidebar,borderRight:`1px solid ${T.sidebarBorder}`,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,overflowY:"auto"}}>
      {/* Logo */}
      <div style={{padding:"20px 16px 16px",borderBottom:`1px solid ${T.sidebarBorder}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <img src="/logo.png" alt="Goldbar" style={{height:28,width:"auto",objectFit:"contain"}}/>
          <span style={{fontSize:10,fontWeight:600,color:T.textMuted,letterSpacing:"0.14em",background:T.goldFaint,border:`1px solid ${T.gold}30`,borderRadius:6,padding:"2px 7px"}}>HUB</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{padding:"12px 8px",flex:1}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:T.textMuted,padding:"4px 8px",marginBottom:4}}>Workspace</div>
        {NAV_ITEMS.map(item=>{
          const on=activeTab===item.id;
          return(
            <div key={item.id} className={`nav-item${on?" active":""}`} onClick={()=>setActiveTab(item.id)} style={{
              display:"flex",alignItems:"center",gap:10,padding:"9px 10px",marginBottom:2,
              background:on?T.navActive:"transparent",
              border:on?`1px solid ${T.gold}25`:"1px solid transparent",
            }}>
              <span style={{fontSize:15,lineHeight:1}}>{item.icon}</span>
              <span style={{fontSize:13,fontWeight:on?500:400,color:on?T.gold:T.textSub}}>{item.label}</span>
            </div>
          );
        })}

        <div style={{height:"0.5px",background:T.border,margin:"12px 8px"}}/>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:T.textMuted,padding:"4px 8px",marginBottom:4}}>More</div>
        {[{icon:"🔗",label:"HubSpot"},{icon:"📆",label:"Calendly"}].map(item=>(
          <div key={item.label} className="nav-item" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",marginBottom:2}}>
            <span style={{fontSize:15}}>{item.icon}</span>
            <span style={{fontSize:13,color:T.textMuted}}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{padding:"12px 8px",borderTop:`1px solid ${T.sidebarBorder}`}}>
        {/* Dark mode toggle */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",marginBottom:8}}>
          <span style={{fontSize:12,color:T.textMuted}}>{darkMode?"Dark":"Light"} mode</span>
          <button onClick={()=>setDarkMode(d=>!d)} style={{
            width:36,height:20,borderRadius:10,border:"none",cursor:"pointer",position:"relative",
            background:darkMode?T.gold:"#D0C8B8",transition:"background 0.2s",
          }}>
            <div style={{position:"absolute",top:3,left:darkMode?19:3,width:14,height:14,borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:T.navActive}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:T.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:"#fff",flexShrink:0}}>O</div>
          <div>
            <div style={{fontSize:12,fontWeight:500,color:T.text}}>Okorie</div>
            <div style={{fontSize:10,color:T.textMuted}}>Admin</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TOP HEADER BAR ───────────────────────────────────────────────────────────
const PAGE_TITLES = {
  "Overview":     {title:"Sales",     italic:"Overview",   sub:"Lead performance, conversion & pipeline"},
  "Lead Sources": {title:"Lead",      italic:"Sources",    sub:"Breakdown by acquisition channel"},
  "Pipeline":     {title:"Sales",     italic:"Pipeline",   sub:"HubSpot deal stages & funnel"},
  "Appointments": {title:"Appointment",italic:"Analytics", sub:"Calendly bookings & attendance"},
  "Activity":     {title:"Sales",     italic:"Activity",   sub:"Weekly rhythm & Meta ads attribution"},
};

function Header({activeTab,dateRange,setDateRange,activeSrc,setActiveSrc,T}){
  const pg=PAGE_TITLES[activeTab]||{title:"Sales",italic:"Dashboard",sub:""};
  const [showPicker,setShowPicker]=useState(false);
  const [customFrom,setCustomFrom]=useState(fmtISO(dateRange.from));
  const [customTo,  setCustomTo]  =useState(fmtISO(dateRange.to));
  const ref=useRef();
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setShowPicker(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const activePreset=PRESETS.find(p=>{const d=p.getDates();return fmtISO(d.from)===fmtISO(dateRange.from)&&fmtISO(d.to)===fmtISO(dateRange.to);});
  const applyCustom=()=>{const f=new Date(customFrom+"T00:00:00"),t=new Date(customTo+"T00:00:00");if(!isNaN(f)&&!isNaN(t)&&f<=t){setDateRange({from:f,to:t});setShowPicker(false);}};
  const days=daysBetween(dateRange.from,dateRange.to)+1;
  const isCustom=!activePreset;

  return(
    <div style={{background:T.headerBg,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
      {/* Title row */}
      <div style={{padding:"18px 28px 14px",display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:600,color:T.text,display:"flex",alignItems:"baseline",gap:8,lineHeight:1}}>
            {pg.title}
            <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontStyle:"italic",fontWeight:400,color:T.gold,fontSize:28}}>{pg.italic}</span>
          </h1>
          <p style={{fontSize:12,color:T.textMuted,marginTop:4}}>{pg.sub}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:T.green+"15",border:`1px solid ${T.green}30`,borderRadius:8}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:T.green,animation:"pulse 2s ease infinite"}}/>
            <span style={{fontSize:11,fontWeight:500,color:T.green}}>Live · HubSpot</span>
          </div>
          <div style={{fontSize:12,color:T.textMuted,fontFamily:T.mono}}>May 17, 2026</div>
        </div>
      </div>

      {/* Filter bar */}
      <div ref={ref} style={{padding:"0 28px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,position:"relative"}}>

        {/* Left: Source pills */}
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:T.textMuted,fontWeight:500,marginRight:2}}>Source</span>
          {["All",...SOURCES].map(src=>{
            const on=activeSrc===src;
            const SC = T.bg==="#F5F0E8"?SOURCE_COLORS_LIGHT:SOURCE_COLORS_DARK;
            const color=src==="All"?T.gold:SC[src];
            return(
              <button key={src} className="src-btn" onClick={()=>setActiveSrc(src)} style={{
                background:on?color+"18":"transparent",
                border:`1px solid ${on?color:T.border}`,
                borderRadius:7,padding:"4px 11px",
                color:on?color:T.textMuted,
                fontSize:10,fontFamily:T.sans,fontWeight:on?500:400,
                display:"flex",alignItems:"center",gap:5,
              }}>
                {src!=="All"&&<div style={{width:5,height:5,borderRadius:1,background:color,opacity:on?1:0.5}}/>}
                {src}
              </button>
            );
          })}
          {activeSrc!=="All"&&<button onClick={()=>setActiveSrc("All")} style={{background:"transparent",border:"none",cursor:"pointer",color:T.textMuted,fontSize:12,padding:"0 4px"}}>✕</button>}
        </div>

        {/* Right: Date filter */}
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          {/* Range pill */}
          <div style={{padding:"5px 12px",background:T.goldFaint,border:`1px solid ${T.gold}30`,borderRadius:8,display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:T.gold,animation:"pulse 2.5s ease infinite"}}/>
            <span style={{fontSize:11,color:T.goldBright,fontWeight:500}}>
              {activePreset?activePreset.label:fmtDisp(dateRange.from)+(days>1?" – "+fmtDisp(dateRange.to):"")}
              {" · "}{days}d
            </span>
          </div>

          {/* Preset buttons */}
          <div style={{display:"flex",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
            {PRESETS.map((p,i)=>{
              const on=activePreset?.label===p.label;
              return(
                <button key={p.label} onClick={()=>{setDateRange(p.getDates());setShowPicker(false);}} style={{
                  background:on?T.gold+"22":"transparent",border:"none",
                  borderRight:i<PRESETS.length-1?`1px solid ${T.border}`:"none",
                  padding:"5px 11px",color:on?T.gold:T.textMuted,
                  fontSize:10,cursor:"pointer",fontFamily:T.sans,fontWeight:on?500:400,
                }}>{p.label}</button>
              );
            })}
            <div style={{width:1,background:T.border}}/>
            <button onClick={()=>setShowPicker(s=>!s)} style={{
              background:showPicker||isCustom?T.gold+"22":"transparent",border:"none",
              padding:"5px 11px",color:showPicker||isCustom?T.gold:T.textMuted,
              fontSize:10,cursor:"pointer",fontFamily:T.sans,display:"flex",alignItems:"center",gap:5,
            }}>
              📅 Custom
            </button>
          </div>
        </div>

        {/* Picker dropdown */}
        {showPicker&&(
          <div style={{position:"absolute",top:"calc(100% + 4px)",right:28,zIndex:600,background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px",minWidth:340,boxShadow:"0 12px 40px rgba(0,0,0,0.15)",animation:"fadeIn 0.15s ease"}}>
            <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:14}}>Select Date Range</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
              {RAW_DAILY.filter((_,i)=>i%4===0||i===RAW_DAILY.length-1).map(r=>{
                const iso=fmtISO(r.date),on=customFrom===iso&&customTo===iso;
                return(<button key={iso} onClick={()=>{setCustomFrom(iso);setCustomTo(iso);}} style={{background:on?T.gold+"22":"transparent",border:`1px solid ${on?T.gold:T.border}`,borderRadius:6,padding:"4px 10px",color:on?T.gold:T.textMuted,fontSize:10,cursor:"pointer",fontFamily:T.mono}}>{r.label}</button>);
              })}
            </div>
            <div style={{height:1,background:T.border,marginBottom:16}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[["From",customFrom,setCustomFrom],["To",customTo,setCustomTo]].map(([l,v,sv])=>(
                <div key={l}>
                  <div style={{fontSize:11,color:T.textMuted,marginBottom:5,fontWeight:500}}>{l}</div>
                  <input type="date" value={v} onChange={e=>sv(e.target.value)} min="2026-04-21" max={fmtISO(TODAY)} style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:12,padding:"8px 10px",fontFamily:T.sans}}/>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={applyCustom} style={{flex:1,background:T.gold,border:"none",borderRadius:8,color:"#fff",fontSize:12,fontWeight:600,padding:"9px",cursor:"pointer"}}>Apply</button>
              <button onClick={()=>setShowPicker(false)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,color:T.textMuted,fontSize:12,padding:"9px 14px",cursor:"pointer"}}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LEAD DRAWER ─────────────────────────────────────────────────────────────
function LeadDrawer({open,stage,leads,onClose,T}){
  const [search,setSearch]=useState("");
  const [sortBy,setSortBy]=useState("name");
  const [filterSrc,setFilterSrc]=useState("All");
  const SC=T.bg==="#F5F0E8"?SOURCE_COLORS_LIGHT:SOURCE_COLORS_DARK;

  const list=useMemo(()=>{
    let l=stage?leads.filter(x=>x.stage===stage):leads;
    if(filterSrc!=="All")l=l.filter(x=>x.source===filterSrc);
    if(search.trim()){const q=search.toLowerCase();l=l.filter(x=>x.name.toLowerCase().includes(q)||x.email.toLowerCase().includes(q));}
    return[...l].sort((a,b)=>a[sortBy]?.localeCompare?.(b[sortBy])||0);
  },[stage,leads,search,filterSrc,sortBy]);

  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose();};if(open)document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);},[open,onClose]);
  if(!open)return null;

  const stageColor=stage?(STAGE_COLORS[stage]||T.gold):T.gold;
  const uniqSrc=[...new Set(leads.filter(l=>!stage||l.stage===stage).map(l=>l.source))];

  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:400,animation:"fadeIn 0.2s ease"}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:660,background:T.surface,borderLeft:`1px solid ${T.border}`,zIndex:500,display:"flex",flexDirection:"column",animation:"slideInRight 0.25s ease",boxShadow:"-12px 0 48px rgba(0,0,0,0.15)"}}>

        <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <div style={{fontSize:11,fontWeight:500,letterSpacing:"0.1em",textTransform:"uppercase",color:T.textMuted,marginBottom:6}}>Pipeline Stage</div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:3,height:20,background:stageColor,borderRadius:2}}/>
                <span style={{fontSize:18,fontWeight:600,color:STAGE_TEXT[stage]||T.text}}>{stage||"All Leads"}</span>
                <span style={{background:stageColor+"18",border:`1px solid ${stageColor}40`,borderRadius:8,padding:"2px 10px",fontSize:12,fontWeight:500,color:stageColor,fontFamily:T.mono}}>{list.length}</span>
              </div>
            </div>
            <button onClick={onClose} style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,width:32,height:32,cursor:"pointer",color:T.textSub,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1,position:"relative"}}>
              <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:12,color:T.textMuted}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads…" style={{width:"100%",background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 10px 7px 28px",color:T.text,fontSize:12,fontFamily:T.sans,boxSizing:"border-box"}}/>
            </div>
            <select value={filterSrc} onChange={e=>setFilterSrc(e.target.value)} style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,color:T.textSub,fontSize:11,padding:"7px 10px",cursor:"pointer"}}>
              <option>All</option>{uniqSrc.map(s=><option key={s}>{s}</option>)}
            </select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,color:T.textSub,fontSize:11,padding:"7px 10px",cursor:"pointer"}}>
              <option value="name">Name</option><option value="source">Source</option><option value="owner">Owner</option>
            </select>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 100px 80px 70px 70px",padding:"8px 24px",background:T.raised,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          {["Lead","Source","Owner","Appt","Status"].map(h=><span key={h} style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:T.textMuted}}>{h}</span>)}
        </div>

        <div style={{flex:1,overflowY:"auto"}}>
          {!list.length
            ? <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:T.textMuted,fontSize:13}}>No leads match</div>
            : list.map((lead,i)=><DrawerRow key={lead.id} lead={lead} i={i} T={T} SC={SC}/>)
          }
        </div>

        <div style={{padding:"10px 24px",background:T.raised,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",flexShrink:0}}>
          <span style={{fontSize:11,color:T.textMuted}}><span style={{color:T.gold,fontWeight:600}}>{list.length}</span> leads</span>
          <span style={{fontSize:10,color:T.textFaint,fontFamily:T.mono}}>ESC to close</span>
        </div>
      </div>
    </>
  );
}

function DrawerRow({lead,i,T,SC}){
  const [exp,setExp]=useState(false);
  const sc=SC[lead.source]||T.textMuted;
  const ac=lead.apptStatus==="Completed"?T.green:lead.apptStatus==="Booked"?T.gold:lead.apptStatus==="No-show"?T.red:T.textMuted;
  return(
    <>
      <div className="lead-row" onClick={()=>setExp(e=>!e)} style={{display:"grid",gridTemplateColumns:"1fr 100px 80px 70px 70px",padding:"11px 24px",borderBottom:`1px solid ${T.border}`,background:exp?T.goldFaint:i%2===0?T.surface:T.raised,animation:`slideUp 0.15s ease ${Math.min(i*0.015,0.25)}s both`}}>
        <div style={{display:"flex",flexDirection:"column",gap:2,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,background:sc+"20",border:`1px solid ${sc}40`,display:"flex",alignItems:"center",justifyContent:"center",color:sc,fontSize:9,fontWeight:600}}>{lead.name.split(" ").map(n=>n[0]).join("")}</div>
            <span style={{color:T.text,fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.name}</span>
            <span style={{color:T.textFaint,fontSize:10,flexShrink:0,transition:"transform 0.15s",transform:exp?"rotate(180deg)":"rotate(0)"}}> ▾</span>
          </div>
          <div style={{color:T.textMuted,fontSize:10,paddingLeft:34,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:T.mono}}>{lead.email}</div>
        </div>
        <div style={{display:"flex",alignItems:"center"}}><span style={{background:sc+"15",border:`1px solid ${sc}30`,borderRadius:6,padding:"2px 7px",color:sc,fontSize:9,fontWeight:500}}>{lead.source}</span></div>
        <div style={{display:"flex",alignItems:"center"}}><span style={{fontSize:11,color:T.textSub}}>{lead.owner}</span></div>
        <div style={{display:"flex",alignItems:"center"}}><span style={{fontSize:10,color:T.textMuted,fontFamily:T.mono}}>{lead.apptDate}</span></div>
        <div style={{display:"flex",alignItems:"center"}}><span style={{fontSize:10,color:ac,fontWeight:500}}>{lead.apptStatus}</span></div>
      </div>
      {exp&&(
        <div style={{background:T.goldFaint,borderBottom:`1px solid ${T.border}`,padding:"12px 24px 14px 58px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,animation:"fadeIn 0.15s ease"}}>
          {[["Phone",lead.phone],["Stage",lead.stage],["Last Activity",lead.lastActivity],["Created",lead.createdAt],["Appt Date",lead.apptDate],["Appt Status",lead.apptStatus]].map(([l,v])=>(
            <div key={l}><div style={{fontSize:10,fontWeight:500,color:T.textMuted,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.08em"}}>{l}</div>
            <div style={{fontSize:11,color:l==="Appt Status"?ac:l==="Stage"?(STAGE_TEXT[v]||T.textSub):T.textSub}}>{v}</div></div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── NO DATA ─────────────────────────────────────────────────────────────────
function NoData({T}){return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 0",gap:12}}><div style={{fontSize:32}}>📭</div><div style={{fontSize:14,color:T.textMuted,fontWeight:500}}>No data for selected period</div><div style={{fontSize:12,color:T.textFaint,fontFamily:T.mono}}>Apr 21 – May 17, 2026</div></div>);}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({label,value,sub,subColor,gold,onClick,T}){
  return(
    <div className={onClick?"kpi-card":"card"} onClick={onClick} style={{background:T.surface,border:`1px solid ${gold?T.gold+"40":T.border}`,borderRadius:12,padding:"18px 20px",cursor:onClick?"pointer":"default",position:"relative",overflow:"hidden"}}>
      {gold&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${T.gold},transparent)`}}/>}
      <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:T.textMuted,marginBottom:10,display:"flex",justifyContent:"space-between"}}>
        {label}
        {onClick&&<span style={{color:T.gold,fontSize:9}}>VIEW ↗</span>}
      </div>
      <div style={{fontSize:28,fontWeight:600,color:gold?T.gold:T.text,fontFamily:T.mono,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:subColor||T.textMuted,marginTop:8}}>{sub}</div>}
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({filtered,srcStats,apptStats,pipelineStats,onOpen,activeSrc,T}){
  if(!filtered.length)return<NoData T={T}/>;
  const SC=T.bg==="#F5F0E8"?SOURCE_COLORS_LIGHT:SOURCE_COLORS_DARK;
  const fs=activeSrc==="All"?srcStats:srcStats.filter(r=>r.source===activeSrc);
  const tl=fs.reduce((s,r)=>s+r.leads,0),tb=fs.reduce((s,r)=>s+r.booked,0),tw=fs.reduce((s,r)=>s+r.closed,0);
  const tq=activeSrc==="All"?pipelineStats.find(p=>p.stage==="Qualified")?.count||0:Math.round((pipelineStats.find(p=>p.stage==="Qualified")?.count||0)*(tl/Math.max(srcStats.reduce((s,r)=>s+r.leads,0),1)));
  const chartData=filtered.map(r=>{if(activeSrc==="All")return{...r,day:r.label};const row={day:r.label};SOURCES.forEach(s=>{row[s]=s===activeSrc?(r[s]||0):0;});return row;});
  const vis=activeSrc==="All"?SOURCES:[activeSrc];
  const sel=activeSrc==="All"?null:fs[0];
  const bookRate=sel?pct(sel.booked,sel.leads):pct(tb,tl);
  const winRate=sel?pct(sel.closed,sel.leads):pct(tw,tl);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
        <KpiCard T={T} label="Total Leads" value={tl} sub={`${Math.round(tl/Math.max(filtered.length,1))}/day avg`} subColor={T.gold} gold onClick={()=>onOpen(null,activeSrc==="All"?null:activeSrc)}/>
        <KpiCard T={T} label="Avg Per Day" value={Math.round(tl/Math.max(filtered.length,1))} sub="daily volume"/>
        <KpiCard T={T} label="Appointments" value={apptStats.booked} sub={`${apptStats.completed} completed`} onClick={()=>onOpen("Appt Booked")}/>
        <KpiCard T={T} label="Book Rate" value={bookRate} sub="lead to appointment" subColor={T.gold} gold/>
        <KpiCard T={T} label="Qualified" value={tq} sub="opportunities" onClick={()=>onOpen("Qualified")}/>
        <KpiCard T={T} label="Closed Won" value={tw} sub={`${winRate} win rate`} subColor={T.green} gold onClick={()=>onOpen("Closed Won")}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
        <Card T={T} style={{padding:"20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div>
              <div style={{fontSize:14,fontWeight:500,color:T.text,marginBottom:2}}>
                Daily Lead Volume
                {activeSrc!=="All"&&<span style={{color:SC[activeSrc],fontSize:12,marginLeft:8}}>· {activeSrc}</span>}
              </div>
              <div style={{fontSize:11,color:T.textMuted}}>{activeSrc==="All"?"Stacked by source":`${activeSrc} only`}</div>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"flex-end",maxWidth:200}}>
              {vis.map(s=><div key={s} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:SC[s]}}/><span style={{fontSize:9,color:T.textMuted}}>{s.split(" ")[0]}</span></div>)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{top:4,right:0,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 6" stroke={T.border} vertical={false}/>
              <XAxis dataKey="day" tick={{fill:T.textMuted,fontSize:9}} tickLine={false} axisLine={false} interval={Math.max(0,Math.floor(filtered.length/9)-1)}/>
              <YAxis tick={{fill:T.textMuted,fontSize:9}} tickLine={false} axisLine={false}/>
              <Tooltip content={<HubTooltip T={T}/>}/>
              {vis.slice().reverse().map(s=><Area key={s} type="monotone" dataKey={s} stackId="1" stroke="none" fill={SC[s]} fillOpacity={0.85}/>)}
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {(activeSrc==="All"
            ?[{l:"Show Rate",v:apptStats.showRate+"%",c:T.green},{l:"Cancel Rate",v:apptStats.cancelRate+"%",c:T.red},{l:"Meta → Booked",v:pct(srcStats[0]?.booked||0,srcStats[0]?.leads||1),c:T.gold},{l:"Referral → Booked",v:pct(srcStats[1]?.booked||0,srcStats[1]?.leads||1),c:T.gold}]
            :[{l:"Total Leads",v:tl,c:SC[activeSrc]||T.gold},{l:"Appts Booked",v:sel?.booked||0,c:T.gold},{l:"Booking Rate",v:bookRate,c:T.gold},{l:"Closed Won",v:tw,c:T.green}]
          ).map(item=>(
            <Card key={item.l} T={T} style={{padding:"14px 16px",flex:1}}>
              <div style={{fontSize:9,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:T.textMuted,marginBottom:6}}>{item.l}</div>
              <div style={{fontSize:22,fontWeight:600,color:item.c,fontFamily:T.mono}}>{item.v}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LEAD SOURCES TAB ────────────────────────────────────────────────────────
function LeadSourcesTab({srcStats,onOpen,T}){
  if(srcStats.every(r=>r.leads===0))return<NoData T={T}/>;
  const SC=T.bg==="#F5F0E8"?SOURCE_COLORS_LIGHT:SOURCE_COLORS_DARK;
  const total=srcStats.reduce((s,r)=>s+r.leads,0);
  const pieData=srcStats.filter(r=>r.leads>0).map(r=>({name:r.source,value:r.leads}));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card T={T} style={{padding:"20px"}}>
          <SectionLabel T={T}>Volume by Source</SectionLabel>
          {srcStats.map(row=>(
            <div key={row.source} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:12,color:T.textSub}}>{row.source}</span>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <button onClick={()=>onOpen(null,row.source)} style={{background:"none",border:"none",cursor:"pointer",color:T.textSub,fontSize:12,fontFamily:T.mono,textDecoration:"underline",textDecorationStyle:"dotted",textDecorationColor:T.gold}}>{row.leads}</button>
                  <span style={{color:SC[row.source],fontSize:11,minWidth:36,textAlign:"right",fontFamily:T.mono,fontWeight:500}}>{total?pct(row.leads,total):"—"}</span>
                </div>
              </div>
              <div style={{background:T.border,borderRadius:4,height:6,overflow:"hidden"}}>
                <div style={{width:total?pct(row.leads,total):"0%",height:"100%",background:SC[row.source],borderRadius:4,transition:"width 0.6s ease"}}/>
              </div>
            </div>
          ))}
        </Card>
        <Card T={T} style={{padding:"20px"}}>
          <SectionLabel T={T}>Source Mix</SectionLabel>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3} stroke="none">
              {pieData.map((e,i)=><Cell key={i} fill={SC[e.name]}/>)}
            </Pie><Tooltip formatter={(v,n)=>[v+" leads",n]} contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11}}/></PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginTop:4}}>
            {SOURCES.map(s=><div key={s} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:SC[s]}}/><span style={{fontSize:10,color:T.textMuted}}>{s}</span></div>)}
          </div>
        </Card>
      </div>
      <Card T={T} style={{padding:"20px"}}>
        <SectionLabel T={T}>Conversion by Source</SectionLabel>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Source","Leads","Booked","Book Rate","Won","Win % Leads","Win % Appts"].map(h=>(
            <th key={h} style={{fontSize:10,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",textAlign:h==="Source"?"left":"right",padding:"0 10px 10px",borderBottom:`1px solid ${T.border}`,color:T.textMuted}}>{h}</th>
          ))}</tr></thead>
          <tbody>{srcStats.map(row=>(
            <tr key={row.source} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:"11px 10px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:3,background:SC[row.source]}}/><span style={{fontSize:12,color:T.textSub}}>{row.source}</span></div></td>
              <td style={{padding:"11px 10px",textAlign:"right"}}><button onClick={()=>onOpen(null,row.source)} style={{background:"none",border:"none",cursor:"pointer",color:T.textSub,fontSize:12,fontFamily:T.mono,textDecoration:"underline",textDecorationStyle:"dotted",textDecorationColor:T.gold}}>{row.leads}</button></td>
              <td style={{padding:"11px 10px",textAlign:"right",fontSize:12,color:T.textMuted,fontFamily:T.mono}}>{row.booked}</td>
              <td style={{padding:"11px 10px",textAlign:"right",fontSize:12,color:SC[row.source],fontFamily:T.mono,fontWeight:500}}>{pct(row.booked,row.leads)}</td>
              <td style={{padding:"11px 10px",textAlign:"right",fontSize:12,color:T.green,fontFamily:T.mono}}>{row.closed}</td>
              <td style={{padding:"11px 10px",textAlign:"right",fontSize:12,color:T.gold,fontFamily:T.mono,fontWeight:500}}>{pct(row.closed,row.leads)}</td>
              <td style={{padding:"11px 10px",textAlign:"right",fontSize:12,color:T.gold,fontFamily:T.mono,fontWeight:500}}>{pct(row.closed,row.booked)}</td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── PIPELINE TAB ─────────────────────────────────────────────────────────────
function PipelineTab({pipelineStats,onOpen,T}){
  if(!pipelineStats.length)return<NoData T={T}/>;
  const won=pipelineStats.find(p=>p.stage==="Closed Won"),lost=pipelineStats.find(p=>p.stage==="Closed Lost"),nurt=pipelineStats.find(p=>p.stage==="Nurture");
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card T={T} style={{padding:"20px"}}>
          <SectionLabel T={T} action="click row to view leads">Funnel Stages</SectionLabel>
          {pipelineStats.map((row,i)=>{
            const c=STAGE_COLORS[row.stage]||T.gold;
            return(
              <div key={row.stage} className="stage-row" onClick={()=>onOpen(row.stage)} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 12px",borderRadius:8,marginBottom:3,background:row.stage==="Closed Won"?T.green+"10":row.stage==="Closed Lost"?T.red+"10":row.stage==="Nurture"?T.purple+"10":"transparent",borderLeft:`3px solid ${c}`}}>
                <span style={{color:T.textFaint,fontSize:10,width:18,textAlign:"right",fontFamily:T.mono}}>{String(i+1).padStart(2,"0")}</span>
                <span style={{flex:1,fontSize:12,fontWeight:500,color:STAGE_TEXT[row.stage]||T.textSub}}>{row.stage}</span>
                <div style={{width:70,background:T.border,borderRadius:4,height:5,overflow:"hidden"}}><div style={{width:`${row.pct}%`,height:"100%",background:c,borderRadius:4}}/></div>
                <span style={{fontSize:14,fontWeight:600,color:T.text,width:44,textAlign:"right",fontFamily:T.mono,textDecoration:"underline",textDecorationColor:c+"60",textDecorationStyle:"dotted"}}>{row.count}</span>
                <span style={{fontSize:10,color:c,width:38,textAlign:"right",fontFamily:T.mono}}>{row.pct}%</span>
              </div>
            );
          })}
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card T={T} style={{padding:"20px",flex:1}}>
            <SectionLabel T={T}>Distribution</SectionLabel>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pipelineStats} layout="vertical" margin={{left:8,right:28,top:0,bottom:0}}>
                <XAxis type="number" tick={{fill:T.textMuted,fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="stage" tick={{fill:T.textMuted,fontSize:9}} axisLine={false} tickLine={false} width={100}/>
                <Tooltip content={<HubTooltip T={T}/>}/>
                <Bar dataKey="count" radius={[0,4,4,0]} cursor="pointer" onClick={d=>onOpen(d.stage)}>
                  {pipelineStats.map(e=><Cell key={e.stage} fill={STAGE_COLORS[e.stage]||T.gold}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[{d:won,c:T.green,bg:T.green+"12",l:"Won"},{d:lost,c:T.red,bg:T.red+"12",l:"Lost"},{d:nurt,c:T.purple,bg:T.purple+"12",l:"Nurture"}].map(item=>(
              <Card key={item.l} T={T} style={{padding:"14px",cursor:"pointer",background:item.bg,border:`1px solid ${item.c}25`}} onClick={()=>onOpen(item.d?.stage||item.l)}>
                <div style={{fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",color:item.c,marginBottom:6}}>{item.l}</div>
                <div style={{fontSize:22,fontWeight:700,color:item.c,fontFamily:T.mono}}>{item.d?.count||0}</div>
                <div style={{fontSize:10,color:item.c,opacity:0.7,fontFamily:T.mono}}>{item.d?.pct||0}%</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APPOINTMENTS TAB ────────────────────────────────────────────────────────
function AppointmentsTab({apptStats,srcStats,onOpen,T}){
  if(!apptStats.booked)return<NoData T={T}/>;
  const SC=T.bg==="#F5F0E8"?SOURCE_COLORS_LIGHT:SOURCE_COLORS_DARK;
  const totalWon=srcStats.reduce((s,r)=>s+r.closed,0);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[{l:"Booked",v:apptStats.booked,c:T.gold,s:"Appt Booked"},{l:"Completed",v:apptStats.completed,c:T.green,s:"Appt Completed"},{l:"Canceled",v:apptStats.canceled,c:T.red},{l:"No-Show",v:apptStats.noshow,c:"#E08020"}].map(item=>(
          <div className={item.s?"kpi-card":"card"} key={item.l} onClick={item.s?()=>onOpen(item.s):undefined} style={{background:T.surface,border:`1px solid ${item.s?item.c+"40":T.border}`,borderRadius:12,padding:"18px 20px",cursor:item.s?"pointer":"default"}}>
            <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:T.textMuted,marginBottom:10}}>{item.l}{item.s&&<span style={{color:T.gold,marginLeft:6,fontSize:9}}>↗</span>}</div>
            <div style={{fontSize:28,fontWeight:700,color:item.c,fontFamily:T.mono}}>{item.v}</div>
            <div style={{fontSize:11,color:T.textMuted,marginTop:6}}>{pct(item.v,apptStats.booked)} of booked</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card T={T} style={{padding:"20px"}}>
          <SectionLabel T={T}>Booking Rate by Source</SectionLabel>
          {srcStats.map(row=>(
            <div key={row.source} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:12,color:T.textSub}}>{row.source}</span>
                <div style={{display:"flex",gap:10}}><span style={{fontSize:11,color:T.textMuted,fontFamily:T.mono}}>{row.booked}/{row.leads}</span><span style={{fontSize:12,color:SC[row.source],fontFamily:T.mono,fontWeight:500,minWidth:40,textAlign:"right"}}>{pct(row.booked,row.leads)}</span></div>
              </div>
              <div style={{background:T.border,borderRadius:4,height:5}}><div style={{width:pct(row.booked,row.leads),height:"100%",background:SC[row.source],borderRadius:4}}/></div>
            </div>
          ))}
        </Card>
        <Card T={T} style={{padding:"20px"}}>
          <SectionLabel T={T}>Appointment Health</SectionLabel>
          {[{l:"Show Rate",v:apptStats.showRate+"%",d:`${apptStats.completed} of ${apptStats.booked}`,c:T.green},{l:"Cancel Rate",v:apptStats.cancelRate+"%",d:`${apptStats.canceled} canceled`,c:T.red},{l:"No-Show Rate",v:pct(apptStats.noshow,apptStats.booked),d:`${apptStats.noshow} no-shows`,c:"#E08020"},{l:"Completed → Won",v:pct(totalWon,apptStats.completed),d:`${totalWon} closed`,c:T.gold}].map(item=>(
            <div key={item.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${T.border}`}}>
              <div><div style={{fontSize:12,fontWeight:500,color:T.textSub}}>{item.l}</div><div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{item.d}</div></div>
              <div style={{fontSize:20,fontWeight:700,color:item.c,fontFamily:T.mono}}>{item.v}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── ACTIVITY TAB ─────────────────────────────────────────────────────────────
function ActivityTab({filtered,srcStats,onOpen,T}){
  if(!filtered.length)return<NoData T={T}/>;
  const tl=srcStats.reduce((s,r)=>s+r.leads,0),tb=srcStats.reduce((s,r)=>s+r.booked,0),tw=srcStats.reduce((s,r)=>s+r.closed,0);
  const meta=srcStats.find(r=>r.source==="Meta Ads")||{leads:0,booked:0,closed:0};
  const weekMap={};
  filtered.forEach(r=>{const d=new Date(r.date),mon=new Date(d);mon.setDate(d.getDate()-((d.getDay()+6)%7));const wk=mon.toLocaleDateString("en-US",{month:"short",day:"numeric"});if(!weekMap[wk])weekMap[wk]={week:"Wk "+wk,leads:0,appts:0,won:0};const dl=SOURCES.reduce((a,k)=>a+(r[k]||0),0);weekMap[wk].leads+=dl;weekMap[wk].appts+=Math.round(dl*0.435);weekMap[wk].won+=Math.round(dl*0.106);});
  const wData=Object.values(weekMap);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card T={T} style={{padding:"20px"}}>
        <SectionHead T={T} title="Weekly" italic="Rhythm" sub="Leads vs appointments vs closed won by week"/>
        <div style={{display:"flex",gap:16,marginBottom:16}}>
          {[{l:"Leads",c:T.gold},{l:"Appointments",c:T.green},{l:"Closed Won",c:T.blue}].map(i=><div key={i.l} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:4,borderRadius:2,background:i.c}}/><span style={{fontSize:11,color:T.textMuted}}>{i.l}</span></div>)}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={wData} barGap={4} margin={{left:-12,right:0,top:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 6" stroke={T.border} vertical={false}/>
            <XAxis dataKey="week" tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip content={<HubTooltip T={T}/>}/>
            <Bar dataKey="leads" fill={T.gold} radius={[4,4,0,0]}/>
            <Bar dataKey="appts" fill={T.green} radius={[4,4,0,0]}/>
            <Bar dataKey="won"   fill={T.blue}  radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card T={T} style={{padding:"20px"}}>
          <SectionHead T={T} title="Meta" italic="Attribution" sub="Via HubSpot UTM tracking"/>
          {[{l:"Meta leads (UTM)",v:meta.leads},{l:"Appointment booked",v:meta.booked},{l:"Appointment attended",v:Math.round(meta.booked*0.728)},{l:"Deal created",v:Math.round(meta.booked*0.541)},{l:"Closed Won",v:meta.closed}].map((step,i,arr)=>(
            <div key={step.l}>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:14}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:i===arr.length-1?T.green:T.gold,flexShrink:0}}/>
                  {i<arr.length-1&&<div style={{width:1,height:18,background:T.border,marginTop:2}}/>}
                </div>
                <span style={{flex:1,fontSize:12,color:i===arr.length-1?T.green:T.textSub}}>{step.l}</span>
                <span style={{fontSize:14,fontWeight:600,color:i===arr.length-1?T.green:T.text,fontFamily:T.mono}}>{step.v}</span>
                {i>0&&<span style={{fontSize:10,color:T.textFaint,fontFamily:T.mono,width:32,textAlign:"right"}}>-{arr[i-1].v-step.v}</span>}
              </div>
            </div>
          ))}
          <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`,display:"flex",gap:20}}>
            {[{l:"Meta → Won",v:pct(meta.closed,meta.leads),c:T.gold},{l:"Attended → Won",v:pct(meta.closed,Math.round(meta.booked*0.728)),c:T.green}].map(m=>(
              <div key={m.l}><div style={{fontSize:10,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.08em",color:T.textMuted,marginBottom:3}}>{m.l}</div><div style={{fontSize:18,fontWeight:700,color:m.c,fontFamily:T.mono}}>{m.v}</div></div>
            ))}
          </div>
        </Card>
        <Card T={T} style={{padding:"20px"}}>
          <SectionHead T={T} title="Period" italic="Summary"/>
          {[{l:"Total Leads",v:tl,c:T.gold,click:()=>onOpen(null)},{l:"Appointments Booked",v:tb,c:T.gold,click:()=>onOpen("Appt Booked")},{l:"Closed Won",v:tw,c:T.green,click:()=>onOpen("Closed Won")},{l:"Lead → Appt Rate",v:pct(tb,tl),c:T.gold,txt:true},{l:"Lead → Won Rate",v:pct(tw,tl),c:T.green,txt:true},{l:"Avg Leads / Day",v:Math.round(tl/Math.max(filtered.length,1)),c:T.textMuted}].map(row=>(
            <div key={row.l} onClick={row.click} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderRadius:8,marginBottom:4,cursor:row.click?"pointer":"default",transition:"background 0.12s"}}
              onMouseEnter={e=>row.click&&(e.currentTarget.style.background=T.goldFaint)}
              onMouseLeave={e=>row.click&&(e.currentTarget.style.background="transparent")}
            >
              <span style={{fontSize:12,color:T.textSub}}>{row.l}{row.click&&<span style={{color:T.gold,marginLeft:6,fontSize:10}}>↗</span>}</span>
              <span style={{fontSize:row.txt?15:18,fontWeight:600,color:row.c,fontFamily:T.mono}}>{row.v}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [activeTab, setActiveTab] = useState("Overview");
  const [dateRange, setDateRange] = useState(()=>PRESETS.find(p=>p.label==="Last 7D").getDates());
  const [activeSrc, setActiveSrc] = useState("All");
  const [darkMode,  setDarkMode]  = useState(false);
  const [drawer,    setDrawer]    = useState({open:false,stage:null,filterSrc:null});

  const T = darkMode ? DARK : LIGHT;

  const filtered=useMemo(()=>{const from=new Date(dateRange.from);from.setHours(0,0,0,0);const to=new Date(dateRange.to);to.setHours(23,59,59,999);return RAW_DAILY.filter(r=>r.date>=from&&r.date<=to);},[dateRange]);
  const leads=useMemo(()=>buildLeads(filtered),[filtered]);
  const srcStats=useMemo(()=>buildSrcStats(filtered),[filtered]);
  const apptStats=useMemo(()=>buildAppt(filtered),[filtered]);
  const pipelineStats=useMemo(()=>buildPipeline(leads),[leads]);

  const openDrawer=useCallback((stage,src=null)=>setDrawer({open:true,stage,filterSrc:src}),[]);
  const closeDrawer=useCallback(()=>setDrawer(d=>({...d,open:false})),[]);
  const drawerLeads=useMemo(()=>drawer.filterSrc?leads.filter(l=>l.source===drawer.filterSrc):leads,[leads,drawer.filterSrc]);

  const sharedProps={filtered,srcStats,apptStats,pipelineStats,onOpen:openDrawer,activeSrc,T};
  const tabContent={
    "Overview":     <OverviewTab     {...sharedProps}/>,
    "Lead Sources": <LeadSourcesTab  srcStats={srcStats} onOpen={openDrawer} T={T}/>,
    "Pipeline":     <PipelineTab     pipelineStats={pipelineStats} onOpen={openDrawer} T={T}/>,
    "Appointments": <AppointmentsTab apptStats={apptStats} srcStats={srcStats} onOpen={openDrawer} T={T}/>,
    "Activity":     <ActivityTab     filtered={filtered} srcStats={srcStats} onOpen={openDrawer} T={T}/>,
  };

  return(
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:T.bg,fontFamily:T.sans,color:T.text}}>
      <style>{makeCSS(T)}</style>

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} darkMode={darkMode} setDarkMode={setDarkMode} T={T}/>

      {/* Main content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <Header activeTab={activeTab} dateRange={dateRange} setDateRange={setDateRange} activeSrc={activeSrc} setActiveSrc={setActiveSrc} T={T}/>
        <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
          <div style={{animation:"slideUp 0.2s ease",maxWidth:1400}}>
            {tabContent[activeTab]}
          </div>
        </div>
      </div>

      <LeadDrawer open={drawer.open} stage={drawer.stage} leads={drawerLeads} onClose={closeDrawer} T={T}/>
    </div>
  );
}

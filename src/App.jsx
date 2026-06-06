import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://sfubbasdtvbjilrmrfoj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdWJiYXNkdHZiamlscm1yZm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODE2NzksImV4cCI6MjA5NjI1NzY3OX0.carLE4hemqWzmGq2G2kIw9DPX3gk4xPW_0FJwBcLNQQ";

const db = {
  async select(table) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async insert(table, row) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async update(table, id, changes) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(changes),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async delete(table, id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) throw new Error(await res.text());
  },
  async insertBatch(table, rows) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(await res.text());
  },
};

const BRANCHES = {
  FRIENDSHIP: {
    label: "Friendship Highway",
    trainers: [
      { name: "HARI",   pin: "1111" },
      { name: "MELVIN", pin: "2222" },
      { name: "ELE",    pin: "3333" },
    ],
  },
  GREENFIELDS: {
    label: "Greenfields",
    trainers: [
      { name: "PAOLO", pin: "4444" },
    ],
  },
};

const TRAINER_COLORS = { HARI: "#7C3AED", MELVIN: "#6D28D9", ELE: "#9333EA", PAOLO: "#7C3AED" };
const DAYS       = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const SLOT_HOURS = ["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];
const MONTHS     = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Get the Monday of the current week
function getWeekStart(offset = 0) {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day); // adjust to Monday
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff + offset * 7);
  mon.setHours(0,0,0,0);
  return mon;
}

// Get array of 7 Date objects for the week
function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

// Map Date to our DAY string
function dateToDayStr(date) {
  return ["SUN","MON","TUE","WED","THU","FRI","SAT"][date.getDay()];
}

function generateDefaultSlots() {
  const slots = [];
  let idx = 0;
  Object.entries(BRANCHES).forEach(([branchKey, branch]) => {
    branch.trainers.forEach(trainer => {
      DAYS.forEach(day => {
        SLOT_HOURS.forEach(time => {
          slots.push({ id: `def_${idx++}`, branch: branchKey, day, time, trainer: trainer.name, available: true });
        });
      });
    });
  });
  return slots;
}

const genId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

// ── LOGO ──────────────────────────────────────────────────────────────────────
const AFLogo = ({ height = 44, white = false }) => {
  const wc = white ? "#fff" : "#1a1a1a";
  const ec = white ? "#fff" : "#7C3AED";
  return (
    <svg height={height} viewBox="0 0 260 60" fill="none">
      <circle cx="30" cy="30" r="28" fill={ec}/>
      <circle cx="34" cy="12" r="4.5" fill="white"/>
      <path d="M30 17 L24 28 L18 34" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <path d="M30 17 L38 22" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <path d="M26 22 L20 26" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <path d="M24 28 L20 36 L16 42" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <path d="M24 28 L30 36 L28 44" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <line x1="8" y1="24" x2="14" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <line x1="6" y1="30" x2="13" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <text x="68" y="26" fontFamily="'Barlow Condensed',sans-serif" fontWeight="900" fontSize="22" fill={wc} letterSpacing="2">ANYTIME</text>
      <rect x="68" y="20" width="136" height="2.5" fill={white?"rgba(255,255,255,0.35)":"rgba(124,58,237,0.25)"}/>
      <text x="68" y="48" fontFamily="'Barlow Condensed',sans-serif" fontWeight="900" fontSize="22" fill={wc} letterSpacing="2">FITNESS</text>
      <rect x="68" y="42" width="110" height="2.5" fill={white?"rgba(255,255,255,0.35)":"rgba(124,58,237,0.25)"}/>
    </svg>
  );
};

// ── CONFIRM DIALOG ────────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(91,33,182,.28)",zIndex:400,
      display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:"#fff",borderRadius:12,border:"2px solid #DDD6FE",padding:"32px 28px",
        maxWidth:400,width:"100%",boxShadow:"0 20px 60px rgba(124,58,237,.18)",textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:14}}>⚠️</div>
        <p style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,
          color:"#1E1B4B",marginBottom:26,lineHeight:1.4}}>{message}</p>
        <div style={{display:"flex",gap:12}}>
          <button onClick={onCancel} style={{flex:1,padding:"13px",fontFamily:"'Barlow Condensed',sans-serif",
            fontSize:16,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",
            border:"2px solid #DDD6FE",borderRadius:6,background:"transparent",color:"#6b6b80"}}>Cancel</button>
          <button onClick={onConfirm} style={{flex:1,padding:"13px",fontFamily:"'Barlow Condensed',sans-serif",
            fontSize:16,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",
            border:"2px solid #dc2626",borderRadius:6,background:"#dc2626",color:"#fff"}}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#F5F3FF;--surface:#fff;--border:#DDD6FE;--border2:#C4B5FD;
    --purple:#7C3AED;--purple-dark:#5B21B6;--purple-light:#EDE9FE;--purple-faint:#F5F3FF;
    --text:#1E1B4B;--muted:#6D6A8A;--muted2:#A89EC9;
    --danger:#dc2626;--success:#059669;--success-light:#d1fae5;
  }
  body{background:var(--bg);color:var(--text);font-family:'Barlow',sans-serif;font-size:17px;}
  .app{min-height:100vh;display:flex;flex-direction:column;}

  /* HEADER */
  .header{display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:72px;
    background:var(--purple);box-shadow:0 2px 20px rgba(91,33,182,.35);position:sticky;top:0;z-index:100;}
  .header-right{display:flex;align-items:center;gap:10px;}
  .nav-tab{padding:10px 22px;font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:700;
    letter-spacing:2px;text-transform:uppercase;border:2px solid rgba(255,255,255,.35);
    background:transparent;color:rgba(255,255,255,.85);cursor:pointer;border-radius:6px;transition:all .15s;}
  .nav-tab:hover{border-color:#fff;color:#fff;}
  .nav-tab.active{background:#fff;color:var(--purple);border-color:#fff;}
  .branch-chip{padding:6px 14px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);
    border-radius:20px;font-size:13px;font-weight:700;letter-spacing:2px;
    color:rgba(255,255,255,.95);font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;}
  .main{flex:1;padding:32px 24px;max-width:1400px;margin:0 auto;width:100%;}

  /* HOME SCREEN */
  .home-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70vh;text-align:center;}
  .home-logo{margin-bottom:32px;}
  .home-tagline{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:var(--muted);margin-bottom:40px;}
  .home-cta{font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--text);margin-bottom:24px;}
  .branch-cards{display:flex;gap:24px;flex-wrap:wrap;justify-content:center;}
  .branch-card{display:flex;flex-direction:column;align-items:center;gap:16px;padding:36px 44px;
    border:2px solid var(--border);background:var(--surface);border-radius:16px;cursor:pointer;
    transition:all .2s;min-width:220px;box-shadow:0 2px 12px rgba(124,58,237,.07);}
  .branch-card:hover{border-color:var(--purple);background:var(--purple-light);
    box-shadow:0 8px 28px rgba(124,58,237,.16);transform:translateY(-3px);}
  .branch-icon{width:72px;height:72px;border-radius:50%;background:var(--purple);display:flex;align-items:center;justify-content:center;font-size:32px;}
  .branch-name{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--text);}
  .branch-card:hover .branch-name{color:var(--purple);}
  .branch-sub{font-size:14px;color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-weight:600;text-transform:uppercase;}

  /* SECTION HEAD */
  .section-head{margin-bottom:24px;}
  .section-head h1{font-family:'Barlow Condensed',sans-serif;font-size:clamp(32px,4vw,56px);font-weight:900;letter-spacing:-.5px;text-transform:uppercase;line-height:1;color:var(--text);}
  .section-head h1 em{color:var(--purple);font-style:normal;}
  .section-head p{color:var(--muted);font-size:15px;letter-spacing:2px;margin-top:8px;text-transform:uppercase;}

  /* TRAINER PICKER */
  .picker-label{font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:16px;}
  .trainer-cards{display:flex;gap:16px;flex-wrap:wrap;}
  .trainer-card-pick{display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px 32px;
    border:2px solid var(--border);background:var(--surface);border-radius:12px;cursor:pointer;
    transition:all .18s;min-width:140px;}
  .trainer-card-pick:hover{border-color:var(--purple);background:var(--purple-light);
    box-shadow:0 4px 16px rgba(124,58,237,.12);transform:translateY(-2px);}
  .tc-avatar{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:900;color:#fff;}
  .tc-name{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--text);}
  .trainer-card-pick:hover .tc-name{color:var(--purple);}

  /* WEEK NAVIGATION */
  .week-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;}
  .week-label{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;letter-spacing:1px;text-transform:uppercase;color:var(--text);}
  .week-btns{display:flex;gap:8px;}
  .week-btn{padding:8px 18px;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;
    letter-spacing:2px;text-transform:uppercase;border:2px solid var(--border);background:var(--surface);
    color:var(--muted);cursor:pointer;border-radius:6px;transition:all .15s;}
  .week-btn:hover{border-color:var(--purple);color:var(--purple);}
  .week-btn.today{background:var(--purple);color:#fff;border-color:var(--purple);}

  /* WEEKLY CALENDAR */
  .week-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;overflow-x:auto;}
  .day-col{min-width:120px;}
  .day-header{text-align:center;padding:12px 8px;background:var(--purple);border-radius:10px 10px 0 0;margin-bottom:8px;}
  .day-header.today-col{background:var(--purple-dark);}
  .day-name{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;
    letter-spacing:2px;color:#fff;text-transform:uppercase;line-height:1;}
  .day-date{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:600;
    color:rgba(255,255,255,.8);letter-spacing:1px;margin-top:2px;}
  .day-slots{display:flex;flex-direction:column;gap:6px;}

  /* SLOT PILL */
  .slot-pill{padding:10px 12px;border-radius:8px;border:2px solid var(--border);background:var(--surface);
    cursor:pointer;transition:all .15s;position:relative;}
  .slot-pill:hover{border-color:var(--purple);box-shadow:0 2px 10px rgba(124,58,237,.15);transform:translateY(-1px);}
  .slot-pill.booked{background:var(--purple-light);border-color:var(--border2);cursor:default;}
  .slot-pill.booked:hover{transform:none;box-shadow:none;}
  .slot-pill.unavailable{opacity:.3;cursor:not-allowed;}
  .slot-pill.unavailable:hover{transform:none;box-shadow:none;border-color:var(--border);}
  .slot-pill.trainer-off{background:#f9fafb;border-color:#e5e7eb;cursor:default;}
  .pill-time{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;
    color:var(--text);letter-spacing:-0.5px;line-height:1;}
  .pill-status{font-size:11px;font-weight:700;letter-spacing:1.5px;font-family:'Barlow Condensed',sans-serif;
    text-transform:uppercase;margin-top:2px;}
  .pill-status.open{color:var(--success);}
  .pill-status.booked{color:var(--purple);}
  .pill-status.off{color:var(--muted2);}
  .pill-client{font-size:12px;color:var(--purple-dark,#5B21B6);font-weight:600;margin-top:4px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .pill-actions{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;}

  /* TOGGLE SWITCH */
  .slot-toggle{width:34px;height:18px;border-radius:9px;border:none;cursor:pointer;
    transition:all .2s;display:inline-flex;align-items:center;padding:2px;vertical-align:middle;}
  .slot-toggle.on{background:var(--purple);justify-content:flex-end;}
  .slot-toggle.off{background:#C4B5FD;justify-content:flex-start;}
  .slot-toggle::after{content:'';width:12px;height:12px;border-radius:50%;background:#fff;}

  /* MODALS */
  .modal-overlay{position:fixed;inset:0;background:rgba(91,33,182,.22);z-index:200;
    display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);}
  .modal{background:#fff;border-radius:14px;border:2px solid var(--border);width:100%;max-width:460px;
    padding:40px;box-shadow:0 20px 60px rgba(124,58,237,.18);animation:slideUp .2s ease;}
  @keyframes slideUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
  .modal-logo{margin-bottom:18px;}
  .modal h2{font-family:'Barlow Condensed',sans-serif;font-size:32px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:var(--text);}
  .modal-sub{color:var(--muted);font-size:15px;letter-spacing:1.5px;margin:8px 0 24px;font-family:'Barlow Condensed',sans-serif;font-weight:600;text-transform:uppercase;}
  .field{margin-bottom:18px;}
  .field label{display:block;font-size:13px;letter-spacing:2px;color:var(--muted);font-weight:700;font-family:'Barlow Condensed',sans-serif;margin-bottom:8px;text-transform:uppercase;}
  .field input,.field select{width:100%;padding:13px 16px;background:var(--bg);border:2px solid var(--border);color:var(--text);font-family:'Barlow',sans-serif;font-size:17px;border-radius:8px;outline:none;transition:border-color .15s;}
  .field input:focus,.field select:focus{border-color:var(--purple);}
  .btn-row{display:flex;gap:12px;margin-top:24px;}
  .btn{flex:1;padding:14px;font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border:2px solid;border-radius:8px;transition:all .15s;}
  .btn-primary{background:var(--purple);color:#fff;border-color:var(--purple);}
  .btn-primary:hover{background:var(--purple-dark);border-color:var(--purple-dark);}
  .btn-ghost{background:transparent;color:var(--muted);border-color:var(--border);}
  .btn-ghost:hover{color:var(--text);border-color:var(--muted2);}
  .btn-danger{background:transparent;color:var(--danger);border-color:var(--danger);}
  .btn-danger:hover{background:var(--danger);color:#fff;}
  .btn-sm{flex:none;padding:5px 12px;font-size:12px;letter-spacing:1px;border-radius:5px;}

  /* CONFIRM SCREEN */
  .confirm-screen{text-align:center;padding:10px 0;}
  .confirm-icon{font-size:56px;margin-bottom:12px;}
  .confirm-screen h2{font-family:'Barlow Condensed',sans-serif;font-size:36px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:var(--text);}
  .confirm-screen p{color:var(--muted);font-size:16px;margin-top:8px;}
  .confirm-detail{margin:22px 0;padding:18px;border:2px solid var(--border);border-radius:10px;background:var(--purple-faint);text-align:left;}
  .confirm-detail div{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);font-size:16px;}
  .confirm-detail div:last-child{border-bottom:none;}
  .confirm-detail span{color:var(--muted);font-size:13px;font-weight:700;letter-spacing:1.5px;font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;align-self:center;}

  /* TRAINER LOGIN */
  .pin-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:65vh;gap:20px;}
  .pin-screen h2{font-family:'Barlow Condensed',sans-serif;font-size:40px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:var(--text);text-align:center;}
  .trainer-select-row{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;}
  .trainer-pill{padding:14px 32px;font-size:18px;letter-spacing:3px;font-family:'Barlow Condensed',sans-serif;font-weight:700;border:2px solid var(--border);background:var(--surface);color:var(--muted);cursor:pointer;border-radius:10px;transition:all .15s;text-transform:uppercase;}
  .trainer-pill:hover{border-color:var(--purple);color:var(--purple);background:var(--purple-light);}
  .pin-label{color:var(--muted);font-size:14px;letter-spacing:3px;font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;}
  .pin-input{width:200px;text-align:center;font-size:36px;letter-spacing:14px;padding:16px;background:var(--surface);border:2px solid var(--border);color:var(--purple);font-family:'Barlow Condensed',sans-serif;font-weight:700;outline:none;border-radius:10px;}
  .pin-input:focus{border-color:var(--purple);}
  .pin-error{color:var(--danger);font-size:15px;letter-spacing:2px;font-family:'Barlow Condensed',sans-serif;font-weight:700;}

  /* DASHBOARD */
  .stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:24px;}
  .stat-box{background:var(--surface);border:2px solid var(--border);border-radius:10px;padding:16px 18px;}
  .stat-n{font-family:'Barlow Condensed',sans-serif;font-size:44px;font-weight:900;color:var(--purple);line-height:1;}
  .stat-l{font-size:13px;color:var(--muted);letter-spacing:2px;font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;margin-top:4px;}
  .tab-row{display:flex;gap:8px;margin-bottom:22px;}
  .trainer-toolbar{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;align-items:center;}
  .trainer-toolbar .btn{flex:none;padding:11px 22px;font-size:15px;}
  .add-slot-form{background:var(--purple-light);border:2px solid var(--border);border-radius:12px;padding:24px;margin-bottom:22px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;align-items:end;}
  .bookings-table{width:100%;border-collapse:collapse;}
  .bookings-table th{text-align:left;font-size:13px;letter-spacing:3px;color:var(--muted);font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;padding:12px 16px;border-bottom:2px solid var(--border);}
  .bookings-table td{padding:14px 16px;border-bottom:1px solid var(--border);font-size:16px;}
  .bookings-table tr:hover td{background:var(--purple-faint);}
  .bookings-table tbody tr:last-child td{border-bottom:none;}
  .empty-state{text-align:center;padding:48px 20px;color:var(--muted2);font-size:16px;letter-spacing:2px;font-family:'Barlow Condensed',sans-serif;font-weight:600;text-transform:uppercase;}
  .dashboard-top{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:24px;}
  .back-link{font-size:15px;letter-spacing:2px;color:var(--muted);cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;background:none;border:none;padding:0;}
  .back-link:hover{color:var(--purple);}
  .loading-screen{min-height:100vh;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;}
  .spinner{width:32px;height:32px;border:3px solid var(--border);border-top-color:var(--purple);border-radius:50%;animation:spin .7s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .loading-txt{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;letter-spacing:3px;color:var(--muted);text-transform:uppercase;}
  .sync-dot{position:fixed;bottom:20px;right:20px;width:10px;height:10px;border-radius:50%;background:var(--success);opacity:0;transition:opacity .3s;z-index:99;}
  .sync-dot.show{opacity:1;animation:pulse 1.5s ease-out;}
  @keyframes pulse{0%{opacity:1;transform:scale(1);}100%{opacity:0;transform:scale(2.5);}}
  .error-banner{background:#FEF2F2;border:2px solid #FECACA;border-radius:8px;padding:14px 18px;margin-bottom:20px;font-size:15px;color:#dc2626;font-family:'Barlow Condensed',sans-serif;font-weight:700;}
  .no-slots-day{text-align:center;padding:16px 8px;color:var(--muted2);font-size:12px;font-family:'Barlow Condensed',sans-serif;font-weight:600;letter-spacing:1px;text-transform:uppercase;}
`;

// ── WEEKLY CALENDAR ───────────────────────────────────────────────────────────
// Used by both client and trainer views
function WeekCalendar({ weekDates, slots, bookings, trainerMode, onSlotClick, onToggle, onDelete, onAddClient, onCancelBooking, accentColor }) {
  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div className="week-grid">
      {weekDates.map((date, di) => {
        const dayStr  = dateToDayStr(date);
        const isToday = date.getTime() === today.getTime();
        const daySlots = slots
          .filter(s => s.day === dayStr)
          .sort((a,b) => a.time.localeCompare(b.time));

        // Client: only show available unbooked slots
        // Trainer: show ALL slots (booked + toggled off) — the "noise" reduction is on the client side
        const visibleSlots = trainerMode
          ? daySlots
          : daySlots.filter(s => s.available && !bookings.find(b => b.slot_id === s.id));

        return (
          <div key={di} className="day-col">
            <div className={`day-header ${isToday ? "today-col" : ""}`}>
              <div className="day-name">{dayStr}</div>
              <div className="day-date">{date.getDate()} {MONTHS[date.getMonth()]}</div>
            </div>
            <div className="day-slots">
              {visibleSlots.length === 0
                ? <div className="no-slots-day">—</div>
                : visibleSlots.map(slot => {
                    const booking  = bookings.find(b => b.slot_id === slot.id);
                    const isBooked = !!booking;
                    return (
                      <div key={slot.id}
                        className={`slot-pill ${isBooked?"booked":!slot.available?"unavailable":""}`}
                        onClick={() => !trainerMode && !isBooked && slot.available && onSlotClick(slot)}>

                        <div className="pill-time">{slot.time}</div>
                        <div className={`pill-status ${isBooked?"booked":slot.available?"open":"off"}`}>
                          {isBooked ? "BOOKED" : slot.available ? "OPEN" : "OFF"}
                        </div>
                        {isBooked && <div className="pill-client">👤 {booking.client_name}</div>}

                        {trainerMode && (
                          <div className="pill-actions">
                            {isBooked ? (
                              <button className="btn btn-danger btn-sm"
                                onClick={e=>{e.stopPropagation();onCancelBooking(booking.id);}}>
                                Cancel
                              </button>
                            ) : (
                              <>
                                {slot.available && (
                                  <button className="btn btn-primary btn-sm"
                                    style={{background:accentColor,borderColor:accentColor}}
                                    onClick={e=>{e.stopPropagation();onAddClient(slot);}}>
                                    + Add
                                  </button>
                                )}
                                <button className={`slot-toggle ${slot.available?"on":"off"}`}
                                  onClick={e=>{e.stopPropagation();onToggle(slot.id,slot.available);}}/>
                                <button onClick={e=>{e.stopPropagation();onDelete(slot.id);}}
                                  style={{background:"none",border:"none",color:"#C4B5FD",cursor:"pointer",fontSize:14,padding:"2px 4px"}}>✕</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── MODALS ────────────────────────────────────────────────────────────────────
function AddClientModal({ slot, onClose, onConfirm }) {
  const [name, setName]     = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onConfirm({ id:genId(), slot_id:slot.id, client_name:name.trim(), booked_at:new Date().toISOString() });
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-logo"><AFLogo height={34}/></div>
        <h2>Add Client</h2>
        <div className="modal-sub">{slot.day} · {slot.time} · {slot.trainer}</div>
        <div className="field">
          <label>Client Full Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Client's full name"
            autoFocus onKeyDown={e=>{if(e.key==="Enter")submit();}}/>
        </div>
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving?"Saving...":"Confirm"}</button>
        </div>
      </div>
    </div>
  );
}

function BookingModal({ slot, branch, onClose, onConfirm }) {
  const [name, setName]     = useState("");
  const [done, setDone]     = useState(null);
  const [saving, setSaving] = useState(false);
  const color       = TRAINER_COLORS[slot.trainer] || "#7C3AED";
  const branchLabel = BRANCHES[branch]?.label || branch;

  if (done) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="confirm-screen">
          <div className="confirm-icon">⚡</div>
          <h2>You're Booked!</h2>
          <p>See you on {slot.day} at {slot.time}.</p>
          <div className="confirm-detail">
            <div><span>Name</span><strong>{done.client_name}</strong></div>
            <div><span>Branch</span><strong>{branchLabel}</strong></div>
            <div><span>Trainer</span><strong style={{color}}>{slot.trainer}</strong></div>
            <div><span>Day</span><strong>{slot.day}</strong></div>
            <div><span>Time</span><strong>{slot.time}</strong></div>
            <div><span>Ref</span><strong style={{fontSize:14}}>{done.id.slice(0,8).toUpperCase()}</strong></div>
          </div>
          <div className="btn-row"><button className="btn btn-primary" onClick={onClose}>Done</button></div>
        </div>
      </div>
    </div>
  );

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const b = { id:genId(), slot_id:slot.id, client_name:name.trim(), booked_at:new Date().toISOString() };
    await onConfirm(b);
    setDone(b);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-logo"><AFLogo height={32}/></div>
        <h2>Book Session</h2>
        <div className="modal-sub">{branchLabel} · {slot.day} · {slot.time} · <span style={{color}}>{slot.trainer}</span></div>
        <div className="field">
          <label>Your Full Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your full name"
            autoFocus onKeyDown={e=>{if(e.key==="Enter")submit();}}/>
        </div>
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving?"Saving...":"Confirm Booking"}</button>
        </div>
      </div>
    </div>
  );
}

// ── HOME SCREEN ───────────────────────────────────────────────────────────────
function HomeScreen({ onSelectBranch }) {
  return (
    <div className="home-screen">
      <div className="home-logo"><AFLogo height={64}/></div>
      <div className="home-tagline">Personal Training — Book Your Session</div>
      <div className="home-cta">Choose Your Branch</div>
      <div className="branch-cards">
        <div className="branch-card" onClick={()=>onSelectBranch("FRIENDSHIP")}>
          <div className="branch-icon">🏋️</div>
          <div className="branch-name">Friendship Highway</div>
          <div className="branch-sub">3 Trainers Available</div>
        </div>
        <div className="branch-card" onClick={()=>onSelectBranch("GREENFIELDS")}>
          <div className="branch-icon">🏋️</div>
          <div className="branch-name">Greenfields</div>
          <div className="branch-sub">1 Trainer Available</div>
        </div>
      </div>
    </div>
  );
}

// ── CLIENT VIEW ───────────────────────────────────────────────────────────────
function ClientView({ branch, onChangeBranch, slots, bookings, onBook }) {
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedSlot, setSelectedSlot]       = useState(null);
  const [weekOffset, setWeekOffset]           = useState(0);

  const branchData     = BRANCHES[branch];
  const branchTrainers = branchData.trainers;
  const weekStart      = getWeekStart(weekOffset);
  const weekDates      = getWeekDates(weekStart);
  const weekEnd        = weekDates[6];

  if (!selectedTrainer) return (
    <div>
      <button className="back-link" onClick={onChangeBranch} style={{marginBottom:22}}>← Change Branch</button>
      <div className="section-head">
        <h1>Book a<br/><em>Personal Training</em><br/>Session</h1>
        <p>{branchData.label} · Choose your trainer</p>
      </div>
      <div className="picker-label">Select Your Trainer</div>
      <div className="trainer-cards">
        {branchTrainers.map(t=>(
          <div key={t.name} className="trainer-card-pick" onClick={()=>setSelectedTrainer(t)}>
            <div className="tc-avatar" style={{background:TRAINER_COLORS[t.name]||"#7C3AED"}}>{t.name[0]}</div>
            <div className="tc-name">{t.name}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const color       = TRAINER_COLORS[selectedTrainer.name] || "#7C3AED";
  const trainerSlots = slots.filter(s => s.branch===branch && s.trainer===selectedTrainer.name);

  return (
    <div>
      <div style={{display:"flex",gap:14,marginBottom:20,flexWrap:"wrap"}}>
        <button className="back-link" onClick={onChangeBranch}>← Change Branch</button>
        <span style={{color:"var(--muted2)",alignSelf:"center"}}>·</span>
        <button className="back-link" onClick={()=>setSelectedTrainer(null)}>← Change Trainer</button>
      </div>
      <div className="section-head">
        <h1>Training with <em style={{color}}>{selectedTrainer.name}</em></h1>
        <p>{branchData.label} · Available slots this week</p>
      </div>

      <div className="week-nav">
        <div className="week-label">
          {weekDates[0].getDate()} {MONTHS[weekDates[0].getMonth()]} — {weekEnd.getDate()} {MONTHS[weekEnd.getMonth()]} {weekEnd.getFullYear()}
        </div>
        <div className="week-btns">
          <button className="week-btn" onClick={()=>setWeekOffset(w=>w-1)}>← Prev</button>
          <button className="week-btn today" onClick={()=>setWeekOffset(0)}>This Week</button>
          <button className="week-btn" onClick={()=>setWeekOffset(w=>w+1)}>Next →</button>
        </div>
      </div>

      <WeekCalendar
        weekDates={weekDates}
        slots={trainerSlots}
        bookings={bookings}
        trainerMode={false}
        onSlotClick={setSelectedSlot}
      />

      {selectedSlot && (
        <BookingModal slot={selectedSlot} branch={branch} onClose={()=>setSelectedSlot(null)}
          onConfirm={async b=>{ await onBook(b); setSelectedSlot(null); }}/>
      )}
    </div>
  );
}

// ── TRAINER DASHBOARD ─────────────────────────────────────────────────────────
function TrainerView({ slots, bookings, onToggleSlot, onDeleteSlot, onAddSlot, onCancelBooking, onAddClientBooking }) {
  const [branch, setBranch]         = useState(null);
  const [selectedTrainer, setTr]    = useState(null);
  const [pin, setPin]               = useState("");
  const [auth, setAuth]             = useState(false);
  const [pinErr, setPinErr]         = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [tab, setTab]               = useState("slots");
  const [addClientSlot, setACS]     = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [nDay, setNDay]             = useState("MON");
  const [nTime, setNTime]           = useState("06:00");
  const [confirmAction, setConfirm] = useState(null);

  const logout = () => { setAuth(false); setTr(null); setBranch(null); setPin(""); setTab("slots"); setShowAdd(false); setWeekOffset(0); };

  if (!branch) return (
    <div className="pin-screen">
      <AFLogo height={52}/>
      <h2>Trainer <span style={{color:"var(--purple)"}}>Login</span></h2>
      <p className="pin-label">Select Your Branch</p>
      <div className="trainer-select-row">
        {Object.entries(BRANCHES).map(([key,b])=>(
          <button key={key} className="trainer-pill" onClick={()=>setBranch(key)}>{b.label}</button>
        ))}
      </div>
    </div>
  );

  if (!selectedTrainer) return (
    <div className="pin-screen">
      <AFLogo height={48}/>
      <h2><span style={{color:"var(--purple)"}}>{BRANCHES[branch].label}</span></h2>
      <p className="pin-label">Select Your Name</p>
      <div className="trainer-select-row">
        {BRANCHES[branch].trainers.map(t=>(
          <button key={t.name} className="trainer-pill" onClick={()=>setTr(t)}>{t.name}</button>
        ))}
      </div>
      <button className="back-link" onClick={()=>setBranch(null)}>← Back</button>
    </div>
  );

  if (!auth) {
    const c = TRAINER_COLORS[selectedTrainer.name] || "#7C3AED";
    return (
      <div className="pin-screen">
        <div className="tc-avatar" style={{background:c,width:72,height:72,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:32,color:"#fff"}}>{selectedTrainer.name[0]}</div>
        <h2 style={{color:c}}>{selectedTrainer.name}</h2>
        <p className="pin-label">Enter Your PIN</p>
        <input type="password" maxLength={4} className="pin-input" value={pin}
          onChange={e=>{setPin(e.target.value);setPinErr(false);}}
          onKeyDown={e=>{if(e.key==="Enter"){if(pin===selectedTrainer.pin)setAuth(true);else{setPinErr(true);setPin("");}}}}
          placeholder="••••" autoFocus/>
        {pinErr && <div className="pin-error">Incorrect PIN — try again</div>}
        <div style={{display:"flex",gap:12}}>
          <button className="btn btn-ghost" style={{flex:"none",padding:"11px 24px",fontSize:15}} onClick={()=>{setTr(null);setPin("");setPinErr(false);}}>← Back</button>
          <button className="btn btn-primary" style={{flex:"none",padding:"11px 24px",fontSize:15,background:c,borderColor:c}}
            onClick={()=>{if(pin===selectedTrainer.pin)setAuth(true);else{setPinErr(true);setPin("");}}}>Unlock</button>
        </div>
      </div>
    );
  }

  const color      = TRAINER_COLORS[selectedTrainer.name] || "#7C3AED";
  const mySlots    = slots.filter(s=>s.branch===branch && s.trainer===selectedTrainer.name);
  const myBookings = bookings.filter(b=>mySlots.find(s=>s.id===b.slot_id));
  const openCount  = mySlots.filter(s=>s.available && !bookings.find(b=>b.slot_id===s.id)).length;

  const weekStart  = getWeekStart(weekOffset);
  const weekDates  = getWeekDates(weekStart);
  const weekEnd    = weekDates[6];

  return (
    <div>
      {confirmAction && <ConfirmDialog message={confirmAction.message} onConfirm={()=>{confirmAction.onConfirm();setConfirm(null);}} onCancel={()=>setConfirm(null)}/>}

      <div className="dashboard-top">
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div className="tc-avatar" style={{background:color,width:52,height:52,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:24,color:"#fff",flexShrink:0}}>{selectedTrainer.name[0]}</div>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,textTransform:"uppercase",letterSpacing:1,color,lineHeight:1}}>{selectedTrainer.name}</div>
            <div style={{fontSize:14,color:"var(--muted)",letterSpacing:2,textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,marginTop:3}}>{BRANCHES[branch].label} · Personal Training</div>
          </div>
        </div>
        <button className="btn btn-ghost" style={{flex:"none",padding:"9px 18px",fontSize:14,alignSelf:"flex-start"}} onClick={logout}>Log Out</button>
      </div>

      <div className="stats-row">
        <div className="stat-box"><div className="stat-n">{mySlots.length}</div><div className="stat-l">Total Slots</div></div>
        <div className="stat-box"><div className="stat-n" style={{color}}>{myBookings.length}</div><div className="stat-l">Booked</div></div>
        <div className="stat-box"><div className="stat-n" style={{color:"var(--success)"}}>{openCount}</div><div className="stat-l">Available</div></div>
      </div>

      <div className="tab-row">
        <button className={`nav-tab ${tab==="slots"?"active":""}`}
          style={tab==="slots"?{background:color,borderColor:color,color:"#fff"}:{color:"var(--muted)",borderColor:"var(--border)"}}
          onClick={()=>setTab("slots")}>My Schedule</button>
        <button className={`nav-tab ${tab==="bookings"?"active":""}`}
          style={tab==="bookings"?{background:color,borderColor:color,color:"#fff"}:{color:"var(--muted)",borderColor:"var(--border)"}}
          onClick={()=>setTab("bookings")}>Bookings ({myBookings.length})</button>
      </div>

      {tab==="slots" && <>
        <div className="trainer-toolbar">
          <button className="btn btn-primary" style={{background:color,borderColor:color}}
            onClick={()=>setShowAdd(!showAdd)}>{showAdd?"✕ Cancel":"+ Add Slot"}</button>
        </div>

        {showAdd && (
          <div className="add-slot-form">
            <div className="field"><label>Day</label>
              <select value={nDay} onChange={e=>setNDay(e.target.value)}>
                {DAYS.map(d=><option key={d}>{d}</option>)}
              </select></div>
            <div className="field"><label>Time</label>
              <select value={nTime} onChange={e=>setNTime(e.target.value)}>
                {SLOT_HOURS.map(t=><option key={t}>{t}</option>)}
              </select></div>
            <div className="field"><label>&nbsp;</label>
              <button className="btn btn-primary" style={{background:color,borderColor:color}}
                onClick={()=>{onAddSlot({id:genId(),branch,day:nDay,time:nTime,trainer:selectedTrainer.name,available:true});setShowAdd(false);}}>
                Add Slot
              </button>
            </div>
          </div>
        )}

        <div className="week-nav">
          <div className="week-label">
            {weekDates[0].getDate()} {MONTHS[weekDates[0].getMonth()]} — {weekEnd.getDate()} {MONTHS[weekEnd.getMonth()]} {weekEnd.getFullYear()}
          </div>
          <div className="week-btns">
            <button className="week-btn" onClick={()=>setWeekOffset(w=>w-1)}>← Prev</button>
            <button className="week-btn today" onClick={()=>setWeekOffset(0)}>This Week</button>
            <button className="week-btn" onClick={()=>setWeekOffset(w=>w+1)}>Next →</button>
          </div>
        </div>

        <WeekCalendar
          weekDates={weekDates}
          slots={mySlots}
          bookings={bookings}
          trainerMode={true}
          accentColor={color}
          onToggle={(id,cur)=>setConfirm({message:`${cur?"Disable":"Enable"} this slot?`,onConfirm:()=>onToggleSlot(id,cur)})}
          onDelete={id=>setConfirm({message:"Delete this slot permanently?",onConfirm:()=>onDeleteSlot(id)})}
          onAddClient={s=>setACS(s)}
          onCancelBooking={id=>setConfirm({message:"Cancel booking? Slot becomes available again.",onConfirm:()=>onCancelBooking(id)})}
        />
      </>}

      {tab==="bookings" && (
        myBookings.length===0
          ? <div className="empty-state">No bookings yet</div>
          : <table className="bookings-table">
              <thead><tr><th>Client</th><th>Day</th><th>Time</th><th>Ref</th><th>Action</th></tr></thead>
              <tbody>{myBookings.map(b=>{
                const slot=slots.find(s=>s.id===b.slot_id);
                return (
                  <tr key={b.id}>
                    <td><strong>{b.client_name}</strong></td>
                    <td style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:16}}>{slot?.day||"—"}</td>
                    <td style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:16}}>{slot?.time||"—"}</td>
                    <td style={{fontSize:13,color:"var(--muted2)"}}>{b.id.slice(0,8).toUpperCase()}</td>
                    <td><button className="btn btn-danger btn-sm"
                      onClick={()=>setConfirm({message:"Cancel booking? Slot becomes available again.",onConfirm:()=>onCancelBooking(b.id)})}>
                      Cancel
                    </button></td>
                  </tr>
                );
              })}</tbody>
            </table>
      )}

      {addClientSlot && <AddClientModal slot={addClientSlot} onClose={()=>setACS(null)} onConfirm={async b=>{await onAddClientBooking(b);setACS(null);}}/>}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [ready, setReady]       = useState(false);
  const [error, setError]       = useState(null);
  const [view, setView]         = useState("book");
  const [branch, setBranch]     = useState(null);
  const [slots, setSlots]       = useState([]);
  const [bookings, setBookings] = useState([]);
  const [syncing, setSyncing]   = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([db.select("slots"), db.select("bookings")]);
      setSlots(s); setBookings(b); setError(null);
    } catch (err) {
      setError("Could not connect to database.");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const existing = await db.select("slots");
        if (existing.length === 0) {
          const defaults = generateDefaultSlots();
          for (let i = 0; i < defaults.length; i += 50) {
            await db.insertBatch("slots", defaults.slice(i, i + 50));
          }
        }
        await loadData();
        setReady(true);
        setInterval(loadData, 30000);
      } catch (err) {
        setError(`Setup error: ${err.message}`);
        setReady(true);
      }
    };
    init();
  }, [loadData]);

  const flash = () => { setSyncing(true); setTimeout(()=>setSyncing(false), 1500); };
  const handleBook              = async b   => { await db.insert("bookings",b); flash(); await loadData(); };
  const handleToggleSlot        = async (id,cur) => { await db.update("slots",id,{available:!cur}); flash(); await loadData(); };
  const handleDeleteSlot        = async id  => { await db.delete("slots",id); flash(); await loadData(); };
  const handleAddSlot           = async s   => { await db.insert("slots",s); flash(); await loadData(); };
  const handleCancelBooking     = async id  => { await db.delete("bookings",id); flash(); await loadData(); };
  const handleAddClientBooking  = async b   => { await db.insert("bookings",b); flash(); await loadData(); };

  const branchLabel = branch ? BRANCHES[branch]?.label : null;

  if (!ready) return (
    <>
      <style>{css}</style>
      <div className="loading-screen">
        <AFLogo height={56}/>
        <div className="spinner"/>
        <div className="loading-txt">Connecting...</div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className={`sync-dot ${syncing?"show":""}`}/>
        <header className="header">
          <div style={{cursor:"pointer"}} onClick={()=>{setBranch(null);setView("book");}}>
            <AFLogo height={44} white={true}/>
          </div>
          <div className="header-right">
            {branchLabel && view==="book" && <div className="branch-chip">{branchLabel}</div>}
            <button className={`nav-tab ${view==="book"?"active":""}`} onClick={()=>setView("book")}>Book</button>
            <button className={`nav-tab ${view==="trainer"?"active":""}`} onClick={()=>setView("trainer")}>Trainer</button>
          </div>
        </header>
        <main className="main">
          {error && <div className="error-banner">⚠️ {error}</div>}
          {view==="book"
            ? (!branch
                ? <HomeScreen onSelectBranch={b=>setBranch(b)}/>
                : <ClientView branch={branch} onChangeBranch={()=>setBranch(null)} slots={slots} bookings={bookings} onBook={handleBook}/>)
            : <TrainerView slots={slots} bookings={bookings}
                onToggleSlot={handleToggleSlot} onDeleteSlot={handleDeleteSlot}
                onAddSlot={handleAddSlot} onCancelBooking={handleCancelBooking}
                onAddClientBooking={handleAddClientBooking}/>
          }
        </main>
      </div>
    </>
  );
}
